# Changelog

Todas as mudanças notáveis deste projeto. Formato: [Keep a Changelog](https://keepachangelog.com/).
Manter via skill `manter-governanca`. Escopo de commit: `docs(etapa-N):`, `docs(governanca):`, `feat(motor):`.

## [Não lançado]

### Handoff (2026-06-27)
- `ESTADO-ATUAL.md` — ponto de entrada para a próxima sessão: onde paramos, o bloqueio de
  publicação no GitHub (classificador de segurança — só o usuário consegue rodar), e os próximos passos.
- **Pendência conhecida:** o repositório `state-machine-in-nodejs` (privado, conta raphaelmarra,
  compartilhar com filipexyz) NÃO foi publicado — o classificador bloqueia toda tentativa do agente.
  Comandos prontos para o usuário rodar estão no `ESTADO-ATUAL.md`.

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
