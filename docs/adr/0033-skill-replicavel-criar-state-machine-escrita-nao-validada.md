# 0033 — Skill replicável `criar-state-machine`: escrita e não-validada (proposed)

- Status: proposed
- Data: 2026-06-30
- Relacionado: entrega a frente A022 (skill replicável); consome o meta-método da Fase 3
  (`_WIP-meta-metodo-core-do-core.md`), o inventário M3 da Fase 1 (`_WIP-inventario-invariante-vs-dominio.md`),
  o estado-da-arte da Fase 2 (`research/0016`) e o pré-mortem da Fase 5 (`_RETRO-premortem-skill.md`). Fiel a
  "testar antes de cristalizar" (ADR 0016 / M4): NÃO é `accepted` porque a skill foi ESCRITA mas a validação
  (Fase 7 — replicar num 2º domínio) foi PULADA por decisão do operador, que validará em outro cenário.

## Contexto e Problema
A frente A022 propôs empacotar TODO o método deste projeto de criar state machines (montar a SM → destilar o CORE
de cada etapa) numa skill replicável para qualquer domínio (vídeo, apps, etc.). O plano
`docs/superpowers/plans/2026-06-30-skill-replicavel-state-machines.md` definiu 9 fases (0–8), cada uma com agente
dedicado e portão de evidência. As Fases 0–6 foram executadas; a Fase 7 (validação por replicação num 2º domínio)
foi conscientemente PULADA pelo operador. O problema desta cristalização: registrar uma entrega REAL (a skill existe
e funciona) sem declará-la VALIDADA (ela não foi exercitada fora do domínio de origem) — o erro que o próprio projeto
combate (falso-verde).

## Decisão
**Cristalizar a skill como ENTREGUE-mas-NÃO-VALIDADA (`proposed`), com a validação registrada como pendência aberta.**
Concretamente:

1. **A skill existe e está registrada no ambiente.** `~/.claude/skills/criar-state-machine/` — SKILL.md (5.7 KB,
   ponteiro enxuto) + `recursos/` (META-METODO-DESTILAR-CORE de 8 passos, MENU-ANATOMIA-DE-ETAPA, CHECKLIST-PRE-
   REQUISITOS) + `scaffold-motor/LEIA-ME.md`. Gatilho ativo ("criar state machine", "replicar o DAG-to-Done para X").

2. **Processo de destilação honesto (6 fases delegadas + pré-mortem que se pagou).** A skill não foi escrita de
   improviso: 3 agentes de descoberta (Explore/task-decomposition-expert/search-specialist), 1 de meta-método (Plan),
   1 de arquitetura (Plan), 2 de pré-mortem (auditor-v2/code-reviewer) e 1 de escrita (builder). O pré-mortem
   CONVERGENTE pegou 3 furos críticos ANTES da escrita — o mais grave: a arquitetura prometia "fábricas extraídas de
   graça" que NÃO existem no código (são funções hardcoded). A decisão do delegador reduziu a ambição do scaffold (a
   extração virou dívida, não pré-requisito) em vez de escrever uma skill que prometia algo inexistente.

3. **Honestidade de maturidade EMBUTIDA na própria skill (M-T4/M-T5 aplicadas a si mesma).** O SKILL.md abre com um
   AVISO DE MATURIDADE ("Você não está usando um método validado; está ajudando a validá-lo") e um aceite obrigatório
   do n=1 na Fase A. Os limites (premissas de "ambiente computável" que vazam: `regraEvidenciaObrigatoria`,
   `confianca_enum`, ids, P0/P1/P2) estão DECLARADOS, não escondidos. A skill é correctable por construção.

## Motivo
O operador decidiu validar a skill em outro cenário, no seu tempo — então a Fase 7 fica pendente. Cristalizar como
`accepted` seria o falso-verde que o projeto inteiro combate (a skill PARECE pronta — existe, tem gatilho, foi
revisada — mas "parece genérico ≠ é genérico", `_RETRO-metodologia-core.md`). O status `proposed` registra o estado
REAL: a skill é uma proposta promissora, destilada com rigor (bottom-up de 32 ADRs + estado-da-arte + pré-mortem
adversarial), mas n=1 — o método foi exercitado só em dev web. A própria skill o declara. O valor já entregue é real:
o meta-método de 8 passos (com a correção de ordem do batismo+expansão e o passo 4 de verificação de ajuste, derivado
da Grounded Theory) e o mapa copiar-vs-destilar são conhecimento destilado que existe agora e não existia antes —
independente de a skill rodar ou não num 2º domínio.

## Consequências
**Pendência ABERTA (o que falta para `accepted` e para fechar a A022):**
1. **Validar por replicação (Fase 7)** — replicar uma SM num 2º domínio (apps, vídeo, ou outro), idealmente com outro
   operador (mitiga o furo "juiz=autor"). É o único teste que tira o método de "proposta promissora". O operador o fará
   em outro cenário. Cada SM gerada é um datapoint — favorável OU não — sobre o próprio método.
2. **O pré-mortem deixou dívidas técnicas declaradas** (em `_RETRO-premortem-skill.md` e no `scaffold-motor/LEIA-ME.md`):
   extrair as fábricas de domínio de `pipeline.config.mjs` em fábricas genéricas parametrizadas (F3/F4/F6/F7); separar
   o HITL genérico do HITL de domínio (`gerarDossieAprovacao` F2, `ETAPA_CENSO_FONTES` F9); `regraOrdemTopologica`
   pressupõe DAG, não pipeline linear. São trabalho FUTURO do motor, não pré-requisitos da skill.

**Limites declarados (herdados e honestos):** a skill herda o n=1 da `METODOLOGIA-CORE.md` (4 furos em
`_RETRO-metodologia-core.md`); a correção de ordem do batismo+expansão e o passo 4 (verificação de ajuste) são
hipóteses FUNDADAS mas não exercitadas — a aposta mais arriscada. Quando a Fase 7 validar (ou refutar), este ADR passa
a `accepted` (ou um sucessor o corrige) e a A022 sai de ABERTO.

**Artefatos da frente (todos versionados):** `research/0015` (síntese + 7 movimentos táticos), `research/0016`
(estado-da-arte), `_WIP-inventario-invariante-vs-dominio.md` (M3), `_WIP-meta-metodo-core-do-core.md` (o "CORE do
CORE"), `_WIP-arquitetura-skill-state-machine.md` (arquitetura), `_RETRO-premortem-skill.md` (os 11 achados). A skill
em si vive em `~/.claude/skills/criar-state-machine/` (fora do repo — é skill global do ambiente).