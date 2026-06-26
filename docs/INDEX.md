# INDEX — Mapa de conhecimento do projeto

> A bússola. **Consulte aqui ANTES de pesquisar ou redescobrir qualquer coisa** — o
> conhecimento provavelmente já existe (neste repo ou no ravi-console, ver SOURCES.md).
> 1 linha por documento. Classificado por [Diátaxis](https://diataxis.fr/). Manter via skill `manter-governanca`.

## Comece por aqui
- [`../CLAUDE.md`](../CLAUDE.md) — papel do copiloto, regras de trabalho, ponteiro para este índice.
- [`ROADMAP.md`](ROADMAP.md) — **estado real** do projeto: motor + 13 etapas, status e DoD. (onde estamos)
- [`SOURCES.md`](SOURCES.md) — conhecimento em repos externos (ravi-console: DAG real, contrato, research).

## Reference (fatos técnicos — o quê)
- [`PIPELINE.md`](PIPELINE.md) — as 13 etapas: agente, entregável, critério de aceitação de cada uma.
- [`CORE.md`](CORE.md) — CORE genérico (esqueleto de regras de geração de briefing).
- [`CORE-DAG.md`](CORE-DAG.md) — CORE da etapa 1 (DAG) v3.0. Gerador de briefing do mapa de correlações.
- [`PADRAO-BRIEFING.md`](PADRAO-BRIEFING.md) — o padrão Meta-Prompt + Structured Handoff (camadas, R1-R9, nomenclatura).

## Explanation (o porquê)
- [`REFERENCIAS.md`](REFERENCIAS.md) — metodologias pesquisadas (Three Amigos, Spike, Pre-mortem, etc.) com fontes.
- [`adr/`](adr/) — 19 ADRs (decisões de design, formato MADR, imutáveis). Índice em DECISOES.md.

## Decision log (cronológico — o que foi decidido/aberto/descartado)
- [`DECISOES.md`](DECISOES.md) — índice dos ADRs (decisões aceitas).
- [`ABERTO.md`](ABERTO.md) — questões em aberto / fundação do DAG a cristalizar (A008).
- [`DESCARTADO.md`](DESCARTADO.md) — o que foi considerado e descartado, com motivo.

## How-to (como fazer)
- Skill global `manter-governanca` (`~/.claude/skills/`) — como manter toda esta estrutura viva.

## Histórico / processo
- [`../CHANGELOG.md`](../CHANGELOG.md) — mudanças notáveis por marco.
- [`../benchmarks/`](../benchmarks/) — scripts de benchmark isolados (schema estrito vs. camadas).

## WIP (rascunhos — ciclo Draft→Active/Retired)
- [`_WIP-briefing-dag-perfeito.md`](_WIP-briefing-dag-perfeito.md) — briefing perfeito do DAG (caso CRM). Referência da etapa 1.
- [`_WIP-dag-crm-concreto.md`](_WIP-dag-crm-concreto.md) — DAG real do CRM (validação do briefing).
- [`_WIP-destilacao-core-dag.md`](_WIP-destilacao-core-dag.md) — racional destilado do CORE-DAG (camadas A/B/C/D).
- [`_WIP-plano-governanca.md`](_WIP-plano-governanca.md) — plano desta governança (Active, executado).
