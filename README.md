# DAG-to-Done State Machine

Máquina de estados para desenvolvimento de software com agentes, briefings
automáticos e critérios de aceitação estruturados. Cada etapa produz conhecimento
estruturado que alimenta a próxima — **briefing automático, critério verificável,
formato de entregável conhecido**.

Padrão central: **Meta-Prompt + Structured Handoff**. Um CORE de regras invariantes
gera briefings contextuais por etapa; o output schema é o contrato de retorno.

## Estrutura

```
CLAUDE.md            ← ponto de entrada: papel do copiloto + regras + padrão CORE
docs/
  PIPELINE.md        ← as etapas do pipeline (entrada, entregável, aceitação)
  CORE.md            ← CORE genérico (esqueleto de regras invariantes)
  CORE-DAG.md        ← CORE da etapa 1 (DAG) — gerador de briefing p/ o Explore
  DECISOES.md        ← decisões de design com motivo (D001…)
  ABERTO.md          ← questões em aberto
  DESCARTADO.md      ← o que foi descartado e por quê
  REFERENCIAS.md     ← metodologias pesquisadas e fontes
benchmarks/          ← scripts de validação isolados
```

## Estado atual

A máquina é faseada (D019): construída etapa por etapa, um CORE por etapa.
Em desenvolvimento: **etapa 1 — DAG**, executor `Explore`.

A etapa 1 está sendo revista pelo método **bottom-up** (briefing perfeito → destilar o
racional → reescrever o CORE-DAG). Fundação já decidida em validação (ver `docs/ABERTO.md`
A008): DAG acíclico por construção (nó = superfície/função, aresta consumidor→provedor),
backward calculado, custo de aresta híbrido, largura ditada pela demanda real.

- Artefato-âncora (briefing perfeito, caso CRM): `docs/_WIP-briefing-dag-perfeito.md`
- CORE-DAG vigente (v2.0, a ser reescrito pela fundação nova): `docs/CORE-DAG.md`
- Calibração histórica: `docs/DECISOES.md` (D001…D019)
