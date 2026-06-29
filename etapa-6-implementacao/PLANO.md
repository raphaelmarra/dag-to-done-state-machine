# Plano da Etapa 6 — Implementação

> Destila e constrói a etapa 6 pela rotina validada (etapas 1-5). Tudo em `etapa-6-implementacao/`.
> Nasce com TODO o aprendizado embutido (3 checagens, paridade, encadeamento das 6, regrasExtras, limite
> epistêmico). **A 1ª etapa que toca CÓDIGO** — exige decidir o que o executor produz/verifica (feito: A015).

## O que é a etapa 6 (do PIPELINE.md, ~l.274)
Implementa a feature conforme o mapa de unidades. Briefing automático traz: endpoints confirmados (etapa 2),
o que não pode quebrar (etapa 1), no-gos (etapa 3), ADRs+critérios (etapa 4), escopo+arquivos da unidade
(etapa 5). Executores: `frontend-developer | typescript-pro | fullstack-developer` (conforme o mapa).

**Entregável (oficial):** código implementado + declaração de: cada endpoint usado (confirmado/inferido),
nenhum no-go violado, confiança por parte incerta.
**Critério (oficial):** `tsc --noEmit` verde · `check:contracts` verde · `vitest run` verde ·
`integrity-check` verde · zero placeholder/TODO sem justificativa · zero hardcode.

## A personalidade da etapa 6 (o que MUDA vs. as 5 anteriores)
- Etapas 1-3 ANALISAM, 4 DESENHA, 5 PLANEJA. **Etapa 6 PRODUZ o artefato (código)** — e é a 1ª cujo
  critério oficial pressupõe RODAR comando, não validar forma de JSON.
- **A tensão central:** porteiro valida forma de JSON; não roda `tsc`. **Resolvida (A015 + pesquisa):**
  o agente jamais é juiz do próprio trabalho → a etapa 6 **DECLARA com prova**, não JULGA. O executor
  APLICA o código e roda os checks (auto-correção = maior alavanca de confiabilidade), mas entrega um
  **handoff verificável** (plano de diff ancorado + prontidão com evidência); Gate A refuta, Done re-roda.

## ✅ FASE DE PESQUISA — CONCLUÍDA (2026-06-29)
Estado-da-arte 2026 (search-specialist) + fit arquitetural (backend-architect) + inventário de âncoras
(Explore). Achados que moldam o design:

- **Plan-vs-apply:** separar raciocínio-da-mudança da emissão-do-diff é vencedor (Aider architect/editor:
  SOTA 85%, 30-50% mais barato). Separar ≠ "nunca aplicar" — o Editor do Aider ainda aplica.
- **Quem roda os testes:** o agente roda no loop para auto-corrigir (melhora acerto), MAS o veredito é
  SEMPRE de um harness externo determinístico (SWE-bench, Terminal-bench/Harbor). As duas coisas coexistem.
- **Agente-juiz (o achado mais forte):** "tests passed" dito pelo agente é não-confiável por DOIS motivos
  independentes — (a) reward hacking (o agente hackeia o teste; documentado), (b) ICSE 2026: 28,6% dos
  patches que passam nos testes estão ERRADOS; 82,7% dos problemáticos não se detecta nem rodando tudo.
  Regra de ouro: verificação por sistema DIFERENTE do que gerou o código.
- **Restrição-chave:** se o porteiro não executa, o agente não pode ser juiz (só ele executaria). →
  etapa 6 DECLARA; Gate A (7) refuta; Done (11) comprova (re-roda, status derivado).
- **Inventário de âncoras (Explore):** no caso real a rastreabilidade âncora→fonte FECHA 100% (33 âncoras,
  0 sem correspondente). Mas 2 "órfãs" legítimas (GAP-006 spike, ADR-003 no-go já implementado) →
  **a regra de âncora é DIRECIONAL: toda mudança→tem âncora; NÃO todo gap→vira mudança** (no-go/spike não viram).

## DECISÃO DE ARQUITETURA (A015) — ver ABERTO.md
Híbrido: executor APLICA + declara prontidão com prova. Output = diff ancorado + golden_path + riscos +
bloco `prontidao` (cada gate; `verde` exige evidência colada — mecanismo da etapa 2). Custo de motor: ZERO
(a menos que a Fase 1 decida cruzar âncora↔fonte, A014 — aí estende o motor 1×).

## ROTINA (a mesma — 0→4, com tudo embutido + encadeamento das 6)
Fase 0 → Fase 1 (padrão-ouro: caso real `implementacao.output.json` + 2º caso cego MUTACAO) → Fase 2
(CORE-IMPL + declarar etapa, regra de prontidão com evidência + âncora direcional) → Fase 3 (testar: cego +
3 checagens + encadeamento das 6 etapas + anti-viés saturado) → Fase 4 (cristalizar, ADR 0027).

## ROADMAP
Hoje 5/13. Depois desta: **6/13** — quase metade. A etapa 6 testa se o método aguenta a etapa mais
atípica (a que toca código): o porteiro valida o handoff, não o código; a verdade do código vai para 7 e 11.
