# Estimativa de complexidade/esforço de forma defensável — derivar dos dados, não opinar

> Pesquisa de apoio à **etapa 3 (GAP)**. Confronta o `docs/adr/0013-estimativa-de-complexidade-no-gap.md`.
> Princípio-guia do projeto: **M1 — dinâmico/derivado do contexto** > constante opinada.

---

## Resumo executivo

A literatura de estimativa converge num ponto que é exatamente o que a etapa 3 precisa: **a melhor
estimativa não é uma opinião, é uma contagem que vira cálculo.** Steve McConnell formaliza isso em
três passos numa ordem de preferência rígida — **Count → Compute → Judge**: conte algo objetivo
relacionado ao tamanho; compute a estimativa a partir da contagem (com dados históricos quando houver);
só use julgamento puro como **último recurso**, porque "expert judgment is the least accurate means of
estimation". Isso é a tradução literal do M1 para o domínio de estimativa.

Os métodos populares se distinguem justamente por **quanto de "judge" vs. "count"** carregam:

- **T-shirt sizing (P/M/G)** e **story points + planning poker** são *relativos e rápidos*, mas
  assumidamente **subjetivos** — bons para humanos comparando entre si, ruins para um agente LLM que
  precisa justificar sozinho um rótulo ("acho que é média" é exatamente o que queremos proibir).
- **COCOMO II** e **Function Points** são *paramétricos*: a estimativa é **computada de fatores
  contáveis** (drivers de custo, tipos de função). São pesados demais para usar inteiros (exigem
  KSLOC/calibração/certificação), mas o **mecanismo** — fatores objetivos → fórmula → resultado — é
  exatamente o que devemos importar.

O que une tudo são os **drivers de complexidade**: o que *de fato* torna uma feature difícil. Mike
Cohn os reduz a três (volume de trabalho, complexidade, risco/incerteza); COCOMO os abre em 17 cost
drivers + 5 scale factors; estudos empíricos de predição de defeitos mostram que **difusão da mudança
(nº de arquivos/subsistemas tocados), tamanho da mudança, acoplamento e correção de bug** são
preditores reais de risco/esforço (Kamei, Mockus & Weiss, Nagappan & Ball, Hassan).

**Conclusão para a etapa 3:** o ADR 0013 está *certo no quê* ("simples|média|alta **com
justificativa**, não label subjetivo") mas é **omisso no como**. A correção é tornar a complexidade
**uma função computada dos gaps já encontrados** — `complexidade = f(drivers extraídos do GAP)` — via
um **scoring ponderado** (estilo Count.co / parametric), com bandas e limiares explícitos. O agente
**conta** drivers que o próprio GAP produziu (gaps P0, integrações, incerteza), o motor **computa** a
banda, e a "justificativa" passa a ser a **própria conta**, não uma frase de efeito.

---

## 1. O princípio que rege tudo: Count → Compute → Judge (McConnell)

McConnell, em *Software Estimation: Demystifying the Black Art* (cap. 7), estabelece uma **hierarquia
de confiabilidade**:

1. **Count** — obtenha um tamanho não-enviesado **contando** algo relacionado ao tamanho do software.
   O *que* contar depende da aplicação: telas novas, endpoints de API, jobs de ETL, requisitos, etc.
   Critérios para um bom "contável": **(a)** ligado ao tamanho, **(b)** disponível cedo, **(c)**
   consistente entre projetos, **(d)** estatisticamente significativo.
2. **Compute** — converta a contagem em estimativa, idealmente com **dados históricos** (ex.: "stories
   2.0–2.5 historicamente levaram 7–9 dias").
3. **Judge** — use julgamento **apenas para ajustar** contagem/cálculo. Julgamento sozinho é o
   **último recurso** e o **menos preciso**.

> Regra de ouro destilada: **"Count if at all possible. Compute when you can't count. Use judgment
> alone only as a last resort."**

Por que isso importa para um **agente LLM**: o agente é, por natureza, uma máquina de "judge". Se a
etapa 3 não impuser um esqueleto de Count→Compute, o LLM cai no modo menos confiável de todos — o
chute plausível. O CORE precisa forçar o agente a **contar primeiro** (drivers) e **computar a banda**
por regra fixa, deixando ao LLM só o papel de **extrair os drivers do contexto** e, no máximo, um
ajuste justificado de ±1 banda.

**Cone da incerteza** (também McConnell): no início de um projeto a estimativa pode errar por um fator
de até **4× para cada lado (faixa de 16×)**, estreitando conforme os detalhes ficam conhecidos. A
etapa 3 vive **cedo** (logo após mapear gaps), então a saída honesta é uma **banda de 3 níveis**
(simples/média/alta), não um número de horas — coerente com o cone.

---

## 2. Métodos relativos (rápidos, mas subjetivos)

### 2.1 Story points + Planning Poker

- **Definição (Mike Cohn):** unidade de medida do **esforço total** para implementar um item. Combina
  **três fatores** num só número, unificados por *esforço*:
  1. **quantidade de trabalho** ("100 campos > 1 campo, mas não 100×");
  2. **complexidade** ("trabalho complexo exige mais raciocínio, tentativa-e-erro, idas e vindas,
     mais tempo para validar e corrigir erros");
  3. **risco/incerteza** (peso de probabilidade × impacto).
- **Relativo, não absoluto:** "uma story de 2 pontos deve dar ~2× o esforço de uma de 1". O número
  absoluto importa menos que a **razão**. Escala usual: Fibonacci (1,2,3,5,8,13,21) — os intervalos
  crescentes embutem a incerteza (não se distingue 21 de 22).
- **Planning Poker:** técnica de **consenso** (origem em Wideband Delphi) — cada um estima às cegas,
  revela junto, discute divergências, re-estima. **Depende de um grupo humano**: o valor vem do
  *debate*, não de uma fórmula.
- **SAFe / normalização:** para comparar times, SAFe ancora numa **reference story** (a "story de 1
  ponto") — toda estimativa é relativa a esse baseline calibrado. Reforça: story point só tem sentido
  **contra uma referência**.

**Crítica (relevante para nós):** story points são **assumidamente subjetivos** — variam por skill,
viés, *groupthink*, e diferem entre times/empresas. Há um movimento **#NoEstimates** defendendo que
**contar stories** (todas pequenas e parecidas) prevê quase tão bem quanto pontuá-las, sem o custo e o
viés da estimativa. Para a etapa 3, a lição dupla é: **(1)** os *três fatores de Cohn* são um ótimo
**vocabulário de drivers**; **(2)** o *mecanismo* (humanos pontuando por sensação) é **exatamente o
que não podemos usar** — não há grupo, e "sensação de LLM" é o pior estimador.

### 2.2 T-shirt sizing (P/M/G)

- **Definição:** estimativa relativa atribuindo "tamanhos de camisa" (PP/P/M/G/GG) por
  **complexidade + esforço + risco** percebidos.
- **Quando brilha:** triagem rápida de **dezenas/centenas** de itens cedo (roadmap, descoberta,
  priorização) — mesmas 10 stories saem em 15–20 min porque não se debate "P-médio vs. médio".
- **Custo:** **baixa precisão** — não distingue vizinhos. É *grosseiro por design*.
- **Híbrido comum:** T-shirt no início (roadmap) → planning poker quando a story entra em sprint.

**Para a etapa 3:** o **formato de saída de 3 bandas** (simples/média/alta) é, na prática, um
**T-shirt de 3 tamanhos** — escolha correta para o estágio "cedo" do GAP. O problema nunca foi o
*formato*; é **como se chega ao tamanho**. T-shirt tradicional chega por votação/sensação; nós vamos
chegar por **contagem de drivers + cálculo**.

---

## 3. Métodos paramétricos (computam de fatores objetivos — o mecanismo certo, peso errado)

### 3.1 COCOMO II — a estrutura de "drivers" mais completa

Modelo de Barry Boehm. Forma da equação de esforço:

```
PM (pessoa-mês) = A × (Tamanho)^E × Π(EMi)
   A ≈ 2.94 (constante calibrável)
   Tamanho em KSLOC (milhares de linhas) ou function points convertidos
   E = exponente derivado dos 5 scale factors  (efeito de escala/diseconomia)
   EMi = effort multipliers dos 17 cost drivers (ajustes multiplicativos)
```

**5 scale factors** (afetam a *forma* da curva — o exponente E):
`PREC` precedentedness · `FLEX` development flexibility · `RESL` architecture/risk resolution ·
`TEAM` team cohesion · `PMAT` process maturity.

**17 cost drivers** (multiplicadores) em 4 grupos: **produto** (RELY confiabilidade, **CPLX
complexidade**, DATA tamanho da base, DOCU, RUSE reuso), **plataforma** (TIME, STOR, PVOL), **pessoal**
(ACAP, PCAP, PCON, APEX, PLEX, LTEX), **projeto** (TOOL, SITE, **SCED** pressão de cronograma).

O driver **CPLX (Product Complexity)** é o mais relevante para nós: COCOMO II **não** trata
complexidade como sensação — **avalia em 5 áreas objetivas** e tira a média:
1. **operações de controle** (fluxo, concorrência, paralelismo);
2. **operações computacionais** (algoritmos, numérica);
3. **operações dependentes de dispositivo** (I/O, hardware);
4. **operações de gerência de dados** (estruturas/queries/estados);
5. **operações de gerência de interface** (UI).

Cada área tem rating **Very Low → Extra High**; CPLX = Very High dá multiplicador **≈ 1.34** (i.e.,
+34% de esforço). **Esta é a evidência canônica de que complexidade pode — e deve — ser decomposta em
fatores objetivos e somada/mediada**, não opinada.

**Por que é pesado demais para a maioria (e para nós, inteiro):**
- Exige o **tamanho em KSLOC up-front** — problema do ovo-e-galinha: para estimar você já precisa
  estimar quantas linhas o software terá. No GAP isso é impossível (o código nem existe).
- Exige **calibração** com dados históricos da organização para os multiplicadores fazerem sentido.
- 22 parâmetros (17+5) é **fricção alta** para uma etapa que roda a cada feature.

**O que importamos:** o **conceito de CPLX** (complexidade = média de áreas objetivas) e a ideia de
**drivers multiplicativos**. **O que descartamos:** KSLOC, calibração organizacional, os 22 parâmetros.

### 3.2 Function Points (IFPUG) — contar funcionalidade, não código

Mede **tamanho funcional** independente de tecnologia. Conta **5 tipos** de função e pesa cada um por
complexidade:

| Tipo de função | O que é | Peso Baixo / Médio / Alto |
|---|---|---|
| **ILF** Internal Logical File | dados mantidos *dentro* do sistema | 7 / 10 / 15 |
| **EIF** External Interface File | dados de sistemas *externos* (lidos) | 5 / 7 / 10 |
| **EI** External Input | entrada que altera dados | 3 / 4 / 6 |
| **EO** External Output | saída/relatório com processamento | 4 / 5 / 7 |
| **EQ** External Inquiry | consulta (lê sem processar) | 3 / 4 / 6 |

A complexidade Baixo/Médio/Alto de cada item vem de uma **matriz objetiva** de **DETs** (campos),
**RETs** (subgrupos) e **FTRs** (arquivos referenciados). Soma-se tudo → **Unadjusted FP**; aplica-se
o **VAF** (Value Adjustment Factor) das **14 General System Characteristics** (ex.: transações
distribuídas, performance, reusabilidade) → **Adjusted FP**.

**Limitações (bem documentadas):**
- **Parcialmente subjetivo** — várias regras "têm de ser interpretadas por quem mede".
- **Exige certificação/expertise**; produtividade baixa (400–600 FP/dia contados).
- **Correlaciona fortemente com linhas de código** — questiona-se o valor distinto.
- **Fraco para complexidade algorítmica/interna** (mede transações/dados, não processamento).
- **Múltiplos padrões ISO** (IFPUG, COSMIC, Nesma) → inconsistência.

**O que importamos:** a **matriz de complexidade objetiva** (rating Low/Avg/High **derivado de
contagens**: campos, subgrupos, arquivos tocados) — modelo perfeito de "complexidade computada". **O
que descartamos:** o aparato de certificação e o VAF de 14 fatores.

---

## 4. Os DRIVERS DE COMPLEXIDADE (o coração: o que torna uma feature complexa)

Cruzando as fontes, os drivers **objetivos e contáveis** que aparecem repetidamente:

| Driver | De onde vem (fonte) | Por que aumenta complexidade | Contável? |
|---|---|---|---|
| **Nº de integrações / pontos de contato** | parametric estimation; CPLX (gerência de dados); My PM Diary | cada sistema externo = contrato, falha, latência, desconhecido | **Sim** (conta) |
| **Difusão da mudança** (nº de arquivos/subsistemas tocados) | Kamei et al. (14 fatores, dim. *diffusion*); **Mockus & Weiss**; Hassan (*scattered changes*) | mudança espalhada → mais risco de defeito, mais coordenação | **Sim** (conta) |
| **Tamanho da mudança** (LOC/itens adicionados) | **Nagappan & Ball**; Moser et al. | mais a construir = mais esforço (não-linear) | **Sim** (conta) |
| **Acoplamento** (dependências entre componentes) | estudos de coupling × faults (Ce ~ defeitos em 6/7 sistemas) | alto acoplamento → efeito-cascata, "blast radius" | **Sim** (conta) |
| **Incerteza técnica / unknowns** | Cohn (risco/incerteza); McConnell (cone); COCOMO PREC/RESL | não se sabe *como* fazer → tentativa-e-erro, retrabalho | **Sim** (conta itens "?") |
| **Dependências (sequenciais/externas)** | internal dependencies; Count.co; SAFe | bloqueiam paralelismo, criam ordem obrigatória | **Sim** (conta) |
| **Superfície de dados / estados** | CPLX (data mgmt); FP (ILF/EIF/DET/RET) | mais entidades/estados/transições = mais caminhos e validações | **Sim** (conta entidades/estados) |
| **Complexidade de controle/algoritmo** | CPLX (control + computational ops) | concorrência, paralelismo, lógica intrincada | parcial (heurístico) |
| **UI / superfície de interface** | CPLX (UI mgmt ops); FP (EI/EO/EQ) | telas/fluxos novos = esforço de construção e teste | **Sim** (conta telas) |
| **Correção de bug em código existente** | estudo empírico (bug fix = maior gerador de complexidade) | mexer no legado introduz mais complexidade que feature nova | sinal (flag) |
| **Pressão de cronograma / experiência do time** | COCOMO SCED, APEX/PLEX/LTEX | menos folga e familiaridade ampliam o esforço efetivo | contextual |

**Os 3 macro-fatores de Cohn** servem de **taxonomia de topo** para agrupar tudo acima:
- **Volume** (quanto há para fazer) ← tamanho da mudança, nº de telas/endpoints/entidades.
- **Complexidade** (quão intrincado) ← acoplamento, controle/algoritmo, superfície de estados.
- **Incerteza/risco** ← unknowns técnicos, dependências externas, legado/bug fix.

> Insight central: **todo driver "bom" é contável e disponível cedo** (critérios de McConnell). E —
> decisivo para a etapa 3 — **vários desses drivers são exatamente o que o GAP já produz**: gaps
> abertos, suas prioridades (P0/P1), integrações faltantes, dependências mapeadas, perguntas em aberto.
> Logo, a complexidade **não precisa de input novo**: ela é **função do output do próprio GAP**.

---

## 5. Como justificar uma estimativa com fatores objetivos (não "sensação")

O padrão **parametric / weighted scoring** (Count.co é um exemplo concreto e citável) operacionaliza
o "Compute" de McConnell:

1. **Escolha fatores objetivos** (os drivers da §4) — cada um numa escala pequena (ex.: 0–3 ou 1–5).
2. **Atribua pesos** por importância (somando 100%). Exemplo Count.co:
   `Technical 40% · Dependencies 25% · Uncertainty 20% · Expertise 15%`.
3. **Compute** o score: `Σ(score_fator × peso)`. Ex. (autenticação):
   `(3×0.4)+(2×0.25)+(2×0.2)+(2×0.15) = 2.4`.
4. **Mapeie para bandas** com **limiares explícitos** validados contra histórico ("2.0–2.5 → 7–9 dias").
5. **Valide/recalibre** os pesos e limiares comparando com o esforço real ao longo do tempo.

A **justificativa deixa de ser uma frase** e passa a ser **a própria decomposição**: "alta **porque**
fator X=3 (peso 40%), Y=2… → score 2.4 → banda alta". Isso é defensável, reprodutível e auditável — o
oposto de "acho que é média".

> Princípio: a estimativa é **derivada e transparente**. Qualquer pessoa (ou agente) que veja os mesmos
> drivers chega à mesma banda. É o "Count→Compute" tornando o resultado **determinístico dado o
> contexto** — exatamente o M1.

---

## 6. Aplicação à etapa 3 — complexidade **derivada dos gaps**, não opinada

### 6.1 Diagnóstico do ADR 0013 (confronto)

O ADR 0013 acerta o **princípio** e a **forma de saída**:
- exige `simples | média | alta` **com justificativa obrigatória**;
- diz explicitamente que **"não é um label subjetivo"**;
- conecta a estimativa a consumidores reais (decisão de Walking Skeleton, nível de paralelismo do Mapa
  de dependências) — ou seja, a estimativa **tem cliente**, não é decorativa.

Mas o ADR é **omisso no mecanismo**, e é justamente aí que mora o risco de virar chute:
- **não diz de onde** sai o rótulo → porta aberta para o LLM "sentir" a banda;
- **não define os drivers** nem que eles devem vir **dos gaps já encontrados**;
- **não há fórmula/limiar** → "justificativa" pode degenerar em prosa pós-hoc que racionaliza um
  palpite (o anti-padrão "judge-first" que McConnell condena).

**Veredito:** a abordagem do ADR é uma **boa base, mas incompleta**. Não trocar de método — **completar**
o método, ancorando-o em Count→Compute. Recomenda-se um **ADR de complemento** (ou revisão do 0013)
especificando o cálculo abaixo.

### 6.2 Método proposto — `complexidade = f(drivers extraídos do GAP)`

A etapa 3 já encontra gaps. **Reaproveite-os como contáveis** (sem pedir input novo ao agente):

**Passo 1 — Contar (o agente extrai do contexto, M1):**
- `P0` = nº de gaps de prioridade máxima (bloqueadores);
- `P1` = nº de gaps importantes;
- `INT` = nº de integrações/sistemas externos envolvidos;
- `DEP` = nº de dependências entre gaps (acoplamento/ordem obrigatória);
- `UNK` = nº de itens marcados como incerteza técnica / pergunta em aberto;
- `SUP` = superfície de mudança (módulos/arquivos/entidades/estados tocados);
- `LEG` = flag de mexer em código existente/legado (bug-fix-like).

> Todos são **objetivos, disponíveis cedo e consistentes entre projetos** (critérios de McConnell) — e,
> crucial, **subprodutos naturais do GAP**. O CORE ensina o *critério* (o que conta como integração,
> como incerteza); o **contexto dá os números** (M1/M3: invariante = a regra; variável = a contagem).

**Passo 2 — Computar (regra fixa do motor, determinística):**
Um **score ponderado** (pesos a calibrar; ponto de partida inspirado em Count.co + drivers empíricos):

```
score = w1·P0 + w2·INT + w3·DEP + w4·UNK + w5·SUP + w6·P1 + bônus·LEG
```

Mapeado por **limiares explícitos** (exemplo ilustrativo, a validar no caso real — M4):

| Banda | Condição (exemplo) |
|---|---|
| **simples** | score baixo · 0 integrações · 0–1 P0 · sem incerteza relevante |
| **média** | score médio · 1–2 integrações **ou** 2–3 P0 **ou** dependências moderadas |
| **alta** | score alto · ≥3 integrações **ou** ≥5 P0 **ou** incerteza técnica alta **ou** legado |

> Isto realiza o exemplo do próprio briefing: **"5 gaps P0 + 3 integrações = alta"** — não porque o
> agente achou, mas porque **a regra computou**.

**Passo 3 — Justificar (a conta é a justificativa):**
A saída do GAP carrega o **rastro**, não uma opinião:

```json
{
  "complexidade": "alta",
  "score": 14,
  "drivers": { "P0": 5, "P1": 3, "integracoes": 3, "dependencias": 4,
               "incerteza": 2, "superficie": 7, "legado": false },
  "justificativa": "alta porque 5 gaps P0 (bloqueadores) + 3 integrações externas + 4 dependências entre gaps; score 14 acima do limiar de 'alta' (≥12)."
}
```

**Passo 4 — Ajuste por julgamento (último recurso, limitado):**
O LLM pode **mover ±1 banda** *somente* com justificativa explícita e fator nomeado (ex.: "subo para
alta: integração com sistema legado sem documentação, incerteza não capturada no score"). Isso respeita
a hierarquia de McConnell (judge **ajusta**, não origina) e mantém o ato de estimar **auditável**.

### 6.3 Por que isto satisfaz os princípios do projeto

- **M1 (dinâmico/derivado):** a banda é **computada do contexto** (os gaps), não fixada no CORE. Trocar
  de projeto/stack **não** exige editar o CORE — muda só a contagem. O CORE guarda o *critério e os
  limiares*; o contexto dá os *dados*.
- **M3 (invariante vs. variável):** **invariante** = quais drivers contam, os pesos, os limiares, a
  fórmula (regra do motor). **Variável** = os valores contados em cada feature (extraídos da demanda).
- **M2/M4 (bottom-up, testar antes de cristalizar):** pesos e limiares acima são **ilustrativos** —
  devem ser **destilados de um caso real** (o "briefing perfeito") e **validados contra um 2º caso
  diferente** antes de virarem ADR. Até lá, vivem em `ABERTO.md`/`_WIP-*`.
- **Estrutura de handoff:** a complexidade vira **conhecimento estruturado** (banda + drivers + score +
  justificativa) que alimenta o Mapa de dependências (nível de paralelismo) e a decisão de Walking
  Skeleton — exatamente os consumidores que o ADR 0013 já nomeia.

### 6.4 Riscos e mitigação

- **Falsa precisão:** um score numérico pode parecer mais exato do que é. Mitigação: a **saída final é
  a banda** (3 níveis, honesta com o cone de uncertainty); o score é só o *mecanismo de derivação*.
- **Pesos arbitrários sem histórico:** no começo não há dados para calibrar. Mitigação: começar com
  pesos por *consenso documentado* (ADR), tratar como **WIP**, e recalibrar quando houver esforço real
  observado (o passo "validate" do parametric).
- **Drivers fora da lista:** lista fechada é "último recurso" (M1). Mitigação: permitir que o agente
  **proponha um driver novo** com justificativa, registrado para futura incorporação ao CORE.

---

## 7. Síntese — tabela de decisão

| Método | Mecanismo | Subjetividade | Precisa de input pesado? | O que aproveitar na etapa 3 |
|---|---|---|---|---|
| **T-shirt (P/M/G)** | comparação relativa, votada | **Alta** (sensação) | Não | **só o formato** de bandas (3 níveis) |
| **Story points / Poker** | consenso humano, relativo | **Alta** | Não (mas exige grupo) | **vocabulário de drivers** (3 fatores de Cohn) |
| **COCOMO II** | paramétrico, 17+5 fatores × KSLOC | Baixa (mas calibração) | **Sim** (KSLOC, calibração) | **CPLX** = média de áreas objetivas; ideia de drivers |
| **Function Points** | paramétrico, matriz de contagem | Média (regras interpretáveis) | **Sim** (certificação) | **matriz de complexidade objetiva** (rating por contagem) |
| **Parametric / weighted (Count.co)** | `Σ(fator×peso)` → bandas + limiares | **Baixa** (transparente) | Não (escala leve) | **o modelo direto** para computar dos gaps |
| **#NoEstimates** | contar itens, prever por throughput | Mínima | Não | lembra que **contar > opinar** |

> **Tese final:** a etapa 3 deve adotar um **parametric/weighted scoring leve** cujos **fatores são os
> drivers extraídos dos gaps**, com **fórmula e limiares no CORE** e **banda + rastro como saída**. Isso
> mantém o formato do ADR 0013 (`simples|média|alta` + justificativa) mas substitui o **mecanismo
> opinado** por um **mecanismo computado** — Count→Compute→Judge, M1 cumprido.

---

## Fontes

**McConnell — Count/Compute/Judge & Cone of Uncertainty (princípio central)**
- Count, Compute, Judge (cap. 7, *Software Estimation*) — https://flylib.com/books/en/2.822.1.55/1/
- Count, Compute, Judge (O'Reilly, índice cap. 7) — https://www.oreilly.com/library/view/software-estimation-demystifying/0735605351/ch07.html
- "How to Estimate Well: Count, Compute, Judge" — https://www.operationalsystems.com/how-to-estimate-well-count-compute-judge-part-3-5/
- Cone of Uncertainty (PDF de McConnell) — https://athena.ecs.csus.edu/~buckley/CSc231_files/McConell_ConeofUncertainty.pdf
- Cone of Uncertainty (Coding Horror) — https://blog.codinghorror.com/the-mysterious-cone-of-uncertainty/

**Story points / Planning Poker / T-shirt (métodos relativos)**
- Mike Cohn, "What Are Story Points?" — https://www.mountaingoatsoftware.com/blog/what-are-story-points
- Cohn, "Agile Estimating with Story Points" — https://www.mountaingoatsoftware.com/agile/agile-estimation-estimating-with-story-points
- T-shirt sizing vs Planning Poker (Easy Agile) — https://www.easyagile.com/blog/agile-estimation-techniques
- T-shirt sizing — alternativa rápida ao Poker — https://www.planning-poker.app/blog/t-shirt-sizing-fast-alternative-planning-poker
- "Death to story points! Long live T-shirt sizing!" (Crittenden) — https://critter.blog/2020/06/23/death-to-story-points-long-live-t-shirt-sizing/
- Atlassian — escolher método de estimativa — https://www.atlassian.com/blog/add-ons/choose-best-methods-estimation-planning
- SAFe — normalized story points / reference story — https://www.agilerising.com/blog/what-is-normalizing-story-points-across-teams/
- RGalen — Reference Stories & Story Points — https://rgalen.com/agile-training-news/2019/12/5/reference-stories-amp-story-points

**Crítica a story points / #NoEstimates (por que sensação não basta)**
- "Story points are pointless" (Scott Logic) — https://blog.scottlogic.com/2024/07/05/story-points-are-wasting-time.html
- "Why Story Points Don't Matter" (Axify) — https://axify.io/blog/story-points
- "Story Point Estimation Doesn't Work" (Uplevel) — https://uplevelteam.com/blog/story-point-estimation

**COCOMO II (paramétrico, CPLX, scale factors)**
- Overview of COCOMO (Softstar) — https://www.softstarsystems.com/overview.htm
- COCOMO II Model Definition Manual (PDF) — https://personal.utdallas.edu/~John.Cole/CoCoMo2.pdf
- COCOMO II Model Definition Manual (USC, PDF) — https://www.rose-hulman.edu/class/cs/csse372/201310/Homework/CII_modelman2000.pdf
- Boehm — COCOMO 2.0 (paper original, PDF) — https://staff.emu.edu.tr/alexanderchefranov/Documents/CMPE412/Boehm1995%20COCOMO%202%20.pdf
- COCOMO Model (DataCamp) — https://www.datacamp.com/tutorial/cocomo-model
- Cost Drivers / Effort Multipliers (Agile Estimator) — http://www.agileestimator.com/2020/02/15/cost-drivers-effort-multipliers/
- Cost Drivers / Scale Factors (Agile Estimator) — http://www.agileestimator.com/2020/01/22/cost-drivers-scale-factors/

**Function Points (paramétrico, matriz de complexidade)**
- Function point (Wikipedia) — https://en.wikipedia.org/wiki/Function_point
- IFPUG — Function Point Analysis (FPA) — https://ifpug.org/ifpug-standards/fpa
- The Function Point Counting Process (InformIT) — https://www.informit.com/articles/article.aspx?p=19800&seqNum=3
- Primer to Function Point Analysis (McFarland) — https://highervista.medium.com/a-primer-to-function-point-analysis-for-the-software-project-manager-8436e3fd6b59
- Simplified Function Points (QSM) — https://www.qsm.com/blog/2021/simplified-function-point-analysis-sifp

**Drivers de complexidade — evidência empírica (predição de defeitos/esforço)**
- Kamei et al. — change metrics (5 dimensões, citado em) — https://arxiv.org/pdf/2507.19714
- Co-Change Graph Entropy (Mockus & Weiss, Hassan, citados) — https://arxiv.org/pdf/2504.18511
- "Effect of coupling on software faults: An empirical study" — https://www.researchgate.net/publication/316732490_Effect_of_coupling_on_software_faults_An_empirical_study
- Bug fixes como maior gerador de complexidade (Scott Logic, acima) e estudos de change-proneness — https://arxiv.org/pdf/2408.05704

**Parametric / weighted scoring (o mecanismo a adotar) & frameworks de complexidade de feature**
- Task Complexity Scoring (Count.co — fatores, pesos, fórmula, bandas) — https://count.co/metric/task-complexity-scoring
- "Assessing Feature's Effort and Complexity" (My PM Diary) — https://mypmdiary.com/assessing-feature-complexity/
- The Weighted Scoring Model (Savio) — https://www.savio.io/product-roadmap/weighted-scoring-model/
- Software Estimation Techniques (Axify) — https://axify.io/blog/software-estimation-techniques
- "Applying Requirement Based Complexity for Estimation" (ResearchGate) — https://www.researchgate.net/publication/239761591_Applying_Requirement_Based_Complexity_for_the_Estimation_of_Software_Development_and_Testing_Effort
