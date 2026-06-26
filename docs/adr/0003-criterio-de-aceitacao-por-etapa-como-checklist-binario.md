# 0003 — Critério de aceitação por etapa como checklist binário

- Status: accepted
- Data: 2026-06-26
- Origem: migrado de DECISOES.md (D003)

## Contexto e Problema
Hoje "aprovado" é subjetivo — depende do julgamento de quem roda o gate.

## Decisão
Cada etapa tem critério de aceitação como lista de perguntas com resposta sim/não. A etapa só fecha quando todas forem sim.

## Motivo
Torna a qualidade verificável e auditável. Remove ambiguidade do handoff entre agentes. Inspirado no Definition of Done do Scrum.

## Consequências
Os critérios precisam ser revisados conforme o processo amadurece. O escape-hatch existe para urgências genuínas.
