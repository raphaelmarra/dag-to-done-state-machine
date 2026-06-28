# Briefing Cego: Mapa de Dependências do Domínio CRM

**Data:** 2026-06-28  
**Projeto:** ravi-console  
**Domínio:** CRM (Customer Relationship Management)  
**Metodologia:** Análise estática do código-fonte  

---

## 1. Unidades Componentes do CRM

### Componentes de Interface (UI)

**Core:**
- `opportunity-detail.tsx` — Modal para visualizar e editar oportunidades; 6 abas (overview, tags, fatos, notas, contatos, mensagens)
- `contact-tag-picker.tsx` — Picker em-drawer com famílias colapsáveis, search em-client, anti-drift guard ao criar
- `merge-contacts-dialog.tsx` — Dialog para desduplicar contatos, preview de 7 tipos de dados absorvidos
- `pipeline-config.tsx` — Configurar pipeline metadados (SDE, regra de mensagem, régua de tags)
- `stage-manager.tsx` — CRUD etapas: add, rename, reorder, archive
- `create-opportunity-wizard.tsx` — Form simples para criar opp
- `contact-activity.tsx` — Timeline de eventos (notas, tags, status, tarefas, opps, fatos); paginação +50
- `contact-messages.tsx` — Tab com conversas do contato

**Suporte:**
- `modal-shell.tsx` — Shell reutilizável (trap foco, ESC fecha, nenhuma lógica CRM)
- `crm-utils.ts` — Helpers puros: money(), isLostStage(), stageDotClass(), type Stage
- `lost-reason-dialog.tsx` — Dialog prompt para motivo da perda ao mover para etapa terminal

### Componentes Compartilhados (_shared/)

- `namespaced-tags.tsx` — Renderiza tags por namespace com chips coloridos; add/remove editável
- `notes.tsx` — Composer + Timeline para notas (endpoints: contacts/note, contacts/timeline)
- `facts.tsx` — List/confirm/reject/propose de fatos (endpoints: crm/fact/*)
- `contact-sections.tsx` — Seções reutilizáveis: tags + notes

### Bibliotecas Puras

- `contacts.ts` — Tag parsing (tagNamespace, tagValue, readTags), nome/avatar, canal, lifecycle, valor-tier
- `tags.ts` — Família (tagFamily, groupTagDefsByFamily), normalização, drift-detection (findDriftCandidates)
- `labels.ts` — Tradução PT-BR (channelLabel, friendlyStatus, friendlySource, etc.)

### Estado Global

- `drawer.ts` (Zustand) — useDrawer store + useDrawerUrlSync hook para sincronizar store ↔ URL

---

## 2. Dependências e Direção

### Hierarquia Acíclica

```
UI Components → (_shared/) Shared → Libraries Puras
             → API (proxy genérico)
             → State (drawer.ts)
```

**Fluxo detalhado (exemplos):**

- `opportunity-detail.tsx` usa:
  - ravi (proxy API client)
  - crm-utils (money, isLostStage, type Stage)
  - labels (friendlyStatus, friendlyProbability)
  - NamespacedTags, FactList, NoteComposer (_shared/)
  - endpoints: crm/opportunity/show, move, link-contact; contacts/tag, untag; chats/list

- `contact-tag-picker.tsx` usa:
  - ravi (API client)
  - useTagsCatalog hook (cursor-walks tags/list)
  - tags.ts (findDriftCandidates, groupTagDefsByFamily, normalizeTagValue, tagFamily)
  - contacts.ts (readTags, tagValue)
  - namespaced-tags.tsx (tagNamespaceClass)
  - endpoints: tags/list, contacts/tag, contacts/untag, tags/create

- `merge-contacts-dialog.tsx` usa:
  - ravi, asRows
  - endpoints: contacts/duplicates, merge, get, sessions, chats/list, crm/fact/list, contacts/timeline
  - 7 query types em MergePreview (phones, tags, facts, notes, sessions, chats, opps=n/d)

- `tags.ts` depende de:
  - contacts.ts (tagNamespace — single source of truth)

- `contacts.ts` depende de:
  - labels.ts (channelLabel, friendlyPhone, isRawJidLikeTitle)

**Zero ciclos confirmados:** Nenhuma lib depende de componentes; nenhum componente cria feedback loop com state.

**Anti-pattern detectado (não é ciclo):** tagNamespace/tagValue replicadas em namespaced-tags.tsx (não importa de contacts.ts). Cicatriz C1: deveria haver single import.

---

## 3. Dependências Circulares Investigadas

**Resultado:** NENHUMA ciclo detectado.

**Investigação:**
- tags.ts → contacts.ts (tagNamespace) — acíclico
- contacts.ts → NÃO usa tags.ts — acíclico
- Componentes → libs → (nada retorna) — acíclico
- drawer.ts → deep-links (parse/with) — acíclico
- useTagsCatalog → tags/list (server) → create-tag (client) — não loop (create-first, não upsert)

**Potencial risco (investigado):** create-tag → anti-drift-guard → não cria novo problema; apenas mostra candidatos.

---

## 4. Propagação de Impacto

**Se eu mudar X, quem quebra?**

| Mudança | Impacto Direto | Transitivo | Amplitude |
|---------|---|---|---|
| tagValue() em contacts.ts | contact-tag-picker (1 uso direto) | NamespacedTags não importa, não quebra | MÉDIA |
| findDriftCandidates() em tags.ts | contact-tag-picker::CreateTagDialog | Apenas validação, não crítico | BAIXA |
| isLostStage() em crm-utils.ts | opportunity-detail (3 usos) | Confirmação de move, regra de negócio | MÉDIA |
| friendlyStatus() em labels.ts | opportunity-detail, contact-activity | Renderização em 2+ lugares | MÉDIA |
| crm/opportunity/move endpoint | opportunity-detail::OverviewTab | Invalidação de ["board", "opportunity"] | ALTA |
| useTagsCatalog hook | contact-tag-picker (search + grouping) | Picker quebra totalmente | ALTA |
| ModalShell component | 7+ diálogos (opp, merge, pipeline, stage, create, lost-reason) | Todos os diálogos perdem layout | CRÍTICA |
| type Stage (fields) | opportunity-detail, stage-manager, crm-utils | stageDotClass depende .category, .probability | ALTA |

**Conclusão:** Mudanças em helpers puros (labels, utils) têm impacto MÉDIA. Mudanças em endpoints (API contract) têm ALTA. Remoção de shared components (ModalShell) é CRÍTICA.

---

## 5. O Que Não Pude Determinar

### Limitações da Análise Estática

1. **Semantics de "lost" stage:** Diferença entre `category === "lost"` vs `isTerminal === true`? Precedência?
2. **Schema strictness de API:** Comentários dizem "order é string", mas como se prova sem docs OpenAPI?
3. **Invalidação de query-keys:** Qual é a estratégia? Existe um mapa? Risco de refatoria quebrar.
4. **Escalabilidade de tagsCatalog:** ~356 defs em memória; e se fosse 10k? Teste de carga necessário.
5. **Oportunidades por contato:** NENHUM endpoint exists; merge preview mostra "n/d". Pode-se realmente desduplicar opps?
6. **Timezone handling:** Timestamps naive UTC (sem T/Z); e se backend mudar para ISO-8601?
7. **Transação/atomicidade do merge:** 7 tipos de dados movem; se 1 falha, roll-back?
8. **Performance de timeline pagination:** +50 por request; viável com 100k eventos?
9. **Compatibilidade tags/create kind:** Se backend rejeitar `kind: "user"` futuramente, falha silent.
10. **Edge-case: merge de contato em si mesmo:** Backend valida? UI permite?

---

## Resumo (8 linhas)

CRM compõe-se de 3 camadas bem-separadas: UI (7 diálogos + 2 seções) → libs puras (contacts, tags, labels) → API proxy. **Dependências:** Acíclicas e unidirecionais; tags←contacts (single source: tagNamespace), UI←libs. **Sem ciclos:** Confirmado; namespaced-tags.tsx tem duplicação (anti-pattern C1, não loop). **Impacto:** Alto para mudanças de endpoints (proxy afeta todos) e ModalShell (7 diálogos quebram), médio para helpers de labels (2+ componentes), baixo para drift-guards isolados. **Lacunas:** Sem execução, impossível validar semantics de lost-stage, schema strictness, invalidação de queries, ou comportamento em edge-cases (100k eventos, merge cross-opp).

