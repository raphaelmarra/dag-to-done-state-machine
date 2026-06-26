# 0004 — Lentes de revisão diferenciadas por arquétipo no Gate A

- Status: accepted
- Data: 2026-06-26
- Origem: migrado de DECISOES.md (D004)

## Contexto e Problema
Hoje o Gate A usa as mesmas lentes para qualquer tipo de tela.

## Decisão
O briefing do Gate A carrega lentes específicas por arquétipo (LISTA, MUTACAO, DRAWER, BOARD, DETALHE, DISCO).

## Motivo
Uma tela de listagem tem riscos de performance e paginação. Uma tela de mutação tem riscos de segurança e reversibilidade. O mesmo checklist para ambas é superficial.

## Consequências
Requer manutenção das lentes por arquétipo. As lentes precisam ser definidas antes da implementação do CLI.
