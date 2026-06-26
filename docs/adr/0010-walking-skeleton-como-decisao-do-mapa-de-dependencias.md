# 0010 — Walking Skeleton como decisão do Mapa de dependências

- Status: accepted
- Data: 2026-06-26
- Origem: migrado de DECISOES.md (D010)

## Contexto e Problema
Walking Skeleton estava como etapa separada após o Mapa de dependências.

## Decisão
Walking Skeleton é uma decisão que o Mapa de dependências toma — entra no fluxo se e somente se o Plan decidir que a feature é de alto risco de integração.

## Motivo
Clareza de responsabilidade. Quem decide se precisa de skeleton é quem conhece as dependências — o Plan. Não é uma etapa obrigatória, é uma ramificação condicional.

## Consequências
O critério de "alto risco de integração" precisa ser definido antes da implementação do CLI (ver A006 em ABERTO.md).
