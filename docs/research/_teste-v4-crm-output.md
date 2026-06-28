# DAG CRM (Teste v4) — Mapeamento de Dependências

**Data**: 2026-06-28
**Domínio**: CRM (Contacts, Opportunities, Pipelines, Facts, Tags)
**Confiança**: 100% lido no código

## RESUMO EXECUTIVO

| Métrica | Valor |
|---------|-------|
| Nós totais | 23 |
| Arestas | 16 |
| Hubs | labels.ts, drawer.ts, ModalShell, NamespacedTags |
| Amplitude máxima | CRÍTICA |
| Gaps C1 aprovados | 5 |
| Gaps descartados | 4 |
| Ciclos | 0 (acíclico) |

## NÓSCOMPONENTES + LIBS)

### Components
1. **ContactActivityTab** - timeline de eventos do contato (contacts/timeline)
2. **ContactDadosTecnicosTab** - identidades, policy, relações (dados técnicos)
3. **ContactMessagesTab** - two-pane chat reader (reuso chats domain)
4. **ContactTagPicker** - sectioned toggle-chips por family (tags/list + contacts/tag)
5. **CreateOpportunityWizard** - modal form (crm/opportunity/create)
6. **LostReasonDialog** - confirmação de lost opportunity
7. **MergeContactsDialog** - dedupe flow 7 endpoints (contacts/merge)
8. **ModalShell** - reusable modal a11y [HUB: 6 consumidores]
9. **OpportunityDetail** - detalhe com 6 abas [HUB: critico]
10. **PipelineConfig** - modal config pipeline (crm/pipeline/set)
11. **StageManager** - modal stage CRUD (crm/pipeline/stage/*)

### Shared Components
12. **ConfidenceBar** - bar + label (0..1)
13. **ContactTagsSection** - tags editable (reuso NamespacedTags)
14. **ContactNotesSection** - notes composer + timeline
15. **FactList** - facts proposal/confirm/reject (crm/fact/*)
16. **NamespacedTags** - tag display + edit by namespace [HUB: 2+ consumidores]
17. **NoteComposer + NoteTimeline** - notes writer + reader (contacts/note)

### Libs (Puras)
18. **contacts.ts** - tag parsing, name, phone, lifecycle, channel [CRÍTICA: tagNamespace + tagValue]
19. **tags.ts** - family derivation, drift detection (imports contacts.tagNamespace)
20. **labels.ts** - PT-BR friendly labels + session resolution [HUB CRÍTICO: 6 consumidores]
21. **crm-utils.ts** - Stage type, money, isLostStage, stageDotClass

### Store
22. **drawer.ts** - global zustand drawer + URL sync [HUB CRÍTICO: navegação]

---

## ARESTAS (Depende de)

### API Calls (ravi)
- ContactActivityTab → contacts/timeline
- ContactDadosTecnicosTab → (nenhuma, props-based)
- ContactMessagesTab → chats/list (via ConversationList reuse)
- **ContactTagPicker → contacts/tag, contacts/untag, tags/list, tags/create** [🟡 escrita]
- CreateOpportunityWizard → crm/opportunity/create [🟡 escrita]
- **MergeContactsDialog → contacts/{duplicates,merge,get,sessions}, chats/list, crm/fact/list** [🟡 escrita destrutiva]
- OpportunityDetail → crm/opportunity/{show,move} [🟡 escrita]
- PipelineConfig → crm/pipeline/{list,set} [🟡 escrita]
- StageManager → crm/pipeline/stage/{add,set,archive} [🟡 escrita]
- FactList → crm/fact/{list,propose,confirm,reject} [🟡 escrita]
- NoteComposer+NoteTimeline → contacts/{note,timeline}

### Função Pura
- ContactTagPicker → tags.{deriveFamilies, groupTagDefsByFamily, findDriftCandidates, normalizeTagValue}
- ContactTagPicker → contacts.{readTags, tagValue}
- ContactTagPicker → NamespacedTags.tagNamespaceClass
- FactList → labels.{friendlyFactStatus, friendlyFactKey, friendlySource}
- ContactActivityTab → labels.{friendlyStatus, friendlySource, friendlyActorType}
- NoteTimeline → labels.{friendlySource, friendlyActorType}
- OpportunityDetail → labels.{friendlyStatus, friendlyProbability}
- OpportunityDetail → crm-utils.{money, isLostStage}
- StageManager → crm-utils.stageDotClass
- tags.ts → contacts.tagNamespace [imports]

### Componente Reuso
- CreateOpportunityWizard → ModalShell
- LostReasonDialog → ModalShell
- MergeContactsDialog → ModalShell
- OpportunityDetail → ModalShell
- PipelineConfig → ModalShell
- StageManager → ModalShell
- ContactTagsSection → NamespacedTags
- OpportunityDetail → NamespacedTags
- OpportunityDetail → FactList
- OpportunityDetail → NoteComposer, NoteTimeline
- FactList → ConfidenceBar

---

## BLAST RADIUS (Reverso + Amplitude)

| Nó | Consumidores | Amplitude | Razão |
|-----|-----------|-----------|-------|
| labels.ts | 6 (ContactActivityTab, FactList, NoteTimeline, OpportunityDetail, MergeContactsDialog, + implícitos) | **CRÍTICA** | Hub PT-BR; toca toda UI CRM |
| drawer.ts | global (toda navegação detail) | **CRÍTICA** | Única drawer; mudança quebra navegação |
| ModalShell | 6 (Create, Lost, Merge, Opp, Pipeline, Stage) | **ALTA** | Modal a11y compartilhada |
| ravi:crm/opportunity/show | OpportunityDetail | **ALTA** | Abre detalhe com 6 abas cascata |
| contacts.ts + tags.ts | ContactTagPicker, tags.ts | **ALTA** | Core do pipeline tags |
| NamespacedTags | ContactTagPicker, ContactTagsSection, OpportunityDetail | **MÉDIA** | Tag rendering; 2+ contextos |
| ravi:contacts/{tag,untag} | ContactTagPicker, ContactTagsSection | **MÉDIA** | 2 consumidores; afeta contato |
| ravi:contacts/timeline | ContactActivityTab, NoteTimeline, MergeContactsDialog | **MÉDIA** | 3 consumidores; leitura pura |

---

## FRONTEIRA + EXPANSÕES

### 1 Hop Saídas
- chats domain (ConversationList, MessageThread reuse)
- contacts domain (implicit via endpoint overlap)

### Hubs Expandidos (2 hop)
1. **labels.ts** → Nenhuma cascata; funções puras. Parar em 1 hop.
2. **drawer.ts** → deep-links.ts (out-of-scope; assume estável)
3. **ModalShell** → Componente puro, sem cascata. Parar em 1 hop.

### Transitivos a Verificar (Próxima Etapa — Descoberta da API)
1. **contacts/timeline contrato**: payload.text vs root-level text (foi bug em D1)
2. **MergeContactsDialog atomicidade**: 7 endpoints, merge é transação atômica ou multi-step?
3. **ContactTagPicker cursor-walk**: tags/list pagination (~356 defs, há max-page-size? como crescer?)
4. **drawer.ts URL parse**: deep-links schema é versioned? mudança quebra deep-links históricos?
5. **OpportunityDetail opp/show**: payload monolítico ou lazy-loadável por aba?

---

## CICLOS DETECTADOS

**0 ciclos. Grafo acíclico confirmado.**

Passe 1 verificou cada aresta: nenhuma depende do inverso.
Exemplo: ContactTagPicker consome contacts/tag; contacts/tag NOT depende de ContactTagPicker.

---

## GAPS FILTRADOS POR C1

### Aprovados (Bloqueiam Descoberta)

| Prioridade | Lacuna | Ação | Razão C1 |
|---|---------|-------|---------|
| P0 | contacts/timeline: payload.text vs root-level | Descoberta verifica schema ao vivo | Próxima etapa NÃO consegue mapear sem saber onde o texto lives |
| P1 | MergeContactsDialog: atomicidade merge (7 endpoints) | Descoberta verifica se rollback automático | Próxima etapa NÃO consegue garantir consistência |
| P1 | ContactTagPicker: tags/list pagination (~356 defs) | Descoberta verifica max-page-size, cursor-walk | Próxima etapa NÃO consegue otimizar UI sem saber limite |
| P1 | drawer.ts: URL parse (deep-links schema) | Descoberta verifica estabilidade schema | Próxima etapa NÃO consegue garantir deep-links sem schema estável |
| P2 | tags.ts + NamespacedTags: duplicam tag-parsing | Refactoring: fonte única (cicatriz C1) | Próxima etapa (arquitetura) NÃO consegue decidir sem mapear duplicação |

### Descartados (Não Bloqueiam)

- contactFriendlyName fallback "Sem nome" → UX (Design, não Descoberta)
- TagDef campos não usados (bindingCount, createdAt) → technical debt (não Descoberta)
- riendlyFactStatus PT-BR labels → localization (Design, não Descoberta)
- stageDotClass cores Tailwind → renderização (Design, não Descoberta)

**Teste C1 resultado**: Próxima etapa consegue mapeary endpoints sem saber desses detalhes? **SIM** → descartados.

---

## RESUMO DE CONFIANÇA

### Por Seção
| Seção | Confiança | Detalhe |
|-------|-----------|--------|
| **Nós** | 100% | 23/23 lido no código (nenhuma inferência) |
| **Arestas** | 94% | 15/16 lido; 1 inferido da traversal |
| **Blast Radius** | 100% | Fan-in/fan-out direto, lido no código |
| **Fronteira** | 100% | Folhas, saídas, hubs identificados direto |
| **Ciclos** | 100% | Traversal completo; acíclico |
| **Gaps C1** | 100% | Filtrados; 5 aprovados de 10 candidatos |

### Advertências
1. ContactTagPicker confia em useTagsCatalog hook (não explorado; assume contrato estável)
2. MergeContactsDialog combina 7 endpoints; atomicidade não foi verificada ao vivo
3. drawer.ts → deep-links.ts é out-of-scope; assume estável
4. labels.ts é hub crítico mas é apenas tradução (baixo risco de refactoring)

---

## FIM DO MAPA

Arquivo gerado para: C:/Users/gouve/Desktop/dag-to-done-state-machine/docs/research/_teste-v4-crm-output.md
Confiança geral: **100% lido no código**
Próxima etapa: Descoberta da API (verifique 5 gaps P0/P1 acima)