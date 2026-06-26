# 0018 — Output schema em JSON via tool_use, renderizado como listas para o agente

- Status: accepted
- Data: 2026-06-26
- Origem: migrado de DECISOES.md (D018)

## Contexto e Problema
Agentes produziam formato livre nas respostas; verificação mecânica era impossível. Formatos de tabela eram ilegíveis em terminal e interpretados de forma inconsistente.

## Decisão
O dag next força saída JSON estruturada via tool_use do SDK. O JSON é validado mecanicamente antes de renderizar. A renderização para o agente executor usa sempre listas aninhadas, nunca tabelas.

## Motivo
Pesquisa (arXiv 2504.02052): JSON + nomes de atributo + descrições → 4.90/5 de aderência de formato vs 3.09/5 sem eles. Instrução de exclusão explícita elevou conformidade de 40% para 100% em Llama3. Listas são mais legíveis em terminal e para o LLM do que tabelas.

## Consequências
Implementação do dag next usa response_format ou tool_use para forçar JSON. CORE define schema; CLI valida; só então renderiza markdown com listas.
