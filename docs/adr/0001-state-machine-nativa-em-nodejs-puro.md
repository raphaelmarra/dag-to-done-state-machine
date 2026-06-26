# 0001 — Abordagem B: state machine nativa em Node.js puro

- Status: accepted
- Data: 2026-06-26
- Origem: migrado de DECISOES.md (D001)

## Contexto e Problema
Três abordagens avaliadas: XState embutido, state machine nativa em JS puro, modelo declarativo via YAML.

## Decisão
Abordagem B — implementar o padrão LangGraph sem LangGraph, em JS puro dentro do `dag.mjs` existente.

## Motivo
Respeita o `GUARD §9` do dag ("ZERO new abstraction, no framework"). Zero dependências novas. A essência do LangGraph cabe em ~150 linhas de JS puro para 13 fases lineares. XState adicionaria 40kb+ e conflita com a filosofia THIN do projeto.

## Consequências
Sem tooling visual. Erros de lógica de guarda ficam invisíveis sem testes. O `tamper_hash` + verificação no CI são o backstop contra edição manual.
