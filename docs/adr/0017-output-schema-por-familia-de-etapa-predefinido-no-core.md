# 0017 — Output schema por família de etapa: pré-definido no CORE, não gerado dinamicamente

- Status: accepted
- Data: 2026-06-26
- Origem: migrado de DECISOES.md (D017)
- Relaciona: D016

## Contexto e Problema
Benchmark comparativo testou duas abordagens: (A) gerador cria briefing primeiro, schema depois; (B) gerador cria schema primeiro, briefing derivado.

## Decisão
O output schema não é gerado pelo mesmo agente que gera o briefing. O schema de cada família de etapa é pré-definido no CORE como template; o gerador apenas personaliza os campos variáveis com dados da instância.

## Motivo
No teste, o Agente A produziu schema mecanicamente verificável mas derivado do briefing (não da necessidade da próxima etapa). O Agente B produziu briefing mais rico mas schema especulativo e não verificável. Nenhum dos dois gerou o schema correto dinamicamente porque o schema correto emerge da especificação da próxima etapa — que é fixa por arquétipo, não por instância.

## Consequências
CORE v3 terá templates de output schema por família de etapa (DISCOVERY, DESIGN, IMPLEMENTAÇÃO, GATES, RETROSPECTIVA). O gerador preenche os campos variáveis; não inventa a estrutura. O dag verify valida o retorno do agente contra o template + campos preenchidos.
