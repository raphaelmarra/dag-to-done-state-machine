# Changelog

Todas as mudanças notáveis deste projeto. Formato: [Keep a Changelog](https://keepachangelog.com/).
Manter via skill `manter-governanca`. Escopo de commit: `docs(etapa-N):`, `docs(governanca):`, `feat(motor):`.

## [Não lançado]

### Revisão cega do plano da etapa 1 (2026-06-28)
- **`docs/_RETRO-revisao-plano-etapa1.md`** (novo) — registro da revisão adversarial do PLANO-DE-ETAPA
  por um verificador cego independente ANTES de executar. 10 findings (3 graves). Provou o portão
  anti-viés: o cego achou F1 (`{next_stage}` nunca substituído no motor — bug real), F2 (ordem das
  peças se inverte ao ler o código), F7 (estado curado hardcoded no motor, blast radius nas 13 etapas)
  — que o autor não viu sozinho.
- **`PLANO-DE-ETAPA.md` corrigido:** tracker reordenado por dependência real; schema vira DADO ÚNICO
  (não parsear markdown — F3); contrato anti-viés reconhece que verificador cego = mesmo modelo (não
  neutraliza viés sistemático; esforço F exige evidência mecânica — F4); DoD endurecida (caixas
  objetivas, "citar ≠ sustentar" — F5); escopo de peças com teste por peça (não auto-referência — F6).
- **Viés-raiz documentado:** a auditoria-base checava *presença de campos*, não *consistência
  CORE↔motor↔teste* — o mesmo erro (`camposPresentes`) que o plano quer corrigir no código. Vira
  regra do método para as etapas 2–13.

### Sistema de plano de etapa + piloto da etapa 1 (2026-06-28)
- **`docs/PLANO-DE-ETAPA.md`** (novo) — molde + tracker para completar uma etapa INTEIRA peça por
  peça (o CORE/briefing é só 1 das 18 peças). Formaliza o "contrato de execução" do piloto: M1
  (dinâmico > hardcode), autonomia total na execução, **portão anti-viés máximo** (verificador
  independente cego ratifica cada peça — réu nunca é juiz), evidência obrigatória. Inclui Definition
  of Done por peça e triagem de esforço (Trivial/Média/Funda → qual método aplicar).
- **Plano concreto da etapa 1 (DAG)** preenchido a partir de auditoria factual (subagente): 9 peças
  obrigatórias presentes, mas 3 com hardcode que viola M1 (schema, critério de aceitação, grau de
  certeza) + bloqueio incompleto. Tracker com ordem/dependências/esforço. Próximo: executar peça a
  peça com ratificação cega.

### Catálogo de anatomia de etapa (2026-06-28)
- **`docs/ANATOMIA-DE-ETAPA.md`** (novo) — documento de consulta que lista **todas as peças que se
  pode definir numa etapa** da state machine (não só o briefing): executor, grau de certeza, estado
  curado, briefing, profundidade, padrão de entrega (schema), critério de aceitação, gaps direcionais,
  handoff, bloqueio, lentes, pre-mortem, spike, paralelismo, arquétipo, walking skeleton, verificação
  independente, retry. Cada peça com o-que-é/quando/exemplo/decisão/status (🟢 em uso · 🔵 disponível ·
  ⚪ candidata), ancorada nos ADRs/COREs/pesquisas reais. Indexado em INDEX (Reference).

### v1 pós-MVP: CORE-DAG v4.0 plugado no motor (2026-06-28)
- **`v1/`** (novo) — versão pós-MVP, clone só-código do `MVP/` (motor `dag.mjs`, config, spec/plan,
  testes), autocontido. O `MVP/` fica congelado como marco + evidência da aba CLIs.
- **Etapa 1 (DAG) agora roda o CORE-DAG v4.0 cristalizado** — `v1/pipeline.config.mjs` aponta a etapa
  `dag` para `cores/CORE-DAG.md` (cópia local autocontida) via `corePath`; schema atualizado para o
  v4.0 (`nos, arestas, blast_radius, fronteira, gaps, confianca`).
- **Testes 8/8 verde** (`cd v1 && node --test`): 5 e2e herdados + 3 novos em `core-dag.test.mjs`
  (briefing carrega o CORE rico de 4.0, não o fallback; schema v4.0; **sincronia** cópia↔fonte
  `docs/CORE-DAG.md` — falha se divergirem, impedindo a duplicata de apodrecer).
- Verificado ponta-a-ponta: `node dag.mjs next` gera briefing de ~316 linhas com estado curado +
  CORE-DAG v4.0 completo. ROADMAP/INDEX atualizados.

### Metodologia do CORE documentada + retrospectiva cética (2026-06-28)
- **`docs/METODOLOGIA-CORE.md`** (novo) — o pipeline reutilizável para destilar o CORE de qualquer
  etapa (pesquisa → Fase 0 vereditos → Fase 1 padrão-ouro cego+principal → Fase 2 escrever → Fase 3
  testar com executor independente → Fase 4 cristalizar). A pesquisa de *forma* (0006–0010) não se
  repete nas etapas 2–13; só a de *conteúdo* + as fases.
- **`docs/_RETRO-metodologia-core.md`** (novo) — retrospectiva cética: a metodologia foi exercitada
  **1x, pelo autor, com testes que o autor escolheu** → NÃO está validada. Registra 4 furos (n=1/réu
  é juiz; cego não-independente; adversarial fácil demais; "passou" foi julgamento, não critério
  mecânico) e o critério de promoção a "validada". Evita que o próximo agente herde otimismo.
- INDEX atualizado (How-to + contagem de ADRs = 22).

### CORE-DAG v4.0 cristalizado (2026-06-28)
- **`docs/CORE-DAG.md` → v4.0** (v3.0 arquivado em `CORE-DAG-v3.archive.md`). Evoluído pela rotina
  0→4 (escrever → revisar → testar → cristalizar) contra 2 casos reais (CRM amplo do ravi-console +
  regressão aba CLIs) e 9 pesquisas. Mudanças:
  - **Aciclicidade verificável** (A2 testa o caminho de volta, não assume) — ADR 0022.
  - **Profundidade dinâmica** (1 hop default + gatilhos hub/pass-through/contrato; transitivos "a
    verificar" em vez de omitidos) — ADR 0020.
  - **Nó no nível Component (C4)** + **blast radius com amplitude graduada** (BAIXA→CRÍTICA) — ADR 0021.
  - **Regras de escrita** das pesquisas: sanduíche (regra-mestra repetida no fim), polaridade
    positiva, exclusões como transferência de responsabilidade, raciocínio-antes-do-JSON.
  - **Condensação de ciclo (A5)** marcada PROVISÓRIA — validada só em teste sintético (ABERTO A010).
- **ADRs 0020, 0021, 0022** criados; **A008 resolvida**; **A010** aberta (condensação provisória).
- **Validação (Fase 3):** agente cego executou o briefing gerado pelo v4.0 no CRM → 23 nós, 4 hubs,
  blast radius graduado, 5 gaps filtrados por C1 (4 descartados), 0 ciclos com verificação por aresta.
  Teste sintético de import circular → super-nó declarado corretamente. Evidência em `docs/research/`
  (`_cego-briefing-crm.md`, `_teste-v4-crm-output.md`) e `docs/_WIP-core-dag-v4.md` (registro da rotina).
- ROADMAP: etapa 1 (DAG) de 🟡 → ✅. INDEX e DECISOES atualizados.

### Fundação teórica do CORE (2026-06-27, sessão posterior)
- **`docs/FLUXO-EXECUCAO.md`** (novo) — registra como a execução roda de fato: a state machine
  é dona dos prompts; o agente principal consome o briefing e o **traduz** num prompt de
  delegação próprio; o subagente executa. Explica por que a reescrita é feature (generalidade —
  M1) e a tensão que abre.
- **`docs/ABERTO.md` A009** — controle de fidelidade da delegação (a máquina não valida o que
  foi delegado). Direções registradas; decisão adiada para quando destilarmos o CORE no motor.
- **`docs/research/0006–0010`** (novos) — 5 pesquisas com fontes sobre construção de prompt:
  técnicas com validação científica, meta-prompting, frameworks de inspiração, clareza-para-LLM
  e redação humana clássica (com a divergência humano↔LLM).
- **`docs/research/0011–0014`** (novos) — 4 pesquisas profundas sobre DAG, calibradas para
  CONFRONTAR o CORE-DAG atual: acíclico vs cíclico (premissa), análise de impacto (fronteira
  1-hop), modelagem arquitetural (granularidade de nó) e ferramentas reais.
- **Achados que alimentam revisão futura do CORE-DAG (→ v4.0, a validar por M4):** forçar DAG é
  sólido no domínio de consumo (Acyclic Dependencies Principle), mas A1/A2 *impõem* aciclicidade
  sem verificá-la — recomendado tornar A2 falsificável + condensação (SCC) como rede de segurança;
  fronteira "1 hop" (A4) é frágil (falso negativo de ripple) — recomendado profundidade dinâmica.
- `docs/INDEX.md` atualizado com os 9 docs de pesquisa e o FLUXO-EXECUCAO.

### Verificação de estado (2026-06-27, sessão posterior)
- **Repo publicado** — `raphaelmarra/dag-to-done-state-machine` (privado), `origin` configurado,
  `main` sincronizada. Bloqueio de publicação **resolvido** (usuário publicou pelo terminal). Nome
  final ficou `dag-to-done-state-machine`, não `state-machine-in-nodejs`.
- **Testes reverificados** — `cd MVP && node --test` → **5/5 verde**.
- `ESTADO-ATUAL.md` e `ROADMAP.md` atualizados para refletir o repo publicado.
- **Pendência remanescente:** compartilhar o repo com `filipexyz` (ainda só `raphaelmarra` consta).

### Handoff (2026-06-27)
- `ESTADO-ATUAL.md` — ponto de entrada para a próxima sessão: onde paramos e os próximos passos.

### Adicionado — MVP (Walking Skeleton) funcional
- **`MVP/` — motor da state machine em Node puro, funcional e testado.** `dag.mjs` (verbos
  init/next/advance/status), `pipeline.config.mjs` (13 etapas), e2e `node --test` **5/5 verde**.
- **Motor genérico + porteiro intransigente** — validado parte por parte (subagentes) + auditoria
  integrada. Bugs achados e corrigidos: contrato `aceita()` dos gates (e2e), colisão do sentinela
  "done" (auditoria P0), escrita atômica de estado e load resiliente (P1).
- **Handoff com subagente REAL provado** — Explore mapeou o CRM do ravi-console, escreveu no
  caminho de convenção, o motor validou e avançou. Cumpre "cada etapa que delega deve funcionar".
- **PRD do MVP:** `MVP/spec.md` (RF-001..007, gaps, spike) + `MVP/plan.md` (orquestração por subagentes).
- Viabilidade validada contra a doc oficial da Anthropic (stdout 30KB, delegação ≤5 níveis, hooks reativos).

### Adicionado
- **Governança do projeto** (pacote completo): `docs/INDEX.md` (índice navegável),
  `docs/SOURCES.md` (cross-reference do ravi-console), `docs/ROADMAP.md` (marcos motor+13 etapas
  com DoD), `CHANGELOG.md`, e migração das 19 decisões para ADRs MADR em `docs/adr/`.
- **Skill global `manter-governanca`** (`~/.claude/skills/`) — mantém índice/ADRs/roadmap/WIP
  atualizados; codifica a regra "consulte INDEX/SOURCES antes de pesquisar".
- **Metodologias M1-M4** no CLAUDE.md: M1 (dinâmico é a preferência), M2 (bottom-up),
  M3 (invariante vs. demanda), M4 (testar antes de cristalizar).
- **CORE-DAG v3.0** — reescrito bottom-up a partir do briefing perfeito (caso CRM); genérico
  para qualquer projeto e stack (tipos de nó descobertos do stack, sem hardcode).

### Mudado
- `DECISOES.md` virou decision-log (índice que aponta para os ADRs).
- `CLAUDE.md` enxugado (<150 linhas): papel + regras + ponteiro para o INDEX; conteúdo extenso
  de CORE/Meta-Prompt referenciado em `docs/CORE.md`.

### Validação (etapa 1 — DAG)
- CORE-DAG validado 2x (baseline CRM + aba CLI). Funcionou: grafo acíclico, custo híbrido,
  proteção contra "bug como gap". Achados anotados em A008 (#6 desempate, #7 provedor não-rede,
  #8 shape de comando) — a cristalizar quando rodar no motor real.

---

## [0.1.0] — 2026-06-26 — Projeto inicial

### Adicionado
- Estrutura inicial extraída do ravi-console: CLAUDE.md, PIPELINE.md (13 etapas), CORE.md,
  CORE-DAG.md, DECISOES/ABERTO/DESCARTADO/REFERENCIAS, benchmarks.
- State machine faseada (ADR 0019): um CORE por etapa.
