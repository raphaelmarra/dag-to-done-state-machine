# [WIP] DAG concreto do CRM — briefing perfeito PREENCHIDO (passo 1)

> Status: ARTEFATO CONCRETO. Resultado de executar o briefing v2 contra o código real
> do ravi-console (CRM), via Explore. Insumo para a destilação do CORE-DAG (passo 2-3).
> Não é decisão. Gerado nesta sessão.

## Observações de validação (o que o exercício provou sobre a fundação)

1. **Grafo saiu acíclico de verdade** — toda aresta consumidor→provedor; backward só na
   seção "Blast radius" (calculado), nenhuma aresta de volta. A fundação funcionou na prática.
2. **Custo híbrido funcionou** — 🟢/🟡/🔴 inferidos do código (param de filtro visível) +
   3 gaps "a-confirmar pela Descoberta" para o que é runtime. Exatamente o desenhado.
3. **Vazamento de fronteira detectado** — o Explore listou G7 (refatoração de duplicação
   ReadTags) como gap. Isso é gap de IMPLEMENTAÇÃO, não do DAG. → o CORE precisa de fronteira
   mais firme: "duplicação de código / refatoração NÃO é gap do DAG".
4. **Nós-folha bem identificados** — endpoints e funções puras como folhas; parou em 1 hop
   para fora (CRM → Session/Agent/Tag/Pipeline). Fronteira respeitada.
5. **Funções puras marcadas custo "n/a"** — bom: nem toda aresta tem custo reverso (funções
   de biblioteca não se "consultam de volta"). O CORE deve prever custo "n/a (pura)".

---

## DAG CONCRETO (resultado do Explore)

### Nós (45) — superfícies-UI, funções-API, funções-biblioteca, estado-browser

**Superfícies-UI (o que o operador toca):**
- OpportunityDetail (src/components/crm/opportunity-detail.tsx) — card da opp, 6 abas
- ContactTagPicker (contact-tag-picker.tsx) — picker de tags, ~356 defs, ~48 famílias
- FactList (_shared/facts.tsx) — propor/confirmar/rejeitar fato
- NoteComposer + NoteTimeline (_shared/notes.tsx) — escrever/ler nota
- ContactActivityTab (contact-activity.tsx) — log de eventos, paginação manual
- NamespacedTags (_shared/namespaced-tags.tsx) — chips por namespace
- CreateOpportunityWizard (create-opportunity-wizard.tsx)
- MergeContactsDialog (merge-contacts-dialog.tsx)

**Funções-API (provedores):**
- crm/opportunity/{show, move, contacts, link-contact, create}
- crm/fact/{list, confirm, reject, propose}
- contacts/{get, tag, untag, timeline, note, duplicates, merge}
- chats/list · tags/{list, create}

**Funções-biblioteca (puras, custo n/a):**
- contacts.ts: contactFriendlyName, contactInitials, contactLifecycle, contactValueTier,
  contactChannels, readTags, tagNamespace, tagValue
- tags.ts: tagFamily, groupTagDefsByFamily, findDriftCandidates
- ravi.ts: asRows

**Estado-browser:**
- useTagsCatalog (TanStack Query, TAGS_CATALOG_KEY)
- invalidateQueries: ["detail","contacts"], ["entity-name","contacts",id]

### Arestas (30) — consumidor → provedor, todas direção única

Custos inferidos do código:
- 🟢 cheap (FK com filtro, 1 hop): crm/opportunity/* · contacts/get · contacts/note ·
  crm/fact/* · chats/list · contacts/tag · contacts/untag · contacts/merge
- 🟡 indireto: contacts/timeline SEM filtro event (timeline completa) · tags/list cursor-walk (catálogo inteiro)
- 🔴 scan: contacts/duplicates (toma {}, retorna todos os pares globalmente, cliente filtra)
- a-confirmar: tags/create (pre-check antes de tag; código não revela volume/semântica)

### Blast radius (grafo reverso, calculado)
- crm/opportunity/show ← OpportunityDetail (único)
- contacts/tag + untag ← ContactTagPicker, OpportunityDetail.ContactTagsTab, ContactTagsSection
- contacts/timeline ← ContactActivityTab, NoteTimeline
- crm/fact/* ← FactList (único consumidor dos 4)
- tags/list ← ContactTagPicker (único, exclusivo)
- transitivo (via invalidateQueries): tag muda → refresh badge lifecycle/valor; nota → refresh activity; create opp → refresh board

### Fronteira do grafo
- nós-folha: todos os endpoints crm/*, contacts/*, chats/*, tags/* + funções-biblioteca
- saídas do CRM (1 hop): CRM → Session, Agent, Contact, Opportunity, Tag, Pipeline

### Gaps (do Explore — com 1 vazamento de fronteira anotado)
- G1 (P1): contacts/duplicates 🔴 — backend faz rank/limite ou lista completa? → Descoberta
- G2 (P1): ContactActivityTab volume de timeline — padrão de volume? → Descoberta
- G3 (P2): tags/create é pré-requisito de contacts/tag ou cria automático? → Descoberta
- G4 (P2): crm/fact/propose confidence é string e não number — por quê? → Descoberta
- G5 (P2): move invalida board — refresh automático ou manual? → Descoberta
- G6 (P1): LIST usa contactChannels (plural) ou contactChannel (singular)? → Descoberta
- ~~G7 (P3): duplicação ReadTags — refatoração C1~~ ← VAZAMENTO: gap de implementação, NÃO é gap do DAG

### Resumo de confiança
- lido no código: 45 nós + 30 arestas
- não encontrado: 0
- custo a confirmar pela Descoberta: 3 (G1, G4, G6 segundo o Explore)
