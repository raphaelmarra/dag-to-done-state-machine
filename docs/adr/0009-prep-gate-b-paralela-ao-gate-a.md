# 0009 — Prep Gate B paralela ao Gate A

- Status: accepted
- Data: 2026-06-26
- Origem: migrado de DECISOES.md (D009)

## Contexto e Problema
Gate B começava do zero após Gate A aprovar — perda de tempo em setup.

## Decisão
Enquanto Gate A revisa o código, o fiscal prepara os cenários de verificação ao vivo. Gate B executa imediatamente após Gate A aprovar.

## Motivo
Prep Gate B não depende do resultado do Gate A — só da implementação pronta. Elimina tempo de setup sem nenhum risco.

## Consequências
Se Gate A reprovar, a prep foi descartada. Custo baixo (prep é leve) vs ganho real em velocidade.
