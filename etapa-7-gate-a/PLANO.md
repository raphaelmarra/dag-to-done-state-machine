# Plano da Etapa 7 — Gate A (Revisão de código)

> Destila e constrói a etapa 7 pela rotina validada (etapas 1-6). Tudo em `etapa-7-gate-a/`. Nasce com TODO
> o aprendizado embutido (3 checagens, paridade, encadeamento das 7, regrasExtras, limite epistêmico).
> **A 1ª etapa REFUTADORA** — fecha o anti-viés do projeto (o réu da etapa 6 encontra seu juiz).

## O que é a etapa 7 (do PIPELINE.md, ~l.307)
Revisão ADVERSARIAL do diff da etapa 6. Tenta ENCONTRAR problemas — não validar, é tentativa de refutação.
Usa lentes específicas por arquétipo. Executor: `code-reviewer`. Roda em paralelo à Prep Gate B (etapa 9).

**Briefing automático inclui:** diff da implementação · ADRs do design (conformidade) · riscos do pre-mortem
(cobrir) · lentes obrigatórias por arquétipo.

**Entregável:** veredito APROVA/REPROVA + lista de problemas (se REPROVA, acionáveis) + lentes cobertas
declaradas + o que ficou fora de cobertura (honestidade sobre limites).
**Critério (oficial):** todas as lentes do arquétipo cobertas · cobertura declarada (não implícita) · veredito
claro (sem "depende") · se REPROVA, motivo específico com localização.

## A personalidade da etapa 7 (o que MUDA vs. as 6 anteriores)
- **1ª REFUTADORA:** não produz artefato, REVISA. O output pode ser REPROVA (volta à etapa 6) — saudável.
- **Lentes por ARQUÉTIPO:** a bateria de verificação muda conforme o tipo de tela (LISTA/MUTACAO/DRAWER/
  BOARD/DETALHE/DISCO). O catálogo arquétipo→lentes é o coração da etapa.
- **Porteiro valida a REVISÃO, não o código nem o veredito:** que as lentes do arquétipo foram cobertas, que
  o veredito é claro, que as issues são acionáveis. NÃO exige "APROVA" (um Gate A que só aprova é teatro).
- **Fecha o anti-viés "réu nunca é juiz":** a etapa 6 (autor) declarou com prova; a etapa 7 (outro agente)
  refuta. É a aplicação canônica do princípio do projeto à própria mecânica do pipeline.

## TENSÃO DE DESIGN (a decidir na Fase 1, com pesquisa + 2 casos)
- **D-1:** catálogo arquétipo→lentes como DADO no CORE (molde `CATALOGO_ESTADOS_UI`/`CATALOGO_GATES`), e o
  porteiro verifica união(cobertas,descobertas) ⊇ lentes(arquétipo)?
- **D-2:** de onde o porteiro lê o arquétipo da feature (estado/design_output/campo do output)?

## FASE DE PESQUISA (em andamento)
1 pesquisa de mercado (search-specialist): revisão adversarial por LLM (CodeRabbit/Codacy/Qodo/Greptile),
checklists por tipo de mudança, veredito REPROVA como saudável, o porteiro que valida a revisão, lentes por
arquétipo de UI. → `research/01`.

## ROTINA (a mesma — 0→4, com tudo embutido + encadeamento das 7)
Fase 0 → Fase 1 (padrão-ouro: caso real `gate_a.output.json` + 2º caso cego DRAWER) → Fase 2 (CORE-GATEA +
declarar etapa, com a regra de cobertura de lentes) → Fase 3 (testar: cego + 3 checagens + encadeamento das 7
etapas + anti-viés saturado) → Fase 4 (cristalizar, ADR 0028).

## ROADMAP
Hoje 6/13. Depois desta: **7/13** — mais da metade. A etapa 7 testa se o método aguenta uma etapa REFUTADORA
(output binário com REPROVA legítimo) e o catálogo dinâmico-por-arquétipo (a lente certa para a tela certa).
