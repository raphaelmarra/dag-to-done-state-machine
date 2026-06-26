# 0002 — Briefing gerado automaticamente pelo estado da instância

- Status: accepted
- Data: 2026-06-26
- Origem: migrado de DECISOES.md (D002)

## Contexto e Problema
Hoje o loop monta o briefing manualmente para cada agente.

## Decisão
Cada fase define um `briefingTemplate` populado com dados reais da instância no momento do `dag next <feature>`.

## Motivo
Elimina dependência de memória do orquestrador. O agente recebe contexto filtrado e relevante, não o arquivo inteiro. Padrão reconhecido como prática emergente (Microsoft Agent Framework Handoff).

## Consequências
O template de briefing precisa ser mantido por arquétipo. Se a instância tiver campos vazios, o briefing fica incompleto — o sistema alerta antes de imprimir.
