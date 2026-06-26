# SOURCES — Conhecimento em repositórios externos

> Cross-reference (padrão meta-repo): conhecimento valioso que vive em OUTROS repos.
> Não duplicamos o conteúdo — apontamos. Consulte aqui ANTES de pesquisar ou redescobrir.
> Manter via skill `manter-governanca`.

---

## ravi-console — `C:\Users\gouve\Desktop\ravi-console`

Projeto de origem deste pipeline. O DAG-to-Done nasceu aqui (contrato + porteiro + `dag.mjs`)
antes de ser redesenhado como state machine genérica. Contém o **DAG real já produzido** e
versões anteriores dos nossos próprios documentos.

### `docs/relations/` — o DAG/mapa de relações REAL (verificado ao vivo)
> ⚠️ Referência de FORMATO, não gabarito (tem gaps autodeclarados ~90% confiança).
- `README.md` — SSoT do grafo: regra "1 hop + closure sob demanda", custo de aresta 🟢🟡🔴, seção "Implicações de design".
- `entities.md` — entidades + edges diretos (forward/backward + custo). CRM inteiro mapeado aqui.
- `functions.md` — funções por grupo (função → entidades que toca).
- `periphery.md` — grupos não-núcleo (workflows, artifacts, chats, métricas).

### `docs/research/` — pesquisas que fundamentam decisões
- `0001-modelo-de-relacoes-ravi.md` — **metodologia do grafo de relações** (a fonte do nosso DAG: nó, aresta, custo, "não é DAG, é grafo com ciclos navegado bidirecional").
- `0004-pipeline-cd-metodologias-e-workflows-claude-code.md` — metodologias de CD + workflows Claude Code.
- `0005-pipeline-por-modulo-retrospectiva-e-automacao.md` — pipeline por módulo + retrospectiva.
- `0009-contrato-de-execucao-best-practices.md` (42K) — best practices de contrato de execução.
- `0010-retrospectiva-checklists-fechados.md` — retrospectiva sobre checklists fechados.
- (demais 0002, 0003, 0006, 0007, 0008 — skills, RBAC, doc-viva-por-tela, command-centric, regras-vs-autonomia.)

### `docs/gap/` — contrato e specs do DAG-to-Done original
- `CONTRATO-DAG-TO-DONE.md` (32K) — o **contrato operacional** original (fases, F0 Descoberta DAG, census).
- `SPEC-PHASE-GATE-ENFORCER.md` (20K) — spec do porteiro de fases (4 verbos a adicionar ao dag.mjs).
- `crm.md` — GAP real do domínio CRM (DAG + funções-chave + params resolvidos ao vivo).
- `functions-inventory.md` (35K) — inventário de funções do RAVI.
- `ia-navigation.md`, `contacts.md`, `instances.md`, `projects.md`, `artifacts.md`, `specs.md`, `skills.md` — GAPs por domínio.
- `README.md`, `ROADMAP.md`, `PLANO-EXECUCAO-H.md`, `PLANO-IMPLEMENTACAO.md` — planejamento original.

### `docs/agentic-pipeline/` — versão PARALELA dos nossos docs (mais antiga/robusta)
> Espelho dos nossos documentos, mantido no ravi. Útil para comparar e recuperar ideias.
- `CORE.md` (17K), `CORE-DAG.md` (11.8K), `PIPELINE.md` (19.7K), `DECISOES.md` (13.8K),
  `ABERTO.md`, `DESCARTADO.md`, `REFERENCIAS.md`, `CLAUDE.md`.

### Código original (referência para o motor)
- `scripts/dag.mjs` (40.7K) — o **CLI/motor original** do DAG-to-Done.
- `scripts/contract-sync-check.mjs`, `integrity-check.mjs` — verificação/integridade.

### Infra para verificação ao vivo (se um dia precisarmos)
- `.env.example` — `RAVI_API_URL=http://127.0.0.1:7777` + `RAVI_CONTEXT_KEY=rctx_*`.
- Proxy `/api/ravi/*` (Next.js) carrega a credencial server-side. Daemon responde na 7777.
- Hoje: sem `.env` real; verificação ao vivo exige mintar `rctx` na VPS.
