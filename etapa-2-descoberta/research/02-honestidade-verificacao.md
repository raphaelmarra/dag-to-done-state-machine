# 02 — Honestidade de verificação: reportar o que foi testado vs. o que foi suposto

> Pesquisa de fundamentação para o **coração da etapa 2 (Descoberta da API)**: como reportar com
> RIGOR a diferença entre *o que foi realmente verificado/testado ao vivo* e *o que foi suposto/inferido*.
> Objetivo: ancorar nosso enum de confiança de 3 níveis (`confirmado ao vivo` | `inferido do código` |
> `não verificado`) em práticas estabelecidas de ciência e de análise de inteligência — e checar se
> existe esquema melhor. Premissa herdada de `docs/research/0009-clareza-para-llm`: **LLM não tem
> calibração interna confiável**; logo a honestidade tem de ser **estrutural** (requisito de formato),
> não "achismo" do modelo.

---

## Resumo executivo

Existe um corpo maduro de práticas — em **análise de inteligência**, **ciência/medicina** e **engenharia
de software de supply chain** — para distinguir afirmação verificada de afirmação inferida. Os achados
convergem em cinco pontos diretamente aplicáveis à etapa 2:

1. **Separe SEMPRE duas dimensões: a afirmação (likelihood / "o que digo") e a confiança nela (o quão
   bem fundamentada está).** Inteligência faz isso em dois eixos independentes; misturá-los é erro de
   tradecraft. Nosso enum é, na prática, o eixo de *confiança* — e deve ficar ortogonal ao *conteúdo* da
   ficha.
2. **Avalie a confiança "em isolamento", por fonte + evidência, não por sensação.** O Código Admiralty
   (NATO) classifica fonte (A-F) e informação (1-6) em **dois caracteres**, com a regra explícita de que
   cada eixo é julgado isoladamente — uma fonte confiável pode passar info ruim e vice-versa. É o 
   precedente mais próximo do que queremos: confiança derivada de *de onde veio* + *foi corroborado?*.
3. **Termos verbais de probabilidade são ambíguos e precisam de ancoragem.** Sherman Kent (CIA, 1964)
   mostrou que "provável" era lido como 75% por uns e 30% por outros; a solução (Kent → ICD-203) foi
   **fixar um vocabulário fechado com faixas numéricas**. Lição para nós: o enum tem de ter **definição
   operacional única por nível** ("confirmado = chamei o endpoint e vi a resposta"), não rótulo solto.
4. **Confiança alta exige evidência rastreável; supply chain chama isso de provenance/atestação.** SLSA,
   in-toto e W3C PROV codificam a diferença entre *claimed* (o produtor afirma) e *verified* (foi
   confirmado de forma independente). E o ponto crítico: **auto-atestação pode ser fabricada** — exatamente
   por isso "confirmado" na nossa ficha tem de carregar **evidência ao vivo anexada**, não a palavra do agente.
5. **A honestidade não pode depender de auto-avaliação do agente.** A literatura de LLM mostra
   *overconfidence* sistemática: o modelo verbaliza alta confiança mesmo quando alucina, porque o
   pós-treino premia respostas definitivas. Calibração estatística **não** é honestidade epistêmica — um
   sistema pode estar "calibrado" e ainda assim soar enganosamente confiante. **Conclusão que valida nossa
   tese:** honestidade tem de ser imposta pelo **formato e pelo portão de aceitação** (sem evidência → não
   pode ser "confirmado"), não pela introspecção do modelo.

**Veredito sobre "3 níveis é suficiente?"** Os 3 níveis são um bom esqueleto, mas a prática estabelecida
sugere **dois ajustes**: (a) tornar o eixo **bidimensional** quando útil (fonte da evidência × grau de
corroboração), à la Admiralty/ICD-203; e (b) exigir um **slot de provenance por campo** ("como sei disto")
e um **slot de questão viva** para o que ficou em aberto — formato de duas colunas que a própria literatura
científica recomenda contra overclaiming. Detalhes na seção de aplicação.

---

## Parte I — Análise de inteligência (o estado da arte em "confiança por fonte + evidência")

A comunidade de inteligência enfrenta exatamente o nosso problema há 60 anos: comunicar **o que é
conhecimento certo vs. juízo fundamentado**, de forma que o leitor não confunda os dois. Três artefatos
importam.

### 1.1 — Words of Estimative Probability (Sherman Kent, CIA, 1964)

Kent, um dos fundadores da disciplina formal de análise, atacou a **variabilidade na interpretação** das
palavras de probabilidade nos National Intelligence Estimates. A descoberta empírica que motivou tudo:
o mesmo termo "**probable**" era lido por alguns leitores como **~75%** e por outros como **~30%** — uma
diferença que pode inverter uma decisão. O objetivo declarado de Kent foi:

> "set forth the community's findings in such a way as to make clear to the reader **what is certain
> knowledge and what is reasoned judgment**, and within this large realm of judgment what varying degrees
> of certitude lie behind each key judgment."

Essa é, quase literalmente, a missão da etapa 2: deixar claro **o que é conhecimento certo** (chamei o
endpoint e vi) **vs. juízo fundamentado** (li o código e infiro).

A solução de Kent foi um **vocabulário fechado de 7 termos** ancorado em faixas numéricas (o debate
"**poets vs. mathematicians**" — quem prefere palavras vagas vs. quem prefere odds numéricos — foi resolvido
a favor de ancorar a palavra num número):

| Termo (Kent) | Faixa |
|---|---|
| Certain | 100% |
| Almost certain | ~93% (±6) |
| Probable | ~75% (±12) |
| Chances about even | ~50% |
| Probably not | ~30% (±10) |
| Almost certainly not | ~7% (±5) |
| Impossible | 0% |

**Princípio que herdamos:** "If it were a fact, it wouldn't be intelligence" (Gen. Michael Hayden). Ou seja,
a estrutura *assume* que parte do conteúdo é juízo — e marca isso explicitamente, em vez de fingir certeza.

### 1.2 — ICD-203 (Intelligence Community Directive, ODNI) — o padrão moderno

O ICD-203 (de 2007, revisado 2015 e jun/2023) é o padrão de tradecraft de TODA a comunidade de inteligência
dos EUA. Ele formaliza dois aprendizados centrais para nós:

**(a) Vocabulário fechado de likelihood com faixas (duas linhas paralelas; proibido misturar):**

| Faixa | Linha 1 | Linha 2 |
|---|---|---|
| 01-05% | almost no chance | remote |
| 05-20% | very unlikely | highly improbable |
| 20-45% | unlikely | improbable |
| 45-55% | roughly even chance | roughly even odds |
| 55-80% | likely | probable |
| 80-95% | very likely | highly probable |
| 95-99% | almost certainly | nearly certain |

Note os limites: **nada é 0% ou 100%** — humildade epistêmica embutida no esquema. "Analysts are strongly
encouraged not to mix terms from different rows" — i.e., **um enum, escolhido e mantido** (eco direto do P3
de `0009-clareza-para-llm`: fixe um formato e seja consistente).

**(b) A REGRA DE OURO: confiança ≠ probabilidade, e NUNCA na mesma frase.** O ICD-203 exige que um
"confidence level" (high/moderate/low) **não seja combinado com um grau de likelihood na mesma sentença**,
para não confundir *o quão provável é o evento* com *o quão boa é a base da avaliação*. E define a confiança
por **fonte + corroboração + premissas**, não por sensação:

- **High confidence** — juízos baseados em informação de alta qualidade, de **múltiplas fontes**, a maioria
  ou todas confiáveis, com **conflito mínimo ou nenhum** entre elas.
- **Moderate confidence** — informação críivel e plausível, mas **sem qualidade ou corroboração suficientes**
  para subir de nível (ex.: fontes com visões opostas).
- **Low confidence** — credibilidade/plausibilidade **incerta**: informação escassa, questionável, fragmentada
  ou mal corroborada; pode também indicar dúvida sobre a **confiabilidade da fonte**.

E o fecho que mais importa para impor honestidade estrutural: o ICD-203 **encoraja explicar a evidência e a
incerteza** em vez de deixar um rótulo de uma palavra solto. **Rótulo sem justificativa é proibido** — é
exatamente o nosso critério de aceitação ("ZERO campos não-verificado sem justificativa").

### 1.3 — Admiralty Code / NATO (AJP-2.1) — o esquema bidimensional fonte × informação

O precedente **mais próximo do que queremos**: uma notação de **dois caracteres** que avalia separadamente a
**confiabilidade da fonte** e a **credibilidade da informação**.

**Eixo 1 — Confiabilidade da FONTE (A-F):**

| Cód | Significado |
|---|---|
| A | Completely reliable — sem dúvida de autenticidade/competência; histórico de total confiabilidade |
| B | Usually reliable — dúvida menor; histórico majoritariamente válido |
| C | Fairly reliable — há dúvida, mas já forneceu info válida no passado |
| D | Not usually reliable — dúvida significativa, mas já forneceu info válida |
| E | Unreliable — sem autenticidade/competência; histórico inválido |
| **F** | **Reliability cannot be judged** — não há base para avaliar a fonte |

**Eixo 2 — Credibilidade da INFORMAÇÃO (1-6):**

| Cód | Significado |
|---|---|
| 1 | Confirmed — **confirmado por outras fontes independentes**; lógico em si; consistente |
| 2 | Probably true — não verificado de forma independente, mas consistente |
| 3 | Possibly true — corroboração limitada; razoavelmente lógico |
| 4 | Doubtful — não confirmado; ilógico mas possível |
| 5 | Improbable — contradito por outra informação |
| **6** | **Truth cannot be judged** — sem base avaliativa |

**O princípio de design que é a alma da coisa:** cada descritor é considerado **em isolamento**, "to ensure
that the reliability of the source does not influence the assessed accuracy of the report" — uma fonte
confiável pode passar info ruim; uma fonte duvidosa pode dar info depois confirmada. Isso **desacopla** "de
onde veio" de "foi corroborado?".

Mapeando para a etapa 2: **a "fonte" é o método** (chamada ao vivo / leitura de código / doc / inferência) e
a "credibilidade" é **se aquilo foi corroborado por evidência executável**. Os níveis-tampão **F** e **6**
("cannot be judged") são o equivalente honesto do nosso `não verificado` — a prática estabelecida **tem um
rótulo dedicado para "não sei"**, e isso é considerado boa higiene, não falha.

*Crítica conhecida (Blockint, SANS):* na prática os dois eixos **não são tão independentes** quanto a teoria
quer (analistas deixam a confiança na fonte vazar para a nota de credibilidade), e o eixo numérico é
frequentemente subutilizado. Lição defensiva para nós: se adotarmos bidimensionalidade, **o portão tem de
checar consistência entre os eixos**, senão eles colapsam num só na prática.

---

## Parte II — Ciência: graus de certeza da EVIDÊNCIA (GRADE) e honestidade epistêmica

### 2.1 — GRADE (medicina baseada em evidência)

GRADE classifica a **certeza da evidência** em 4 níveis — **high / moderate / low / very low** — que
representam "a gradient of confidence in estimates" e, consequentemente, o quanto se pode inferir dali:

- **High** — pouco provável que nova pesquisa mude a estimativa.
- **Moderate** — nova pesquisa **provavelmente** impacta a confiança e **pode** mudar a estimativa.
- **Low** — nova pesquisa muito provavelmente muda a estimativa.
- **Very low** — qualquer estimativa é **muito incerta**.

Dois aprendizados de design:

1. **O ponto de partida depende do TIPO de evidência.** Ensaio randomizado começa "high"; estudo
   observacional começa "low". Tradução direta para a etapa 2: **uma chamada ao vivo bem-sucedida começa
   "confirmado"; uma leitura de código começa "inferido"** — o *método* define o teto de confiança, antes
   de qualquer ajuste.
2. **A certeza é REBAIXADA por critérios objetivos** (risco de viés, inconsistência, imprecisão, etc.), não
   por sensação. Há um *checklist* que justifica cada degrau. Para nós: o que **rebaixa** "confirmado" para
   "inferido" deve ser uma regra ("não anexei a resposta crua observada"), não opinião.

### 2.2 — Honestidade epistêmica vs. calibração (e por que isto fundamenta nossa tese estrutural)

A literatura de humildade epistêmica e de overclaiming traz o achado que **fecha o caso a favor da
honestidade estrutural**:

- **Overclaiming** mistura gestão de impressão + **miscalibração metacognitiva** + baixa vigilância
  epistêmica: as pessoas (e modelos) afirmam saber o que não sabem.
- **Calibração estatística NÃO é humildade epistêmica.** Um sistema pode estar "bem calibrado" e ainda
  apresentar a informação em termos enganosamente confiantes. (Ou seja: mesmo que um dia um LLM fique
  calibrado, isso **não** garante que ele *reporte* honestamente.)
- A cultura científica **premia overconfidence** (é o que passa em revisão) — o mesmo viés que o RLHF
  injeta nos LLMs.
- **A intervenção prática validada** (equipe de política de água urbana, citada em i2insights): adotar um
  **formato de DUAS COLUNAS** — uma para "confident findings", outra para "live questions" — preservando
  honestidade intelectual e mostrando ao financiador *onde investir mais*. **Isto é, quase ipsis litteris,
  o que a etapa 2 deve produzir**: campos confirmados + lista explícita do que não deu para confirmar.
- Norma recomendada: **rotular cada afirmação por força de evidência** ("anedota, correlação, ensaio
  randomizado...") reduz "a ilusão de que toda asserção pesa igual". É a justificativa científica para o
  enum existir como **campo obrigatório por afirmação**, não como nota de rodapé global.

---

## Parte III — Software: provenance, lineage e a diferença "claimed vs. verified"

A engenharia de software de supply chain resolveu, com padrões executáveis, o problema "como provar que uma
afirmação é verdadeira e de onde ela veio".

### 3.1 — Data provenance vs. lineage (W3C PROV)

- **Provenance** = *de onde o dado veio* (origem, responsável). **Lineage** = *por onde passou* (transformações).
- O **W3C PROV** modela isto em 3 conceitos — **entity / activity / agent** — com relações como
  `wasGeneratedBy`, `wasDerivedFrom`, `wasAttributedTo`, `used`, `wasInformedBy`. Permite rastrear "a história
  completa e a origem **de cada asserção**".

Aplicação: cada campo da ficha da etapa 2 deveria ter um mini-registro de provenance — **qual atividade gerou
este valor** (ex.: "GET /orders executado em 2026-06-28") e **a partir de quê** (`wasDerivedFrom`: resposta
HTTP 200 anexada). Sem isso, "confirmado" é uma afirmação sem origem rastreável.

### 3.2 — SLSA / in-toto: atestação e o problema da auto-atestação

- **SLSA** = framework de níveis para artefatos de software; **in-toto attestation** = metadado **autenticado**
  sobre artefatos. **Provenance** prova *como* algo foi construído; **assinatura** prova *quem* aprovou.
- A distinção-chave: **claimed** (o produtor afirma o nível) vs. **verified** (confirmado de forma
  independente, no build ou no deploy).
- O alerta que **valida nosso requisito de evidência ao vivo**: *"self-attestation can be misleading or
  fabricated"* — auto-atestação pode ser enganosa ou fabricada, e isso é "ainda um problema em aberto".

**Conclusão para a etapa 2:** marcar "confirmado" é uma **auto-atestação do agente** — e a literatura diz
que auto-atestação não basta. Por isso o nível "confirmado" só é legítimo **com a evidência observável
anexada** (a resposta crua do endpoint), que é o equivalente leve de uma atestação verificável: um terceiro
(o porteiro / um humano) pode reproduzir/conferir sem confiar na palavra do agente.

---

## Parte IV — Por que NÃO confiar na auto-avaliação do LLM (e o que isso impõe)

Conecta-se a `docs/research/0009-clareza-para-llm`, que já estabeleceu que clareza para LLM é mecânica, não
estética. Aqui, o achado específico sobre **confiança verbalizada**:

- LLMs **não são treinados para expressar incerteza calibrada**; reportam confiança muito alta mesmo ao
  **alucinar**, porque RLHF/SFT premiam respostas **definitivas** sobre admitir incerteza ("training and
  evaluation still incentivize confident guessing over admitting uncertainty").
- O sinal de "inflação de confiança" é **mecanicístico** — concentrado em blocos MLP/atenção de camadas
  médio-tardias; existe, mas **não é confiável** como medidor de verdade.
- Logo: **confiança verbalizada do modelo é um mau medidor de verdade.** Pedir ao agente "diga seu nível de
  confiança" sem amarra reproduz o overclaiming.

**Implicação de design (a tese central do projeto, agora fundamentada):** a honestidade da etapa 2 **não pode**
residir no julgamento do agente. Tem de residir em **(a) definição operacional** de cada nível que seja
*checável* ("confirmado" ⇔ existe evidência ao vivo anexada), e **(b) um portão** que rejeite a ficha quando a
marca não bate com a evidência. Isto transforma "confiança" de *opinião do modelo* em *propriedade verificável
do artefato* — exatamente o que Admiralty/ICD-203/SLSA fazem para humanos e máquinas.

---

## Aplicação à etapa 2 (o enum de confiança e a exigência de evidência)

### A. O enum de 3 níveis — validação e definição operacional

Os 3 níveis sobrevivem ao escrutínio: são um **vocabulário fechado** (Kent/ICD-203), com um nível-tampão
explícito para "não sei" (Admiralty F/6), e o teto de cada um é fixado pelo **método/tipo de evidência**
(GRADE). Mas o rótulo solto é proibido pela própria prática — então cada nível precisa de **definição
operacional única e checável**:

| Nível | Definição operacional (o critério, não a sensação) | Análogo estabelecido | Evidência obrigatória |
|---|---|---|---|
| **confirmado ao vivo** | Chamei o endpoint real e **observei** a resposta. | Admiralty **1** (Confirmed) · GRADE **high** · SLSA **verified** | Resposta crua anexada (request + status + corpo), reproduzível |
| **inferido do código** | Li a fonte/doc mas **não executei**; deduzo o comportamento. | Admiralty **2-3** (probably/possibly true) · GRADE **low/moderate** · SLSA **claimed** | Ponteiro à evidência: arquivo:linha / trecho de doc que sustenta a inferência |
| **não verificado** | **Não consegui** confirmar nem inferir com base sólida. | Admiralty **F/6** (cannot be judged) | Justificativa obrigatória: *por que* não deu (sem acesso, ambíguo, fora de escopo...) + próximo passo |

Regra de redação (P2 de `0009`, polaridade positiva): defina o nível pelo que **foi feito** ("executei e vi"),
não pelo que faltou.

### B. Ortogonalidade — não misture "o que digo" com "o quão fundamentado" (regra de ouro do ICD-203)

O enum é o eixo de **confiança/método**; ele deve ser um **campo separado** anexo a cada afirmação da ficha,
nunca embutido na própria afirmação. Ex. de schema por campo:

```
campo: "auth"
valor: "Bearer token no header Authorization"
confianca: "confirmado ao vivo"
evidencia: { metodo: "GET /me", status: 200, corpo_observado: "{...}", quando: "2026-06-28T..." }
```

Isso espelha o "não combine confidence e likelihood na mesma frase": o **valor** e a **confiança** vivem em
slots distintos e são checados por regras distintas.

### C. Critério de aceitação — como o portão impõe honestidade ESTRUTURAL (não confia no agente)

Fundamentado em SLSA ("auto-atestação pode ser fabricada") + ICD-203 ("rótulo sem justificativa é proibido")
+ overclaiming de LLM ("confiança verbalizada é mau medidor"). O portão da etapa 2 deve, **mecanicamente**:

1. **Todo campo tem `confianca` ∈ {confirmado, inferido, não verificado}.** Campo sem enum = ficha rejeitada.
   (Rotular cada asserção por força de evidência — norma científica anti-overclaiming.)
2. **Todo `confirmado` carrega `evidencia` ao vivo** (request + status + corpo observado, reproduzível).
   "Confirmado" sem evidência anexada **rebaixa automaticamente para `inferido`** ou rejeita. Esta é a regra
   que tira a honestidade das mãos do modelo: a marca é validada contra um **artefato**, não contra a palavra.
3. **Todo `inferido` aponta a fonte** (arquivo:linha ou doc) — provenance mínima (W3C PROV `wasDerivedFrom`).
4. **`não verificado` exige justificativa + próximo passo.** ZERO "não verificado" mudo. (Admiralty tem rótulo
   para "cannot be judged", mas inteligência **explica** o porquê.)
5. **Consistência entre eixos** (lição da crítica ao Admiralty): se `confianca = confirmado` mas `evidencia`
   está vazia/inconsistente, é contradição → rejeita. (Evita o colapso dos eixos visto na prática real.)

### D. Há um esquema melhor que o nosso de 3 níveis? — recomendação

**Manter os 3 níveis como espinha dorsal** (são suficientes, claros e mapeiam 1:1 a "executei / li / nem"),
mas **adotar duas melhorias da prática estabelecida**, ambas de **formato** (coerentes com a tese estrutural):

- **(D1) Provenance por campo (obrigatório), não global.** Cada afirmação carrega *como sei disto* — é o que
  separa Admiralty/PROV de um simples selo. Sem isso, "confirmado" é auto-atestação não rastreável.
- **(D2) Bloco "questões vivas" explícito** (o formato de duas colunas validado na ciência): além dos campos,
  a ficha lista o que **não** deu para confirmar e o próximo passo. Isso converte "não verificado" de buraco
  silencioso em **input acionável** para a etapa 3 (Gap) — alinhado ao princípio central do produto (cada
  etapa entrega conhecimento estruturado para a próxima).

Opcional/futuro (testar antes de cristalizar — M4): **bidimensionalizar** o eixo ao estilo Admiralty
(método-fonte × grau-de-corroboração) **só se** aparecer um caso real em que 3 níveis percam informação
relevante (ex.: "confirmado por doc oficial não-executado" vs. "inferido de código"). Hoje isso seria
sobre-especificação (P4 de `0009`); mantém-se em ABERTO até um 2º caso concreto justificar.

---

## Fontes

**Análise de inteligência**
- Sherman Kent, *Words of Estimative Probability*, CIA Studies in Intelligence, 1964 — https://www.cia.gov/resources/csi/studies-in-intelligence/archives/vol-8-no-4/words-of-estimative-probability/
- *Statements of Estimative Probability* (mirror Kent + faixas) — https://www.globalsecurity.org/intell/ops/probability.htm
- *Words of estimative probability* (Wikipedia, faixas de Kent e contexto) — https://en.wikipedia.org/wiki/Words_of_estimative_probability
- ICD-203 *Analytic Standards* (ODNI; termos de likelihood + faixas; regra confidence≠likelihood) — https://github.com/wesinator/ICD203-intel-analysis · https://fas.org/irp/dni/icd/icd-203.pdf
- ICD-203/206/208 (texto integral, ODNI) — https://www.bmbs.org/salamanca/readings/ODNI_ICDs_203-206-208.pdf
- CIS / MS-ISAC, *Words of Estimative Probability, Analytic Confidences, and Structured Analytic Techniques* (high/moderate/low confidence) — https://www.cisecurity.org/ms-isac/services/words-of-estimative-probability-analytic-confidences-and-structured-analytic-techniques
- *Admiralty code* (Wikipedia; escalas A-F e 1-6, princípio de isolamento) — https://en.wikipedia.org/wiki/Admiralty_code
- NATO AJP-2.1 Source Reliability and Information Credibility Scales (ResearchGate) — https://www.researchgate.net/figure/NATO-AJP-21-Source-Reliability-and-Information-Credibility-Scales_tbl1_328858953
- SANS, *Enhance your Cyber Threat Intelligence with the Admiralty System* — https://www.sans.org/blog/enhance-your-cyber-threat-intelligence-with-the-admiralty-system
- Blockint, *Critical review of the Admiralty Code* (limitações: eixos não tão independentes) — https://www.blockint.nl/intel-analysis/critical-review-of-the-admiralty-code/

**Ciência / evidência / honestidade epistêmica**
- GRADE — *an emerging consensus on rating quality of evidence and strength of recommendations*, BMJ (PMC) — https://pmc.ncbi.nlm.nih.gov/articles/PMC2335261/
- *What is "quality of evidence" and why is it important to clinicians?* (PMC) — https://pmc.ncbi.nlm.nih.gov/articles/PMC2364804/
- CDC ACIP, *GRADE Criteria Determining Certainty of Evidence* — https://www.cdc.gov/acip-grade-handbook/hcp/chapter-7-grade-criteria-determining-certainty-of-evidence/index.html
- *Cultivating epistemic humility in research teams* (formato de duas colunas: confident findings × live questions; rotular por força de evidência) — https://i2insights.org/2026/06/02/epistemic-humility-in-teams/
- *Epistemic humility* (Wikipedia) — https://en.wikipedia.org/wiki/Epistemic_humility
- *Overclaiming: Why People Claim Knowledge They Don't Have* — https://www.psychologic.online/overclaiming-explained/

**Software / provenance / atestação**
- W3C PROV-O (Provenance Ontology) — https://www.w3.org/TR/prov-o/
- *Data Provenance vs Data Lineage* — https://www.ovaledge.com/blog/data-lineage-vs-data-provenance
- *Data lineage* (Wikipedia) — https://en.wikipedia.org/wiki/Data_lineage
- SLSA — *Frequently asked questions* (claimed vs. verified; auto-atestação) — https://slsa.dev/spec/v1.1/faq
- *Understanding Software Provenance Attestation: SLSA and in-toto* — https://mikael.barbero.tech/blog/post/2023-12-28-slsa-and-in-toto/
- *Artifact Provenance and Attestations: From SLSA to in-toto* — https://secure-pipelines.com/ci-cd-security/artifact-provenance-attestations-slsa-in-toto/

**LLM — overconfidence / confiança verbalizada (por que a honestidade tem de ser estrutural)**
- *Wired for Overconfidence: A Mechanistic Perspective on Inflated Verbalized Confidence in LLMs*, arXiv 2604.01457 — https://arxiv.org/pdf/2604.01457
- *ConfTuner: Training LLMs to Express Their Confidence Verbally*, arXiv 2508.18847 — https://arxiv.org/pdf/2508.18847
- *Learn to be Honest: Mitigate LLMs' Overconfidence...* (OpenReview) — https://openreview.net/forum?id=FRtKUpgEZ9
- MIT News, *A better method for identifying overconfident large language models* (2026) — https://news.mit.edu/2026/better-method-identifying-overconfident-large-language-models-0319
- *The Polite Liar: Epistemic Pathology in Language Models*, arXiv 2511.07477 — https://arxiv.org/pdf/2511.07477

**Interno (não duplicar)**
- `docs/research/0009-clareza-para-llm.md` — LLM não tem calibração interna confiável; clareza é mecânica; P2 (polaridade), P3 (formato único), P4 (especificação seletiva), P5 (sem contradição).
