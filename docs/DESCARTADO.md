# Descartado

> O que foi considerado e descartado durante o design, e por quê.
> Registrar o que foi descartado evita reabrir discussões já resolvidas.

---

## X001 — Abordagem A: XState embutido no dag.mjs

**Descartado em:** 2026-06-26
**O que era:** Usar a biblioteca XState (statecharts formais, tooling visual Stately Studio) como motor da máquina de estados.
**Por que foi descartado:** Conflita diretamente com o `GUARD §9` do dag.mjs ("ZERO new abstraction, no framework"). Adicionaria 40kb+ de dependência. Para 10 fases lineares com gates, é overkill. O valor (tooling visual) não justifica o custo (dependência, curva de aprendizado, violação da filosofia THIN).
**Se reconsiderar quando:** O pipeline evoluir para grafos cíclicos reais ou múltiplos caminhos por arquétipo que tornem o modelo linear insuficiente.

---

## X002 — Abordagem C: phase_model declarativo em YAML

**Descartado em:** 2026-06-26
**O que era:** Colocar o modelo de fases em YAML (no template/contrato) e o dag.mjs ler e interpretar dinamicamente.
**Por que foi descartado:** Requer parser YAML real (o dag usa scan line-oriented propositalmente para ser THIN). Adiciona indireção significativa. As fases são fixas hoje — a flexibilidade não tem uso imediato. Over-engineering claro.
**Se reconsiderar quando:** Pipelines diferentes por arquétipo forem necessários e validados (ver A003 em ABERTO.md).

---

## X003 — LangGraph como motor de orquestração

**Descartado em:** 2026-06-26
**O que era:** Usar o LangGraph (Python) como motor, com o dag.mjs chamando-o.
**Por que foi descartado:** Introduz dependência Python em projeto Node.js. LangGraph tem problemas documentados: loops não gerenciados queimam tokens, checkpoints não detectam falhas silenciosas, grafos complexos viram black box. Para o nosso problema (10 fases lineares, guardas determinísticas), é o nível errado de complexidade. A essência útil do LangGraph cabe em JS puro.
**Se reconsiderar quando:** Nunca para este projeto específico. A inspiração é válida; a dependência, não.

---

## X004 — Temporal / Prefect / Dagster como orquestrador

**Descartado em:** 2026-06-26
**O que era:** Usar um orquestrador de workflows externo (Temporal, Prefect, Dagster) para gerenciar as fases.
**Por que foi descartado:** São ferramentas para coordenação de infra/pipelines de dados, não para enforcement de processo de desenvolvimento. Introduzem servidores, bancos de dados e infraestrutura que não existem no projeto. Overhead absurdo para o problema.
**Se reconsiderar quando:** Nunca para este caso de uso.
