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
**ATUALIZAÇÃO:** a etapa 7 foi destilada SEM precisar disto (catálogo plano, ADR 0028) — o risco segue teórico.

---

## A017 — Etapa 8 sem tela: "tudo N/A" é indistinguível de fuga (falso-verde um nível acima)

**Status:** dívida registrada (não bloqueante) — apontada pelo anti-viés da etapa 8 (backend-architect).
**Questão:** a etapa 8 (Acessibilidade) RODA SEMPRE (decisão: não pular, N/A com motivo — ADR 0029). Para uma
feature 100% backend/CLI SEM UI, TODOS os 16 critérios WCAG viram `nao_aplicavel`. O porteiro
(`regraNaoAplicavelComMotivo`) só checa que cada motivo não é OCO — não que a feature realmente não tem tela.
O motivo "não há tela nesta feature" passa, e é indistinguível de um agente que FUGIU (operou nada, declarou
tudo inaplicável com motivos bem-redigidos). É a MESMA classe de falso-verde que a decisão D-1 combateu (o
falso-verde do *pular*), só que empurrada um nível acima (o falso-verde do *N/A-em-massa numa etapa vácua*).
**Onde a analogia com a etapa 7 VAZA:** a etapa 7 SEMPRE tem um diff para revisar (toda feature mexe em
código). A etapa 8 nem sempre tem uma tela para operar. A condicionalidade da etapa 8 é mais profunda que
"quais critérios se aplicam" — é "esta etapa se aplica de todo?". Resolver "quais critérios" por N/A é correto;
"a etapa inteira é vácua" foi ABSORVIDO na mesma solução, e essa absorção é o ponto frágil.
**Por que não virou código agora:** a correção (um sinal binário `tem_interface` derivado do estado — ex.: a
etapa 6 tocou arquivos `.tsx`/`.vue`? a etapa 4 produziu `estados` de tela?) é uma decisão de FUNDAÇÃO sobre
COMO derivar "há tela?" de outputs anteriores — e merece o método (M4: contra um caso real de feature sem UI,
que ainda não temos). Apressá-la repetiria o erro da etapa 7 (eu "simplifiquei" e quebrei a defesa).
**Direção (na filosofia do projeto, ~0 motor):** um campo de topo `tem_interface` (sim/não) declarado pela
etapa 8 com evidência (`querySelectorAll de roots de UI vazio`, ou "nenhum arquivo de UI no diff da etapa 6");
+ uma regra-clone de `regraEvidenciaObrigatoria`: se `tem_interface=não`, exige a evidência da AUSÊNCIA de
tela; senão exige ≥1 critério `coberto`/`violado`. É o mesmo princípio `evidencia_operacional` um nível acima:
PROVE que não havia o que operar, em vez de só afirmá-lo. NÃO precisa do arquétipo como entrada (D-2 segue certo).
**Próximo passo:** reavaliar quando aparecer uma feature SEM UI no pipeline (ou ao destilar uma etapa que já
derive "há tela?" do estado). Até lá, o limite vive declarado no CORE-A11Y (a etapa pressupõe uma tela operável).

---

## A018 — Autenticidade da evidência ao vivo do Gate B: o porteiro não pode autenticar o request/response

**Status:** dívida registrada (não bloqueante) — limite epistêmico central da etapa 9 (Gate B), declarado no
CORE-GATEB §2. É o gap mais sério da etapa 9 e merece dívida PRÓPRIA (o ADR 0030 antes apontava A016, que é
sobre a rastreabilidade da etapa 6 — classe parecida, mas objeto diferente).
**Questão:** o Gate B inteiro depende da `evidencia` (request real + response real + asserção) que o `fiscal`
anexa a cada critério `confere`. O porteiro RE-AVALIA a asserção SOBRE essa evidência (determinístico, barato,
sem re-chamar a API) e exige que ela seja substantiva (não-oca). Mas ele **NÃO re-chama a API e NÃO prova que
o par request/response é AUTÊNTICO** — um LLM "prevê como seria o output da tool e apresenta como fato
consumado". Em tese, o agente poderia FABRICAR um par request/response plausível e o porteiro não o
distinguiria de uma chamada real. É a frase-âncora da etapa virada do avesso: o porteiro audita a evidência,
mas não a sua veracidade última.
**Por que o risco é PARCIALMENTE mitigado hoje:** (1) **fail-closed** — só `verificado` avança, e a evidência
fabricada teria de ser internamente coerente com TODOS os critérios + o veredito global; mentir aumenta a
superfície de incoerência que o porteiro pega. (2) A etapa 10 (humano) re-verifica a autenticidade — é
explicitamente a fronteira declarada (`fica_para_humano`). Mas a mitigação é de incentivo/processo, não
estrutural: nada no motor IMPEDE a fabricação.
**Por que não virou código agora:** a correção real é **captura independente do agente** — um proxy read-only
(ou runtime) que intercepte a chamada e entregue ao porteiro o par request/response que o motor mesmo
observou, não o que o agente DIGITOU. Isso é infraestrutura que o motor (Node puro, zero deps, ADR 0001) não
tem hoje e cuja adição é decisão de fundação (toca o contrato de como a evidência chega ao porteiro). Um caso
teórico não justifica (M4) — precisa de um caso real onde a fabricação seja plausível e custosa.
**Direção (na filosofia do projeto):** um "Tool Receipt" não-forjável — o proxy assina/carimba a evidência que
ELE capturou, e a regra do Gate B passa a exigir que a `evidencia` carregue esse carimbo (em vez de texto
livre do agente). Modelo: `can-i-deploy` (consulta evidência registrada por terceiro) + Pact (o broker é a
autoridade, não o consumidor). NÃO precisa o agente ser confiável — precisa a evidência ser capturada por quem
não é o agente.
**Próximo passo:** reavaliar quando houver um proxy/runtime de verificação disponível ao motor (hoje o `fiscal`
chama via curl fora do motor). Até lá, o limite vive DECLARADO no CORE-GATEB §2 e a autenticidade última é do
humano (etapa 10). Relacionado: A016 (mesma classe — porteiro que aprova sem poder distinguir checado de
não-checado/fabricado).

---

## A019 — Aprovação humana (etapa 10) é PROCESSUAL, não criptográfica: o agente pode forjar o OK

**Status:** dívida registrada (não bloqueante) — limite da etapa 10 (HITL), declarado no core da etapa
(pipeline.config.mjs). Irmã de A018 (autenticidade que o motor não consegue provar).
**Questão:** o pipeline é dirigido por um agente Claude Code. Qualquer comando que o agente PODE rodar, ele
pode rodar — inclusive escrever o output da etapa 10 com `decisao: "aprovado"` + `aprovado_por: "<nome>"` sem
que nenhum humano tenha aprovado. O porteiro valida a FORMA (campos presentes, decisão no enum, fail-closed só
"aprovado" avança) — mas NÃO consegue provar que houve um ato humano real. É a etapa onde o risco se inverte:
nas etapas 1-9 o risco é o agente fingir trabalho; aqui é o agente fingir a APROVAÇÃO humana.
**Por que é aceito assim (KISS, decisão do operador):** gate formal pesado (tamper_hash, frase-segredo, cripto)
é over-engineering para o contexto — a pesquisa de HITL 2026 alerta que gate cerimonioso vira fila/fadiga e que
um tamper_hash gerado pelo próprio motor (que o agente invoca) não prova nada contra o agente. A garantia real
e barata é PROCESSUAL: o agente é instruído (no core) a MOSTRAR o dossiê e ESPERAR uma fala humana de OK na
conversa antes de registrar — e a NÃO fabricar essa fala. A diferença entre isto e "o agente aprova sozinho" é
uma linha de instrução, e é o que mantém o H do HITL antes do deploy (etapa 12) — a regra inviolável do HITL é
"aprovação antes do side-effect irreversível".
**Por que não virou garantia técnica:** provar autenticidade exigiria um canal que o agente NÃO controla — uma
aprovação fora do repositório (clique/comentário no GitHub PR que o CI lê) ou um segredo que só o humano sabe.
Ambos saem do "Node puro, zero deps" (ADR 0001) e adicionam infraestrutura externa. Decisão de fundação adiada
até haver um caso real que justifique (M4) — hoje o operador acompanha a conversa e vê a fala humana.
**Direção:** quando o pipeline rodar em CI/desacoplado do operador, mover a aprovação para um canal externo
(GitHub Environments com required reviewers, ou um webhook que o humano aciona) — o motor/CI lê o veredito de
lá, não do output que o agente escreve. Modelo: "approvals before side effects" + canal fora do alcance do
agente. Relacionado: A018 (mesma raiz — o motor não autentica o que o agente declara, num fluxo agêntico).
**Próximo passo:** reavaliar ao levar o pipeline para execução não-supervisionada (CI). Até lá, o limite vive
DECLARADO no core da etapa 10 e a autenticidade última é o operador humano acompanhando a conversa.

---

## A020 — Cegueira de fonte: o DAG ancora numa fonte sem perguntar "é a única?" (achado-ouro do E2E piloto)

**Status:** dívida registrada (a PRINCIPAL entrada de melhoria do pipeline) — descoberta pela 1ª condução E2E
completa de uma feature real (2026-06-30). Documentada no relatório `docs/RELATORIO-E2E-PILOTO.md`.
**Questão:** o DAG (etapa 1) mapeia A FUNDO a fonte de dados que recebe, mas NUNCA pergunta "esta é a única
fonte que satisfaz a intenção?". Toda a verificação a jusante (Descoberta → Gate B ao vivo) opera sobre a
premissa que o DAG fixou e a confirma com rigor — se a premissa nasce PARCIAL, o rigor só prova que "a parte
funciona". No E2E o MESMO erro de classe ocorreu 2×: (1ª) a tela listou 1 item porque o DAG ancorou na fonte
que o código legado já usava; (2ª) corrigida a fonte, listou centenas — mas faltava um universo inteiro de
itens vindo de um sistema paralelo que a fonte escolhida nem conhecia. O pipeline garante "a feature faz CERTO
o que faz", mas não "a feature olha para a coisa COMPLETA".
**Por que o pipeline não pega hoje:** nenhuma das 13 etapas tem a lente "esta tela está olhando para TODAS as
fontes certas para seu propósito?". O Three Amigos (etapa 4) pergunta "por que isso existe?" mas DEPOIS de o DAG
já ter fixado o território. O GAP confronta "descoberto vs necessário", mas o "necessário" também é derivado da
fonte que o DAG escolheu. A pergunta de COMPLETUDE DE FONTE não tem dono.
**Direção (proposta de melhoria):** adicionar uma **Etapa 0 — Censo de Fontes / Gate de Intenção**, ANTES do DAG.
Dada a intenção declarada, ela varre o ambiente atrás de TODAS as fontes que a satisfazem (não só a que o código
legado usa) e confronta "o que a tela DEVERIA agregar" vs "o que ela está ligada a agregar". Secundário (mesma
raiz): o CORE-DISCOVERY deve exigir leitura do contrato tipado (SDK/OpenAPI/spec) ANTES de sondar ao vivo — numa
execução, sondar por tentativa-e-erro a partir de um único exemplo fez a descoberta perder parâmetros e métodos
que o contrato documentava (e gerou um no-go falso no design).
**Próximo passo:** brainstorm da Etapa 0 (é decisão de fundação — muda o início do pipeline). É o trabalho de
maior valor pendente. Relacionado: é a 3ª vez que uma cegueira de escopo/fonte morde (ver também os 2 achados
crus em `e2e-run-2-tools/contexto-vivo/`, locais).

**ATUALIZAÇÃO (2026-06-30) — Etapa 0 CONSTRUÍDA e testada, ISOLADA (ainda não no fluxo).** Brainstorm conduzido
com o operador; 4 decisões de fundação tomadas:
1. **Quem dirige:** *humano declara → agente confronta → humano julga* (o agente é o cético da completude, exatamente
   quem faltava no pipeline).
2. **O que é "fonte":** MVP em origens de dados, mas `tipo` é CAMPO ABERTO (sem enum) — cresce para consumidores/
   sistemas-afetados sem reescrever a etapa (M1).
3. **Alcance da busca:** DUPLA e marcada — estática (read-only por construção) + viva (sonda o ambiente read-only),
   cada fonte com `proveniencia` ∈ {declarada-pelo-humano, lida-no-codigo, sondada-ao-vivo} (espelha o confianca_enum
   da etapa 1 e o veredito quaternário da etapa 9).
4. **Porteiro:** confronto provado + veredito humano fail-closed — reusa `regraEvidenciaObrigatoria` (fonte ao vivo
   exige evidência colada, classe A017/A018) + nova `regraCensoConfrontado` (nenhuma fonte fica "a_decidir"; descarte
   exige motivo) + `regraCampoIgual("veredito_humano","censo_completo")` (só completo avança; faltam_fontes BLOQUEIA).
**Estado:** `ETAPA_CENSO_FONTES` em `v1/pipeline.config.mjs` (exportada FORA do array `PIPELINE` — decisão do operador
de não tocar os 227 testes agora). Teste `v1/test/censo-fontes.test.mjs` (8 casos) exercita o porteiro real; suíte
**235/235 verde**. ZERO mecanismo novo de motor (reusa avaliarEtapa/regras existentes).
**O que FALTA para fechar a A020 (e virar ADR de cristalização):** (a) inserir a etapa em `PIPELINE[0]` (vira a nova
`PRIMEIRA_ETAPA`; o DAG passa a consumir `censo_output`) e adaptar os ~3 testes que assumem 'dag' como 1ª etapa
(placeholder, encadeamento, e2e — trocar contagens hardcoded por `PIPELINE.length`); (b) validar contra um 2º caso
real (M4) — idealmente o E2E #3 com a intenção corrigida; (c) o secundário (CORE-DISCOVERY ler contrato tipado antes
de sondar) segue pendente. Até (a)+(b), a etapa vive isolada e a dívida A020 permanece ABERTA.

---

## A021 — Meta-aprendizado dentro do DAG: memória que evita repetir erros do passado (FRENTE FUTURA)

**Status:** FRENTE FUTURA registrada (2026-06-30) — visão do operador, NÃO decidida, NÃO desenvolvida. Pré-requisito:
estudo do estado-da-arte (ninguém vai cristalizar arquitetura sem pesquisa — M2/M4). Referência mental do operador:
**"estilo Hermes Agent"** (agente com memória episódica reflexiva).
**A visão:** hoje a state machine garante a qualidade do que circula DENTRO de uma execução, mas cada execução começa
do zero — não aprende com as anteriores. O E2E piloto provou o custo disso: a **cegueira de fonte** (A020) mordeu
**3×** (2 no piloto + a do design original) porque nada no pipeline "lembrava" que esse erro já tinha acontecido. A
proposta é dar ao DAG uma **estrutura de consulta a lições passadas**: antes (ou durante) uma execução, o sistema
recupera o que já deu errado em situações análogas e injeta isso onde possa prevenir a repetição. É o loop
*experiência → reflexão → recuperação → ação* aplicado ao próprio pipeline.
**O que JÁ existe no design (o gancho de captura):** a **etapa 13 (Retrospectiva)** — hoje placeholder, mas o
**ADR 0014** já decidiu que ela "**propõe melhorias, não só registra**", e o **ADR 0012** a tornou etapa formal. O
**relatório E2E** (`docs/RELATORIO-E2E-PILOTO.md`) já é uma retrospectiva manual rica (4 lições destiladas). Ou seja:
o lado da CAPTURA de lição tem dono no design. **O que FALTA é o lado da CONSULTA** — recuperar a lição certa, na
etapa certa, numa execução futura. Hoje a lição morre no relatório; ninguém a lê no momento em que ela preveniria o erro.
**A pergunta central, AINDA EM ABERTO (operador: "não sei, vamos estudar como as pessoas fazem"):** QUANDO e COMO a
memória é consultada. Três hipóteses levantadas (a escolher após pesquisa, provavelmente combinadas em camadas):
- **(H1) Por etapa, no briefing:** o motor injeta no meta-prompt as lições relevantes ÀQUELA etapa ("no DAG, já erramos
  cegueira de fonte 3×"). Casa com o padrão Meta-Prompt + Structured Handoff do projeto (a memória vira mais uma camada
  do briefing). Mais cirúrgico.
- **(H2) No início (gate de intenção):** consulta global no começo da feature ("features parecidas já falharam em X"),
  alimentando a Etapa 0 (A020) / o planejamento. Visão macro.
- **(H3) No porteiro (prevenção ativa):** quando um erro recorrente tem assinatura DETECTÁVEL, a lição "endurece" o
  gate — o porteiro passa a bloquear ativamente aquele padrão. Mais forte e mais arriscado (memória vira enforcement;
  risco de falso-positivo). Nota: a A020 já é um exemplo DESTE caminho feito à mão (uma lição do E2E virou a regra
  `regraCensoConfrontado` da Etapa 0). H3 seria automatizar o que ali foi manual.
**Roteiro de pesquisa (FAZER ANTES de qualquer decisão — é o próximo passo real desta frente):**
1. Estudar o **Hermes Agent** concreto (o que o operador citou) — arquitetura de memória, gatilho de recuperação,
   formato do traço episódico. Registrar em `REFERENCIAS.md` + `research/`.
2. Levantar o estado-da-arte de **memória de agentes / aprendizado contínuo 2026**: Reflexion (auto-reflexão verbal),
   Generative Agents (memory stream + retrieval por relevância/recência/importância), Voyager (skill library que
   cresce), ExpeL (extração de regras de experiências passadas), MemGPT/Letta (memória hierárquica), RAG sobre
   post-mortems. Para cada: como capturam, como indexam, COMO RECUPERAM, e como evitam poluir o contexto.
3. Confrontar com a **filosofia do projeto** (ADR 0001 "Node puro, zero deps"): uma memória que exige vector DB/
   embeddings tensiona isso — avaliar alternativas leves (índice por tags/etapa, recuperação por palavra-chave, o
   próprio formato de ADR/ABERTO como "memória estruturada já existente"). M1: a memória deve ser dinâmica (cresce
   com o uso), não uma lista fixa.
4. Decidir QUANDO consultar (H1/H2/H3 ou combinação) contra um caso real — idealmente provar que teria evitado a A020.
**Impacto:** Alto — é a diferença entre uma state machine que executa bem e uma que MELHORA sozinha a cada uso.
**Por que não decidir agora:** arquitetura de memória é decisão de fundação; sem pesquisa, qualquer escolha viola M2/M4.
**Relacionado:** etapa 13 (captura), ADR 0014/0012, A020 (`regraCensoConfrontado` é um H3 manual), `RELATORIO-E2E-PILOTO.md`.
Frente IRMÃ mas INDEPENDENTE: A022 (skill replicável). Decisão do operador: tratá-las como duas frentes paralelas, sem
acoplar (evita over-engineering — coerente com X001–X004). Conexão FUTURA possível (a skill consumir a memória
cross-projeto) fica registrada como hipótese, não como requisito.

---

## A022 — Skill replicável: empacotar TODO o método de criar state machines (FRENTE FUTURA)

**Status:** FRENTE FUTURA registrada (2026-06-30) — visão do operador, NÃO decidida, NÃO desenvolvida.
**A visão:** transformar TODO o processo que este projeto desenvolveu — de "como montar uma state machine do zero" a
"como destilar o CORE de cada etapa" — numa **skill replicável**, para gerar uma nova state machine para QUALQUER
cenário de forma clara e rápida: uma SM de **criação de vídeo**, uma de **desenvolvimento de apps**, ou qualquer
domínio. Hoje o método existe, mas espalhado em documentos de processo e na cabeça de quem conduziu; replicá-lo para
um novo domínio exige reler tudo e reinterpretar. A skill seria o **empacotamento executável** desse know-how.
**O que JÁ existe (a matéria-prima — a skill é EMPACOTAMENTO, não invenção):**
- **`PLANO-DE-ETAPA.md`** — "o sistema para completar uma etapa inteira, peça por peça" (o CORE é só 1 das ~18 peças).
  Molde + tracker + portão de evidência/anti-viés + triagem de esforço.
- **`METODOLOGIA-CORE.md`** — "o pipeline reutilizável para destilar o CORE de qualquer etapa" (5 fases, da pesquisa
  ao refinamento). É o "motor" de uma peça do PLANO-DE-ETAPA. **Ressalva honesta:** exercitada 1× com sucesso, NÃO
  validada — ver `_RETRO-metodologia-core.md` (4 furos conhecidos: n=1, cego não-independente, etc.). A skill herda
  essa imaturidade; empacotar não conserta os furos.
- **`ANATOMIA-DE-ETAPA.md`** — o catálogo de capacidades de uma etapa (o que se pode definir: executor, briefing,
  critério, gaps, lentes, pre-mortem...). É o "vocabulário" que a skill ofereceria.
- **`CLAUDE.md`** (M1–M4), a skill global **`manter-governanca`**, o padrão **Meta-Prompt + Structured Handoff**
  (`PADRAO-BRIEFING.md`), e o próprio **motor `v1/`** (genérico, agnóstico a domínio — já foi projetado para isto).
**O que está EM ABERTO (a decidir — provavelmente após um 2º domínio existir):**
1. **Forma da skill:** uma skill única que conduz o fluxo inteiro (SM → etapas → COREs)? Ou um conjunto (uma p/
   "criar a SM", uma p/ "destilar um CORE", uma p/ "completar uma etapa")? A modularidade espelha a separação
   MOTOR↔CONTEÚDO que o projeto já faz.
2. **O que é INVARIANTE vs. específico de domínio (M3):** o motor (`dag.mjs`) é agnóstico — replica direto. O PADRÃO
   de destilar CORE é invariante. Mas o CONTEÚDO dos COREs é 100% do domínio (um CORE-DAG de vídeo ≠ de apps). A skill
   precisa separar com clareza "o que você copia" de "o que você destila do zero para o seu domínio".
3. **Validação por replicação (M4 aplicado à própria skill):** a skill só estará provada quando gerar uma SM de um
   domínio DIFERENTE de desenvolvimento de software (o operador citou criação de vídeo). Esse seria o "2º caso" que
   tira a skill de proposta. Risco: o método foi destilado SÓ de um domínio (dev de features web) — pode haver
   premissas escondidas que não generalizam (ex.: "toda etapa tem um diff", "existe um ambiente vivo p/ sondar").
4. **Relação com o ravi-console:** o spec de migração (`docs/superpowers/specs/2026-06-30-migrar-motor-para-ravi-
   console-design.md`) já prevê uma skill `/dag` fina sobre os verbos do motor. A skill desta frente é MAIOR (cria SMs
   novas, não só dirige uma existente) — avaliar se a `/dag` é um subconjunto dela ou coisa distinta.
**Roteiro:** (a) estudar como skills/scaffolders de processo são empacotados (a própria infra de skills do ambiente;
generators tipo Yeoman/`create-*`; o padrão "golden path / paved road" de plataformas internas); (b) decidir forma
(1 skill vs. conjunto); (c) PROVAR gerando uma SM de domínio não-software (vídeo) — o teste de generalidade real.
**Impacto:** Alto — é o que transforma um projeto pontual numa CAPACIDADE reaproveitável (o "produto" do produto).
**Por que não desenvolver agora:** depende de o método estar mais maduro (METODOLOGIA-CORE ainda é n=1) e idealmente
de um 2º domínio para validar. Empacotar cedo demais cristaliza premissas não-provadas.
**Relacionado:** `PLANO-DE-ETAPA.md`, `METODOLOGIA-CORE.md`, `ANATOMIA-DE-ETAPA.md`, `_RETRO-metodologia-core.md`,
`manter-governanca`, spec da migração ravi-console (skill `/dag`). Frente IRMÃ mas INDEPENDENTE de A021 (decisão do
operador: paralelas, sem acoplar).

**PLANO APROVADO (2026-06-30):** o caminho desta frente está detalhado em
`docs/superpowers/plans/2026-06-30-skill-replicavel-state-machines.md` — 9 fases (0–8), cada uma com agente dedicado,
artefato versionado e portão de evidência. Plano de DESCOBERTA/destilação (não TDD): reprocessar git + extrair o método
tácito (Fase 0) → invariante vs domínio (1) ∥ estado-da-arte de destilação (2) → "CORE do CORE" / meta-método (3) →
arquitetura da skill (4) → pré-mortem ANTES de escrever (5) → escrever a skill (6) → validar por replicação num 2º
domínio (7) → cristalizar (8). **Achado-âncora da Fase 0:** o movimento "destilar racional → nomear → pesquisar o nome
→ expandir o cenário" (o que dobrou o CORE-DAG v3→v4) é TÁCITO no `METODOLOGIA-CORE.md` — o plano o formaliza. Status:
APROVADO, NÃO INICIADO (nenhuma fase executada).
