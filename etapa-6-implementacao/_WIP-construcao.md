# _WIP — Construção da Etapa 6 (Implementação)

> Rotina 0→4. **Status: ✅ RETIRED — etapa cristalizada (ADR 0027) em 2026-06-29.** CORE-IMPL v1.0, suíte
> 139/139, encadeamento de 6 etapas verde, motor estendido (resolve A014). Anti-viés fechou: W2 (varredura
> recursiva), W1 (filtro de namespace), vermelho→evidência, nota no schema, freeze como cópia rasa; dívida
> A016 registrada. Mantido como registro histórico. Pesquisas: estado-da-arte 2026 (plan-vs-apply, agente-juiz,
> SWE-bench, em `research/01`). 2 casos: `MVP/.../implementacao.output.json` (LISTA) + `research/02` (MUTACAO).
> Decisão de fundação: ABERTO **A015** (resolvida).

A etapa 6 é a **1ª que toca CÓDIGO**. Diferente das 5 anteriores (produzem conhecimento-JSON validado por
forma), o critério oficial fala em `tsc/vitest verdes` — coisas que só se sabe RODANDO. Mas o porteiro valida
forma de JSON. A pesquisa resolveu a tensão: **o agente jamais é juiz do próprio trabalho** (reward hacking +
ICSE 2026: 28,6% dos patches que passam estão errados) → a etapa 6 **DECLARA com prova**, não JULGA.

---

## DECISÃO DE ARQUITETURA (A015) — executor APLICA + declara prontidão com prova

**Híbrido (Opção 3 com executor que aplica):**
- O executor (frontend/typescript/fullstack) REALMENTE edita os arquivos e roda os checks no loop para
  auto-corrigir (a maior alavanca de confiabilidade — toda a evidência empírica). Padrão Aider: raciocina
  o plano ancorado, depois emite os edits (separar raciocínio da emissão do diff = SOTA 85%).
- O OUTPUT é um **handoff verificável**: plano de diff por arquivo (cada mudança ancorada num gap/critério/
  risco/ADR/unidade real), golden_path G/W/T, riscos de regressão, MAIS um bloco `prontidao` (cada gate
  declarado; `verde` EXIGE evidência colada — mesmo mecanismo da etapa 2).
- **Divisão sem duplicar:** 6 declara (com prova) · 7 (Gate A) REFUTA o diff (outro agente) · 11 (Done)
  COMPROVA (re-roda, status derivado). Réu nunca é juiz.

---

## FASE 0 — Vereditos das mudanças candidatas

> O que a etapa 6 HERDA do motor (só declarar o dado) vs. o que é NOVO (regra de domínio).

### Herdado (mecanismo do motor — custo ZERO, só declarar)
- **M-A** `executor` como dado consultável (nome/capacidade/confianca_enum) — peça 2 da etapa 1, reusada.
- **M-B** `schema` (presença de campos de topo) + `schemaEstrutural` (forma recursiva) — reusados.
- **M-C** `precondicoes` (as 5 etapas anteriores = mapa pronto) + promoção de `<etapa>_output` — reusados.
- **M-D** `avaliarEtapa` compõe schema + estrutura + `regrasExtras` — reusado intacto.
- **M-E** `regraEvidenciaObrigatoria(lista, id, cond, valor, evid)` — a FÁBRICA da etapa 2/3, reusada
  diretamente para "gate `verde` exige `evidencia`". Zero dialeto novo.

### Novo (regra de domínio da etapa 6 — o que diferencia)
- **I-A** Toda mudança de `arquivos_alterados` tem `ancora` não-vazia (sem mudança órfã). DIREÇÃO: mudança→âncora
  (não o inverso — Explore confirmou que gaps no-go/spike NÃO viram código, então gap→mudança seria falso).
- **I-B** Bloco `prontidao` cobre os 6 gates do critério oficial (cada um declarado, mesmo `nao_aplicavel`
  com motivo) — transporta `tsc/contracts/vitest/integrity/placeholder/hardcode` para a etapa SEM rodá-los.
- **I-C** `golden_path_test` tem `then` observável + lista quais critérios verifica.
- **I-D** (decisão da Fase 1) cruzar âncora↔fonte real (exige estado no porteiro, A014) — OU forma só?

### A decidir na Fase 1 (contra o caso concreto)
- **D-1** Rastreabilidade âncora→fonte: validar que os ids ancorados EXISTEM nos outputs 3/4/5 (estende o
  motor 1× para passar `estado` às regras — resolve A014 junto), ou validar só presença/forma da âncora?
  → A etapa 6 é o 2º caso que A014 previu. Decidir com o padrão-ouro destilado.

---

## FASE 1 — Padrão-ouro (em andamento)

- [x] Racional invariante destilado do caso real (backend-architect) ✅
- [x] 2º caso cego MUTACAO ("Editar perfil") produzido (typescript-pro) ✅ — REALMENTE escreveu 4 arquivos,
      rodou `tsc --noEmit` (exit 0) + 6 asserções de runtime. Schema generalizou sem deformar.
- [x] Fundir: invariante (regra) vs. variável (demanda) — M3 ✅ (abaixo)
- [x] Decidir D-1 (rastreabilidade âncora↔fonte): **B-restrito CONFIRMADO** ✅

### FUSÃO DOS 2 CASOS (M4 cumprido — 2 arquétipos diferentes, schema estável)

| Dimensão | Caso 1 (aba CLIs) | Caso 2 (editar perfil) | Veredito |
|----------|-------------------|------------------------|----------|
| Arquétipo | LISTA + correção de contrato | MUTACAO + greenfield | schema serve ambos |
| `arquivos_alterados`+âncora | 8 mudanças, todas ancoradas | 4 mudanças, todas ancoradas | INV-1 ✅ |
| gap→mudança | GAP-006 spike não virou código | GAP-105 no-go não virou código | "gap→mudança é FALSO" ✅ |
| `confianca:inferido`+nota | GAP-005 (shape não confirmado) | api.ts (erro 400 não confirmado) | INV-5 ✅ |
| `golden_path` `then` observável | payload array + UI exibe prompt | botão disabled + rollback + erro inline | INV-2 ✅ |
| `riscos` com alvo concreto | app-run-section consome ArgsForm | queryKey da lista /users | INV-3 ✅ |
| **`prontidao`** | (ausente — caso é pré-decisão) | **PRESENTE e estressado** | INV-4 **VALIDADO** ✅ |

**O 2º caso VALIDOU `prontidao` (que era hipótese) e revelou a regra completa:**
- `tsc` → **verde com evidência real** (`exit 0`).
- `check:contracts`/`vitest`/`integrity-check` → **`nao_aplicavel` com motivo** (não existem no projeto-alvo).
  **DESCOBERTA:** `nao_aplicavel` é o caso COMUM, não fuga. A regra "verde exige evidência" tem GÊMEA:
  **`nao_aplicavel` exige motivo** (senão vira a fuga "marco tudo N/A e passo"). Os dois lados impostos.
- `placeholders`/`hardcode` → verde com evidência textual.
- **Confirma a variável "quais gates se aplicam":** vitest foi N/A aqui, seria quente na aba CLIs. O porteiro
  fixa a LISTA de gates a declarar (cobertura), não quais são verde.

### DECISÃO D-1 — B-restrito CONFIRMADO (cruzar âncora↔fonte, só existência do id)
Os 2 casos selam: a rastreabilidade só tem VALOR se o porteiro confere que o id ancorado EXISTE na fonte
(senão "toda mudança tem âncora" vira "toda mudança tem uma string que casa regex" — teatro). O caso 1 já
provou que outputs anteriores divergem da realidade (mapa errou path). **Estende o motor 1×** (passar
`estado` às regras, `dag.mjs:342` já tem o estado) — **resolve A014 junto**, retrocompatível, regra dinâmica
(M1: varre `<array>[].id`). Fonte ausente = `nao_verificavel` (≠ âncora-fantasma = reprova).

### SCHEMA FINAL DA ETAPA 6 (destilado, pronto p/ Fase 2)
```
executor: { nome, capacidade: "aplica o código e roda os checks; entrega handoff com prova", confianca_enum: ["confirmado","inferido"] }
precondicoes: [entry_point, project_root, dag_output, descoberta_output, gap_output, design_output, mapa_dependencias_output]  # as 5 anteriores
schema (presença): [resumo]
schemaEstrutural:
  resumo: obrigatorio
  arquivos_alterados: lista-de-objetos minItens 1 { arquivo*, mudanca*, ancora* (lista-de-strings, ≥1), confianca* (enum confirmado|inferido) }
  golden_path_test: objeto { given*, when*, then*, verifica* (lista-de-strings, ≥1) }
  riscos_de_regressao: lista-de-strings minItens 1
  prontidao: lista-de-objetos minItens 1 { gate*, estado* (enum verde|vermelho|nao_aplicavel), evidencia* }
  no_gos_respeitados: presente (lista-de-strings; [] válido = não havia no-go)
regrasExtras:
  1. regraEvidenciaObrigatoria("prontidao","gate","estado","verde","evidencia")   # verde exige prova (REUSO etapa 2)
  2. regraEvidenciaObrigatoria("prontidao","gate","estado","nao_aplicavel","evidencia")  # N/A exige motivo (a gêmea)
  3. regraCatalogoCoberto("prontidao", CATALOGO_GATES)  # os 6 gates do critério oficial declarados (REUSO etapa 4)
  4. regraConfiancaInferidaComNota  # confianca:inferido exige nota (INV-5) — NOVA ou via fábrica?
  5. regraAncoraRastreavel(estado)  # toda ancora existe nos outputs anteriores (D-1, B-restrito) — NOVA, usa estado
```
**Mudança no motor:** `avaliarEtapa(etapa, output, estado)` + `regra(output, etapa, estado)` + linha 342.
Custo: ~3 linhas, retrocompatível, serve todo o pipeline (resolve A014).

### Racional destilado (do caso real — backend-architect)

**Regra-mestra:** o executor converte unidades→diff ancorado, aplica e roda os gates, e entrega um handoff
com prova colada por gate. Réu nunca é juiz.

**Invariantes (viram regra do porteiro):**
- **INV-1 — Âncora DIRECIONAL (a nuance crítica):**
  - *forte:* toda mudança de `arquivos_alterados` → `ancora` não-vazia e bem-formada (sem mudança órfã).
  - *fraco:* toda unidade do mapa → ENDEREÇADA no plano, mas **no-op justificado é válido** (o caso real:
    U2 virou "nenhuma mudança obrigatória" porque a string 'roda-lo' não existia no arquivo).
  - *FALSO:* "todo gap → mudança" — no-go/spike/P2-incerto NÃO viram código (GAP-006 spike, no_gos). Exigir
    isso reprovaria bom output e premiaria quem implementa no-go.
- **INV-2 — golden_path:** `then` OBSERVÁVEL (efeito checável, não "funciona") + `verifica:[ids]`.
- **INV-3 — riscos de regressão:** cada um aponta vizinho concreto (blast radius) ou incerteza herdada
  (spike/gap), com mitigação. "Pode haver bugs" reprova.
- **INV-4 — `prontidao` (PROJETADO, não validado no caso real):** todo gate canônico declarado ∈
  {verde,vermelho,nao_aplicavel}; `verde`→evidência colada; `nao_aplicavel`→motivo. Gate verde sem prova =
  réu-vira-juiz = reprova. ⚠️ **M4: ainda não visto em output real — validar no 2º caso antes de cristalizar.**
- **INV-5 — confiança:** toda mudança declara `confianca`; `inferido`→`nota` (caso real: GAP-005 inferido+nota).

**Variáveis (a demanda dá; o CORE jamais fixa):** paths, ids (o porteiro conhece o REGEX `GAP-\d+` etc., não
os valores), nº de mudanças, **quais gates se aplicam** (UI→vitest/tsc; schema→migração; Python→pytest/mypy),
stack/linguagem, conteúdo do `then`, perfil do executor.

**Limite epistêmico (o porteiro NÃO valida — vai p/ Gate A/Done):** (1) compila de verdade; (2) a evidência
colada é autêntica/não-fabricada (coração do anti-viés); (3) a mudança é semanticamente correta; (4) a âncora
é PERTINENTE (só que EXISTE, ver D-1); (5) o blast radius está completo; (6) o no-op é real. Cada seção do
CORE declara seu próprio teto.

### DECISÃO D-1 — Rastreabilidade âncora↔fonte: **B-restrito (recomendado pelo architect)**
Cruzar a âncora com o ESTADO anterior (outputs 3/4/5) só para **EXISTÊNCIA do id** (integridade referencial),
NUNCA pertinência. **Por quê:** o caso real JÁ provou que outputs anteriores divergem da realidade (o mapa
errou o path `ui/`↔`agent/`); confiar cego nos ids repete o erro no campo mais perigoso (a âncora é o alicerce
do anti-viés). Forma-só valida que a âncora *parece* âncora; o cruzamento valida que ela *é* âncora deste
pipeline. Custo: parsing + set-membership determinístico (sem LLM). **Exige mudar a fundação 1×** (passar
`estado` às regras) — resolve A014 junto, e serve TODO o pipeline (design ancora em gap, mapa em design...).
Fonte ausente = 3º estado `nao_verificavel` (≠ âncora-fantasma = reprova). **→ confirmar na fusão dos 2 casos.**

**Mudança no motor (dimensionada, mínima):** `cmdAdvance` JÁ tem o `estado` em mãos no ponto da chamada
(`dag.mjs:342`, usa-o em 347/357/361). A mudança é: `avaliarEtapa(etapa, output)` → `avaliarEtapa(etapa,
output, estado)`; `regra(output, etapa)` → `regra(output, etapa, estado)`; passar `estado` na linha 342.
**Retrocompatível** (as 5 etapas ignoram o 3º arg). **A regra é DINÂMICA (M1):** varre os outputs anteriores
do estado buscando qualquer `lista-de-objetos com campo id`, monta o SET de ids válidos, checa pertinência —
SEM hardcodar "gaps/criterios_aceitacao/adrs/unidades" (todos seguem `<array>[].id`, confirmado no config).
Trocar de projeto/etapa não exige editar a regra.

## FASE 2 — Escrever CORE + declarar etapa ✅ CONCLUÍDA
- [x] Motor estendido (D-1): `avaliarEtapa(etapa,output,estado)` + `regra(output,etapa,estado)` + `dag.mjs:342`.
      Retrocompatível (5 etapas ignoram o 3º arg). **Resolve A014.**
- [x] 5 regras da etapa 6: `regraEvidenciaObrigatoria`×3 (verde→evidência, n/a→motivo, inferido→nota — REUSO
      da fábrica da etapa 2/3, zero dialeto), `regraGatesDeclarados` (6 gates), `regraAncoraRastreavel`
      (B-restrito, dinâmica M1, cruza com estado).
- [x] Etapa `implementacao` declarada (executor que aplica; precondições = 5 anteriores; schemaEstrutural).
- [x] CORE-IMPL.md escrito (4 famílias A/G/R/P + limite epistêmico por seção + 4 partes + checklist) + cópia sincronizada.
- [x] Testes: `implementacao.test.mjs` (17 — inclui âncora-fantasma e nao_verificavel); e2e estendido;
      encadeamento das 6 etapas + prova de fantasma no fluxo real. Referências placeholder migradas → gate_a.
- [x] Suíte **131/131** verde.

## FASE 3 — Testar (3 checagens + anti-viés saturado) — EM ANDAMENTO
- [x] 3 checagens da auditoria-base ✅ (paridade ok; encanamento testado no encadeamento; só regrasExtras declarativo)
- [~] Anti-viés saturado: auditor-v2 ✅ + backend-architect ✅ (SÓLIDO) chegaram; code-reviewer pendente
- [ ] Corrigir achados convergentes

### ACHADOS CONVERGENTES (auditor-v2 + backend-architect) — a corrigir
1. **`nota` ausente do schemaEstrutural** (backend-arch, lente A013): a regra exige `nota` p/ inferido, mas o
   campo não está no schema → não aparece na prosa gerada, o executor não o vê. **FIX:** `nota: {}` no schema
   (padrão `evidencia_ao_vivo` da etapa 2). + **teste de paridade** "todo campo exigido por regra ∈ schema".
2. **Gate `vermelho` sem evidência** (auditor-v2 + backend-arch): inconsistente com verde→evidência, n/a→motivo.
   **FIX:** 4ª `regraEvidenciaObrigatoria("prontidao","gate","estado","vermelho","evidencia")`. Todo estado
   carrega justificativa.
3. **`nao_verificavel` silencioso** (backend-arch): quando `!temFonte`, aprova igual a "verifiquei e ok" → o
   Gate A herda falsa cobertura. **FIX:** deixar rastro (aviso). Mesma classe da A013. → avaliar como registrar
   sem poluir (talvez campo no veredito / log) — ou registrar dívida A016 se exigir mudar o contrato do motor.
4. **`riscos_de_regressao` over-claim no CORE** (auditor-v2): o limite §4 promete "valida ≥1 risco com ALVO",
   mas o porteiro só valida presença de string (alvo é semântico). **FIX:** corrigir o CORE (não o schema):
   limite §4 deve dizer "valida que há ≥1 risco; NÃO que tem alvo/mitigação (semântico → Gate A)".
5. **`Object.freeze(estado)`** na borda de `avaliarEtapa` (backend-arch): fecha mutação acidental do estado
   pelas regras. 1 token. (Fraqueza: estado passado como objeto vivo sem contrato.)

### A DECIDIR com o code-reviewer → DECIDIDO
- **`verifica` (G3) cruzar?** NÃO. O CORE não promete (é jurisdição do Gate B); adicionar seria o porteiro
  invadindo semântica. Mantido como presença de ids.
- **A4 unidade omitida:** NÃO cruzar (no-op silencioso é honestidade do executor; detectar é do Gate A).
  Limite DECLARADO explicitamente no CORE §2.

### ✅ FASE 3 — CONCLUÍDA (anti-viés saturado: 3 verificadores cegos)
**code-reviewer** (24 probes de execução real) achou 2 vazamentos reais na regra de rastreabilidade que os 17
testes não cobriam — o anti-viés se pagou de novo:
- **W2 (perigoso):** varredura rasa desligava `temFonte` se a fonte aninhasse os requisitos → fantasma passava
  em silêncio. **FIX:** `coletarIdsAncoraveis` RECURSIVO (alcança qualquer profundidade).
- **W1:** a varredura coletava `id` de qualquer array → ids espúrios (estados[].id de UI) afrouxavam a regra.
  **FIX:** filtro `RE_ID_ANCORA` (`/^[A-Z]+-?\d+$/`) — só ids no formato de âncora entram. M1 preservado (a
  regra sabe a FORMA de uma âncora, não o nome do campo).
**auditor-v2 + backend-architect** (convergentes):
- Gate `vermelho` sem evidência → 3ª regra-irmã `vermelho→evidencia`.
- `nota` ausente do schema (lente A013) → `nota: {}` + teste de paridade "campo de regra ∈ schema".
- `nao_verificavel` silencioso → A016 (teórico pós-W2; declarado no CORE).
- over-claim do CORE em riscos → limite §4 corrigido.
- `Object.freeze(estado)` → cópia rasa (a 1ª versão congelava o original e quebrou 24 testes — pego na hora).
- A4 unidade omitida → limite §2 do CORE explicitado.
**backend-architect VEREDITO: SÓLIDO.** code-reviewer: ratificado com ressalvas (corrigidas). +8 testes dos
casos perigosos. **Suíte 139/139.**

## FASE 4 — Cristalizar (ADR 0027 + governança) — EM ANDAMENTO

## FASE 4 — Cristalizar (ADR 0027 + governança) (pendente)
