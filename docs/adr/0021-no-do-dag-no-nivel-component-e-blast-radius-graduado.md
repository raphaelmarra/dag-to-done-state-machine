# 0021 — Nó do DAG no nível Component (C4) e blast radius com amplitude graduada

- Status: accepted
- Data: 2026-06-28
- Relacionado: CORE-DAG v4.0 (regras A1, A3); ADR 0016

## Contexto e Problema
O CORE-DAG v3.0 dizia que o tipo de nó é "descoberto do stack", sem fixar o nível de granularidade —
risco de cair no nível de cada linha de código (nível Code do C4), fino demais. E o blast radius era
uma lista de consumidores sem peso, o que não distingue um nó central de um periférico.

## Decisão
1. **Granularidade do nó:** o tipo vive no **nível Component do C4** — a unidade que alguém consome
   com uma intenção. O critério é invariante ("unidade consumida numa direção"); a stack apenas
   **nomeia** o tipo (superfície-UI, função-API, comando-CLI…), não o define.
2. **Blast radius graduado:** o reverso calculado (A3) carrega **amplitude** — BAIXA | MÉDIA | ALTA |
   CRÍTICA — lida da contagem de dependentes reversos, não de opinião.

## Motivo
O C4 (`research/0013`) valida tipos emergentes do sistema dentro de níveis fixos de zoom; ancorar no
nível Component evita granularidade errada. A amplitude graduada foi um achado do briefing cego do
CRM (`research/_cego-briefing-crm.md`): distinguir `ModalShell` (CRÍTICA, quebra 7 diálogos) de um
helper isolado (BAIXA) é informação que o Design precisa e que uma lista plana não dá. Validado
contra o CRM (4 hubs com amplitudes distintas produzidas corretamente no teste).

## Consequências
O schema do briefing inclui `hub?` por nó e `amplitude` por entrada de blast radius. O Design recebe
um mapa que já prioriza por impacto.
