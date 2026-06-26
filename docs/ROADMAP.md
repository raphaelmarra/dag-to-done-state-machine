# ROADMAP — Construção do DAG-to-Done State Machine

> Marcos do projeto: o motor (código) + os 13 COREs (conteúdo). Status REAL, não otimista.
> Cada etapa tem um DoD (Definition of Done). Manter via skill `manter-governanca`.

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
| M-0 Contrato motor↔CORE | Interface: o que o motor passa ao CORE, o que o CORE retorna, como valida | ⬜ não iniciado |
| M-1 Esqueleto state machine | `dag.mjs` + `package.json`: ler estado, injetar CORE, gerar briefing | ⬜ não iniciado |
| M-2 Validação de schema | Forçar JSON via tool_use, validar mecanicamente (ADR 0018) | ⬜ não iniciado |
| M-3 Porteiro de fases | Guarda que bloqueia avanço sem critério; `tamper_hash` (ADR 0001) | ⬜ não iniciado |
| M-4 Verbos do CLI | `dag next` / `verify` / `advance` / `check` | ⬜ não iniciado |

> Referência de implementação: `ravi-console/scripts/dag.mjs` (40K) — ver SOURCES.md.

---

## Frente CONTEÚDO (13 COREs)

| # | Etapa | Agente | CORE | Status |
|---|-------|--------|------|--------|
| 1 | DAG | Explore* | `CORE-DAG.md` v3.0 | 🟡 validado 2x, aguarda motor p/ cristalizar (A008) |
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
