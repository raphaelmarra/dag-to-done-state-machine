# 0007 — DAG como primeira etapa (antes da Descoberta da API)

- Status: accepted
- Data: 2026-06-26
- Origem: migrado de DECISOES.md (D007)

## Contexto e Problema
No fluxo original a Descoberta da API vinha primeiro.

## Decisão
DAG (mapa de correlações) vem antes. Descoberta da API vem depois.

## Motivo
Sem o mapa de correlações, o agente da Descoberta não sabe quais endpoints importam para essa feature específica. O DAG delimita o território; a Descoberta explora esse território. Delimitar antes de explorar é mais eficiente.

## Consequências
A Descoberta da API se torna mais precisa e menos ampla — foca no que o DAG sinalizou como relevante.
