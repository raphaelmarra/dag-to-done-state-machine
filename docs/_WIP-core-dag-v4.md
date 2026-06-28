# _WIP — CORE-DAG v4.0 (RETIRED — registro da rotina 0→4)

> **Status:** ✅ RETIRED em 2026-06-28. A rotina concluiu: CORE-DAG v4.0 cristalizado em
> `docs/CORE-DAG.md` (ADR 0020/0021/0022). Este arquivo fica como REGISTRO HISTÓRICO do processo
> (vereditos, padrão-ouro fundido, testes) — não é mais o documento ativo. Não editar.
> Objetivo: evoluir o CORE-DAG v3.0 à luz das 9 pesquisas (docs/research/0006–0014) e validar
> contra um 2º caso real (CRM do ravi-console) + regressão (aba CLIs). Método: rotina 0→4.
> Início: 2026-06-28. Ver tarefas #10–#14.

---

## ROTINA (referência rápida)

- **Fase 0** — vereditos das mudanças candidatas (abaixo). ✅ feita.
- **Fase 1** — briefing perfeito do 2º caso (CRM), bottom-up (M2). ⏳ em andamento.
- **Fase 2** — escrever o v4.0 aplicando Fase 0 + pesquisas.
- **Fase 3** — testar: agente CEGO no CRM (generalidade) + aba CLIs (regressão) + adversarial (ciclo/multi-hop).
- **Fase 4** — cristalizar: v4.0 oficial + 3 ADRs + governança.

**Portão de cristalização (M4):** só vira oficial se gerar o briefing certo nos 2 casos, sem
regressão, e os achados adversariais (ciclo, multi-hop) aparecerem de fato.

---

## FASE 0 — Vereditos das mudanças candidatas

Três mudanças saíram das pesquisas. Veredito de cada uma (aceita / rejeita / a-testar), com fonte.

### M-A · Aciclicidade VERIFICÁVEL + condensação (SCC) como cláusula de escape
**Fonte:** 0011 (acíclico vs cíclico), reforço 0013 (ADP), 0014 (diagnóstico reporta, não aborta).
**Veredito: ACEITA (estrutural).**
- **Mantém** A1/A2/A3 como caso comum — forçar DAG no domínio de *dependência de consumo* é o
  Acyclic Dependencies Principle (validado sem ressalvas por 0013).
- **Muda A2 de axioma para meta verificável:** o CORE instrui o executor a *testar* o caminho de
  volta ("existe dependência de B para A na MESMA relação?") antes de afirmar DAG. Hoje A2 *assume*.
- **Adiciona regra de condensação:** ao detectar dependência mútua genuína, o executor NÃO apaga
  uma aresta (A2) nem nega o nó (A1) — declara um **super-nó "ciclo: {A,B}"** (SCC) e o trata como
  unidade indivisível. Honesto: admite o ciclo, mantém o resto ordenável.
- **Coerente com:** 0014 (somos diagnóstico → reportamos ciclo, não abortamos) e M4 (verificar, não assumir).

### M-B · Fronteira "1 hop" → PROFUNDIDADE DINÂMICA
**Fonte:** 0012 (análise de impacto; indústria usa 3–5 hops), 0013 (DDD: fronteira é semântica, não topológica).
**Veredito: ACEITA (estrutural) — é a M1 aplicada à própria regra.**
- **1 hop deixa de ser teto rígido e vira default com gatilhos de expansão.** Expandir o 2º hop de
  um vizinho específico quando ele for: (a) pass-through / re-export / adaptador fino; (b) hub de
  fan-in/fan-out alto; (c) a aresta cruza fronteira de contrato (API pública/schema/interface).
- **Não cortar o transitivo — sinalizar:** reportar 1-hop como "impacto direto (alta confiança)" e
  candidatos transitivos como "a verificar", em vez de omitir (converte falso-negativo silencioso
  em aviso explícito de incerteza — mais seguro p/ agente LLM).
- **DDD:** "DOMÍNIO" passa a significar *bounded context* (região de linguagem coerente), não
  "muitos hops". Mudança de linguagem no grafo = sinal de fronteira de contexto (candidato a ACL).

### M-C · Regras de ESCRITA do CORE (forma, não conteúdo)
**Fonte:** 0006 (técnicas com evidência), 0007 (meta-prompting), 0009 (clareza-para-LLM), 0010 (divergência humana↔LLM).
**Veredito: ACEITA (aplica-se à redação de TODO o v4.0).**
- **Sanduíche (posição):** regra crítica no início E reforçada no fim — combate "lost in the middle" (0009).
- **Polaridade positiva:** "faça X" em vez de "não faça Y" — negação é violada até 80% (0009).
  ⚠️ *Tensão a resolver na Fase 2:* a seção FRONTEIRAS do v3.0 é toda em negativo ("NÃO execute…").
  Reescrever em positivo sem perder a função de exclusão.
- **Exclusões explícitas (do/don't):** movem aderência de ~40% p/ ~100% (0007) — é o mecanismo que
  faz o briefing ser específico do projeto, não genérico. Manter, mas na forma "faça X; o que está
  fora: Y" em vez de só "não Y".
- **Desacoplar raciocínio do formato:** o executor raciocina livre primeiro, formata em JSON depois —
  evita o "Format Tax" de 10–30% no raciocínio (0006). Afeta como instruímos os 2 passes.
- **Vocabulário consistente + repetição deliberada da instrução-chave** (inverte a redação humana,
  que manda variar) — 0010. O CORE já tem "Vocabulário fixo"; reforçar.
- **Descartar:** role/persona elaborada (não melhora acurácia factual — 0006).

### A1 — refinо de granularidade (de 0013)
**Veredito: ACEITA (ajuste fino).** O tipo de nó vive no **nível Component do C4** e é *nomeado*
pela stack (UI/API/CLI), não *definido* por ela. Invariante = "unidade consumida numa direção";
a stack é só o rótulo (M3). Evita cair no nível Code (granularidade fina demais).

---

## FASE 1 — Briefing perfeito do 2º caso (bottom-up, M2)

### Escolha do caso: domínio **CRM** do ravi-console
**Por quê (critério de teste, não conveniência):**
- **Contrasta com a aba CLIs:** aba CLIs = INTENT estreita (uma tela). CRM = DOMÍNIO amplo (região
  inteira: contatos, tags, labels, oportunidades, pipeline). Estressa D1 e a fronteira (M-B).
- **Alta chance de ciclo real:** contacts ↔ tags ↔ labels ↔ opportunities se interligam
  (`contact-tag-picker`, `merge-contacts-dialog`, `opportunity-detail`). Terreno ideal p/ testar M-A.
- **Multi-hop provável:** CRM → tags → labels → resources. Testa M-B.
- **É a origem teórica:** o "modelo de relações do ravi" (fonte do nosso DAG) nasceu do CRM. Fechar
  o ciclo testando o CORE no domínio que originou a teoria é metodologicamente forte.

**Entry point do caso:** `entry_point = "CRM"` (substantivo de região → DOMÍNIO por D1).

### Superfícies observadas (1ª varredura — para o briefing perfeito)
- UI: `src/components/crm/` — opportunity-detail, contact-tag-picker, merge-contacts-dialog,
  pipeline-config, stage-manager, create-opportunity-wizard, contact-activity, etc.
- Lib/domínio: `src/lib/contacts.ts` (18.7K), `tags.ts` (8.9K), `labels.ts` (46.8K), `resources.tsx` (125K).
- Estado: `src/stores/drawer.ts`.

### Padrão-ouro: um cego + eu, fundidos

**Briefing do cego:** `docs/research/_cego-briefing-crm.md` (Explore sem contexto do CORE/pesquisas).
**Minha versão (estruturada):** abaixo. **Fusão:** extrai o melhor de cada (a seguir).

#### O que o CEGO viu melhor que eu (frescor não-enviesado)
- **Camadas reais nomeadas pelo stack:** UI → _shared/ → libs puras → API proxy → state (Zustand).
  Confirma A1-refino: o tipo de nó emerge do projeto, e o CRM tem 5 tipos naturais.
- **Aresta de domínio concreta com "single source of truth":** `tags.ts → contacts.ts` (via
  `tagNamespace`) e `contacts.ts → labels.ts`. Direção clara consumidor→provedor (valida A2).
- **Anti-pattern ≠ ciclo:** a duplicação de `tagNamespace` em `namespaced-tags.tsx` PARECE acoplamento
  mas não é dependência circular — é cicatriz. **Lição para M-A:** o executor precisa distinguir
  "duplicação" (dívida, não-gap, não-ciclo) de "dependência mútua" (ciclo real). O cego fez isso certo.
- **Propagação com amplitude graduada:** tabela "mudança → impacto direto → transitivo → amplitude
  (BAIXA/MÉDIA/ALTA/CRÍTICA)". Isto é blast radius **com peso** — mais rico que o v3.0 (que só lista).
- **Hubs identificados:** `ModalShell` (quebra 7 diálogos) e `useTagsCatalog` (quebra o picker inteiro)
  são nós de fan-in alto. **Valida M-B:** são exatamente os gatilhos de expansão de profundidade.

#### O que EU estruturo melhor que o cego (o que o CORE exige e ele não deu)
- **Confiança por item** (lido vs inferido) — o cego misturou; o CORE exige o enum explícito por nó/aresta.
- **Gaps DIRECIONAIS (teste C1):** o cego listou 10 "lacunas", mas várias são dívida/edge (timezone,
  escalabilidade 100k) que NÃO passam no teste "a próxima etapa precisa disto?". Só ~4 são gap real
  (semantics lost-stage, schema strictness, endpoint opps-por-contato inexistente, atomicidade do merge).
  **O CORE filtra; o cego não filtrou.** Esta é a regra que mais agrega.
- **Fronteira explícita (nós-folha + arestas de saída 1-hop)** e **shape do nó** (contrato observável):
  o cego deu por exemplos, não sistematicamente.

#### Veredito do caso para as mudanças da Fase 0
- **M-A (ciclo/condensação):** o CRM **não tem ciclo** → esta mudança NÃO é exercitada por este caso.
  ⇒ a Fase 3 precisa de um **caso adversarial específico de ciclo** (ver Fase 3), senão M-A entra no
  CORE sem validação (violaria M4). Candidato: import circular real ou FKs mútuas.
- **M-B (profundidade dinâmica):** **fortemente validada** — `ModalShell`/`useTagsCatalog` são hubs cujo
  impacto a 2+ hops seria perdido por "1 hop" rígido. O caso real exige a expansão dinâmica.
- **A1-refino (tipo no nível Component):** validado — 5 tipos emergiram do stack naturalmente.

---

## Minha versão do briefing perfeito do CRM (estruturada p/ o CORE)

> entry_point = "CRM" (DOMÍNIO, por D1). Executor: Explore (lê código, não toca rede).

**OBJETIVO** — Construa o DAG de dependências do domínio CRM: as unidades consumíveis e suas
relações de consumo (consumidor→provedor), com blast radius graduado e gaps direcionais para a
Descoberta da API.

**ESCOPO (largura por D1 = DOMÍNIO):** inclui as superfícies de `src/components/crm/` + `_shared/`,
as libs de domínio (`contacts.ts`, `tags.ts`, `labels.ts`), o store `drawer.ts`, e os endpoints que o
CRM consome. Fora: interior de `resources.tsx` além de 1 hop; medição de runtime; domínios vizinhos
(chats, sessions) além das arestas de saída.

**Nós (tipo nomeado pelo stack — nível Component do C4):**
- superfície-UI: opportunity-detail, contact-tag-picker, merge-contacts-dialog, pipeline-config,
  stage-manager, create-opportunity-wizard, contact-activity, contact-messages, lost-reason-dialog
- componente-compartilhado: modal-shell (HUB), namespaced-tags, notes, facts, contact-sections
- função-domínio: contacts.ts, tags.ts, labels.ts, crm-utils.ts
- hook-estado: useTagsCatalog (HUB), useDrawer/useDrawerUrlSync
- função-API (provedor): crm/opportunity/{show,move,link-contact}, contacts/{tag,untag,merge,duplicates,
  timeline,note}, tags/{list,create}, crm/fact/*

**Arestas (consumidor→provedor — amostra de alta confiança):**
- tags.ts → contacts.ts (usa tagNamespace) · confiança: lido
- contacts.ts → labels.ts (channelLabel, friendlyPhone) · lido
- contact-tag-picker → {tags.ts, contacts.ts, namespaced-tags, useTagsCatalog} · lido
- opportunity-detail → {crm-utils, labels, namespaced-tags, facts, notes} · lido
- todos os diálogos → modal-shell · lido  ← HUB (fan-in 7)

**Blast radius graduado (vista calculada — A3):**
- modal-shell: 7 diálogos (CRÍTICA) · useTagsCatalog: picker inteiro (ALTA) · type Stage:
  {opportunity-detail, stage-manager, crm-utils} (ALTA) · labels: 2+ superfícies (MÉDIA)

**Fronteira:** nós-folha = libs puras (labels.ts não consome ninguém do CRM). Arestas de saída 1-hop:
CRM → chats/list, CRM → sessions. **Expansão dinâmica (M-B):** modal-shell e useTagsCatalog são hubs →
expandir o 2º hop deles (quem mais consome).

**Gaps direcionais (passam no teste C1 — a Descoberta precisa):**
- G1: semantics de "lost stage" (category==="lost" vs isTerminal) — P0, a próxima etapa decide o comportamento de move.
- G2: schema strictness dos endpoints (ex.: `order` é string?) — P0, Descoberta confirma ao vivo.
- G3: endpoint "oportunidades por contato" parece INEXISTENTE (merge mostra "n/d") — P1, afeta o que o merge promete.
- G4: atomicidade do merge (7 tipos movem; rollback?) — P1, contrato de comportamento.
- **NÃO-gaps** (o cego listou, mas falham C1): timezone naive, escalabilidade 100k, duplicação tagNamespace
  (dívida técnica), performance de paginação. Olham para o lado, não para a próxima etapa.

---

## Racional destilado (invariante vs variável — M3)

**Invariante (vira/confirma regra do CORE):**
- Tipo de nó emerge do stack mas no nível Component (A1-refino). ✔ confirmado por 2 fontes.
- Aresta consumidor→provedor, direção testável (A2 verificável, M-A). ✔
- Blast radius é vista calculada (A3) — e ganha **amplitude graduada** (novo, do cego). ✔
- Profundidade dinâmica com gatilho de hub (M-B). ✔ exercitado pelo caso.
- Filtro de gap direcional C1 é o que separa nosso output de um "relatório de problemas" (a maior
  diferença entre a minha versão e a do cego).

**Variável (lido da demanda, não fixado):** os 5 tipos concretos, os nomes dos hubs, os endpoints,
a largura (DOMÍNIO porque entry_point="CRM"). Tudo isso muda por projeto — o CORE não fixa, extrai.

> ✅ **Fase 1 concluída.**

---

## FASE 2 — concluída
CORE-DAG v4.0 escrito em `_WIP-CORE-DAG-v4-draft.md`. Aplica M-B, A1-refino, amplitude graduada,
regras de escrita M-C (sanduíche R-mestra/R-fim, polaridade positiva nas FRONTEIRAS, exclusões como
transferência de responsabilidade, raciocínio-antes-do-JSON, vocabulário repetido) e M-A (A5)
marcado PROVISÓRIO.

## FASE 3 — TESTES (resultados)

### Teste 1 — Generalidade (agente cego executa o briefing gerado pelo v4.0 no CRM)
Output: `docs/research/_teste-v4-crm-output.md`. **PASSOU.** Comparação com o padrão-ouro fundido:
- **23 nós, 16 arestas, 4 hubs** (labels.ts, drawer.ts, ModalShell, NamespacedTags) — bateu e até
  superou meu padrão-ouro (achou drawer.ts e labels como hubs CRÍTICOS que eu subvalorizei).
- **Blast radius graduado** (BAIXA→CRÍTICA) produzido corretamente, com razão por nó. ✔ valida A3-amplitude.
- **Fronteira com expansões dinâmicas registradas E transitivos "a verificar"** (5 candidatos) — ✔ valida M-B.
  O executor expandiu drawer→deep-links e parou em labels/ModalShell por serem puros: decisão correta de A4.
- **Gaps: 5 aprovados / 4 descartados, com a razão C1 explícita** ("Design, não Descoberta"). ✔ valida C1 —
  exatamente a disciplina que o cego da Fase 1 NÃO tinha sozinho. O CORE a impôs.
- **0 ciclos**, com verificação de caminho de volta declarada por aresta. ✔ A2 verificável funcionou.
- Confiança por seção. ✔ B3.
- Pequena ressalva: 1 gap aprovado (P2 duplicação tags) é borderline — é dívida, mas o executor o
  reformulou na direção "arquitetura precisa decidir". Aceitável, mas observar se vira ruído.

### Teste 2 — Regressão (aba CLIs)
O v4.0 é superconjunto do v3.0 nas regras que a aba CLIs exercitou (nós/arestas/gaps/confiança/2 passes).
Os campos novos (amplitude, hub?, expansões, super-nó) são ADITIVOS — não invalidam o
`dag.output.json` real existente. **Sem regressão.** (Verificação documental contra
`MVP/evidencia-teste-aba-clis/dag.output.json`.)

### Teste 3 — Adversarial de ciclo (A5, sintético)
Caso: import circular plantado (order.js ↔ pricing.js). Executor com a regra A2/A5.
**PASSOU.** O agente verificou o caminho de volta nas duas arestas, confirmou dependência mútua, e
declarou `super-nó ciclo: {order.js, pricing.js}` — NÃO apagou aresta, NÃO confundiu com duplicação.
A5 funcionou no teste sintético. (Continua PROVISÓRIO até um ciclo real, mas ganhou evidência p/ promoção.)

### Veredito da Fase 3
- **M-B, A1-refino, amplitude graduada, C1 reforçado, regras de escrita → VALIDADOS.** Cristalizar.
- **M-A (A5/condensação) → funciona em sintético.** Promover de "não-validado" para "validado em
  sintético, a confirmar em caso real". Mantém ressalva no CORE + questão aberta.

> ✅ **Fase 3 concluída.** Próximo: Fase 4 — cristalizar (CORE oficial v4.0 + ADRs + governança).

---

## Registro de decisões desta rodada

### Decisão sobre M-A (o CRM não tem ciclo → M-A ficou sem teste real)
**Escolha: Opção 2 reforçada.** Racional: caçar um ciclo de *consumo* genuíno é incerto — o ADP
(0013) diz que código bom os evita, e o lint do Next.js provavelmente os barra. Adiar (Opção 3)
joga fora uma descoberta sólida. O projeto JÁ pratica "regra não-cristalizada no documento" (o
próprio v3.0 vive como "validar antes de cristalizar"). Então:
- **M-B + A1-refino + M-C (escrita)** → cristalizam agora (validados por CRM + regressão aba CLIs) → viram ADR.
- **M-A (condensação)** → entra no v4.0 marcada **"⚠️ PROVISÓRIO — não validado contra ciclo"**; NÃO
  vira ADR; vira questão em ABERTO com critério de validação. Na Fase 3, **teste sintético dirigido**
  (import circular plantado) decide se ganha evidência para promoção futura.

### Vira ADR na Fase 4 (cristalizado)
1. Forçar DAG é válido **no domínio de dependência de consumo** (ADP) — verificável, não imposto (parte verificável; condensação fica provisória).
2. Profundidade da fronteira é **dinâmica** (gatilhos de hub/contrato), não fixa em 1 hop. ✔ validada pelo CRM.
3. Tipo de nó no **nível Component do C4**, nomeado pelo stack (A1-refino). ✔ validada pelo CRM.
4. Blast radius com **amplitude graduada** (achado do cego). ✔ validada pelo CRM.

### Fica PROVISÓRIO (questão aberta, não ADR)
5. Ciclo genuíno → **condensação (super-nó SCC)**, reportar não abortar. ⏳ só teste sintético na Fase 3.
