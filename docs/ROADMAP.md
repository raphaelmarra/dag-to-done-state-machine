# ROADMAP — Construção do DAG-to-Done State Machine

> Marcos do projeto: o motor (código) + os 13 COREs (conteúdo). Status REAL, não otimista.
> Cada etapa tem um DoD (Definition of Done). Manter via skill `manter-governanca`.

> **Onde paramos (2026-06-28):** **v1 pós-MVP em `v1/`** com a etapa 1 rodando o **CORE-DAG v4.0
> cristalizado** (testes 8/8 verde). MVP congelado em `MVP/` como marco. CORE-DAG v4.0 destilado pela
> rotina 0→4 (ADR 0020/0021/0022; metodologia em `METODOLOGIA-CORE.md`). Repo publicado em
> `raphaelmarra/dag-to-done-state-machine`. Próximo trabalho: destilar os COREs das etapas 2–13 (uma
> a uma, pela metodologia) e plugá-los no `v1/pipeline.config.mjs` como foi a etapa 1.

---

## Visão

Construir uma **state machine em Node.js puro, acionada por CLI** (`dag.mjs`), que serve de
trilho para um agente LLM (Claude Code) executar features pelas 13 etapas — gerando briefing
por etapa (via CORE), validando output schema e bloqueando avanço fora do critério.

Duas frentes: **MOTOR** (código genérico) e **CONTEÚDO** (1 CORE por etapa).

---

## DoD genérico de um CORE de etapa

Uma etapa é considerada "CORE pronto" quando:
- [ ] Briefing perfeito do caso concreto escrito (método bottom-up, ADR 0016/M2)
- [ ] Racional destilado (invariante vs. demanda — M3)
- [ ] CORE escrito (genérico, dinâmico — M1; sem hardcode)
- [ ] Validado ≥2x (gerador produz briefing correto; 2ª demanda diferente)
- [ ] Coerência/coesão revisadas; sem viés de exemplo único
- [ ] ADR de cristalização criado (sai de ABERTO)

---

## Frente MOTOR (código)

| Marco | Descrição | Status |
|-------|-----------|--------|
| M-0 Contrato motor↔CORE | Interface: o motor imprime caminhos; output por convenção de arquivo `.dag/<f>/<etapa>.output.json` | ✅ MVP |
| M-1 Esqueleto state machine | `MVP/dag.mjs` + `package.json`: lê estado, gera briefing em arquivo | ✅ MVP |
| M-2 Validação de schema | `aceita(output)` por etapa, validação mecânica (ADR 0018) | 🟡 MVP (só presença; endurecer pós-MVP, GAP-04) |
| M-3 Porteiro de fases | `advance` bloqueia output inválido e não deixa pular/regredir | ✅ MVP (validado + auditado) |
| M-4 Verbos do CLI | `init` / `next` / `advance` / `status` | ✅ MVP (`verify`/`check` pós-MVP) |

> MVP (Walking Skeleton) construído e validado em `MVP/` (congelado como marco + evidência do E2E
> da aba CLIs). e2e 5/5 verde lá.
>
> **v1 pós-MVP em `v1/`** (clone só-código do MVP, autocontido): a **etapa 1 (DAG) agora roda o
> CORE-DAG v4.0 cristalizado**, carregado de `v1/cores/CORE-DAG.md` via `corePath`. Testes **8/8
> verde** (`cd v1 && node --test`): 5 e2e herdados + 3 novos (briefing carrega o CORE rico; schema
> v4.0; sincronia cópia↔fonte `docs/CORE-DAG.md`). Etapas 2–13 ainda placeholders — serão destiladas
> pela `METODOLOGIA-CORE.md` e plugadas como a etapa 1.
> Referência futura: `ravi-console/scripts/dag.mjs` (40K) — ver SOURCES.md.

---

## Frente CONTEÚDO (13 COREs)

| # | Etapa | Agente | CORE | Status |
|---|-------|--------|------|--------|
| 1 | DAG | Explore* | `CORE-DAG.md` v4.0 | ✅ CORE cristalizado + **etapa completa no v1** (8/8 peças, plugada no motor, 40/40 testes) |
| 2 | Descoberta da API | fiscal | — | ⬜ não iniciado |
| 3 | GAP | error-detective | — | ⬜ não iniciado |
| 4 | Design | ui-ux-designer | — | ⬜ não iniciado |
| 5 | Mapa de dependências | Plan | — | ⬜ não iniciado |
| 6 | Implementação | frontend/typescript/fullstack | — | ⬜ não iniciado |
| 7 | Gate A (revisão) | code-reviewer | — | ⬜ não iniciado |
| 8 | Acessibilidade | web-accessibility-checker | — | ⬜ não iniciado |
| 9 | Gate B (ao vivo) | fiscal | — | ⬜ não iniciado |
| 10 | Aprovação humana | humano | — | ⬜ não iniciado |
| 11 | Done | sistema | — | ⬜ não iniciado |
| 12 | Smoke pós-deploy | devops-engineer | — | ⬜ não iniciado |
| 13 | Retrospectiva | documentador | — | ⬜ não iniciado |
| — | Pesquisa de mercado (paralela à 1) | search-specialist | — | ⬜ não iniciado |

\* Executor do DAG: o CORE-DAG isola isso na Seção 1 (trocar executor = editar só ali). Em aberto se Explore é o ideal.

---

## Sequência recomendada (decisão pendente do operador)

Tensão registrada: **motor cedo** (COREs nascem testados nele, evita poço de polimento) vs.
**mais COREs antes** (motor nasce sabendo de mais etapas). Recomendação atual: motor mínimo
(M-0→M-1) primeiro, rodar o CORE-DAG real nele, depois destilar os outros 12 COREs com o
motor de pé. Decisão final: do operador humano.

---

## Legenda
⬜ não iniciado · 🟡 em andamento/parcial · ✅ concluído · 🔴 bloqueado
