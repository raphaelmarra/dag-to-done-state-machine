# ROADMAP — Construção do DAG-to-Done State Machine

> Marcos do projeto: o motor (código) + os 13 COREs (conteúdo). Status REAL, não otimista.
> Cada etapa tem um DoD (Definition of Done). Manter via skill `manter-governanca`.

> **Onde paramos (2026-06-29):** **10 de 13 etapas completas** no `v1/`. Etapas 1 (DAG), 2 (Descoberta), 3 (GAP),
> 4 (Design), 5 (Mapa), 6 (Implementação), 7 (Gate A), 8 (Acessibilidade), 9 (Gate B) e **10 (Aprovação humana,
> ADR 0031 — HITL)**. Suíte v1 **227/227**. Encadeamento real das **10 etapas** testado. A etapa 10 é a 1ª de
> gênero NÃO-CORE (executor = humano): sem meta-prompt, o `next` injeta um DOSSIÊ derivado do estado (construído
> + vereditos dos gates + o que ficou fora). Porteiro fail-closed binário (só `aprovado` avança). KISS-com-fala-
> humana: a garantia é PROCESSUAL (o agente mostra o dossiê e espera a fala humana, não a fabrica) — gate
> cripto seria over-engineering. ZERO mecanismo de validação novo. MVP congelado. Próximo: etapa 11 (Done —
> gênero sistema). Dívidas: A010, A011, A016, A017, A018, A019.

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
| 2 | Descoberta da API | fiscal | `CORE-DISCOVERY.md` v1.0 | ✅ cristalizado (ADR 0023) + plugado no v1 + **testado AO VIVO** (51/51) |
| 3 | GAP | error-detective | `CORE-GAP.md` v1.0 | ✅ cristalizado (ADR 0024) + plugado no v1 + testado (cego) — 75/75 |
| 4 | Design | ui-ux-designer | `CORE-DESIGN.md` v1.0 | ✅ cristalizado (ADR 0025) + plugado + testado (cego) — 95/95 |
| 5 | Mapa de dependências | Plan | `CORE-MAPA.md` v1.0 | ✅ cristalizado (ADR 0026) + plugado no v1 + testado (cego) — 113/113 |
| 6 | Implementação | frontend/typescript/fullstack | `CORE-IMPL.md` v1.0 | ✅ cristalizado (ADR 0027) + plugado no v1 + testado (2 casos cegos) — 139/139 |
| 7 | Gate A (revisão) | code-reviewer | `CORE-GATEA.md` v1.0 | ✅ cristalizado (ADR 0028) + plugado no v1 + testado (2 casos cegos) — 164/164 |
| 8 | Acessibilidade | web-accessibility-checker | `CORE-A11Y.md` v1.0 | ✅ cristalizado (ADR 0029) + plugado no v1 + testado (2 casos cegos OPERADOS ao vivo) — 186/186 |
| 9 | Gate B (ao vivo) | fiscal | `CORE-GATEB.md` v1.0 | ✅ cristalizado (ADR 0030) + plugado no v1 + testado (2 casos cegos opostos + 2 rodadas anti-viés) — 213/213 |
| 10 | Aprovação humana | humano | — (HITL, sem CORE) | ✅ cristalizado (ADR 0031) + plugado no v1 + encadeamento das 10 etapas testado + 2 verificadores cegos — 227/227 |
| 11 | Done | sistema | — | ⬜ não iniciado |
| 12 | Smoke pós-deploy | devops-engineer | — | ⬜ não iniciado |
| 13 | Retrospectiva | documentador | — | ⬜ não iniciado |
| — | Pesquisa de mercado (paralela à 1) | search-specialist | — | ⬜ não iniciado |

\* Executor do DAG: **Explore — validado** (A008) como o melhor para a etapa, por garantir read-only
por construção (sem rede/escrita); a alternativa só entra se passar nesse critério. O CORE-DAG isola
isso na Seção 1 (trocar executor = editar o objeto `executor` na config).

> **Etapa 0 — Censo de Fontes (A020):** construída e testada (235/235), mas ISOLADA (fora do array `PIPELINE`,
> `proposed` no ADR 0032). Resolve a cegueira de fonte. Pendente: inserir em `PIPELINE[0]` + validar contra 2º caso.

---

## Frentes FUTURAS (visão registrada — NÃO iniciadas, exigem pesquisa antes de decidir)

> Direções de longo prazo do projeto, levantadas pelo operador em 2026-06-30. Registradas em profundidade em
> `ABERTO.md` (com roteiro de pesquisa e o que falta decidir). São **paralelas e independentes** entre si (decisão
> do operador — evita acoplamento prematuro). Não desenvolver sem o estudo do estado-da-arte (M2/M4).

| Frente | O que é | Status | Onde |
|--------|---------|--------|------|
| **Meta-aprendizado no DAG** | Memória que evita repetir erros passados (consulta a lições — "estilo Hermes Agent"). Captura já tem dono no design (etapa 13 / ADR 0014); falta o lado da CONSULTA. | ⬜ frente futura — pré-requisito: pesquisar estado-da-arte (Reflexion, Generative Agents, ExpeL, MemGPT...) | A021 |
| **Skill replicável de state machines** | Empacotar TODO o método (montar a SM → destilar o CORE de cada etapa) numa skill, p/ gerar SMs de qualquer domínio (vídeo, apps...). **Skill `criar-state-machine` ESCRITA** (`~/.claude/skills/`), ADR 0033 `proposed`. Coração: meta-método de 8 passos (o "CORE do CORE"). | 🟡 escrita, NÃO validada — Fase 7 (replicar num 2º domínio) pulada pelo operador (validará em outro cenário); n=1 até lá | A022 |

---

## Sequência recomendada (decisão pendente do operador)

Tensão registrada: **motor cedo** (COREs nascem testados nele, evita poço de polimento) vs.
**mais COREs antes** (motor nasce sabendo de mais etapas). Recomendação atual: motor mínimo
(M-0→M-1) primeiro, rodar o CORE-DAG real nele, depois destilar os outros 12 COREs com o
motor de pé. Decisão final: do operador humano.

---

## Legenda
⬜ não iniciado · 🟡 em andamento/parcial · ✅ concluído · 🔴 bloqueado
