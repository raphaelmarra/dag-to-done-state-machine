# 0012 — Análise de Impacto em Software (CIA, ripple effect, slicing, blast radius)

> Pesquisa de fundamentação para confrontar as regras A3 (blast radius como vista
> calculada por travessia reversa) e A4 (fronteira de "1 hop" do entry_point) do CORE-DAG.
> Data: 2026-06-27.

## Resumo executivo

A literatura de **Change Impact Analysis (CIA)** — fundada por Bohner & Arnold (1996) — define
impacto como "identificar as consequências potenciais de uma mudança, ou estimar o que precisa ser
modificado para realizá-la". O campo organiza-se em torno de três tensões que são exatamente as que
o CORE-DAG enfrenta:

1. **Direção (forward vs backward).** *Backward slicing* responde "o que afeta este ponto?" (origens,
   dependências). *Forward slicing* responde "o que este ponto afeta?" (impacto a jusante). O **blast
   radius** ("o que quebra se eu mexer aqui?") é, na teoria, **forward impact** — mas computado por
   **travessia reversa das arestas de dependência** (BFS pelas arestas que apontam dos dependentes para
   o alvo). Ou seja: a relação primária armazenada é "X depende de Y"; o conjunto "quem depende de Y"
   é **derivado/calculado**, não dado primário. **Isto confirma A3.**

2. **Profundidade (1 hop vs fecho transitivo).** A maioria das técnicas clássicas de CIA computa o
   **fecho transitivo (transitive closure)** da relação de dependência — visam *segurança* (recall
   alto, zero falsos negativos) ao custo de *precisão* (incluem entidades não realmente afetadas).
   A indústria moderna de blast radius diverge: ferramentas reais usam profundidade limitada (tipicamente
   3–5 hops) e **reachability** (caminhos de fato exercitados) para podar ruído, porque o fecho transitivo
   puro "inunda o desenvolvedor com falsos positivos".

3. **Precisão vs recall.** Formalmente: uma análise é **safe** se inclui *todas* as entidades afetadas
   (recall=100%, sem falsos negativos) e **precise** se *não* inclui entidades não afetadas (precisão
   alta). As duas raramente coexistem; toda decisão de profundidade é uma escolha nesse eixo.

**Veredito para o CORE-DAG:** A3 está teoricamente sólida. A4 (limite de 1 hop) é **defensável como
default de precisão**, mas **não é "safe" no sentido formal** — perde o efeito ripple transitivo e,
sozinha, produz falsos negativos. A salvaguarda do CORE-DAG (expandir transitivamente *sob demanda*
quando o entry_point é cross-cutting) é justamente o mecanismo que a literatura de CIA iterativa
recomenda para reconciliar os dois extremos. Detalhes e recomendação no confronto abaixo.

---

## Metodologias com evidência

### 1. Fundação: Bohner & Arnold (1996) — ripple effect e o processo de 3 passos

CIA foi formalizada por Robert Arnold e Shawn Bohner. Definição canônica: "determinação dos efeitos
potenciais a um sistema resultantes de uma mudança proposta". Processo de três passos:
(1) analisar a especificação da mudança e os artefatos; (2) **rastrear impactos potenciais**
(tracing); (3) implementar. O **ripple effect** é o fenômeno de uma mudança pequena cascatear por
componentes interconectados — o objeto que a profundidade de análise tenta capturar.

### 2. Taxonomia de Lehnert (2011) — review de 150 abordagens

Lehnert revisou 150 abordagens (1991–2011) e propôs uma taxonomia que classifica CIA por:
**granularidade** (arquivo / método / linha), **tipo de análise** (estática / dinâmica / online),
**escopo**, **direção** e **tipo de dependência**. A propriedade-chave definida: análises distinguem-se
pelo *alcance* (reach) da dependência de dados que percorrem — exatamente o parâmetro que A4 fixa em 1.

### 3. Program slicing — forward vs backward

- **Backward slice**: captura todas as instruções que *podem afetar* o critério de fatiamento. Útil para
  entender origens de um valor/bug — "de onde isto vem".
- **Forward slice**: identifica instruções *afetadas pelo* critério. Útil para rastrear impacto a jusante
  — o sentido do blast radius.
- **Custo e recall**: técnicas baseadas em slicing têm **recall alto** (poucos falsos negativos), mas são
  **caras** em prática; por isso surgiram aproximações em granularidade de método/arquivo com custo menor.
- Métricas modernas (NS-Slicer, slicing com LLMs): F1 ~96–97% backward, ~92–95% forward — ou seja, o
  sentido reverso (backward) é tipicamente *mais preciso* que o forward, reforçando que a "vista reversa"
  é tecnicamente bem-fundamentada.

### 4. Blast radius na indústria — travessia reversa e profundidade prática

O cálculo padrão: construir um grafo de dependências dirigido (nós = arquivos/entidades, arestas = imports/
chamadas); para um alvo, fazer **BFS para fora pelas arestas reversas** (dos dependentes para o alvo); cada
nó alcançado entra no blast radius. Pontos-chave da prática industrial:

- **É calculado, não armazenado.** "Computar sob demanda via algoritmo de grafo é mais prático do que
  pré-calcular e manter listas explícitas de dependentes para cada arquivo." → **confirma A3.**
- **Profundidade importa.** Profundidade 1 captura só dependentes diretos; "a análise mais útil usa
  profundidade 3 a 5". Dependentes transitivos (3–4 hops) "escondem acoplamento importante fácil de perder".
- Dados de estabilidade citados pela indústria: times sem visibilidade de blast radius veem 8–12 breaking
  changes/trimestre e ~30% de rollbacks; com consciência de dependências ao vivo, caem a 0–1 e ~5%.

### 5. Reachability-based analysis — podando o fecho transitivo

A crítica central ao fecho transitivo puro: grafos de chamada estáticos são **super-aproximações** do
comportamento real e portanto **imprecisos** — "inundam o desenvolvedor com falsos positivos". A resposta
moderna (Endor Labs, Snyk, Konvu) é **reachability**: em vez de marcar tudo no fecho transitivo, só conta
o que é alcançável por caminhos de fato exercitados. Trata direto e transitivo de forma diferente e
**poda** o conjunto de impacto. Isto valida a ideia do CORE-DAG de não expandir cegamente o interior dos
vizinhos.

### 6. CIA iterativa — expansão guiada a partir de uma semente

"Evaluating Heuristics for Iterative Impact Analysis" (2019) formaliza o padrão que o CORE-DAG usa
intuitivamente: parte-se de um **conjunto-semente** (o entry_point) e **expande-se incrementalmente**,
hop a hop, com heurísticas/julgamento guiando até onde ir. É o meio-termo explícito entre 1 hop (precisão,
risco de falso negativo) e fecho transitivo total (recall, ruído). A expansão sob demanda do CORE-DAG é
uma instância desse padrão.

### 7. Precisão vs recall — definições formais

- **Safe (seguro)**: todas as entidades realmente afetadas estão no conjunto selecionado → recall 100%,
  **zero falsos negativos**. Em domínios críticos (ex.: software de voo do A380 via analisador Astrée),
  exige-se super-aproximação *sound* justamente para garantir zero falso negativo.
- **Precise (preciso)**: nenhuma entidade não afetada é selecionada → sem falsos positivos.
- **Super-aproximação** (fecho transitivo, call graph estático) tende a safe-mas-impreciso; só gera falsos
  positivos, nunca falsos negativos. **Sub-aproximação** (1 hop) é o oposto: precisa, mas pode ter falsos
  negativos de impacto ripple.

---

## CONFRONTO com nosso CORE-DAG (1 hop e blast radius)

### A3 — "blast radius é vista calculada por travessia reversa" → **CONFIRMADA pela teoria.**

Tanto a indústria de blast radius quanto a literatura de reachability concordam explicitamente:
- A relação **primária** armazenada/dada é "X depende de Y" (forward dependency).
- "Quem consome um nó" é o conjunto de **dependentes reversos**, obtido por **BFS pelas arestas reversas** —
  é **derivado/calculado sob demanda**, não dado primário.
- Backward slicing concorda com a *direção* da computação (caminhar para trás nas dependências), e métricas
  mostram que o sentido reverso é tipicamente *mais preciso* que o forward. **A3 é tecnicamente correta e
  bem-alinhada à prática.**

### A4 — "fronteira de 1 hop, transitivo só sob demanda" → **DEFENSÁVEL, mas com ressalva forte.**

**O que a teoria endossa em A4:**
- A crítica de A4 ao fecho transitivo cego é a *mesma* da reachability-based analysis: expandir o interior
  de todos os vizinhos super-aproxima e **gera falsos positivos / ruído** que afogam o sinal. Limitar a
  fronteira é uma escolha legítima de **precisão**.
- O gatilho condicional do CORE-DAG ("transitivo sob demanda quando entry_point é cross-cutting") é
  *exatamente* o padrão de **CIA iterativa**: semente + expansão guiada. Isto é o estado-da-arte para
  reconciliar precisão e recall, não um atalho.

**Onde A4 é frágil (o risco real):**
- No sentido **formal**, 1 hop **não é "safe"**: é uma sub-aproximação que **perde efeito ripple transitivo**
  e portanto **admite falsos negativos de impacto**. A literatura clássica de CIA computa fecho transitivo
  *precisamente para evitar isso* (recall alto). A indústria de blast radius reforça: "a análise mais útil
  usa profundidade 3–5" e "dependentes 3–4 hops de distância escondem acoplamento importante".
- Logo, **1 hop como *default* é razoável**, mas **1 hop como *teto rígido* é perigoso**. O ponto cego não
  é só o entry_point cross-cutting — é qualquer cadeia A→B→C onde B é um *pass-through fino* (re-exporta,
  delega, é um adaptador). Nesses casos o impacto real está em C, a 2 hops, e a heurística "cross-cutting"
  pode não disparar.

**Recomendações concretas (a testar contra caso real, conforme M4):**
1. **Manter 1 hop como default**, mas tornar o gatilho de expansão **mais rico que só "cross-cutting"**.
   Sugestão de critérios dinâmicos (alinhado a M1) que forçam olhar o 2º hop de um vizinho específico:
   - o vizinho é um **pass-through / re-export / adaptador fino** (pouca lógica própria, alta fan-out);
   - o vizinho tem **fan-in/fan-out alto** (hub) — proxy estrutural de "cross-cutting" mensurável no grafo;
   - a aresta entry→vizinho atravessa uma **fronteira de contrato** (API pública, schema, interface).
2. **Distinguir impacto direto de transitivo no output**, em vez de cortar (como faz reachability):
   reportar o 1-hop como "impacto direto (alta confiança)" e sinalizar candidatos transitivos como
   "a verificar", em vez de simplesmente não os mencionar. Isso converte um *falso negativo silencioso*
   num *aviso explícito de incerteza* — muito mais seguro para um agente LLM.
3. **Nomear o trade-off no CORE explicitamente:** A4 otimiza **precisão** ao custo de **recall**. Em etapas
   onde falso negativo é caro (refactor amplo, mudança de contrato), o default deveria pender para
   expandir; em etapas exploratórias, manter 1 hop. Profundidade ideal **não é constante** — depende da
   natureza da mudança (coerente com M1/M3).

**Síntese do veredito:** A3 = sólida, manter. A4 = boa intuição de precisão, mas o limite de 1 hop, se
tratado como invariante fixo, viola tanto a teoria de CIA (recall/safety) quanto M1 ("dinâmico é a
preferência"). O *critério* de quão fundo ir deveria ser ensinado pelo CORE e *decidido pelo contexto*
(forma do vizinho, fan-in/out, fronteira de contrato), não fixado em "1". O gatilho "cross-cutting" é um
começo correto, mas estreito demais para evitar falsos negativos de ripple.

---

## Fontes

- Bohner & Arnold, *Software Change Impact Analysis* (1996) — fundação: https://books.google.com/books/about/Software_change_impact_analysis.html?id=IQFRAAAAMAAJ
- Lehnert, *A Review of Software Change Impact Analysis* (review de 150 abordagens, 2011): https://d-nb.info/1020114983/34
- Lehnert, *A taxonomy for software change impact analysis* (ACM/IWPSE): https://dl.acm.org/doi/abs/10.1145/2024445.2024454
- Li et al., *A survey of code-based change impact analysis techniques* (STVR 2012): https://zhang-sai.github.io/pdf/li-stvr12.pdf
- *Evaluating Heuristics for Iterative Impact Analysis* (arXiv 2019): https://arxiv.org/pdf/1907.08730
- *Program Slicing in the Era of Large Language Models* (forward/backward, métricas F1): https://arxiv.org/html/2409.12369v1
- *A Learning-Based Approach to Static Program Slicing* (NS-Slicer, ACM PL 2024): https://dl.acm.org/doi/10.1145/3649814
- *srcSlice: efficient and scalable forward static slicing*: https://www.researchgate.net/publication/262417511_srcSlice_very_efficient_and_scalable_forward_static_slicing
- Axiom Refract, *What Is Blast Radius in Code* (BFS reverso, profundidade 3–5, cálculo sob demanda): https://axiomrefract.com/learn/what-is-blast-radius
- SixDegree, *What Is Blast Radius Analysis* (dados de estabilidade): https://sixdegree.ai/blog/blast-radius-analysis
- Riftmap, *AI Doesn't Understand Blast Radius*: https://riftmap.dev/blog/ai-doesnt-understand-blast-radius/
- Endor Labs, *What is Reachability-Based Dependency Analysis* (poda do fecho transitivo): https://www.endorlabs.com/learn/what-is-reachability-based-dependency-analysis
- Konvu, *What Is Reachability Analysis*: https://konvu.com/blog/reachability-analysis
- *Identification and analysis of change ripples in object-oriented software* (Sādhanā/Springer 2023): https://link.springer.com/article/10.1007/s12046-023-02137-9
- *Breaking Changes in Software Ecosystems: A Systematic Literature Review* (direto vs transitivo, multi-hop): https://arxiv.org/html/2605.24397
- Arnica, *Direct vs. Transitive Dependencies in SCA*: https://www.arnica.io/blog/direct-vs-transitive-dependencies-navigating-package-management-in-software-composition-analysis-sca
