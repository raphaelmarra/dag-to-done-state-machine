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

---

## A012 — Regras de aceitação custom: padronizar em `regrasExtras` declarativo

**Status:** ✅ RESOLVIDA em 2026-06-28 (ADR 0024) — `regrasExtras`/`avaliarEtapa` implementados; `comCondicao` deletado; gates migrados.
**Status (histórico):** dívida registrada (não bloqueante) — apontada pela revisão cega da etapa 2 (backend-architect).
**Questão:** Hoje há 3 formas de exprimir "regra de aceitação" no `aceita()` de uma etapa: presença de
campos (declarativo), estrutura via schemaEstrutural (declarativo), e condição custom imperativa — em
dois sabores: `comCondicao(...)` (gates simples: gate_a/gate_b/done/smoke) e um `.filter()` cru (a regra
de evidência da etapa 2). Isso começa a fragmentar o padrão.
**Impacto:** Médio — funciona, mas não escala limpo. Os GATES (etapas 7/9) terão regras próprias e cada
um tende a inventar seu `aceita` imperativo.
**Direção:** um campo declarativo único `regrasExtras: [(o)=>{ok,faltando}]` que o motor compõe (AND)
após `validarEstrutura`; migrar os gates de `comCondicao` para ele. Depois, a gramática de schema pode
absorver o caso comum ("campo obrigatório quando outro campo == valor") — que é o que a regra de
evidência da etapa 2 realmente é (obrigatoriedade condicional).
**Próximo passo:** avaliar ao destilar a etapa 7 (Gate A) — quando o 2º caso de regra custom aparecer,
implementar o `regrasExtras`. Até lá, o `aceita` custom por etapa serve.

---

## A013 — Paridade CORE↔porteiro na etapa 1: 4 buracos achados e FECHADOS

**Status:** ✅ RESOLVIDA em 2026-06-28. Achada ao revisitar a etapa 1 com a lente nascida na etapa 2
("paridade CORE↔porteiro" — todo campo prometido é exigido?). O operador perguntou se os erros da
etapa 2 teriam diminuído a qualidade da etapa 1 — não houve regressão (mudança no motor foi 4 linhas
aditivas), MAS a lente nova expôs 4 buracos que já existiam na etapa 1 (mesmo tipo F3 da etapa 2):
- `nos.hub` era opcional (tem enum sim/não) → agora `obrigatorio`.
- `fronteira.expansoes` e `candidatos_transitivos` eram omitíveis, mas o CORE (A4) diz "nunca um
  silêncio" → agora `presente: true` (a chave deve existir; `[]` é válido = "registrei que não há").
- `gaps` exigia ≥1 (`minItens`), mas C1 é filtro e zero gaps é resultado válido → agora `presente`
  sem minItens (gaps:[] passa; ausente reprova).
**Validação:** TDD (5 testes novos de paridade) + verificador cego confirmou as 4 fechadas, paridade
bidirecional, sem nova divergência. Suíte 56/56. Novo flag genérico `presente` no validador (chave
obrigatória mas vazio OK) — reusável pelas etapas 2–13.
**Lição:** revisitar etapas antigas com lentes novas acha dívida real. A regra entrou no método
(METODOLOGIA Fase 3, as 3 checagens). Vale reaplicar a lente de paridade a cada etapa nova destilada.

---

## A014 — Rastreabilidade âncora↔fonte: regra precisaria do ESTADO no porteiro (exige mudança de fundação)

**Status:** dívida registrada (não bloqueante) — achada pelo anti-viés da etapa 5 (auditor-v2 + backend-architect, convergentes).
**Questão:** A etapa 5 prega "trabalho sem âncora não existe" (U2): cada unidade aponta `ancora`/`depende_de`/
`ancoragem_no_gos` para ids de etapas anteriores (gaps do GAP, critérios/ADRs do Design, no-gos do GAP). Hoje
o porteiro valida que esses campos EXISTEM e têm forma, e que a ordem é topológica internamente — mas NÃO
cruza os ids com a fonte real. `ancora: ["GAP-INEXISTENTE-999"]` passa; um ciclo escondido por omitir
`depende_de` passa. A etapa 4 fecha um circuito análogo (`regraCircuitoComportamentoCriterio`), mas ali
os dois lados estão DENTRO do mesmo output (comportamento↔critério no design_output). A etapa 5 cruzaria
contra output de OUTRA etapa.
**Por que não virou código agora (decisão consciente):** a regra `regra(output, etapa)` recebe só o output
da etapa atual (`pipeline.config.mjs:178`). Cruzar com `gap_output`/`design_output` (promovidos no `state.json`)
exige passar o ESTADO às `regrasExtras` — mudar a assinatura do porteiro no motor (`dag.mjs`) + tocar as 13
etapas. Isso é mudança de FUNDAÇÃO, e:
- viola M4 (não cristalizar fundação sem 2º caso que a justifique — só a etapa 5 pede isto hoje);
- seria a 1ª etapa a custar código de MOTOR, quebrando a tese de amortização (provada em 5 etapas);
- a honestidade do limite já está declarada ao executor (CORE-MAPA §4 O3 reforçado: "o porteiro só enxerga
  o que você DECLARA; `depende_de` deve refletir as arestas reais do DAG").
**Impacto:** Médio — abre espaço a âncora órfã / ciclo omitido que o porteiro não pega; mitigado por (a) o
executor é o Plan (planeja a partir das saídas reais que recebe no briefing), (b) o Gate A (etapa 7) revisa
o plano adversarialmente, (c) o limite é declarado, não silencioso.
**Direção:** quando um 2º caso pedir cruzamento-entre-outputs (provável: um gate que confere se o implementado
cobre os critérios), estender o motor para passar `estado` às regras — `regra(output, etapa, estado)` — e então
adicionar `regraAncoraRastreavel` à etapa 5 de graça. Detectar ciclo explicitamente (Kahn/DFS) com mensagem
correta ("grafo cíclico — re-divida") entra junto.
**Próximo passo:** não decidir agora. Reavaliar ao destilar a etapa 7 (Gate A) ou a primeira etapa que precise
ler o output de outra para validar. Até lá, o limite vive declarado no CORE. **→ A etapa 6 é o 2º caso
candidato (ver A015): ela também ancora cada mudança em gap/critério real. Decisão de estender o motor
fica para a Fase 1 da etapa 6, contra o caso concreto.**

---

## A015 — Etapa 6 (Implementação): executor APLICA + declara prontidão com prova (decidida, a cristalizar)

**Status:** decidida em 2026-06-29 (operador + pesquisa de mercado + 2 verificadores) — a cristalizar na Fase 4 (ADR 0027).
**Contexto:** a etapa 6 é a 1ª que toca CÓDIGO. As 5 anteriores produzem conhecimento-JSON validado por forma;
o critério oficial da etapa 6 (PIPELINE.md ~l.291) fala em `tsc/check:contracts/vitest/integrity verdes` —
coisas que só se sabe RODANDO comando. Mas o porteiro valida forma de JSON, não executa nada.
**Pesquisa (estado-da-arte 2026, search-specialist):** (1) separar raciocínio-da-mudança da emissão-do-diff
é vencedor (Aider architect/editor: SOTA 85%); (2) o agente JAMAIS é juiz do próprio trabalho — "tests passed"
dito pelo agente é não-confiável (reward hacking + ICSE 2026: 28,6% dos patches que passam estão errados);
a regra de ouro é verificação por sistema DIFERENTE do que gerou o código. Restrição-chave: se o porteiro não
executa, o agente não pode ser juiz (só ele executaria) → a etapa 6 DECLARA, não JULGA.
**Decisão (Híbrido — Opção 3, com executor que aplica):**
- O executor REALMENTE edita os arquivos e roda os checks no loop (auto-correção = maior alavanca de
  confiabilidade, por toda a evidência empírica). Internamente segue o padrão Aider (raciocina o plano
  ancorado, depois emite os edits).
- O output é um **handoff verificável**: plano de diff por arquivo (cada mudança ancorada num gap/critério
  real, herança do caso real do MVP que FECHA 100% — Explore confirmou), golden_path Given/When/Then,
  riscos de regressão, MAIS um bloco `prontidao`: cada gate (tsc/contracts/vitest/integrity/placeholder/
  hardcode) declarado com estado ∈ {verde, vermelho, nao_aplicavel}; **`verde` EXIGE evidência colada**
  (exit code/log) — mesmíssimo mecanismo da etapa 2 (`regraEvidenciaObrigatoria`: "confirmado ao vivo" só
  passa com `evidencia_ao_vivo`). O porteiro valida forma + rastreabilidade + prova-anexada; NUNCA "é verdade".
- **Divisão de trabalho sem duplicar:** 6 declara (com prova) · 7 (Gate A) REFUTA o diff (outro agente,
  lentes por arquétipo) · 11 (Done) COMPROVA (re-roda `dag verify`/`check ci`, status derivado, tamper_hash).
  O autor nunca assina o próprio veredito de verdade.
**Limite honesto:** o bloco `prontidao` é declaração, não prova-de-verdade — um agente pode colar evidência
falsa. Mitigado por Gate A (refuta) + Done (re-roda). Risco residual idêntico ao já aceito na etapa 2.
**Custo de motor:** ZERO se a rastreabilidade âncora→fonte ficar como hoje (forma só). SE a Fase 1 decidir
cruzar âncora com a fonte real (A014), aí estende o motor 1× para passar `estado` às regras — e a etapa 5
ganha `regraAncoraRastreavel` de brinde. Decisão na Fase 1.
**Próximo passo:** rotina 0→4 em `etapa-6-implementacao/`. Cristalizar como ADR 0027.
**ATUALIZAÇÃO (Fase 1-3):** RESOLVIDA — decidido B-restrito; motor estendido (`estado` às regras,
retrocompatível); `regraAncoraRastreavel` cruza âncora↔fonte; A014 resolvida junto. Cristalizada no ADR 0027.

---

## A016 — `nao_verificavel` da rastreabilidade aprova em silêncio (rastro para o Gate A)

**Status:** dívida registrada (não bloqueante) — apontada pelo anti-viés da etapa 6 (backend-architect).
**Questão:** `regraAncoraRastreavel` (etapa 6), quando não acha NENHUM id ancorável nos outputs anteriores
(`idsValidos.size === 0`), retorna `{ok:true, faltando:[]}` — idêntico a "verifiquei e está tudo certo". O
Gate A (etapa 7), que herda o veredito, não sabe que a dimensão "rastreabilidade" foi PULADA, não APROVADA —
pode assumir falsa cobertura. É a mesma classe da A013 (porteiro que aprova sem distinguir "ok" de "não-checado").
**Por que o risco é hoje TEÓRICO:** após a correção W2 (varredura recursiva), `idsValidos.size === 0` só
ocorre se gap/design/mapa não produziram NENHUM requisito com id em nenhuma profundidade — impossível no
fluxo real (os schemas das etapas 3/4/5 exigem `gaps[].id`/`criterios_aceitacao[].id`/`unidades[].id`). O
estado é construído pelo motor (promove os `*_output` ao aprovar cada etapa), não pelo executor.
**Por que não virou código agora:** deixar rastro exigiria o veredito carregar um campo de "dimensões não
verificadas" — mudar o contrato `{ok, faltando}` que as 13 etapas e o motor consomem. É mudança de fundação
que um caso teórico não justifica (M4). O limite já está DECLARADO no CORE-IMPL §2 (conceito `nao_verificavel`).
**Direção:** quando o Gate A (etapa 7) for destilado e precisar saber o que o porteiro NÃO conferiu, estender
o veredito com `nao_verificado: [...]` (dimensões puladas) — e a etapa 6 reporta a rastreabilidade pulada ali.
**Próximo passo:** reavaliar ao destilar a etapa 7 (Gate A). Até lá, o limite vive declarado no CORE.
