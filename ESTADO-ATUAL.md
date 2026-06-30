# ESTADO ATUAL — leia isto primeiro

> Handoff para a próxima sessão. Se você é um agente sem contexto, **comece por aqui**, depois leia
> `docs/INDEX.md`. Última atualização: 2026-06-30.

---

## O que é este projeto (1 parágrafo)

Uma **state machine em Node.js puro**, acionada por CLI (`v1/dag.mjs`), que serve de trilho para um agente LLM
(Claude Code) conduzir uma feature de software por **13 etapas** (DAG → Descoberta → GAP → Design → Mapa →
Implementação → Gate A → Acessibilidade → Gate B → Aprovação humana → Done → Smoke → Retrospectiva). O agente
**dirige** (roda os comandos); o motor é o **juiz** que valida cada entrega e bloqueia o avanço fora do critério.
Cada etapa tem um **CORE** (meta-prompt) que gera o briefing daquela etapa. Visão completa: `README.md`,
estado/DoD por etapa: `docs/ROADMAP.md`.

## Onde EXATAMENTE paramos (2026-06-30)

Há DUAS frentes, em estados diferentes — não confunda:

### Frente A — CONSTRUÇÃO do pipeline (motor + COREs): **10 de 13 etapas cristalizadas**
- **Etapas 1–10 prontas** no `v1/`, cada uma plugada no motor com testes cegos. Suíte **227/227 verde**
  (`cd v1 && node --test`). ADRs 0020–0031. Etapa 10 (Aprovação humana / HITL) é a 1ª de gênero não-CORE.
- **Faltam cristalizar as etapas 11–13** (Done, Smoke, Retrospectiva). Hoje são **placeholders** no
  `v1/pipeline.config.mjs` (validam só presença de campo: `verify_ok`, `status`, `licoes`). São de gênero
  sistema/devops/documentador — não precisam de CORE-meta-prompt como as etapas 1–9; provavelmente viram
  verbos de motor (`dag verify`/`check`) + registro. Decisão de design ainda aberta.

### Frente B — VALIDAÇÃO do pipeline (E2E piloto): **concluído, com achado-ouro**
- Conduzimos uma feature REAL pelas 13 etapas, com subagentes reais, verificação contra ambiente vivo e deploy.
  Resultado: **o pipeline passou** (porteiros bloquearam bugs reais; ciclo REPROVA→corrige→re-revisa fechou).
- **Relatório sanitizado (publicado):** `docs/RELATORIO-E2E-PILOTO.md` — leia para ver o que o teste provou.
- **Outputs crus (LOCAIS, não versionados):** `e2e-run-2-tools/` (16 outputs por etapa + diff + `_state-final.json`).
  Ignorados pelo git de propósito (`.gitignore`: `e2e-run-*/`) — contêm host/IP/SDK/dados de negócio.
- **ACHADO-OURO (a principal entrada de melhoria do pipeline):** ver A018 em `docs/ABERTO.md` — "cegueira de
  fonte". O DAG mapeia a fundo a fonte que recebe mas NUNCA pergunta "é a única?". O mesmo erro ocorreu 2× no
  E2E (mostrou 1 item faltando 611; mostrou 611 faltando ~1964 de outro sistema). Proposta: uma **Etapa 0 —
  Censo de Fontes / Gate de Intenção** antes do DAG.

## O que fazer a seguir (próximos passos, em ordem de valor)

1. **(Recomendado) Endereçar o achado-ouro (A018 — cegueira de fonte).** É a lição mais valiosa do piloto.
   Brainstorm: uma Etapa 0 (Censo de Fontes) que, dada a intenção, varre o ambiente atrás de TODAS as fontes
   antes do DAG ancorar numa. Secundário: CORE-DISCOVERY deve ler contrato tipado (SDK/spec) antes de sondar.
2. **Cristalizar as etapas 11–13** (Done/Smoke/Retrospectiva) — saem de placeholder. Decidir se viram CORE,
   verbo de motor, ou mistura. Seguir o workflow do projeto (`docs/PLANO-DE-ETAPA.md` + skill `manter-governanca`).
3. **(Opcional) E2E #3** com a intenção corrigida ("agregar TODOS os CLIs do ambiente, não só de uma fonte") —
   seria o teste que valida a Etapa 0 nova. O usuário tem interesse nisto (ver A018).

## Como retomar em 60 segundos

```
cd C:\Users\gouve\Desktop\dag-to-done-state-machine
cd v1 && node --test            # confirma o motor (227/227)
cat ../docs/RELATORIO-E2E-PILOTO.md   # o que o piloto provou
cat ../docs/ROADMAP.md          # estado das 13 etapas
cat ../docs/ABERTO.md           # dívidas — A018 é o achado-ouro do piloto
```

## Mapa rápido (onde está cada coisa)

- `README.md` — visão geral.
- `docs/INDEX.md` — a bússola (consulte ANTES de pesquisar qualquer coisa).
- `docs/ROADMAP.md` — marcos: motor + 13 etapas (status real).
- `docs/RELATORIO-E2E-PILOTO.md` — relatório sanitizado do teste piloto.
- `docs/ABERTO.md` — questões abertas; **A018 = cegueira de fonte (achado-ouro do piloto)**.
- `docs/adr/` — 31 ADRs (decisões). `docs/PLANO-DE-ETAPA.md` — o sistema para completar uma etapa.
- `v1/` — o motor (`dag.mjs`) + os COREs das etapas 1–10 + a suíte de testes.
- `e2e-run-2-tools/` — outputs crus do piloto (LOCAL, fora do git).
- `CLAUDE.md` — papel do copiloto + metodologias M1-M4. Skill global `manter-governanca`.

## Git

`main` sincronizado com `origin` (`raphaelmarra/dag-to-done-state-machine`, privado). Último commit: relatório do
piloto. Os diretórios `e2e-run-*/` e `v1/.dag/` NÃO são versionados (`.gitignore`) — preservam dados vivos local.
