# Plano da Etapa 4 — Design

> Destila e constrói a etapa 4 (Design) pela rotina validada (etapas 1-3). Tudo em `etapa-4-design/`.
> Nasce com TODO o aprendizado embutido: 3 checagens da auditoria-base, lente de paridade CORE↔porteiro,
> regra do encadeamento (testar encadeada com as anteriores), `regrasExtras` declarativo. Ver `docs/METODOLOGIA-CORE.md`.

## O que é a etapa 4 (do PIPELINE.md)
Define o COMPORTAMENTO esperado da feature: estados da tela, como o usuário interage, casos de erro/borda.
Integra o que o mercado faz + o que a API permite + o que os gaps revelaram. Executor (placeholder):
`ui-ux-designer` — **a validar**. Recebe: dag_output + descoberta_output + gap_output.

**Dois rituais OBRIGATÓRIOS dentro do Design:**
- **Three Amigos** (ADR pré-existente): 3 perguntas por comportamento → por quê existe (propósito) ·
  como funciona (comportamento) · **como saberemos que está certo (critério de aceitação TESTÁVEL)**.
  Os critérios viram o que o Gate B verifica ao vivo.
- **Pre-mortem** (ADR 0006): imaginar a feature já fracassada em produção → mínimo 3 riscos. Alimentam
  as lentes do Gate A.

**Entregável:** matriz estados×ações · comportamento por caso (incl. erro/borda/vazio) · critérios de
aceitação testáveis (Given/When/Then) · riscos do pre-mortem · ADR por decisão arquitetural · refs de mercado.

## O que MUDA em relação às etapas 1-3 (a personalidade da etapa 4)
- Etapas 1-3 ANALISAM/DESCOBREM (mapeiam, confirmam, confrontam o que existe).
- **Etapa 4 PRODUZ decisões** — é a primeira etapa CRIATIVA. Não há "verdade ao vivo" para conferir;
  há *escolhas de design* a justificar. Isso muda o que o porteiro pode validar:
  - O porteiro NÃO julga se o design é "bom" (subjetivo) — valida que os RITUAIS foram feitos e os
    artefatos têm a forma certa: todo critério é testável? pre-mortem tem ≥3 riscos? cada decisão tem ADR?
  - A honestidade estrutural aqui é "o ritual foi cumprido", não "a verdade foi provada".
- → Executor diferente (designer, não analista). Confiança provável: baseada na origem (gap confirmado
  vs. suposição de produto). Pré-condições: dag+descoberta+gap (as 3 anteriores).

## FASE DE PESQUISA (pesquisar bem antes, como sempre)
A pesquisa de FORMA não se repete. Pesquisas de CONTEÚDO da etapa 4, em paralelo, em `research/`:

| # | Pesquisa | Pergunta central |
|---|----------|------------------|
| P1 | **Critério de aceitação testável** | Como escrever critério que é mesmo verificável (não vago)? Given/When/Then, BDD/Gherkin, acceptance criteria, "definition of done". Confronta ADR 0003. |
| P2 | **Three Amigos** | A prática Three Amigos (BA+Dev+QA): como as 3 perguntas (propósito/comportamento/critério) produzem critérios testáveis? Specification by Example. |
| P3 | **Pre-mortem / antecipação de risco** | Pre-mortem (Klein), prospective hindsight, FMEA leve: como antecipar falha de forma que gere risco ACIONÁVEL (não medo genérico)? Confronta ADR 0006. |
| P4 | **Modelagem de estados de tela** | State machines de UI, matriz estado×ação, statecharts (Harel), estados vazios/erro/loading: como cobrir TODOS os estados sem esquecer bordas? |

## ROTINA (a mesma — 0→4, com tudo embutido)
Fase 0 (vereditos) → Fase 1 (padrão-ouro: caso real `design.output.json` + cego, fundidos) → Fase 2
(escrever CORE-DESIGN + declarar etapa) → Fase 3 (testar: cego + as 3 checagens + **encadeamento** das
4 etapas + anti-viés saturado) → Fase 4 (cristalizar).

## ROADMAP
Hoje 3/13. Depois desta: **4/13**. A etapa 4 testa se o método aguenta uma etapa CRIATIVA (produz, não
analisa) — o porteiro validando "ritual cumprido + forma certa" em vez de "verdade provada".

## ✅ FASE DE PESQUISA — CONCLUÍDA (2026-06-28)
4 pesquisas em `research/01-04`, com fontes. Achado central: numa etapa CRIATIVA, o porteiro não julga
se o design é "bom" — valida que o RITUAL foi feito e os artefatos têm FORMA testável (e a maior parte
disso é mecanicamente verificável). Achados que moldam o design:

- **P1 (critério testável):** Given/When/Then é **parseável** (Given=dado, When=ação, Then=asserção
  observável) → vira roteiro do Gate B. O porteiro pode REJEITAR critério sem "então observável".
  Confronta ADR 0003: "checklist binário é necessário mas INSUFICIENTE" — dá pra escrever lixo binário
  ("o sistema é rápido? sim/não"). Schema do critério: `{given, when, then, exemplo}`.
- **P2 (Three Amigos):** com 1 agente, são **3 lentes SEQUENCIAIS** — Negócio (propósito, antes da
  solução) → Dev (viabilidade) → QA (bordas, cristaliza o critério). A ordem é regra; misturar colapsa
  o valor. Schema: `proposito · regras[] · criterios[] · perguntas_abertas[]`. Porteiro: toda regra tem
  ≥1 critério testável.
- **P3 (pre-mortem):** risco acionável = formato **SE-causa → ENTÃO-consequência** + o campo que faltava:
  **`o_que_revisar`** (a lente do Gate A que "adota" o risco). Confronta ADR 0006: "exige quantidade
  (≥3), não FORMA" → 3 frases vazias passam e chegam ao Gate A como ruído. FMEA: toda ação tem dono.
- **P4 (estados):** exaustividade = cruzar **catálogo de estados** (vazio/loading/erro-carga/erro-usuário/
  parcial/ideal — lista fixa checável) × **matriz estado×ação** (toda célula declara comportamento;
  célula em branco = buraco VISÍVEL). "Make impossible states impossible" (enum único). Porteiro: catálogo
  percorrido, zero célula em branco, erro preserva input, vazio com CTA.

**Convergência:** os 5 critérios oficiais da etapa 4 viram regras ESTRUTURAIS verificáveis — critério com
Given/When/Then; Three Amigos com as 3 respostas por comportamento; pre-mortem com ≥3 riscos
causa→consequência+o_que_revisar; matriz de estados sem célula em branco; ADR por decisão. A honestidade
é "ritual cumprido + forma certa", e o porteiro a impõe. Limite epistêmico (honesto): a parte SINTÁTICA
o motor checa; "este 'então' é MESMO observável?" é semântico (cabe ao executor/anti-viés).

## ▶️ PRÓXIMO: Fase 0 → Fase 1 → Fase 2 → Fase 3 (+ encadeamento das 4 etapas) → Fase 4.
