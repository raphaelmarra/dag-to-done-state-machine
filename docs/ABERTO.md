# Questões em Aberto

> O que ainda não foi decidido, o que é incerto, e o que precisa de mais pesquisa.
> Cada item tem um dono e um status.

---

## A001 — Formato exato do entregável de cada etapa

**Status:** em aberto
**Questão:** Os entregáveis foram descritos em prosa. Precisamos definir se são: campos YAML na instância, documentos markdown com seções fixas, ou respostas estruturadas do agente em formato JSON.
**Impacto:** Alto — o formato determina como o sistema verifica o critério de aceitação automaticamente.
**Próximo passo:** Decidir um formato antes de desenhar a verificação automática.

---

## A002 — Como o agente "responde" ao sistema (loop de feedback)

**Status:** em aberto
**Questão:** Hoje o agente produz texto livre. Para o sistema verificar o critério de aceitação, o agente precisa produzir uma saída estruturada. Como isso funciona na prática dentro do Claude Code?
**Impacto:** Alto — é o coração da verificação automática.
**Próximo passo:** Pesquisar como o Claude Code captura saída estruturada de agentes para uso pelo CLI.

---

## A003 — Fases diferenciadas por arquétipo (LISTA vs MUTACAO)

**Status:** em aberto, baixa prioridade
**Questão:** Na versão inicial o pipeline tem as mesmas 10 fases para qualquer feature. Mas uma tela MUTACAO é mais complexa que um DRAWER simples. Faz sentido ter pipelines diferentes por arquétipo?
**Impacto:** Médio — afeta a rigidez vs flexibilidade do sistema.
**Próximo passo:** Avaliar após a primeira versão funcionar. Não adicionar antes.

---

## A004 — O que acontece quando o Spike não resolve a incerteza

**Status:** em aberto
**Questão:** O Spike está previsto entre etapas 3 e 4 para resolver incerteza técnica. Mas se o Spike terminar sem resposta (a incerteza persiste), o pipeline para? Escala para o humano? Descarta a feature?
**Impacto:** Médio — precisa de um caminho definido para não travar o processo.
**Próximo passo:** Definir o protocolo de "Spike inconclusivo" antes de implementar.

---

## A005 — Paralelismo entre features diferentes simultaneamente

**Status:** em aberto
**Questão:** O sistema cuida de cada feature separadamente. Mas e quando duas features estão em etapas diferentes ao mesmo tempo e compartilham arquivos? O mapa de colisão atual é suficiente ou precisa ser integrado ao pipeline?
**Impacto:** Médio — pode gerar conflitos silenciosos em implementações paralelas.
**Próximo passo:** Verificar se o mapa de colisão do CONTRATO atual cobre esse caso ou precisa ser extendido.

---

## A006 — Critério para ativar Walking Skeleton

**Status:** em aberto
**Questão:** Walking Skeleton foi incluído como "opcional entre etapas 5 e 6, para features de risco alto". Mas o que define "risco alto"? Quem decide e como?
**Impacto:** Baixo — é opcional, mas sem critério claro vira ou obrigatório (burocracia) ou ignorado.
**Próximo passo:** Definir 2-3 critérios objetivos para acionar o Walking Skeleton.

---

## A007 — Integração com o CLI dag existente: extend vs rewrite

**Status:** em aberto
**Questão:** A SPEC-PHASE-GATE-ENFORCER propõe adicionar 4 verbos ao dag.mjs existente. Mas o pipeline agora é mais rico (10 etapas, briefings, critérios de aceitação). O dag.mjs ainda é o lugar certo, ou precisa de um arquivo separado?
**Impacto:** Alto — afeta toda a arquitetura da implementação.
**Próximo passo:** Decidir antes de começar a implementação.

---

## A008 — Fundação do DAG (etapa 1): decidida em validação, não cristalizada

**Status:** ✅ RESOLVIDA em 2026-06-28 — cristalizada no CORE-DAG v4.0 via ADR 0020/0021/0022
(rotina 0→4, 2 casos + 9 pesquisas). A mecânica abaixo foi absorvida e refinada (aciclicidade
agora *verificável*, profundidade *dinâmica*, nó no nível Component, blast radius graduado).
A parte ainda aberta (condensação de ciclo) virou A010. Mantida abaixo por histórico.

**Status (histórico):** fundação estável, aguardando validação contra demanda real (D016)
**Contexto:** Revisão da etapa 1 (DAG) pelo método bottom-up — escrever o briefing perfeito
primeiro, destilar o racional, e só então reescrever o CORE-DAG. Cruzou-se a base interna
(`relations/`, metodologia `research/0001`, contrato F0) com pesquisa externa sobre DAG e
impact analysis. Artefato-âncora: `docs/_WIP-briefing-dag-perfeito.md` (caso CRM).

**Fundação decidida (mecânica do grafo — vira CORE-DAG quando validada):**
- Nó = superfície/função que a feature/domínio consome (NÃO entidade de dados — gera ciclos)
- Aresta = "depende de", direção única consumidor→provedor → **DAG acíclico por construção**
- Backward (blast radius) = grafo reverso **calculado** por travessia, não aresta armazenada
- Fronteira = 1 hop armazenado, closure transitiva sob demanda
- Custo de aresta = **híbrido**: Explore infere o que o código revela (`inferido`); o que é
  runtime vira gap `a confirmar pela Descoberta` (etapa 2). Respeita D019 (Explore não toca rede).
- Executor = Explore (lê código) — D019 preservada. **VALIDADO em 2026-06-28** contra os 40 agentes
  do CLI `agents` + built-in: Explore é o único que garante read-only POR CONSTRUÇÃO (sem rede/escrita);
  os demais (code-reviewer, auditor-v2, typescript-pro…) têm Bash → garantia só comportamental, que
  pode corromper o enum de confiança. Ranking: Explore 8.5 > auditor-v2 5.5 > typescript-pro 4.0. Critério
  permanente registrado no CORE-DAG §1: substituto só entra se passar no teste read-only-estrutural.
- **Largura do escopo vem da DEMANDA REAL (`entry_point`), não do CORE.** Intent estreito
  ("card da oportunidade") vs. domínio amplo ("CRM") — a mecânica é a mesma; o gerador lê
  o entry_point, não inventa a largura.

**Por que ainda não é D0XX formal:** fiel ao D016 ("testar antes de registrar"). A fundação
só vira decisão registrada quando o CORE-DAG derivado dela gerar um briefing perfeito contra
uma demanda real.

**Resolve a contradição central da base:** metodologia-fonte (`0001`) e contrato (F0) faziam
o mapa ao vivo; redesenho (PIPELINE+CORE+D019) deu ao Explore que não toca rede. A divisão
estática/runtime (estrutura→Explore, custo-runtime→etapa 2) dissolve o conflito.

**Próximo passo:** ou destilar o CORE-DAG agora a partir do briefing v2, ou aguardar uma
demanda real para construir+validar o CORE-DAG contra ela. Decisão do operador humano.

---

## A009 — Controle de fidelidade da delegação (briefing → prompt do subagente)

**Status:** em aberto
**Questão:** O agente principal consome o briefing da máquina e redige um prompt PRÓPRIO para
o subagente — não repassa o briefing palavra por palavra (ver `FLUXO-EXECUCAO.md`). A máquina
não verifica o que foi delegado, qual subagente foi usado, nem o conteúdo do prompt — só o
output final. A fidelidade "briefing → delegação" depende 100% do julgamento do agente principal.
**Tensão:** essa folga é o que dá GENERALIDADE (um CORE genérico vira um prompt específico do
projeto — o DAG do CLI ≠ DAG do CRM, M1). Tirá-la mata a generalidade. Mas ela também tira
controle e reprodutibilidade.
**Impacto:** Alto — define quanto a máquina realmente "controla" a execução vs. confia no agente.
**Direções:** (a) briefing vira prompt literal do subagente — preserva controle, mata generalidade;
(b) a máquina registra/valida o que foi delegado — preserva generalidade, adiciona controle.
**Próximo passo:** não decidir agora. Reavaliar ao destilar o CORE-DAG real no motor — é quando
a tensão fica concreta. Provável: manter (b) como caminho, mas só implementar se a falta de
controle morder num caso real.

---

## A010 — Condensação de ciclo (CORE-DAG A5): validada só em sintético

**Status:** provisória — no CORE-DAG v4.0 marcada "⚠️ PROVISÓRIO", não cristalizada em ADR.
**Questão:** A regra A5 manda, ao detectar dependência mútua genuína (A precisa de B e B precisa de
A na mesma relação), declarar um super-nó `ciclo: {A,B}` (condensação SCC) em vez de apagar uma
aresta. Funciona — mas só foi testada contra um caso SINTÉTICO (import circular plantado,
order.js ↔ pricing.js). Não vimos um ciclo de consumo REAL ainda (o ADP faz código bom evitá-los,
e o lint costuma barrá-los).
**Impacto:** Baixo/Médio — a regra é uma rede de segurança; a maioria das features é acíclica.
**Próximo passo:** promover a regra (de provisória a cristalizada, vira ADR) quando aparecer um
ciclo de consumo genuíno num caso real e o CORE o fizer declarar o super-nó corretamente. Até lá,
fica no CORE como provisória. Evidência sintética: ver _WIP-core-dag-v4.md, Fase 3, Teste 3.

---

## A011 — Descrições semânticas dos campos: fonte única incompleta (schema gera forma, não significado)

**Status:** dívida registrada (não bloqueante) — apontada pela revisão cega das peças 4+5.
**Questão:** O `schemaEstrutural` (v1) virou fonte única da FORMA do output (tipos, enums, obrigatoriedade)
e GERA a prosa do contrato (Seção 4 do CORE). Mas o SIGNIFICADO de cada campo (ex.: "shape = contrato
observável, não a implementação"; "blast_radius = vista reversa, A3") ficou num bloco de prosa MANUAL
no CORE-DAG, acima do bloco gerado. Esse bloco repete os nomes/ordem dos campos do schema sem teste de
sincronia — então pode divergir (se renomear um campo no schema, a descrição manual fica órfã).
**Impacto:** Baixo — as descrições mudam raramente, e a auditoria confirmou que hoje estão corretas e
preservadas. Mas é a mesma classe de divergência que a refatoração combateu, num eixo menos visível.
**Direção:** o schema carregar um campo `desc` por campo/itemCampo, e `gerarSchemaProsa` emiti-lo
(`nome: tipo — desc`), colapsando os dois blocos num só gerado. Fecha a fonte única de verdade.
**Próximo passo:** avaliar ao destilar a etapa 2 (quando o gerador de prosa for reusado) — se a dívida
morder, implementar o `desc`; senão, manter o bloco manual com um teste de sincronia nomes-schema↔prosa.
