# INDEX — Mapa de conhecimento do projeto

> A bússola. **Consulte aqui ANTES de pesquisar ou redescobrir qualquer coisa** — o
> conhecimento provavelmente já existe (neste repo ou no ravi-console, ver SOURCES.md).
> 1 linha por documento. Classificado por [Diátaxis](https://diataxis.fr/). Manter via skill `manter-governanca`.

## Comece por aqui
- [`../ESTADO-ATUAL.md`](../ESTADO-ATUAL.md) — **handoff: onde paramos, bloqueios e próximos passos. LEIA PRIMEIRO.**
- [`../CLAUDE.md`](../CLAUDE.md) — papel do copiloto, regras de trabalho, ponteiro para este índice.
- [`ROADMAP.md`](ROADMAP.md) — **estado real** do projeto: motor + 13 etapas, status e DoD. (onde estamos)
- [`SOURCES.md`](SOURCES.md) — conhecimento em repos externos (ravi-console: DAG real, contrato, research).

## Reference (fatos técnicos — o quê)
- [`ANATOMIA-DE-ETAPA.md`](ANATOMIA-DE-ETAPA.md) — **catálogo de capacidades de uma etapa**: tudo o que se pode definir (executor, grau de certeza, briefing, padrão de entrega, critério, gaps, profundidade, spike, lentes, pre-mortem...), cada peça marcada 🟢 em uso / 🔵 disponível / ⚪ candidata. Consulte ao desenhar qualquer etapa.
- [`PIPELINE.md`](PIPELINE.md) — as 13 etapas: agente, entregável, critério de aceitação de cada uma.
- [`CORE.md`](CORE.md) — CORE genérico (esqueleto de regras de geração de briefing).
- [`CORE-DAG.md`](CORE-DAG.md) — CORE da etapa 1 (DAG) **v4.0** (cristalizado, ADR 0020/0021/0022). Gerador de briefing do mapa de correlações: aciclicidade verificável, profundidade dinâmica, nó nível Component, blast radius graduado. (v3.0 arquivado em `CORE-DAG-v3.archive.md`.)
- [`PADRAO-BRIEFING.md`](PADRAO-BRIEFING.md) — o padrão Meta-Prompt + Structured Handoff (camadas, R1-R9, nomenclatura).

## Explanation (o porquê)
- [`FLUXO-EXECUCAO.md`](FLUXO-EXECUCAO.md) — como a execução roda: máquina tem o prompt → agente principal consome e traduz → subagente executa. Por que a reescrita é feature (generalidade) e a tensão que abre (A009).
- [`REFERENCIAS.md`](REFERENCIAS.md) — metodologias pesquisadas (Three Amigos, Spike, Pre-mortem, etc.) com fontes.
- [`research/`](research/) — pesquisas LOCAIS que fundamentam o CORE (com fontes citadas):
  - `0006-tecnicas-prompt-validacao-cientifica.md` — técnicas de prompt com evidência empírica (CoT, delimitadores, posição, re-leitura; desmistifica role-prompting e "Format Tax" do JSON).
  - `0007-meta-prompting.md` — como escrever um meta-prompt que gera prompts (APE, maestro→experts, anatomia de template). O coração do CORE.
  - `0008-frameworks-inspiracao.md` — DSPy, APE, guias Anthropic/OpenAI, structured output; o que reaproveitar.
  - `0009-clareza-para-llm.md` — clareza que move LLM (posição, negação falha, formato, especificação seletiva).
  - `0010-redacao-humana-classica.md` — redação humana clássica e onde DIVERGE de prompts para LLM.
  - `0011-dag-aciclico-vs-ciclico.md` — a premissa DAG: acíclico vs cíclico, SCC/condensação. Confronta A1/A2/A3 do CORE-DAG.
  - `0012-analise-de-impacto.md` — change impact analysis, blast radius, slicing. Confronta a fronteira "1 hop" (A4).
  - `0013-modelagem-dependencia-arquitetura.md` — C4, ADP, DDD bounded contexts. Confronta granularidade de nó e fronteira.
  - `0014-ferramentas-reais-dag.md` — Airflow/Nx/Bazel/madge: como tratam ciclo e impacto. O que imitar no CORE-DAG.
- [`adr/`](adr/) — 22 ADRs (decisões de design, formato MADR, imutáveis). Índice em DECISOES.md.

## Decision log (cronológico — o que foi decidido/aberto/descartado)
- [`DECISOES.md`](DECISOES.md) — índice dos ADRs (decisões aceitas).
- [`ABERTO.md`](ABERTO.md) — questões em aberto / fundação do DAG a cristalizar (A008).
- [`DESCARTADO.md`](DESCARTADO.md) — o que foi considerado e descartado, com motivo.

## How-to (como fazer)
- [`PLANO-DE-ETAPA.md`](PLANO-DE-ETAPA.md) — **o sistema para completar uma etapa inteira**, peça por peça (o briefing é só 1 das 18). Molde + tracker com portão de evidência/anti-viés + triagem de esforço. Contém o plano concreto da etapa 1 (piloto).
- [`METODOLOGIA-CORE.md`](METODOLOGIA-CORE.md) — **o pipeline para destilar o CORE de uma etapa** (da pesquisa ao refinamento, 5 fases). É o "método funda" de uma peça no PLANO-DE-ETAPA. Validou-se obtendo o CORE-DAG v4.0.
- [`_RETRO-metodologia-core.md`](_RETRO-metodologia-core.md) — retrospectiva cética: os 4 furos da metodologia (n=1, cego não-independente, adversarial fácil, juiz = autor). Leia antes de confiar.
- [`_RETRO-revisao-plano-etapa1.md`](_RETRO-revisao-plano-etapa1.md) — revisão cega do plano da etapa 1: 10 findings (3 graves, incl. bug `{next_stage}` no motor); o viés-raiz (auditoria checa presença, não consistência). Por que o portão anti-viés se pagou.
- [`_RETRO-mvp-vs-v1.md`](_RETRO-mvp-vs-v1.md) — avaliação comparativa MVP vs v1 (etapa 1): ganho real provado por execução cega, zero regressão, saldo positivo; a ressalva do over-engineering localizado.
- Skill global `manter-governanca` (`~/.claude/skills/`) — como manter toda esta estrutura viva.

## Código (o motor)
- [`../v1/`](../v1/) — **versão ativa pós-MVP.** Motor `dag.mjs` + `pipeline.config.mjs`; etapa 1 roda o CORE-DAG v4.0 (cores/CORE-DAG.md). Testes: `cd v1 && node --test` (8/8).
- [`../MVP/`](../MVP/) — Walking Skeleton congelado (marco) + evidência do E2E da aba CLIs.

## Histórico / processo
- [`../CHANGELOG.md`](../CHANGELOG.md) — mudanças notáveis por marco.
- [`../benchmarks/`](../benchmarks/) — scripts de benchmark isolados (schema estrito vs. camadas).

## WIP (rascunhos — ciclo Draft→Active/Retired)
- [`_WIP-briefing-dag-perfeito.md`](_WIP-briefing-dag-perfeito.md) — briefing perfeito do DAG (caso CRM). Referência da etapa 1.
- [`_WIP-dag-crm-concreto.md`](_WIP-dag-crm-concreto.md) — DAG real do CRM (validação do briefing).
- [`_WIP-destilacao-core-dag.md`](_WIP-destilacao-core-dag.md) — racional destilado do CORE-DAG (camadas A/B/C/D).
- [`_WIP-plano-governanca.md`](_WIP-plano-governanca.md) — plano desta governança (Active, executado).
