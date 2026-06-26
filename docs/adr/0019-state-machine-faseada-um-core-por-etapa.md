# 0019 — State machine faseada: um CORE por etapa

- Status: accepted
- Data: 2026-06-26
- Origem: migrado de DECISOES.md (D019)

## Contexto e Problema
O CORE atual era genérico — tentava servir todas as 13 etapas com um único documento, resultando em regras contraditórias e enum de confiança impossível para certos agentes (ex.: Explore não pode usar "confirmado ao vivo").

## Decisão
A state machine é construída fase por fase. Cada etapa tem seu próprio CORE individual (ex.: CORE-DAG.md, CORE-DISCOVERY.md). O CORE genérico vira referência/esqueleto; nunca é despachado diretamente.

## Motivo
Etapas diferentes usam agentes diferentes (Explore, fiscal, code-reviewer) com capacidades diferentes. Um CORE genérico força o gerador a produzir briefings com instruções impossíveis para o agente destinatário — como o enum "confirmado ao vivo" sendo usado pelo Explore, que não toca a rede.

## Consequências
Começamos pelo CORE-DAG (etapa 1). As demais etapas serão especificadas individualmente. O investimento é maior por etapa, mas cada CORE é preciso, testável e sem ambiguidade de destinatário.
