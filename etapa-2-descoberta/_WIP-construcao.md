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

## FASE 3 — pendente (próxima sessão / continuação)
Plugar a etapa 2 no `v1/pipeline.config.mjs` declarando seus dados (executor `fiscal`, enum próprio,
`schemaEstrutural` da ficha de API, `precondicoes` incl. dag_output, `estadoCurado`), copiar o CORE para
`v1/cores/`, e TESTAR (cego executa o briefing gerado; regressão; adversarial). Esta fase MUDA o motor
(nova etapa real) → rende muitas rodadas de anti-viés saturado, como a etapa 1.

## FASE 4 — pendente
Cristalizar: CORE oficial + ADR(s) da etapa 2 + governança + atualizar ROADMAP (2/13).

> Estado: Fases 0,1,2 ✅ (pesquisa + design). Fases 3,4 (plugar no motor + cristalizar) a seguir.
