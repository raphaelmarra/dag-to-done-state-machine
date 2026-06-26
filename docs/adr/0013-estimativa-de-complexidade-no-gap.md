# 0013 — Estimativa de complexidade no GAP

- Status: accepted
- Data: 2026-06-26
- Origem: migrado de DECISOES.md (D013)

## Contexto e Problema
O Mapa de dependências decidia sobre Walking Skeleton sem informação de complexidade formal.

## Decisão
GAP inclui estimativa de complexidade: simples | média | alta, com justificativa.

## Motivo
A decisão de Walking Skeleton precisa de insumo. A complexidade também influencia o nível de paralelismo que o Mapa de dependências vai propor.

## Consequências
Mais um campo no entregável do GAP. A justificativa é obrigatória — não é um label subjetivo.
