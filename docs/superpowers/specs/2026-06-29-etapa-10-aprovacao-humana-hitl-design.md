# Design — Etapa 10 (Aprovação humana / HITL) — KISS

> **Status: RETIRED — cristalizado no ADR 0031 (2026-06-29).** As 3 peças foram implementadas (TDD + verificador
> cego), encadeamento das 10 etapas testado, suíte 227/227. Mantido como histórico do design. O racional vive no
> ADR 0031 e no core da etapa 10 (pipeline.config.mjs). Dívida aberta: A019 (garantia processual).
>
> Status histórico: aprovado (2026-06-29). Próximo: tracker no PLANO-DE-ETAPA → implementação peça-por-peça (TDD + anti-viés cego).
> Etapa 10 do pipeline DAG-to-Done. É a 1ª etapa de gênero NÃO-CORE (executor = humano, não agente LLM).

## Contexto e princípio

A etapa 10 é o último checkpoint humano antes do deploy (10 → 11 Done → 12 Smoke/produção). A pesquisa de
HITL 2026 dá dois princípios que governam o design:

1. **Gate formal pesado é over-engineering aqui** (tamper_hash, frase-segredo, cripto) — "não pique um tipo de
   gate e aplique a todo ponto; vira fila/fadiga". Fluxos conversacionais usam o padrão mais simples: o agente
   apresenta um resumo e espera um ok humano.
2. **MAS: aprovação antes de side-effect irreversível é inviolável** — "approvals must happen before side
   effects, not after, senão é retrospective review, não HITL". O deploy (etapa 12) é esse side-effect.

**Decisão (operador): KISS-com-fala-humana.** Sem cerimônia, sem cripto. O agente mostra um dossiê curto e
ESPERA uma fala humana de ok na conversa ("tá bom" basta); só então roda o advance. A diferença entre isto e
"o agente aprova sozinho" é uma linha de instrução (não fabricar a fala — esperá-la), e é o que mantém o H do
HITL antes do deploy. **A garantia é PROCESSUAL e declarada honesta** (irmã de A018): num pipeline dirigido por
agente, o motor não prova criptograficamente que um humano aprovou.

Fontes: [Awesome Agentic Patterns — HITL Approval](https://agentic-patterns.com/patterns/human-in-loop-approval-framework/) ·
[AI Agent Approval Gates (cordum.io)](https://cordum.io/blog/approvals-for-autonomous-workflows) ·
[n8n — Production AI Playbook: Human Oversight](https://blog.n8n.io/production-ai-playbook-human-oversight/).

## Natureza: mecanismo de motor leve, sem CORE-para-LLM

Sem agente executor → sem CORE meta-prompt. O motor faz o mínimo:
- **`dag next`** gera um **dossiê curto** derivado do estado das 9 etapas (não briefing-para-LLM), via novo
  placeholder `{dossie_aprovacao}`.
- **`dag advance`** registra a aprovação com output mínimo (`aprovado_por` + `decisao`).

O PLANO-DE-ETAPA e a METODOLOGIA-CORE foram feitos para destilar um CORE; aqui se aplicam ADAPTADOS — as
"peças" são os componentes do mecanismo (dossiê/schema/porteiro), não regras de geração de briefing. O método
(evidência + teste + anti-viés cego) vale igual; o objeto muda.

## Componentes

### (a) Gerador de dossiê
Função em `pipeline.config.mjs` (à la `gerarSchemaProsa`), injetada no `next` via `{dossie_aprovacao}`. Deriva
do estado, sem rede:
- **Resumo do construído** — do `design_output` (o que a feature faz).
- **Veredito de cada gate** — `gate_a_output.veredito`, `gate_b_output.veredito`, `acessibilidade_output.veredito`.
- **O que ficou fora (honestidade)** — `gate_b_output.fica_para_humano` + riscos do pre-mortem
  (`design_output.riscos_premortem`) + o limite A018 (o Gate B não autentica a evidência ao vivo).

### (b) Schema do output (mínimo)
```
schema: ["aprovado_por", "decisao"]
schemaEstrutural:
  aprovado_por: { obrigatorio: true, tipo: "string" }      // nome do humano
  decisao:      { obrigatorio: true, enum: ["aprovado", "rejeitado"] }
  observacao:   { presente: true, tipo: "string" }          // opcional — o que o humano disse/pediu
```

### (c) Porteiro (2 regras, ambas reúso)
- `aprovado_por` não-oco → reúso de `regraNaoAplicavelComMotivo`/anti-oco.
- **Fail-closed binário** (igual Gate B): só `decisao === "aprovado"` avança; `rejeitado` é válido mas BLOQUEIA
  e volta à etapa 6 → reúso de `regraCampoIgual("decisao", "aprovado", ...)`.

**Custo no motor:** 1 ramo novo no `contextoDeSubstituicao` (injetar `{dossie_aprovacao}`, como `{schema_prosa}`
já faz). ZERO mecanismo de validação novo — as 2 regras são clones.

## Execução — peça por peça (PLANO-DE-ETAPA, adaptado a etapa sem CORE)

| Ordem | Peça | Esforço | DoD chave | Depende de |
|-------|------|---------|-----------|------------|
| 1 | **Schema + porteiro fail-closed** (`aprovado_por`+`decisao`; só `aprovado` avança; `rejeitado` bloqueia→etapa 6) | **T** | Clones de `regraCampoIgual`/anti-oco. Teste: `rejeitado` bloqueia, `aprovado` avança, campos ocos reprovam. Anti-viés cego. | — |
| 2 | **Gerador de dossiê** (resumo+gates+o-que-ficou-fora do estado; injeta `{dossie_aprovacao}`) | **M** | 1 ramo no `contextoDeSubstituicao`. Teste: o dossiê contém os 3 vereditos reais + os limites; não vaza `[object Object]`. Anti-viés cego. | peça 1 |
| 3 | **Instrução de fluxo HITL** (o agente mostra o dossiê e ESPERA a fala humana antes do advance; não fabrica) | **T** | Pura redação (no dossiê/FRONTEIRAS), sem efeito em código → DoD declara isso. Garantia processual; limite vira **A019**. | peça 2 |

**Cada peça:** implementa → TDD (teste falha antes) → verificador cego independente ratifica → governança.

**Marco "etapa 10 pronta":** as 3 peças ✅ pela Definition of Done, encadeamento das 10 etapas testado, **ADR
0031** cristaliza.

**Dívida nova:** A019 (a garantia da aprovação é processual, não criptográfica — irmã de A018).
