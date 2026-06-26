# 0016 — Testar antes de registrar decisão de design

- Status: accepted
- Data: 2026-06-26
- Origem: migrado de DECISOES.md (D016)

## Contexto e Problema
Tendência de registrar ideias de arquitetura como decisões antes de validá-las empiricamente — criando dívida difícil de desfazer.

## Decisão
Nenhuma ideia nova de arquitetura ou abordagem é registrada como decisão antes de um teste isolado comparativo. O teste é a evidência; a decisão vem depois.

## Motivo
Benchmark A vs B mostrou que a hipótese "schema primeiro" parecia correta na teoria mas produziu schema mais fraco na prática. Sem o teste, teríamos registrado a abordagem errada como padrão.

## Consequências
Toda proposta nova de abordagem gera dois subagentes paralelos antes de qualquer atualização no CORE ou DECISOES.md. Adiciona tempo mas elimina decisões baseadas em intuição não testada.
