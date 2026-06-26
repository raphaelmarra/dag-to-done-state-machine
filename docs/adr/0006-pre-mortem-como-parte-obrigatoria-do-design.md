# 0006 — Pre-mortem como parte obrigatória do Design

- Status: accepted
- Data: 2026-06-26
- Origem: migrado de DECISOES.md (D006)

## Contexto e Problema
Riscos emergem na implementação ou nos gates — tarde demais.

## Decisão
O design (etapa 4) inclui uma pergunta obrigatória: "o que poderia fazer essa feature falhar em produção?" com pelo menos 3 riscos levantados.

## Motivo
O pre-mortem (Gary Klein, HBR 2007) usa "prospective hindsight" — imaginar que já falhou melhora a identificação de riscos em ~30%. O lugar mais barato para encontrar riscos é antes de escrever código.

## Consequências
Os riscos levantados alimentam as lentes do Gate A e os cenários do Gate B.
