# _WIP — Inventário invariante vs. domínio (Fase 1 da A022)

> **Status:** WIP/Active. Insumo de descoberta da skill replicável (A022). **Origem:** Fase 1 do plano
> `docs/superpowers/plans/2026-06-30-skill-replicavel-state-machines.md`, executada pelo agente
> `task-decomposition-expert` (read-only) em 2026-06-30. Aplica o eixo M3 (invariante vs. variável) ao projeto inteiro.
> **Convenção:** 🟢 invariante (a skill COPIA) · 🔵 variável (a skill ENSINA A DESTILAR) · ⚪ fronteiriço (decisão da
> Fase 3/4). As 9 decisões fronteiriças (F1–F9) são entrada direta da Fase 3.

---

## Critério de classificação

Um elemento é **INVARIANTE** (🟢) se serve a qualquer domínio sem edição: a mecânica não sabe nada sobre
"desenvolvimento web" e funcionaria igualmente num pipeline de vídeo, pesquisa científica ou operações logísticas.
Teste M3 do `CLAUDE.md`: "se trocar de projeto/stack exige editar o elemento, ele é VARIÁVEL; se serve a qualquer
domínio sem edição, é INVARIANTE." Um elemento é **VARIÁVEL** (🔵) se carrega conhecimento do domínio "dev web" — o
conteúdo foi destilado de casos concretos de feature web e precisaria ser redestilado do zero para outro domínio. Um
elemento é **FRONTEIRIÇO** (⚪) quando a mecânica é invariante mas o conteúdo injetado é de domínio, ou quando a
generalidade ainda não foi validada contra um segundo domínio diferente.

---

## Inventário

### MOTOR (dag.mjs)

| Elemento | Onde | Classe | Justificativa | Implicação p/ a skill |
|---|---|---|---|---|
| Verbos CLI (init/next/advance/status) | `dag.mjs:88–398` | 🟢 | Interface de uma SM genérica; não mencionam dev web. | Copia o motor inteiro. |
| Persistência de estado | `dag.mjs:51–70` | 🟢 | JSON genérico, atômico, BOM-tolerante. | Copia. |
| `montarBriefing` | `dag.mjs:248–268` | 🟢 | Monta o briefing em 4 seções espelhando `PADRAO-BRIEFING.md`. | Copia. |
| `substituirPlaceholders` | `dag.mjs:171–185` | 🟢 | Resolve `{chave}` do estado em qualquer CORE. | Copia. |
| `contextoDeSubstituicao` | `dag.mjs:189–224` | 🟢 | Injeta `confianca_enum`/`schema_prosa`/`dossie` derivados do cartucho. | Copia. |
| `resolverCore` (`corePath`) | `dag.mjs:152–159` | 🟢 | Indireção genérica de carregamento. | Copia. |
| `ESTADO_CURADO_DEFAULT` | `dag.mjs:228` | ⚪ | Mecanismo invariante; conteúdo (`entry_point`...) é de domínio. | **F1**. |
| `estaCompleto`/`proximaEtapa`/`etapaPorId` | `dag.mjs:75–77`, `pipeline.config.mjs:1560–1574` | 🟢 | Navegação na lista `PIPELINE`. | Copia. |
| `cmdAdvance` — promoção `<etapa>_output` | `dag.mjs:374–376` | 🟢 | Promove output por padrão de nome, dinâmico. | Copia. |
| `gerarDossieAprovacao` | `pipeline.config.mjs:206–246` | ⚪ | Mecanismo invariante; campos extraídos são de domínio. | **F2**. |

### VALIDADORES do pipeline.config.mjs

| Elemento | Onde | Classe | Justificativa | Implicação |
|---|---|---|---|---|
| `camposPresentes` | 20–26 | 🟢 | Presença de campos, sem domínio. | Copia. |
| `validarForma`+`validarEstrutura` | 57–135 | 🟢 | Motor declarativo de schema; domínio entra via schema da etapa. | Copia. |
| `gerarSchemaProsa` | 162–170 | 🟢 | Prosa a partir do `schemaEstrutural`. | Copia. |
| `avaliarEtapa` | 259–279 | 🟢 | Porteiro genérico (3 camadas). | Copia. |
| `regraCampoIgual` (fábrica) | 298–302 | 🟢 | "Campo X = valor Y". | Copia. |
| `regraEvidenciaObrigatoria` (fábrica) | 823–838 | 🟢 | "Item com condição X exige campo Y não-oco". | Copia a fábrica; operador instancia. |
| `regraCatalogoCoberto` (fábrica) | 335–353 | 🟢 | Cobertura 1-para-1 contra catálogo regex. | Copia a fábrica; catálogo é de domínio. |
| `regraNaoAplicavelComMotivo` (fábrica) | 624–644 | 🟢 | Anti-fuga: N/A exige motivo substantivo. | Copia. |
| `evidenciaVazia`, `escaparRegex` | 283–294 | 🟢 | Utilitários universais. | Copia. |
| `regraCircuitoComportamentoCriterio` | 366–384 | ⚪ | Mecanismo invariante; hardcoda `three_amigos`/`criterios_aceitacao`. | **F3**. |
| `regraResumoCoerente`/`regraResumoDesignCoerente` | 306–315/388–400 | 🟢 | "Resumo não mente sobre a contagem" (universal); nomes de campo são de domínio. | Mecanismo copia; operador reimplementa nomes. |
| `regraComplexidadeCoerente` | 843–865 | 🔵 | Fórmula de peso + bandas destiladas de dev web. | Ensina a destilar. |
| `regraParaleloDisjunto` | 405–433 | 🟢 | Prova de disjunção (conjuntos). | Copia. |
| `regraOrdemTopologica` | 436–463 | 🟢 | Ordenação topológica genérica. | Copia. |
| `regraAncoraRastreavel` | 508–525 | 🟢 | Rastreabilidade dinâmica; convenção de id é do pipeline. | Copia. |
| `regraAngulosSeImpossivel` | 318–329 | ⚪ | Mecanismo invariante; regex PT-BR. | **F5**. |
| `regraGatesDeclarados` + `CATALOGO_GATES` | 470–482 | 🔵 | Gates TSC/vitest/contracts — 100% dev TS/JS. | Ensina a destilar. |
| `regraCatalogoLentesDeclaradas` + `CATALOGO_LENTES` | 534–583 | 🔵 | 21 lentes de UI web; mecanismo de matching é invariante. | Copia mecanismo; destila catálogo. |
| `regraCatalogoWcagDeclarado` + `CATALOGO_WCAG` | 686–724 | 🔵 | Norma WCAG (acessibilidade web). | Copia mecanismo; operador define normas. |
| `regraVeredictoJustificado` | 591–601 | 🟢 | Coerência veredito↔exigências (gate binário). | Copia. |
| `regraVeredictoA11y` | 727–735 | ⚪ | Idêntico ao acima, enums diferentes. | **F4**. |
| `regraDescobertaViraIssue`/`regraViolacaoViraIssue` | 651–664/745–754 | 🟢 | "Descoberto/violado sem issue = buraco". | Copia. |
| `regraIssueAcionavel` | 668–675 | 🟢 | "Issue precisa de local + ação". | Copia. |
| `regraVeredictoGlobalCoerente` | 783–795 | 🟢 | Fail-closed: global segue o pior caso. | Copia. |
| `regraInconclusivoComMotivo` + `MOTIVOS_INCONCLUSIVO` | 762–776 | ⚪ | Mecanismo invariante; motivos de API REST. | **F6**. |
| `regraCriteriosDoDesignCobertos` | 801–818 | ⚪ | Rastreabilidade cruzada invariante; acopla `design_output`. | **F7**. |
| `regraCensoConfrontado` | 876–897 | 🟢 | "Fonte achada não fica sem resolução" (universal). | Copia. |
| `CATALOGO_ESTADOS_UI` | 357–361 | 🔵 | `[vazio, erro, carregando]` — estados de UI. | Ensina a destilar. |

### CARTUCHO — As 13 etapas

| Elemento | Onde | Classe | Justificativa | Implicação |
|---|---|---|---|---|
| Anatomia de uma etapa (id, nome, agente, corePath, schema, schemaEstrutural, regrasExtras, precondicoes, estadoCurado, executor) | estrutura do objeto | 🟢 | Contrato cartucho↔motor; nenhum campo conhece dev web. | Copia o contrato como template vazio. |
| As 13 etapas concretas | `1494–1556` e demais | 🔵 | A sequência (Acessibilidade WCAG, Gate A de diff, Implementação frontend...) é de dev web. | Ensina a destilar nº/ordem/tipo de etapas. |
| `ETAPA_CENSO_FONTES` | `1494–1556` | ⚪ | Gênero HITL híbrida é invariante; conteúdo ("fontes de dados") é de domínio. | **F9**. |
| Objetos `executor` (agente + enum confiança) | ex. `907–914` | 🔵 | Explore/fiscal/error-detective... escolhidos p/ dev web. | Ensina a destilar. |
| `schemaEstrutural` de cada etapa | ex. `930–978` | 🔵 | Campos são conceitos de domínio (`nos`, `arestas`, `three_amigos`, `prontidao`...). | Ensina a destilar. |

### PADRÃO DE BRIEFING (PADRAO-BRIEFING.md, CORE.md)

| Elemento | Onde | Classe | Justificativa | Implicação |
|---|---|---|---|---|
| 4 partes do briefing (OBJETIVO/ESCOPO/FORMATO/FRONTEIRAS) | `CORE.md` Seção 1 | 🟢 | Validado por pesquisa (atenção U-shaped). | Copia como template obrigatório. |
| Regras O1-O3/E1-E3/F1-F5/FR1-FR3 | `CORE.md` Seção 2 | 🟢 | Derivadas de pesquisa empírica de LLM. | Copia integralmente. |
| G1–G5 (curar estado, gaps P0/P1/P2, early-exit, profundidade, self-check) | `CORE.md` Seção 3 | 🟢 | Princípios universais; tabela de campos é de domínio. | Copia princípio; operador cura p/ seu domínio. |
| Seção 4 — output schemas por família | `CORE.md` Seção 4 | 🔵 | Schemas JSON são contratos dev web. | Ensina a destilar por família. |
| Seção 5 — protocolos por família | `CORE.md` Seção 5 | 🔵 | Perguntas-guia específicas de dev web. | Ensina a destilar. |
| Hierarquia de prioridade | `CORE.md` 26–35 | 🟢 | Solução ao conflito de instrução (Control Illusion). | Copia. |
| Nomenclatura Meta-Prompt + Structured Handoff | `PADRAO-BRIEFING.md` 59–70 | 🟢 | Nomes da literatura (APE, Supervisor Pattern). | Copia como vocabulário. |
| Seção 6 — checklist do executor | `CORE.md` Seção 6 | 🟢 | Verificações universais. | Copia. |

### ANATOMIA DE ETAPA (18 peças)

Peças 1–10, 12–14, 16–18 → 🟢 invariante (executor, certeza, estado curado, briefing, profundidade, schema, porteiro,
gaps, handoff, bloqueio, pre-mortem, spike, paralelismo, walking skeleton, verificação independente, retry). A skill
copia o catálogo; o operador preenche o conteúdo. Peças 11 (lentes) e 15 (arquétipo) → 🔵 variável (destiladas de tipos
de tela web; o mecanismo de lentes é invariante, as lentes concretas não).

### SISTEMA DE GOVERNANÇA — todo 🟢 invariante

M1–M4, padrão ADR (MADR), ciclo Draft→Active/Retired, `ABERTO.md`/`DESCARTADO.md`, `ANATOMIA-DE-ETAPA.md` como
catálogo, `METODOLOGIA-CORE.md` como método de destilação. A skill copia integralmente o ritual.

### COREs CONCRETOS (v1/cores/CORE-*.md)

A **estrutura interna** de qualquer CORE (regra-mestra no topo e no fim, seção de executor com placeholders, famílias
de regras, leitura dinâmica da demanda, schema de output) → 🟢 invariante (template copiável). Os placeholders
`{executor_nome}`/`{confianca_enum}`/`{schema_prosa}` → 🟢 (infra do padrão). O **conteúdo** de cada CORE (CORE-DAG,
CORE-GAP, CORE-DESIGN, CORE-IMPL, CORE-MAPA, CORE-DISCOVERY, CORE-A11Y, CORE-GATEB) → 🔵 variável. O CORE-GATEA →
⚪ fronteiriço (**F8**: o enquadramento adversarial é invariante; só o catálogo de lentes é variável).

---

## Fronteiriços (⚪) — as decisões que a Fase 3/4 precisa tomar

- **F1 — `ESTADO_CURADO_DEFAULT`:** default vazio `[]` (força cada etapa a declarar) OU documentar como "exemplo dev
  web a substituir"?
- **F2 — `gerarDossieAprovacao`:** tornar configurável (lista declarativa de "o que extrair" passada pela etapa) OU
  documentar que o operador a reescreve? Hoje hardcoda `design_output`/`gate_*_output`/`riscos_premortem`/`fica_para_humano`.
- **F3 — `regraCircuitoComportamentoCriterio`:** extrair como fábrica genérica `regraCircuitoBidirecional(campoA, campoB, idA, idB)`?
- **F4 — `regraVeredictoA11y` vs `regraVeredictoJustificado`:** unificar numa fábrica `regraVeredictoCoerente(enumAprova, enumReprova)` OU conviver com os dois dialetos?
- **F5 — `regraAngulosSeImpossivel`:** regex PT-BR — documentar como "regra de domínio-idioma" OU parametrizar a regex?
- **F6 — `regraInconclusivoComMotivo` + `MOTIVOS_INCONCLUSIVO`:** virar fábrica `regraInconclusivoComMotivo(listaCampo, enumMotivos)` que o operador instancia.
- **F7 — `regraCriteriosDoDesignCobertos`:** extrair como fábrica genérica de rastreabilidade `(estadoCampo, listaCampo, idCampo)`?
- **F8 — CORE-GATEA:** promover (sem o catálogo de lentes) a template invariante de "gate adversarial genérico"?
- **F9 — `ETAPA_CENSO_FONTES`:** separar o template do gênero HITL híbrida do conteúdo de instrução de domínio.

> **Padrão emergente das F1–F9:** quase todas são a MESMA decisão — "esta peça é uma fábrica genérica esperando ser
> extraída, ou conteúdo de domínio?". A Fase 3 decide a política geral; a Fase 4 aplica. Várias (F3, F4, F6, F7) são
> oportunidades de tornar o motor MAIS genérico de graça — alinhado à M-T3 (extensão fundacional amortizável) da Fase 0.

---

## Conclusão: a fronteira copia-vs-destila

A linha divisória é precisa: **o motor (`dag.mjs`) é 100% copiável**; **o sistema de validação genérico** (as fábricas
`camposPresentes`, `validarForma`, `avaliarEtapa`, `regraCampoIgual`, `regraEvidenciaObrigatoria`, `regraCatalogoCoberto`,
`regraNaoAplicavelComMotivo`, `regraParaleloDisjunto`, `regraOrdemTopologica`, `regraAncoraRastreavel`,
`regraDescobertaViraIssue`, `regraIssueAcionavel`, `regraVeredictoGlobalCoerente`, `regraCensoConfrontado` e vizinhas)
também é copiável; **o padrão de briefing** (4 partes + regras O/E/F/FR + G1–G5) é copiável; **a anatomia de etapa**
(as 18 peças) é copiável; e **a governança** (M1–M4, ADRs MADR, ciclo WIP, ABERTO/DESCARTADO) é copiável. O que a skill
**ensina a destilar do zero** é o **cartucho**: as etapas concretas (quantas, em que ordem, com qual agente-executor),
os schemas de saída de cada etapa, os COREs concretos com seu vocabulário e regras de domínio, e os catálogos de
conteúdo (`CATALOGO_GATES`, `CATALOGO_LENTES`, `CATALOGO_WCAG`, `CATALOGO_ESTADOS_UI`, `MOTIVOS_INCONCLUSIVO`). Em uma
frase: **o operador de um novo domínio recebe motor + validador + padrão de briefing + anatomia + governança prontos, e
destila do zero apenas o cartucho** — o que é, quem faz, como se verifica, e o que cada etapa produz no seu domínio.