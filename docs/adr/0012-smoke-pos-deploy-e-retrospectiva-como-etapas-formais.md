# 0012 — Smoke pós-deploy e Retrospectiva como etapas formais

- Status: accepted
- Data: 2026-06-26
- Origem: migrado de DECISOES.md (D012)

## Contexto e Problema
O pipeline terminava no Done lógico. Deploy e aprendizado eram informais.

## Decisão
Smoke pós-deploy (etapa 12) e Retrospectiva de cicatriz (etapa 13) entram como etapas formais do pipeline.

## Motivo
Done lógico ≠ Done real. A feature só está entregue quando funciona em produção. E o pipeline só melhora se houver um momento formal de aprender com o que aconteceu.

## Consequências
O ciclo total tem 13 etapas. A retrospectiva alimenta o GEPA (melhoria dos próprios gates) de forma sistemática — não esparsa como hoje.
