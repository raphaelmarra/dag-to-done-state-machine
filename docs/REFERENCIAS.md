# Referências

> Metodologias e fontes pesquisadas, e o que aproveitamos de cada uma.

---

## LangGraph (LangChain)

**O que é:** Framework Python para workflows agênticos com State, Nodes e Edges condicionais.
**O que aproveitamos:** O padrão mental — state centralizado por entidade, guardas determinísticas, edges que param (não bypassam) se a condição não passa.
**O que rejeitamos:** A dependência, os loops não gerenciados, o roteamento por LLM, a ausência de failure detection.
**Fonte:** langchain.com/langgraph

---

## Microsoft Conductor

**O que é:** Orquestrador multi-agente com workflows em YAML e roteamento determinístico via templates.
**O que aproveitamos:** A filosofia de roteamento determinístico ("first matching condition wins"). O orquestrador declara o grafo; o LLM não decide o fluxo.
**O que rejeitamos:** O modelo declarativo em YAML (ver X002 em DESCARTADO.md).
**Fonte:** opensource.microsoft.com/blog/2026/05/14/conductor-deterministic-orchestration

---

## XState (Stately)

**O que é:** Biblioteca JS de statecharts formais, zero dependências de runtime relevantes.
**O que aproveitamos:** A confirmação de que state machine por-entidade em Node.js puro é viável e tem precedente (Gatsby usa XState no build).
**O que rejeitamos:** A biblioteca em si (ver X001 em DESCARTADO.md).
**Fonte:** github.com/statelyai/xstate · dev.to/mattpocockuk/what-is-xstate-used-for-38ei

---

## Spike — Extreme Programming (Kent Beck)

**O que aproveitamos:** Tarefa de pesquisa/protótipo com tempo fixo, descartável, cujo output é uma decisão — não código. Entra entre GAP e Design quando há incerteza técnica.
**Fonte:** extremeprogramming.org/rules/spike.html

---

## Walking Skeleton — Alistair Cockburn

**O que aproveitamos:** Implementação mínima end-to-end que valida a arquitetura antes do volume. Opcional entre Mapa de dependências e Implementação para features de risco alto.
**Fonte:** agileambition.com/glossary/walking-skeleton/

---

## Three Amigos — George Dinwiddie / BDD

**O que aproveitamos:** Três perguntas obrigatórias no Design: por quê existe? como funciona? como saberemos que está certo? O resultado alimenta diretamente o Gate B.
**Fonte:** johnfergusonsmart.com/three-amigos-requirements-discovery/

---

## Pre-mortem — Gary Klein (HBR, 2007)

**O que aproveitamos:** Imaginar que a feature já falhou e listar o que deu errado. Melhora identificação de riscos em ~30% (prospective hindsight). Entra obrigatoriamente no Design.
**Fonte:** gary-klein.com/premortem · HBR September 2007

---

## Definition of Ready — Scrum (prática complementar)

**O que aproveitamos:** Checklist que um item precisa cumprir para entrar na Implementação. Formaliza que as etapas 1-5 foram feitas de verdade.
**Fonte:** scrum.org/resources/blog/what-difference-between-definition-done-dod-and-definition-ready-dor

---

## ADR — Architecture Decision Records (Michael Nygard, 2011)

**O que aproveitamos:** Documento curto com Contexto, Decisão e Consequências. Produzido no Design, revisado no Gate A como critério de conformidade.
**Fonte:** cognitect.com/blog/2011/11/15/documenting-architecture-decisions · martinfowler.com/bliki/ArchitectureDecisionRecord.html

---

## Rabbit Holes e No-gos — Shape Up (Ryan Singer / Basecamp)

**O que aproveitamos:** Declarar explicitamente o que está fora de escopo (no-gos) e onde estão os perigos (rabbit holes) no GAP e no Design.
**Fonte:** basecamp.com/shapeup/1.4-chapter-05

---

## DORA — Trunk-Based Development e Small Batch Size

**O que aproveitamos:** Batches menores = Gate A mais rápido e barato, menor taxa de retrabalho. Informou a decisão de fazer a Implementação em unidades do mapa de dependências.
**Fonte:** dora.dev/capabilities/working-in-small-batches/ · dora.dev/capabilities/trunk-based-development/

---

## Microsoft Agent Framework Handoff / Structured Briefing

**O que aproveitamos:** Confirma que gerar o briefing automaticamente do estado do grafo é prática emergente reconhecida. Validou a decisão D002.
**Fonte:** learn.microsoft.com/en-us/agent-framework/workflows/orchestrations/handoff · xtrace.ai/blog/ai-agent-context-handoff
