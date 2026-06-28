# _WIP — Construção da Etapa 2 (Descoberta da API)

> Registro da rotina 0→4 da etapa 2. Status: em execução (autônoma). Pesquisas em `research/01-04`.

## FASE 0 — Vereditos das mudanças candidatas

O que a etapa 2 HERDA da etapa 1 (mecanismo pronto no `v1/`) vs. o que é PRÓPRIO dela.

### Herdado (mecanismo do motor — só declarar o dado da etapa 2)
- Substituição de placeholder, validação estrutural recursiva, gerador de prosa do schema, bloqueio de
  pré-condição, estado curado por etapa. **Tudo reusável** — a etapa 2 declara seus dados, não constrói motor.

### Próprio da etapa 2 (decisões de design, com veredito)

| # | Mudança | Veredito | Fonte |
|---|---------|----------|-------|
| D-A | **Executor = `fiscal`** (toca a rede — oposto do Explore) | ACEITA, mas VALIDAR como validamos o Explore | PIPELINE.md; P3 |
| D-B | **Enum de confiança próprio:** `confirmado ao vivo / inferido do código / não verificado` | ACEITA | PIPELINE.md; P2 |
| D-C | **Porteiro REBAIXA "confirmado"→"inferido" sem evidência ao vivo anexada** | ACEITA (estrutural) — o achado-chave da P2 | P2 (SLSA/in-toto/overconfidence) |
| D-D | **Evidência ao vivo OBRIGATÓRIA por endpoint confirmado** (campo `evidencia_ao_vivo`) | ACEITA | P2; caso real |
| D-E | **Divergência doc↔realidade é entregável de 1ª classe** (campo próprio, não nota) | ACEITA | P1 |
| D-F | **Segurança estrutural:** o fiscal sonda só com acesso read-only; "ambíguo = mutação até prova" | ACEITA (princípio no CORE) | P3 (caso PocketOS/Railway) |
| D-G | **Protocolo de sondagem de fronteiras** (Equiv. Partition + Boundary Value, 9 sondas) | ACEITA (vira instrução no CORE) | P4 |
| D-H | **Pré-condição: exige o output do DAG** (quais endpoints importam) | ACEITA | PIPELINE.md; P1 (stateful) |
| D-I | **Bidimensionalizar confiança** (fonte × evidência, estilo Admiralty) | REJEITA por ora → ABERTO até 2º caso (M4) | P2 |

**Portão 0:** cada mudança tem veredito + fonte. As ACEITAS estruturais (D-C, D-D, D-F) são o coração:
a honestidade é imposta pelo PORTEIRO e pela CAPACIDADE, não pela boa-fé do agente — convergente com a
etapa 1 (executor read-only por construção).

---

## FASE 1 — Padrão-ouro (caso real + cego, fundidos)

**Caso real:** `MVP/evidencia-teste-aba-clis/descoberta.output.json`.
**Cego:** um Explore destilou o racional do caso sem ver CORE/pesquisas. **Fusão abaixo.**

### O que o CEGO destilou (princípios frescos, não-enviesados)
1. **Evidência sobre suposição** — todo fato vem com *como foi descoberto*.
2. **Parâmetros com traço crítico** — não "name: string", mas "OBRIGATÓRIO", "tipo real é string NÃO number", "rejeitado quando enviado como X".
3. **Shape + Bordas** — o esquema da resposta E o que foge do óbvio (duplicação, coexistência, normalização).
4. **Falhas são DADOS** — cada `ValidationError` testado é uma regra que define o perímetro.
5. **Testar casos extremos pequenos** — `{}`, mínimo, tipo errado — expõem regras rápido e são citáveis.
6. **Mapear ambiguidades** — dois nomes p/ a mesma coisa, ou nome que engana (run não executa) → resolver com evidência.
7. **Relatar lado-a-lado** — mesmo campo em vários endpoints; normalização camelCase↔kebab.
8. **Incerteza marcada honestamente** — "inferido do código" / "não determinado", nunca especular.

> Frase do cego que captura a etapa: *"uma boa descoberta é uma foto de Raio-X da realidade
> operacional, não um resumo de docs"*.

### O que EU estruturo (o que o motor/porteiro exige e o cego não formalizou)
- **Confiança por campo como ENUM fechado** (não prosa) — para o porteiro validar mecanicamente.
- **`evidencia_ao_vivo` como campo obrigatório** quando confiança = "confirmado" — e o porteiro REBAIXA
  para "inferido" se faltar (D-C, achado da P2). O cego viu que a evidência existe; eu a torno *exigível*.
- **Divergência doc↔realidade como campo próprio** (D-E) — o cego listou as surpresas; eu as elevo a entregável.
- **Schema estrutural** (reusa o validador da etapa 1): endpoints como lista-de-objetos com forma fixa.

### Fusão = padrão-ouro da etapa 2 (o alvo do CORE-DISCOVERY)
Cada endpoint descoberto carrega: `endpoint` (método+rota) · `params` {nome, tipo_real, obrigatorio,
default, traço_crítico} · `shape_resposta` · `limites` · `bordas` · `divergencias_doc_vs_real` ·
`confianca` (enum) · `evidencia_ao_vivo` (obrigatória se confirmado). Mais: uma seção de `nao_verificado`
com justificativa (critério: zero não-verificado sem motivo).

### Racional destilado (invariante vs. variável — M3)
- **Invariante (vira regra do CORE):** evidência-sobre-suposição; falhas-são-dados; confiança estrutural
  rebaixável; divergência doc↔real como entregável; sondagem segura (read-only por construção);
  protocolo de fronteiras (Equiv.Partition + Boundary).
- **Variável (lido da demanda):** quais endpoints (vêm do DAG), os params concretos, os shapes, as
  bordas específicas — tudo descoberto ao vivo, não fixado no CORE.

> ✅ Fase 1 concluída.

---

## FASE 2 — CORE-DISCOVERY escrito ✅
`etapa-2-descoberta/CORE-DISCOVERY.md` (v1.0-draft). Estrutura espelha o CORE-DAG (que funcionou):
6 seções (capacidade do executor, evidência/confiança, sondagem segura, fronteiras/bordas, leitura da
demanda, 4 partes do briefing) + placeholders que o motor já injeta (`{executor_*}`, `{confianca_enum}`,
`{schema_prosa}`, `{next_stage}`) + regra-mestra em sanduíche. Incorpora os 4 achados de pesquisa
(D-C confiança rebaixável, D-E divergência entregável, D-F segurança estrutural, D-G protocolo de fronteiras).

## FASE 3 — TESTE REAL AO VIVO ✅ (2026-06-28) — SUCESSO
**Etapa 2 plugada no `v1/`:** etapa `descoberta` ganhou `executor` (fiscal), `precondicoes`
(+dag_output), `estadoCurado`, `schemaEstrutural` (Ficha de API) e `corePath` → `cores/CORE-DISCOVERY.md`.
O `aceita()` aplica a regra estrutural P2: **reprova "confirmado ao vivo" sem `evidencia_ao_vivo`**.

**Teste de generalidade AO VIVO (o mesmo sistema da etapa 1, agora tocando a rede):**
1. Motor gerou o briefing da etapa 2 (256 linhas; enum injetado; `{schema_prosa}` gerado da fonte única; placeholders resolvidos).
2. Um agente **fiscal CEGO** (só o briefing, sem CORE/pesquisas) executou **chamando a API real** do
   ravi (`ravi-console.tail40b2ad.ts.net:3000/api/ravi`, read-only) — 13 sondas, invariante de estado verificado (antes==depois, zero mutação).
3. **Resultado:** 2 endpoints confirmados ao vivo (list, show — cadeia stateful), 6 falhas registradas
   como dados (400 vs 500 distintos), **3 surpresas reais** (items≡commands duplicados; clamp silencioso
   limit→500; dois regimes de erro), e **uma DIVERGÊNCIA de 1ª classe DAG↔realidade** (o DAG de teste
   dizia que contact-tag-picker consome commands/list — FALSO; consome tags/list). Exatamente o tipo de
   achado que só a verificação ao vivo revela.
4. **O porteiro APROVOU** e avançou para a etapa 3 (gap). Confirmado: ambos "confirmado ao vivo" têm
   evidência anexada → a regra estrutural funcionou.

**Veredito:** o CORE-DISCOVERY e o motor da etapa 2 funcionam ao vivo, ponta a ponta. Mesma prova que
validou a etapa 1, agora com a dificuldade extra de tocar uma API real com segurança. Suíte v1 40/40
(2 testes da etapa 1 reapontados de `descoberta`→`gap`, que agora é a etapa-placeholder de referência).

## ANTI-VIÉS SATURADO (3 verificadores) — achou 4 problemas reais, TODOS corrigidos
O teste ao vivo provou o caminho feliz, mas os verificadores acharam que o porteiro era teatral em
pontos críticos. Convergência dos 3 (code-reviewer + auditor-v2 + backend-architect):
- 🔴 **BUG 1** — `evidencia_ao_vivo: {}` (objeto vazio) furava a regra-mestra (`!ep.evidencia` só pega
  falsy). **Corrigido:** `evidenciaVazia()` pega {}, [], "  ", número. Testado (4 formas vazias).
- 🔴 **BUG 2** — `dag_output` era inalcançável no fluxo real (`next` da descoberta sempre bloquearia;
  o e2e mascarava por usar `advance` direto). **Corrigido:** o motor PROMOVE `<etapa>_output` para o
  estado ao aprovar (genérico, M1). Testado.
- 🔴 **SCHEMA RASO** — o porteiro não exigia `limites`/`bordas`/`divergencias`/`params` ricos que o
  CORE promete (a divergência schema↔prosa F3 que a etapa 1 matou, reintroduzida). **Corrigido:**
  params vira lista-de-objetos {nome,tipo,obrigatorio}; +limites/bordas/divergencias/nao_verificado.
  CORE Seção 6 atualizado para casar. Testado (params malformado e falta de limites reprovam).
- 🟡 **SEM TESTE PRÓPRIO** — **Corrigido:** `discovery.test.mjs` (13 casos) + sync-test do CORE.

**Tese confirmada com números (backend-architect):** etapa 2 custou ~50 linhas config + 0 de motor,
vs etapa 1 que construiu ~155 de infra. "O custo marginal caiu de 'construir o motor' para 'declarar
um objeto'." A aposta do piloto está quantificada.

**Suíte v1: 51/51.** Veredito pós-correção: design sólido, regra estrutural agora REAL (não teatral).

## FASE 4 — cristalizar (a seguir)
ADR(s) da etapa 2; ROADMAP 2/13; governança. CORE-DISCOVERY sai de draft.

## FASE 4 — pendente
Cristalizar: CORE oficial + ADR(s) da etapa 2 + governança + atualizar ROADMAP (2/13).

> Estado: Fases 0,1,2 ✅ (pesquisa + design). Fases 3,4 (plugar no motor + cristalizar) a seguir.
