# Plano da Etapa 8 — Acessibilidade

> Destila e constrói a etapa 8 pela rotina validada (etapas 1-7). Tudo em `etapa-8-acessibilidade/`. Nasce com
> TODO o aprendizado embutido (3 checagens, paridade, encadeamento das 8, regrasExtras, limite epistêmico).
> **SEM caso real no MVP** — preciso construir o 1º caso. **A 1ª etapa CONDICIONAL** (só interação real).

## O que é a etapa 8 (do PIPELINE.md, ~l.362)
Verifica a tela EM MOVIMENTO (não lendo o código): foco ao entrar, navegação por teclado, leitura de tela,
contraste com dado real. WCAG operacional, não análise estática. Posição: entre Gate A (7) e Gate B (9).
Executor: `web-accessibility-checker`. Arquétipos: só MUTACAO/DRAWER/BOARD (interação real).

**Entregável:** `aprovado` | lista de itens a corrigir com severidade.
**Critério (oficial):** WCAG operacionais cobertos (não só estática) · navegação por teclado testada · foco e
escape testados · se itens a corrigir: cada um com severidade e ação clara.

## A personalidade da etapa 8 (o que MUDA vs. as 7 anteriores)
- **1ª CONDICIONAL:** só se aplica a interação real. Tensão: o motor é linear (não pula etapas). Resolução
  provável (simetria c/ etapa 7): roda sempre + declara N/A com motivo p/ feature read-only.
- **Verifica MOVIMENTO, não código:** o que o Gate A leu estaticamente, esta vê operando. No nosso contexto
  (etapa 6 = plano de diff), declara as checagens WCAG com EVIDÊNCIA (família da etapa 6); a verdade vai ao
  Gate B / humano.
- **WCAG é catálogo canônico:** WCAG 2.2 A/AA operacional vira CATALOGO_WCAG (molde CATALOGO_LENTES da etapa 7).
- **Reúso forte:** cobertura de catálogo (etapa 7) + N/A com motivo (etapa 7) + evidência obrigatória (etapa 6)
  + injeção de catálogo no briefing (etapa 7). Custo de mecanismo esperado: ~0.

## TENSÕES (a decidir na Fase 1 — pesquisa é pré-requisito)
- D-1 condicionalidade: pular vs. rodar-sempre-com-N/A. D-2 arquétipo (some se D-1=rodar-sempre). D-3 movimento
  vs. plano (declarar com evidência). Ver _WIP-construcao.md.

## FASE DE PESQUISA (pré-requisito — não há caso real)
1 pesquisa (search-specialist): WCAG operacional vs estático (axe/Lighthouse pegam ~30-40%; o resto é manual);
catálogo WCAG 2.2 por nível e por tipo de interação; agentes de a11y (Playwright+axe); etapa condicional; o
output de uma verificação a11y. → `research/01`.

## ROTINA (a mesma — 0→4, com tudo embutido + encadeamento das 8)
Fase 0 → Fase 1 (PESQUISA primeiro → decidir D-1/2/3 → 2 casos cegos CONSTRUÍDOS → destilar) → Fase 2
(CORE-A11Y + declarar etapa) → Fase 3 (testar: cego + 3 checagens + encadeamento das 8 + anti-viés saturado) →
Fase 4 (cristalizar, ADR 0029).

## ROADMAP
Hoje 7/13. Depois desta: **8/13**. A etapa 8 testa se o método aguenta uma etapa CONDICIONAL (só às vezes se
aplica) num motor linear, e se um catálogo canônico externo (WCAG 2.2) cabe no padrão CATALOGO_*.
