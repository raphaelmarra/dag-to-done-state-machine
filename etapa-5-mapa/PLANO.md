# Plano da Etapa 5 — Mapa de Dependências

> Destila e constrói a etapa 5 pela rotina validada (etapas 1-4). Tudo em `etapa-5-mapa/`. Nasce com
> TODO o aprendizado embutido (3 checagens, paridade, encadeamento, regrasExtras, limite epistêmico).

## O que é a etapa 5 (do PIPELINE.md)
Organiza a IMPLEMENTAÇÃO: quebra a feature em unidades de trabalho, define o que bloqueia o quê
(dependências), o que roda em paralelo (só com arquivos DISJUNTOS), a ordem, e decide se precisa de
Walking Skeleton. Executor (placeholder): `Plan` — **a validar**. Recebe os outputs das 4 etapas anteriores.

**Definition of Ready (gate interno):** confirma que etapas 1-4 estão completas — já garantido pelas
pré-condições do motor (precisa de dag+descoberta+gap+design_output).

**Entregável:** unidades com escopo · dependências (o que bloqueia o quê) · paralelo (com arquivos de
cada unidade) · ordem de execução · decisão Walking Skeleton com justificativa.

## O que MUDA / o que REUSA (a personalidade da etapa 5)
- Etapas 1-3 ANALISAM, 4 DESENHA. **Etapa 5 PLANEJA a execução** — organiza trabalho, não produto.
- **INSIGHT (reuso de pesquisa):** a etapa 5 é um **DAG de unidades de trabalho** (`depende_de` = arestas).
  É a MESMA teoria de grafos da etapa 1 (acíclico, ordem topológica), aplicada a TAREFAS, não a código.
  A regra de paralelismo "só arquivos disjuntos" é a chave própria. → Reaproveitar `research/0011-0014`
  da etapa 1 (DAG, condensação); não repesquisar grafo.
- → Executor: planejador (Plan). Pré-condições: as 4 etapas anteriores.
- → A regra estrutural crítica: **paralelo só com arquivos disjuntos** — verificável MECANICAMENTE (as
  unidades em paralelo têm interseção de arquivos = ∅?). Isso é honestidade estrutural pura.

## FASE DE PESQUISA (focada — só o que é novo; grafo já temos da etapa 1)
3 pesquisas de CONTEÚDO em paralelo, em `research/`:

| # | Pesquisa | Pergunta central |
|---|----------|------------------|
| P1 | **Decomposição em unidades de trabalho** | Como quebrar trabalho em unidades com escopo claro e done-criteria? Work breakdown structure (WBS), vertical slicing, INVEST para tarefas, right-sizing. |
| P2 | **Paralelismo seguro / file-disjointness** | Como decidir o que roda em paralelo sem conflito? Disjoint file sets, merge conflicts, critical path, parallelização segura de tarefas de código. |
| P3 | **Walking Skeleton / ordem de implementação** | Walking Skeleton (Cockburn), tracer bullet, ordem incremental (o que primeiro), risco-primeiro vs valor-primeiro. Confronta ABERTO A006 (critério de WS). |

> Grafo de dependências (acíclico, ordem topológica, condensação de ciclo) NÃO se repesquisa — vem da
> etapa 1 (`research/0011-0014`). A etapa 5 aplica isso a unidades de trabalho.

## ROTINA (a mesma — 0→4, com tudo embutido + encadeamento das 5)
Fase 0 → Fase 1 (padrão-ouro: caso real `mapa_dependencias.output.json` + cego) → Fase 2 (CORE-MAPA +
declarar etapa, com regra de file-disjointness mecânica) → Fase 3 (testar: cego + 3 checagens +
encadeamento das 5 etapas + anti-viés saturado) → Fase 4 (cristalizar).

## ROADMAP
Hoje 4/13. Depois desta: **5/13** — passa de um terço. A etapa 5 testa se o método reusa pesquisa de
etapas anteriores (o grafo da etapa 1) e se uma regra puramente mecânica (file-disjointness) cabe no padrão.

## ✅ FASE DE PESQUISA — CONCLUÍDA (2026-06-28)
3 pesquisas em `research/01-03`, com fontes (grafo reusado da etapa 1). Achados que moldam o design:

- **P1 (unidades):** unidade bem-formada = **regra dos 100%** (cobertura sem invenção, PMI/WBS) + **RTM**
  (toda unidade liga a ≥1 gap/critério via `ancora`). Corte VERTICAL (entrega comportamento), não
  horizontal. Schema da unidade: `id · nome(resultado) · objetivo · arquivos · ancora(≥1) · depende_de`.
  Porteiro: âncora não-vazia por unidade + cobertura dos gaps P0/P1.
- **P2 (paralelismo) — ACHADO CRÍTICO:** `arquivos ∩ = ∅` é **NECESSÁRIO mas NÃO SUFICIENTE**. Cobre o
  conflito TEXTUAL (Git só conflita nas mesmas linhas), mas o conflito SEMÂNTICO atravessa arquivos
  disjuntos (U muda assinatura, outra consome no formato antigo — sem marcador, quebra build/teste;
  medido ~3-35% em estudos). **A salvaguarda:** isso é uma ARESTA do DAG (etapa 1). Regra completa
  DUPLA: arquivos disjuntos (textual, o porteiro verifica como interseção de conjuntos) **E** ausência
  de aresta de consumo entre as unidades (semântico, herdado do DAG). O porteiro REPROVA par paralelo
  com interseção ≠ ∅; emite aviso onde o grafo não desce ao nível do símbolo (nunca silêncio).
- **P3 (Walking Skeleton):** a pergunta certa NÃO é "a feature é grande?" mas **"o caminho end-to-end
  já existe e roda?"**. Se já existe, o WS já foi pago (refazer = burocracia); se não (integração nova/
  risco não confirmado), é o 1º passo. Teste de 5 sinais. Proposta p/ A006: "risco alto" = risco de
  INTEGRAÇÃO/caminho, não de volume. (Hipótese de 1 caso — validar 2º caso que force SIM antes de ADR.)

**Convergência:** os critérios oficiais da etapa 5 viram regras ESTRUTURAIS — unidade com âncora;
paralelo verificável por arquivos disjuntos (limite semântico declarado honestamente); WS com
justificativa ancorada em fato (o caminho já roda?). Mesma espinha das etapas anteriores.

## ▶️ PRÓXIMO: Fase 0 → Fase 1 → Fase 2 → Fase 3 (+ encadeamento das 5) → Fase 4.
