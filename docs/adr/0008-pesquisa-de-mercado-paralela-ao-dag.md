# 0008 — Pesquisa de mercado paralela ao DAG

- Status: accepted
- Data: 2026-06-26
- Origem: migrado de DECISOES.md (D008)

## Contexto e Problema
A pesquisa de mercado estava dentro do Design, aumentando o tempo dessa etapa.

## Decisão
Pesquisa de mercado roda em paralelo ao DAG. O Design recebe ambos prontos.

## Motivo
DAG e pesquisa de mercado não dependem um do outro. Rodar em paralelo reduz o tempo total sem nenhum risco.

## Consequências
O Design fica mais rico desde o início — recebe contexto do sistema E contexto do mercado ao mesmo tempo.
