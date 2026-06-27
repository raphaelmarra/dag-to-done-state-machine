# State Machine in Node.js — DAG-to-Done

Uma **máquina de estados em Node.js puro**, acionada por CLI, que serve de **trilho** para um
agente LLM (Claude Code) conduzir uma feature de software por **13 etapas** não-puláveis — do
mapeamento de dependências até a entrega verificada em produção.

O diferencial não é controlar a ordem das fases. É controlar a **qualidade do que circula entre
elas**: cada etapa gera um documento estruturado (briefing automático, critério de aceitação
verificável, output de formato conhecido) que alimenta a próxima.

> **Modelo central:** o agente LLM **dirige** as transições (roda os comandos); o motor em Node
> é o **juiz intransigente** que valida cada entrega e bloqueia o avanço fora do critério. O
> enforcement vive no código, não no bom comportamento do agente.

---

## Como funciona

```
operador: "faça o dag-to-done da feature X"
   ↓
agente (Claude Code) roda:  node dag.mjs next <feature>
   ↓
MOTOR (dag.mjs)  → lê o estado + carrega o CORE da etapa → escreve o briefing num arquivo
   ↓
agente lê o briefing → executa a etapa (sozinho OU delegando a um subagente especializado)
   → escreve o output JSON no caminho de convenção
   ↓
agente roda:  node dag.mjs advance <feature>
   ↓
MOTOR  → valida o output contra o schema/critério da etapa
   ├── passa  → registra, avança para a próxima etapa
   └── falha  → BLOQUEIA, diz o que faltou (não deixa pular nem regredir)
```

- **Motor genérico:** `dag.mjs` não conhece nenhuma etapa — só lê `pipeline.config.mjs`. Zero
  dependências externas.
- **Contrato por arquivo:** o handoff entre o motor, o agente e os subagentes é por arquivos no
  disco (robusto, auditável, e funciona com a delegação a subagentes do Claude Code).
- **O LLM é externo ao motor:** o Node faz a máquina de estados; o LLM faz o trabalho cognitivo.

## As 13 etapas

DAG (mapa de correlações) → Descoberta da API → GAP → Design → Mapa de dependências →
Implementação → Gate A (revisão) → Acessibilidade → Gate B (verificação ao vivo) →
Aprovação humana → Done → Smoke pós-deploy → Retrospectiva.

Detalhe de cada uma (agente, entregável, critério): [`docs/PIPELINE.md`](docs/PIPELINE.md).

## Padrão técnico: Meta-Prompt + Structured Handoff

Cada etapa tem um **CORE** — um conjunto de regras invariantes que um LLM aplica para gerar o
briefing contextual daquela etapa. O CORE é o meta-prompt; o output schema é o contrato de
retorno. Validado em produção pela Anthropic (+90,2% vs. agente único). Detalhes em
[`docs/PADRAO-BRIEFING.md`](docs/PADRAO-BRIEFING.md).

---

## Rodando o MVP

```bash
cd MVP
npm test                          # e2e das 13 etapas (node --test) — 5/5 verde

node dag.mjs init minha-feature --entry "X" --desc "..." --root "/caminho/projeto"
node dag.mjs next minha-feature   # gera o briefing da etapa atual
# ... produza o output e escreva no caminho indicado ...
node dag.mjs advance minha-feature  # valida e avança (ou bloqueia)
node dag.mjs status minha-feature
```

## Estrutura do repositório

```
README.md              ← este arquivo
CLAUDE.md              ← contexto para o agente (papel, regras, metodologias) — fino, aponta p/ docs
CHANGELOG.md           ← mudanças por marco

docs/
  INDEX.md             ← a bússola: onde está cada conhecimento
  ROADMAP.md           ← estado real: motor + 13 etapas, status e DoD
  SOURCES.md           ← conhecimento em repos externos (ravi-console)
  PIPELINE.md          ← as 13 etapas em detalhe
  CORE.md / CORE-DAG.md / PADRAO-BRIEFING.md  ← o padrão de geração de briefing
  adr/                 ← 19 decisões de arquitetura (formato MADR, imutáveis)
  ABERTO.md / DESCARTADO.md / REFERENCIAS.md
  _WIP-*.md            ← rascunhos da trilha de design (método bottom-up)

MVP/                   ← a state machine funcional (Walking Skeleton)
  dag.mjs              ← o MOTOR (genérico, Node puro, zero deps)
  pipeline.config.mjs  ← as 13 etapas (o "cartucho")
  test/e2e.test.mjs    ← teste e2e das 13 etapas
  cores-aba-clis/      ← COREs específicos da feature de teste (aba CLIs)
  evidencia-teste-aba-clis/  ← documentos REAIS gerados no teste end-to-end

benchmarks/            ← validações isoladas (schema estrito vs. camadas)
```

## Estado do projeto

- ✅ **Motor (MVP)** funcional e testado — e2e 5/5; porteiro auditado; handoff com subagente real provado.
- ✅ **Teste real** conduzido contra a feature "aba CLIs" do ravi-console, com verificação ao
  vivo da API. Ver [resultado abaixo](#resultado-do-teste-real) e
  [`MVP/evidencia-teste-aba-clis/`](MVP/evidencia-teste-aba-clis/).
- 🟡 **Conteúdo:** os COREs das etapas são específicos do caso de teste; a generalização (um CORE
  reutilizável por etapa) é o próximo passo. Ver [`docs/ROADMAP.md`](docs/ROADMAP.md).

### Resultado do teste real

Rodamos a feature **"aba CLIs"** do ravi-console pelo pipeline, com delegação a subagentes
especializados e verificação ao vivo contra a API de produção. Resumo:

| Etapa | Resultado real |
|-------|----------------|
| DAG | 22 nós, 26 arestas, 7 gaps — mapa real da feature |
| Descoberta | **4 endpoints confirmados ao vivo** — revelou que `commands/show` usa param `name`, `commands/list` exige `limit` como string, `commands/run` **não executa** (só renderiza prompt) |
| GAP | bugs reais com arquivo:linha (`args` enviado como objeto, mas a API exige array posicional) |
| Design | 12 critérios Given/When/Then, 6 riscos pre-mortem, 9 estados, 4 ADRs |
| Mapa de dependências | 5 unidades, ordem, paralelismo seguro |
| Implementação | plano de 8 mudanças ancoradas nos achados (sem alterar o ravi) |
| Gate A | **REPROVA** — achou buracos reais (delete sem confirmação, concorrência); o motor **bloqueou** o avanço |

**A feature parou corretamente no Gate A** — o porteiro recusou avançar uma revisão reprovada.
Sem "done" falso. Isso provou que o sistema tem integridade: documentos reais e valiosos em
cada etapa, e enforcement de verdade. Detalhes: [`MVP/evidencia-teste-aba-clis/README.md`](MVP/evidencia-teste-aba-clis/README.md).
