# research/0015 — Síntese do racional + movimentos táticos não-nomeados (Fase 0 da A022)

> **Origem:** Fase 0 do plano `docs/superpowers/plans/2026-06-30-skill-replicavel-state-machines.md`. Executada pelo
> agente `Explore` (read-only) em 2026-06-30. Reconstrói o racional do projeto e extrai os movimentos de método que
> usamos na prática mas NUNCA nomeamos no `METODOLOGIA-CORE.md`. Toda afirmação ancorada num arquivo/ADR real.
> **Status:** insumo de descoberta (não cristaliza nada). Funda as Fases 1–3 da skill replicável (A022).
>
> **Nuance importante registrada pela Fase 0:** o "CORE-DAG dobrou v3→v4" refere-se a RIQUEZA CONCEITUAL
> (verificabilidade + condensação SCC + profundidade dinâmica + amplitude graduada + candidatos transitivos), NÃO a
> linhas (v3 252 → v4 287). A Fase 3 não deve citar "dobrou de tamanho" como contagem de linhas.

---

## Síntese cronológica do racional

A história não é "13 etapas construídas em sequência". É a história de **um motor genérico que se pagou** e de **um
método de destilação que foi se endurecendo a cada etapa que destilava** — cada etapa virou um datapoint sobre o
próprio método. Agrupado em 6 marcos.

### Marco 1 — Fundação de design no papel (ADRs 0001–0014, 2026-06-26)
Antes de uma linha de motor, 14 decisões de arquitetura do pipeline foram cortadas e registradas como ADRs
(`docs/DECISOES.md`, linhas 9–22). O racional: **decidir a forma do pipeline antes do conteúdo** — state machine
nativa em Node puro (`adr/0001`), briefing gerado pelo estado (`adr/0002`), critério binário por etapa (`adr/0003`),
DAG como 1ª etapa (`adr/0007`), pre-mortem obrigatório no Design (`adr/0006`). Já aqui aparece um movimento-semente:
**`adr/0015` ("Meta-Prompt + Structured Handoff")** não inventa o padrão — vai buscar o NOME na literatura (APE
arXiv 2211.01910, Microsoft Agent Framework) e o justifica com evidência ("+90.2% vs agente único"). Motivo
declarado: *"Nomear o padrão evita reinvenção e ancora futuras decisões em evidência"*. É o batismo+expansão em
embrião, aplicado ao padrão-mãe.

### Marco 2 — Os princípios M1–M4 e a regra de ouro epistêmica (`adr/0016`, `CLAUDE.md`)
O `CLAUDE.md` (linhas 32–46) cristaliza 4 metodologias: **M1** (dinâmico > fixo), **M2** (bottom-up: briefing perfeito
→ destilar racional → CORE), **M3** (separar invariante de variável), **M4** (testar antes de cristalizar). O
`adr/0016` é o pivô epistêmico: *"Nenhuma ideia nova é registrada como decisão antes de um teste isolado
comparativo"* — nasceu de um benchmark A/B onde "schema primeiro" parecia certo mas produziu schema mais fraco. É a
raiz da disciplina "provisório explícito".

### Marco 3 — O MVP (Walking Skeleton) e o nascimento do motor
O motor mínimo foi construído primeiro (`MVP/dag.mjs`) — racional no `ROADMAP.md`: **motor cedo** para os COREs
nascerem testados nele e evitar "poço de polimento". Antes de executar a etapa 1, o plano passou por **revisão cega
adversarial** (`_RETRO-revisao-plano-etapa1.md`): o crítico cego achou 3 problemas graves que o autor não viu
(placeholder `{next_stage}` inerte, ordem invertida, estado curado hardcoded). Lição-âncora: *"a auditoria-base deve
verificar consistência entre artefatos, não apenas presença de campos"*.

### Marco 4 — O caso do DAG: onde o método se descobre (CORE-DAG v3 → v4, 2026-06-28)
O coração do projeto e a fonte do achado-âncora. A sequência real (de `_WIP-destilacao-core-dag.md` e
`_WIP-core-dag-v4.md`):
1. Escreveu-se o **briefing perfeito cru** do caso CRM (`_WIP-briefing-dag-perfeito.md`) — em prosa, SEM nomes da
   literatura: "nó = superfície/função", "backward é calculado", "fronteira 1 hop".
2. Destilou-se o racional (`_WIP-destilacao-core-dag.md`) em 4 camadas A/B/C/D — isso É o CORE-DAG v3.0.
3. **Disparou-se pesquisa em paralelo** (`research/0011–0014`) NOMEANDO os conceitos: a fronteira virou *Change
   Impact Analysis / blast radius / program slicing* (`research/0012`); a aciclicidade virou *Acyclic Dependencies
   Principle / SCC / condensação de Tarjan* (`research/0011`).
4. **A pesquisa revelou que o conceito era MAIOR que a fatia usada** e o cenário expandiu: "1 hop" virou
   **profundidade dinâmica** (`adr/0020`), o blast radius ganhou **amplitude graduada** (`adr/0021`), a aciclicidade
   deixou de ser axioma e virou **meta verificável** + condensação SCC (`adr/0022`).

O racional da expansão é explícito: `research/0012` diz *"1 hop como teto rígido é perigoso... o gatilho deveria ser
mais rico"*; `research/0011` diz *"A2 deveria ser uma meta a verificar, não um axioma"*. O v4.0 saiu validado contra
2 casos (CRM amplo + aba CLIs estreita), cristalizado em 3 ADRs, com a regra A5 (condensação) honestamente marcada
PROVISÓRIA (só passou em sintético — `ABERTO.md` A010).

### Marco 5 — A cadeia de etapas e a tese de amortização PROVADA (etapas 2–10, ADRs 0023–0031)
A partir da etapa 2 o racional dominante é **reutilizar, não reconstruir**. `METODOLOGIA-CORE.md` (linhas 118–130)
prova por número: etapa 1 custou ~155 linhas de infra genérica; etapa 2 custou ~50 de config e **0 de motor**. Cada
etapa nova é "declarar um objeto". A cadeia também é o laboratório onde o método se endurece:
- **Etapa 2 (`adr/0023`)** ensinou "passou no teste ao vivo ≠ pronto" — o anti-viés depois achou a regra burlável por
  evidência vazia `{}`. Lição virou regra (as 3 checagens + regra do encadeamento).
- **Etapa 3 (`adr/0024`)** unificou as regras em `regrasExtras` declarativo (resolveu A012).
- **Etapa 6 (`adr/0027`)** foi a única a tocar o motor em 5 etapas: estendeu-o **1× genérico e retrocompatível**
  (`estado` às regras) para servir o pipeline inteiro.
- **Etapa 7 (`adr/0028`)** fechou "réu nunca é juiz" na própria mecânica.
- **Etapa 9 (`adr/0030`)** levou a amortização ao "gênero mais distante" (verificação ao vivo): ZERO motor novo.

### Marco 6 — O E2E piloto e a virada para a meta-camada (2026-06-30)
A 1ª condução completa de uma feature real pelas 13 etapas (`RELATORIO-E2E-PILOTO.md`). O pipeline passou, mas
**encontrou um defeito no próprio pipeline**: a **cegueira de fonte** (A020). Isso gerou a **Etapa 0** (`adr/0032`,
isolada) e abriu as duas frentes futuras: meta-aprendizado (A021) e **a skill replicável (A022)** — a razão deste
relatório.

---

## Movimentos táticos não-nomeados

Cada movimento: **Nome | Descrição | Evidência | Está no METODOLOGIA-CORE?**

### M-T1 — Batismo + expansão pelo nome canônico (achado-âncora, CONFIRMADO)
**Descrição:** destila-se primeiro o racional CRU (sem jargão). Só DEPOIS dá-se a ele o NOME da literatura.
Pesquisa-se esse nome. Descobre-se que o conceito canônico é MAIOR que a fatia usada. EXPANDE-se o cenário. A ordem
importa: destilar primeiro evita ancorar no jargão antes de ter o pensamento próprio; nomear depois abre a biblioteca
inteira.
**Evidência (forte, caso canônico):** racional cru em `_WIP-briefing-dag-perfeito.md` e `_WIP-destilacao-core-dag.md`
SEM nomes; batismo na pesquisa (`research/0012`: CIA/blast radius/slicing; `research/0011`: ADP/SCC/Tarjan); expansão
mensurável (`adr/0020/0021/0022`). O `_WIP-core-dag-v4.md` (Fase 0, M-A/M-B/M-C) é o registro literal.
**No METODOLOGIA-CORE?** PARCIAL e em ORDEM INVERSA. A pré-fase PESQUISA (linhas 28–40) manda pesquisar ANTES de
destilar; o movimento "batizar o racional já destilado e deixar o nome revelar que o conceito é maior" não é nomeado;
não há instrução de "expandir o cenário ao descobrir que o canônico excede a fatia".

### M-T2 — Fusão cego↔autor com extração assimétrica
**Descrição:** não se confia só no principal (viés) nem só no cego (sem rigor). Dois briefings independentes, fundidos.
Assimetria deliberada: cego = frescor não-enviesado; principal = rigor estrutural.
**Evidência (forte):** `_WIP-core-dag-v4.md` (Fase 1: "o que o CEGO viu melhor" — amplitude graduada virou `adr/0021`
— vs. "o que EU estruturo melhor"). `_RETRO-revisao-plano-etapa1.md` (o cego pegou 3 bugs reais).
**No METODOLOGIA-CORE?** SIM, mas RASO (Fase 1, linhas 50–53). Falta a heurística nomeada (cego=frescor/autor=rigor)
e a observação de que um achado do cego pode virar regra NOVA do CORE.

### M-T3 — Extensão fundacional amortizável
**Descrição:** ao precisar de mecanismo que o motor não tem, não hardcode na etapa — espere um 2º caso (M4), estenda o
motor 1× genérico e retrocompatível, e toda etapa futura herda. NÃO estender é tão deliberado quanto estender (dívida
em ABERTO até o 2º caso).
**Evidência (forte):** `adr/0027` (estender 1× resolveu A014+A015); `ABERTO.md` A014 (adiar conscientemente);
`_RETRO-mvp-vs-v1.md` ("a fábrica antes do 2º produto").
**No METODOLOGIA-CORE?** AUSENTE como passo; implícito em M4 + tese de amortização.

### M-T4 — Declaração de limite epistêmico
**Descrição:** cada CORE declara EXPLICITAMENTE o que o porteiro consegue checar (forma, evidência colada, coerência)
e o que NÃO consegue (autenticidade, pertinência, completude). O limite vira texto no CORE + dívida em ABERTO com
direção. Transforma falso-negativo silencioso em aviso explícito.
**Evidência (muito forte, 5+ etapas):** `adr/0027` (A016), `adr/0028`, `adr/0030`+A018, A017, A019.
**No METODOLOGIA-CORE?** AUSENTE como passo. Há "provisório explícito" (Fase 2/4), mas não "declarar dentro do CORE a
fronteira epistêmica do porteiro".

### M-T5 — Honestidade imposta pela forma (anti-fuga)
**Descrição:** toda saída que poderia ser fuga ("confirmado", "N/A", "inconclusivo", "skip", "aprovado") exige um
ÔNUS DE PROVA colado e MECÂNICO (evidência não-oca, motivo de enum fechado, prova-da-ausência). A defesa é mecânica
(token/objeto/número), não semântica. Fragmenta a permissão de fuga em muitas mentiras pontuais auditáveis.
**Evidência (muito forte, quase a "regra-mãe"):** `regraEvidenciaObrigatoria` (etapa 2, `adr/0023`);
`regraNaoAplicavelComMotivo` (etapa 7, `adr/0028`); `inconclusivo` com enum fechado (etapa 9, `adr/0030`);
`regraCensoConfrontado` (etapa 0, `adr/0032`).
**No METODOLOGIA-CORE?** AUSENTE como princípio nomeado (só a lição da etapa 2 sobre evidência vazia, linhas 75–79).

### M-T6 — Transporte de disciplina (reuso conceitual, não só de infra)
**Descrição:** além de reusar fábricas de regras, reusa-se o RACIOCÍNIO de uma etapa noutra (o DAG de código → grafo
de tarefas; o veredito honesto de incerteza migra; "réu nunca é juiz" vira mecânica).
**Evidência (forte):** `adr/0026` (etapa 5 = disciplina do DAG aplicada a unidades); `adr/0028` (etapa 7 = juiz da 6);
`adr/0030` (etapa 9 = parente da 2).
**No METODOLOGIA-CORE?** AUSENTE. Fala de reuso de INFRA, não CONCEITUAL.

### M-T7 — Retro-aplicação de lente
**Descrição:** toda lente nova nascida numa etapa é re-aplicada às etapas JÁ fechadas (a dívida que só aparece sob luz
nova).
**Evidência (forte):** `ABERTO.md` A013 — a lente "paridade CORE↔porteiro" nasceu na etapa 2 e expôs 4 buracos na
etapa 1.
**No METODOLOGIA-CORE?** PARCIAL (as 3 checagens cobrem a etapa NOVA; falta o passo de retroceder e re-auditar as
fechadas).

### Candidatos sem evidência forte (registrados por honestidade)
- *"Pré-mortem do método antes de escrever a skill"* — é do plano FUTURO (Fase 5 da A022), não da história executada.
- *"Triagem de esforço por peça"* (`PLANO-DE-ETAPA.md`) — citado mas não verificado nesta passada; a Fase 1/3 confirma.

---

## Recomendação para a Fase 3 (meta-método) — a decisão é da Fase 3

**Promover a passo formal (alta convicção):**
1. **M-T1 (Batismo + expansão)** — achado-âncora; o único cuja ausência demonstravelmente custou riqueza. Formalizar
   CORRIGINDO a ordem do método: **destilar racional cru → batizar com nome da literatura → pesquisar o nome → se o
   conceito canônico excede a fatia, EXPANDIR**. É o mais geral cross-domínio (todo domínio tem literatura canônica
   que o praticante ainda não nomeou).
2. **M-T5 (Honestidade imposta pela forma / anti-fuga)** — a invariante de produto mais consistente (5+ etapas).
   "Todo porteiro exige ônus de prova mecânico para saída-fuga" é princípio de altíssimo retorno e domínio-agnóstico.
3. **M-T4 (Limite epistêmico declarado)** — impede o pipeline de mentir sobre o que garante. Generaliza a qualquer SM.

**Promover com ressalva (média convicção):**
4. **M-T3 (Extensão fundacional amortizável)** — específico de SMs com motor separado do conteúdo; a Fase 3 deve checar
   se todo domínio-alvo tem essa separação.
5. **M-T2 (Fusão cego↔autor)** — já no método, mas raso; enriquecer com a heurística (cego=frescor/autor=rigor) SEM
   vender o cego como neutralizador de viés sistemático (`_RETRO-metodologia-core.md` Furo 2: "cego não é independente").

**Manter como heurística, não passo central (baixa convicção):**
6. **M-T6 (Transporte de disciplina)** e **M-T7 (Retro-aplicação de lente)** — valiosos, mas difíceis de tornar passo
   executável sem virar burocracia. Registrar como heurísticas do meta-método.

**Ressalva geral:** o `_RETRO-metodologia-core.md` lista 4 furos abertos (n=1, cego não-independente, adversarial
fácil, juiz=autor) e a A022 avisa que "empacotar não conserta os furos". Qualquer passo promovido herda a imaturidade.
O teste real só virá quando a skill gerar uma SM de domínio NÃO-software (o "2º caso", Fase 7). Este relatório funda
as hipóteses; não as valida.