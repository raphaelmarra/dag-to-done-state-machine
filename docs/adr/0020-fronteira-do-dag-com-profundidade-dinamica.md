# 0020 — Fronteira do DAG com profundidade dinâmica (não "1 hop" fixo)

- Status: accepted
- Data: 2026-06-28
- Relacionado: CORE-DAG v4.0 (regra A4), substitui a A4 "1 hop fixo" do v3.0; ADR 0016 (validar antes)

## Contexto e Problema
O CORE-DAG v3.0 fixava a fronteira do grafo em "1 hop para fora do entry_point", expandindo o
transitivo só quando o entry_point era cross-cutting. A pesquisa de análise de impacto
(`research/0012`) mostrou que 1 hop como **teto rígido** admite falsos negativos de ripple: uma
cadeia A→B→C onde B é um pass-through fino esconde o impacto real em C (2 hops). A indústria de
blast radius usa profundidade 3–5. O DDD (`research/0013`) reforça: a fronteira certa é semântica
(bounded context), não uma contagem de hops.

## Decisão
A fronteira do DAG tem **1 hop como default, com expansão dinâmica guiada por gatilhos**. Expande-se
o 2º hop de um vizinho específico quando ele é: (a) um hub (fan-in/out alto), (b) um
pass-through/adaptador fino, ou (c) a aresta cruza uma fronteira de contrato (API/schema/interface).
O que ficar além da expansão é registrado como candidato transitivo **"a verificar"**, nunca omitido.

## Motivo
Alinha com a metodologia M1 ("dinâmico é a preferência"): o critério de profundidade é ensinado pelo
CORE e os dados (forma do vizinho) vêm do contexto. Converte falso-negativo silencioso em aviso
explícito de incerteza — mais seguro para um agente LLM. Validado contra o domínio CRM do
ravi-console (hubs `ModalShell`, `useTagsCatalog`, `labels.ts`, `drawer.ts` cujo impacto a 2+ hops
seria perdido por "1 hop" rígido).

## Consequências
O briefing gerado inclui uma seção "expansões dinâmicas feitas e por quê" e "candidatos transitivos a
verificar". O executor decide a profundidade lendo o código, não por um número fixo.
