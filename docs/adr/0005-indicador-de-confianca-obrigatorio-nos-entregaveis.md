# 0005 — Indicador de confiança obrigatório nos entregáveis

- Status: accepted
- Data: 2026-06-26
- Origem: migrado de DECISOES.md (D005)

## Contexto e Problema
Agentes hoje produzem entregáveis sem declarar o que foi verificado vs inferido.

## Decisão
Etapas 2 (Descoberta), 6 (Implementação) e 9 (Gate B) exigem que o agente declare o nível de confiança por item: `confirmado ao vivo` | `inferido do código` | `não verificado`.

## Motivo
Torna incertezas visíveis antes que se propaguem. Um "não verificado" na etapa 2 que chega silencioso à etapa 6 gera retrabalho caro.

## Consequências
O critério de aceitação da etapa 2 bloqueia itens `não verificado` sem justificativa.
