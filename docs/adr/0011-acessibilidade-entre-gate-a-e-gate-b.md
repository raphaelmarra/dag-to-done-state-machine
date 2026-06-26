# 0011 — Acessibilidade entre Gate A e Gate B (só arquétipos de interação)

- Status: accepted
- Data: 2026-06-26
- Origem: migrado de DECISOES.md (D011)

## Contexto e Problema
Acessibilidade era uma lente do Gate A — verificação estática no código.

## Decisão
Etapa separada de acessibilidade entre Gate A e Gate B, executada com a tela funcionando, apenas para MUTACAO, DRAWER e BOARD.

## Motivo
Problemas reais de acessibilidade (foco, navegação por teclado, leitura de tela) só aparecem com a tela em movimento — não lendo o código. LISTA e DETALHE têm menor risco de interação complexa.

## Consequências
Adiciona uma etapa para 3 dos 6 arquétipos. Para LISTA, DETALHE e DISCO, acessibilidade continua como lente do Gate A.
