# Plano da Etapa 3 — GAP

> Destila e constrói a etapa 3 (GAP) pela rotina validada (etapas 1 e 2). Tudo em `etapa-3-gap/`.
> **Nasce com o aprendizado das etapas 1 e 2 embutido** (as 3 checagens da auditoria-base + a lente de
> paridade CORE↔porteiro + "ao-vivo passou ≠ pronto"). Ver `docs/METODOLOGIA-CORE.md`.

## O que é a etapa 3 (do PIPELINE.md)
Confronta o que foi DESCOBERTO (mapa do DAG + contrato da API da etapa 2) com o que a FEATURE precisa.
Lista: o que falta, o que é incerto, o que já está pronto para reusar, os no-gos (fora de escopo de
propósito), e a complexidade estimada. Executor (placeholder): `error-detective` — **a validar**.

**Entregável:** o que a API não oferece (com evidência) · o que o sistema não tem · o que dá pra reusar ·
incertezas que pedem Spike · no-gos explícitos · complexidade (simples|média|alta com justificativa).

**Critério oficial:** cada gap tem evidência (não suposição) · nenhum "impossível" sem tentar outros
ângulos · no-gos explícitos.

## O que MUDA em relação às etapas 1 e 2 (a personalidade da etapa 3)
- Etapa 1 (DAG): mapeia o código (read-only). Etapa 2 (Descoberta): confirma ao vivo (toca a rede).
- **Etapa 3 (GAP): NÃO descobre nada novo — CONFRONTA o que as etapas 1+2 já entregaram com a demanda.**
  É uma etapa de *análise/raciocínio*, não de coleta. O insumo são os outputs do DAG e da Descoberta.
- → Executor diferente (analista, não explorador nem verificador). Confiança provável: baseada na
  evidência das etapas anteriores ("confirmado na descoberta" / "inferido" / "a confirmar via Spike").
- → Pré-condições: precisa do `dag_output` E do `descoberta_output` (as duas etapas anteriores).

## O 2º caso que destrava A012 (regrasExtras)
A etapa 3 provavelmente terá uma regra custom no `aceita` (ex.: "todo gap tem evidência"). Isso é o
**2º caso** de regra custom (o 1º foi a evidência da etapa 2). Pela M4 (2 casos antes de abstrair), é
aqui que se decide implementar o **`regrasExtras` declarativo** (A012) — com 2 casos reais guiando o
design, em vez de adivinhar. Decisão na Fase 2/3.

## FASE DE PESQUISA (pesquisar bem antes, como nas etapas 1 e 2)
A pesquisa de FORMA não se repete. Pesquisas de CONTEÚDO da etapa 3, em paralelo, em `research/`:

| # | Pesquisa | Pergunta central |
|---|----------|------------------|
| P1 | **Gap analysis / fit-gap** | Como a indústria faz análise de lacuna (o que falta entre "tem" e "precisa")? Fit-gap, requirements traceability, gap matrix. |
| P2 | **Evidência de gap (não suposição)** | Como provar que algo FALTA (vs. supor)? O critério "cada gap tem evidência". Negative evidence, "absence of evidence". |
| P3 | **Estimativa de complexidade/esforço** | Como estimar complexidade de forma defensável? T-shirt sizing, story points, COCOMO leve, drivers de complexidade. (ADR 0013 já existe — confrontar.) |
| P4 | **Escopo e no-gos** | Como declarar fronteira de escopo explicitamente? Out-of-scope, MoSCoW, "won't have", trade-off de descarte. |

## ROTINA (a mesma — 0→4, com as checagens novas embutidas)
Fase 0 (vereditos: o que herda vs próprio) → Fase 1 (padrão-ouro: caso real `gap.output.json` + cego,
fundidos) → Fase 2 (escrever CORE-GAP) → Fase 3 (testar: cego + regressão + adversarial + **as 3
checagens: paridade CORE↔porteiro, encanamento de entrada, dialeto de validação**) → Fase 4 (cristalizar).

**Anti-viés saturado** (múltiplos verificadores cegos por peça) e **evidência obrigatória**, como sempre.

## ROADMAP
Hoje 2/13. Depois desta: **3/13**. A 3ª repetição testa se o método se mantém barato e se as checagens
novas pegam os problemas ANTES (não depois, como na etapa 2). Custo esperado: ~igual ou menor que a 2.

## ✅ FASE DE PESQUISA — CONCLUÍDA (2026-06-28)
4 pesquisas em `research/01-04`, com fontes. Achados que MOLDAM o design (todos convergem com a
filosofia das etapas 1-2: estrutura > achismo):

- **P1 (gap analysis):** a indústria usa a taxonomia **Fit / Partial Fit / Gap / Not-Applicable** —
  mapeia 1:1 no nosso "pronto-pra-reusar / existe-mas-muda / falta / no-go". Método sistemático: a
  **matriz de rastreabilidade** (necessidade × oferta); célula vazia = gap. Confirma que a etapa 3 só
  CONFRONTA (não descobre). Regra Microsoft: marcar todo Fit como "não reconstruir".
- **P2 (evidência de ausência) — ACHADO QUE MOLDA O PORTEIRO:** provar que algo FALTA exige um **trio**:
  afirmação + busca executada + sinal forte (ex.: chamei e deu 404). Sem o trio, é suposição (rebaixar).
  "Impossível" exige `angulos_tentados ≥1`. Domínio fechado (API) permite prova dedutiva; domínio aberto
  ("impossível") nunca é certo. → vira regra estrutural do `aceita` (herda a honestidade da etapa 2).
- **P3 (complexidade) — DERIVAR, não opinar:** "Count → Compute → Judge" (McConnell): a complexidade é
  **computada dos gaps** (nº de P0/P1, integrações, dependências, incerteza, superfície), não um chute do
  agente. Confronto do ADR 0013: acerta o princípio, é omisso no COMO → completar (não trocar). Proposta:
  o agente conta os drivers (subproduto natural do GAP); o motor computa a banda por limiares. (M1 puro.)
- **P4 (no-gos):** cada no-go precisa de **3 campos — o-quê / motivo / destino** (desta-feature / de-propósito
  / de-outra-etapa). Sem isso, é omissão disfarçada de decisão. Vira contrato que protege Design/Implementação.

**Convergência:** os 4 critérios oficiais da etapa 3 viram regras ESTRUTURAIS (trio de evidência por gap,
ângulos por "impossível", complexidade computada, no-go com 3 campos) — a honestidade imposta pelo
formato, não confiada ao agente. Mesma espinha das etapas 1 e 2.

## ▶️ PRÓXIMO: Fase 0 (vereditos) → Fase 1 (padrão-ouro) → Fase 2 (CORE-GAP) → Fase 3 (testar + 3 checagens) → Fase 4 (cristalizar).
