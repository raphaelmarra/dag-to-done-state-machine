# Three Amigos — a conversa entre 3 perspectivas que produz critério testável

> Pesquisa local da **etapa 4 (Design)**. Fundamenta como tornar o Three Amigos
> obrigatório e **não-teatral** quando há **um único agente** executando a etapa.
> Fontes citadas ao final. Classificação Diátaxis: *Explanation* (o porquê) + *How-to* parcial.

---

## Resumo executivo

O **Three Amigos** (George Dinwiddie, 2009) é a prática de juntar três perspectivas
— **Negócio/BA**, **Desenvolvimento**, **Teste/QA** — numa conversa curta **antes de construir**,
para produzir um **entendimento compartilhado e testável** do que vai ser feito. A Agile Alliance
condensa as três perspectivas em três perguntas: **Negócio** — "qual problema estamos resolvendo?";
**Desenvolvimento** — "como poderíamos construir a solução?"; **Teste** — "e se acontecer isto? o que
mais poderia acontecer?". O encontro não termina com uma especificação ditada, mas com um conjunto de
**exemplos concretos** que cobrem os cenários significativos e servem de base direta para os testes de
aceitação ([Agile Alliance](https://agilealliance.org/glossary/three-amigos/);
[Smart](https://johnfergusonsmart.com/three-amigos-requirements-discovery/)).

A prática se ancora em duas obras de referência: **Specification by Example** (Gojko Adzic, 2011) —
exemplos realistas viram a especificação executável e a *living documentation* — e **Example Mapping**
(Matt Wynne, Cucumber) — a técnica de 4 cartões (história/regra/exemplo/pergunta) que estrutura a
conversa em ~25 min e **torna visível** quando a história ainda não está pronta. As três perspectivas
previnem mal-entendidos porque cada uma **força um vetor diferente**: Negócio fixa o *porquê* antes
que o time pule para a solução; Desenvolvimento testa a viabilidade; QA **ataca** o entendimento com
casos de borda — e cada ambiguidade vira uma **pergunta registrada** (um *unknown unknown* virando um
*known unknown*), não uma suposição silenciosa.

**Achado-chave para a etapa 4:** com um só agente, as "3 pessoas" são **3 LENTES sequenciais** que o
mesmo agente aplica em ordem deliberada — e a ordem importa. O artigo "Three Amigos with AI"
([Test Double](https://testdouble.com/insights/three-amigos-with-ai-stop-building-the-wrong-thing-faster))
documenta exatamente isto: a IA veste **três personas em fases sequenciais** (BA → Arquiteto → QA
Challenger), e a separação por fase **impede o colapso das lentes** (se a IA olha o código primeiro,
ela inconscientemente reduz o requisito ao que é fácil de construir). O antídoto contra teatro é
estrutural: cada comportamento só "passa" quando a 3ª lente (QA) produz um **critério no formato
Given/When/Then com método de verificação anexado** (AUTO/MANUAL/CODE) — e o **porteiro verifica a
presença das 3 respostas + a forma verificável do critério**, não a boa-vontade do agente.

---

## As 3 lentes — com evidência

A literatura descreve as três perspectivas de dois jeitos complementares: por **pergunta** (o que cada
uma busca) e por **postura** (o que cada uma força na conversa). A reformulação de **John Ferguson Smart**
— *Request / Suggest / Protest* — é a mais útil para nós porque descreve a **postura**, e postura é o que
um único agente precisa simular quando troca de lente.

### Lente 1 — NEGÓCIO / BA · "por quê?" · postura: *One to Request*

- **O que busca:** o problema a resolver e o *valor* do comportamento. Pergunta canônica:
  "qual problema estamos tentando resolver?" ([Agile Alliance](https://agilealliance.org/glossary/three-amigos/)).
- **O que força (evidência):** Smart insiste que esta lente **apresenta o problema, não dita a solução** —
  "walk through concrete examples, explain user motivations, and list business rules", convidando o time a
  resolver junto em vez de receber "a fully finalised specification to commit to"
  ([Smart](https://johnfergusonsmart.com/three-amigos-requirements-discovery/)). Em
  *Specification by Example*, esta lente corresponde ao padrão **"deriving scope from goals"**: o escopo
  nasce do objetivo de negócio, não de uma lista de features ([gist · Adzic patterns](https://gist.github.com/rpivo/1469476d9c4cd3ea41f8709eaae94920)).
- **Por que vem PRIMEIRO:** a regra mais importante do framework com IA — "the BA in Phase 1 deliberately
  avoids looking at the codebase — if the AI explores the code first, it unconsciously scopes requirements
  to what's easy to build" ([Test Double](https://testdouble.com/insights/three-amigos-with-ai-stop-building-the-wrong-thing-faster)).
  Se o *porquê* não é fixado antes do *como*, a viabilidade técnica contamina a intenção.

### Lente 2 — DESENVOLVIMENTO · "como funciona?" · postura: *One to Suggest*

- **O que busca:** o desenho do comportamento e a viabilidade. Pergunta canônica:
  "como poderíamos construir uma solução para esse problema?" ([Agile Alliance](https://agilealliance.org/glossary/three-amigos/)).
- **O que força (evidência):** explora opções — "what if we did this?" — e traz a perspectiva de
  factibilidade técnica. Smart registra o **risco** que esta lente precisa equilibrar: "we sometimes like
  to dive into 'solution' mode before we understand the problem fully" — por isso ela vem **depois** de
  Negócio ([Smart](https://johnfergusonsmart.com/three-amigos-requirements-discovery/)). No framework com
  IA, é a persona **Arquiteto**: "find existing patterns, check framework conventions, identify resilience
  gaps" ([Test Double](https://testdouble.com/insights/three-amigos-with-ai-stop-building-the-wrong-thing-faster)).
- **Conexão com a etapa:** é aqui que o agente cruza com o que as etapas anteriores já produziram (ficha de
  API confirmada ao vivo, mapa do DAG, gaps/no-gos) — o "como" é restrito pela realidade, não inventado.

### Lente 3 — TESTE / QA · "como saberemos que está certo?" · postura: *One to Protest*

- **O que busca:** verificar que o produto funciona **e** caçar defeitos. Pergunta canônica:
  "e se acontecer isto? que outros desfechos poderiam ocorrer?" ([Agile Alliance](https://agilealliance.org/glossary/three-amigos/)).
- **O que força (evidência):** é a lente **adversarial** — "challenges assumptions and highlights
  ambiguities", procurando "hidden assumptions, edge cases, and inconsistencies"
  ([Smart](https://johnfergusonsmart.com/three-amigos-requirements-discovery/)). No framework com IA é o
  **QA Challenger**, que "walks through both documents asking adversarial questions across 8 categories:
  happy path gaps, failure modes, edge cases, security boundaries…"
  ([Test Double](https://testdouble.com/insights/three-amigos-with-ai-stop-building-the-wrong-thing-faster)).
- **É a lente que CRISTALIZA o critério testável.** Automation Panda define a divisão de trabalho com
  precisão: **Negócio** "provides *what* problem must be solved", **Desenvolvimento** "provides *how* the
  solution will be implemented", **Teste** "verifies that the delivered software works correctly… and tries
  to find defects" ([Automation Panda](https://automationpanda.com/2017/02/20/the-behavior-driven-three-amigos/)).
  A saída desta lente é o critério no formato **Given/When/Then**, "a common format for discussion" que o
  desenvolvedor usa como direção e o testador usa para automação.

### Como as 3 lentes, juntas, geram o critério de aceitação

O mecanismo é o de **Specification by Example / Example Mapping**: a conversa não produz prosa, produz
**exemplos concretos** — e exemplo concreto é o que se converte em teste de aceitação.

- **Regra (azul) ⇄ critério de aceitação.** Em Example Mapping, "write a **rule** for each known acceptance
  criteria on a blue card" — a regra *é* o critério ([Automation Panda · Example Mapping](https://automationpanda.com/2018/02/27/bdd-example-mapping/)).
- **Exemplo (verde) ⇄ teste.** Cada exemplo verde ilustra **exatamente uma** regra azul, e "engineers can
  easily turn example cards into Gherkin scenarios" — o exemplo vira o Given/When/Then. Os exemplos são
  "a great basis for our acceptance tests" ([Cucumber docs](https://cucumber.io/docs/bdd/example-mapping/);
  [Cucumber · introdução](https://cucumber.io/blog/bdd/example-mapping-introduction/)).
- **Pergunta (vermelho) ⇄ honestidade.** Toda ambiguidade que a lente QA levanta e o time não resolve vira
  um cartão vermelho: "you've just turned an *unknown unknown* into a *known unknown*"
  ([Wynne · Medium](https://medium.com/@mattwynne/introducing-example-mapping-42ccd15f8adf)). Isso impede que
  suposição vire código.
- **O mapa é um termômetro de prontidão (anti-teatro visual):** muitos **vermelhos** = incerteza alta, *não
  está pronto*; muitos **azuis** = história grande demais, *fatie*; uma regra com exemplos demais = *há uma
  regra escondida* ([Wynne · Medium](https://medium.com/@mattwynne/introducing-example-mapping-42ccd15f8adf)).
  Em ~25 min uma história bem dimensionada se mapeia ([Cucumber docs](https://cucumber.io/docs/bdd/example-mapping/)).

### Por que a prática previne mal-entendidos

Três mecanismos, todos com evidência:

1. **Trava a sequência problema→solução.** Negócio fixa o *porquê* antes de Desenvolvimento propor o *como*;
   o framework com IA torna isto regra dura (BA não olha o código primeiro) justamente para a feasibility não
   "encolher" o requisito ([Test Double](https://testdouble.com/insights/three-amigos-with-ai-stop-building-the-wrong-thing-faster)).
2. **Externaliza a ambiguidade.** A postura *Protest* + o cartão de pergunta transformam "achismo" em "questão
   registrada", em vez de cada amigo sair com um entendimento diferente
   ([Smart](https://johnfergusonsmart.com/three-amigos-requirements-discovery/); [Wynne](https://medium.com/@mattwynne/introducing-example-mapping-42ccd15f8adf)).
3. **Substitui opinião por exemplo.** O objetivo declarado do encontro é "shared understanding of what it will
   take for the story to be done" — e exemplo concreto não admite as duas leituras que uma frase abstrata admite
   ([Cucumber · introdução](https://cucumber.io/blog/bdd/example-mapping-introduction/);
   [Adzic patterns](https://gist.github.com/rpivo/1469476d9c4cd3ea41f8709eaae94920)).

---

## Aplicação à etapa 4 (as 3 perguntas como gerador de critério)

A etapa 4 já adota o Three Amigos como **obrigatório**: para **cada comportamento**, três perguntas —
*por quê existe* (propósito), *como funciona* (comportamento), *como saberemos que está certo* (critério
testável) — e o resultado vira os critérios que o Gate B verifica ao vivo (ver `docs/PIPELINE.md`,
etapa 4). Esta pesquisa fundamenta **como** fazer isso sem virar teatro. O desafio próprio do projeto:
**não há 3 pessoas, há 1 agente** (`ui-ux-designer`). Logo, as 3 perspectivas são **3 LENTES sequenciais**
que o mesmo agente aplica — e há precedente direto disso na literatura com IA.

### Princípio: lentes sequenciais, não simultâneas (e a ordem é a regra)

A pesquisa mostra que o valor das lentes **vem da ordem**, não de "ter 3 vozes". O Test Double prova que a
IA pode vestir personas em fases — **BA → Arquiteto → QA Challenger** — e que **misturar as fases colapsa o
valor** (a feasibility contamina o requisito). Traduzindo para o CORE da etapa 4: o briefing deve **forçar o
agente a fechar a Lente 1 de TODOS os comportamentos antes de abrir a Lente 2**, e a Lente 3 por último.
Isso casa com a metodologia do projeto (M2 bottom-up: o *porquê* é o caso concreto; o critério é destilado
dele) e combate o viés de "raciocínio antes do JSON" já documentado nas pesquisas 0006–0010.

### O que cada lente deve FORÇAR (contrato por lente)

Para a pergunta produzir critério (e não prosa), cada lente precisa de uma **saída obrigatória** e uma
**proibição**:

| Lente | Pergunta | DEVE forçar (saída obrigatória) | NÃO pode (anti-teatro) |
|-------|----------|----------------------------------|------------------------|
| **1 · Negócio** | Por quê existe? | Um **propósito** ligado a valor de usuário/negócio + a **regra** que o comportamento encarna (a "regra azul"). Deriva do objetivo, não da tela. | Justificar pelo *como* ("porque a API tem esse campo"); olhar a solução antes do problema. |
| **2 · Desenvolvimento** | Como funciona? | O **comportamento** descrito como exemplos concretos por estado/ação, **restrito** pela ficha de API (etapa 2), DAG (etapa 1) e gaps/no-gos (etapa 3). | Inventar capacidade não confirmada ao vivo; ignorar no-go declarado. |
| **3 · Teste/QA** | Como saberemos? | **≥1 critério Given/When/Then** por regra, **cada um com método de verificação** anexado (ex.: `ao-vivo` / `código` / `manual`), cobrindo happy path **e** ao menos uma borda/erro. | Critério não-binário ("deve funcionar bem"); regra sem nenhum exemplo verde; afirmação sem como-verificar. |

A coluna "DEVE forçar" da Lente 3 é o coração: é o que transforma a etapa 4 em **gerador de critério**. O
formato Given/When/Then com tag de verificação é exatamente o que o Test Double usa para "prevent vague
deliverables by making preconditions, actions, and outcomes explicit and machine-checkable", e é o mesmo
artefato que a etapa 9 (Gate B) consome (ver `docs/PIPELINE.md`, briefing automático do Gate B).

### Mapeamento Example Mapping → schema de saída do Design

Recomenda-se que o **output schema** da etapa 4 (peça 6 de `docs/ANATOMIA-DE-ETAPA.md`) materialize os 4
cartões de Wynne como campos — assim o porteiro tem o que verificar, e o handoff já chega pronto para o Gate B:

- `comportamento` (história/amarelo) — o item sob design.
- `proposito` (saída da Lente 1) — por quê existe.
- `regras[]` (azul) — cada regra = um critério de aceitação.
- `criterios[]` (verde) — por regra: `{ given, when, then, verificacao }`. **≥1 por regra.**
- `perguntas_abertas[]` (vermelho) — ambiguidades não resolvidas (alimentam `ABERTO.md` / Spike).

Isto se conecta às peças já catalogadas: o **pre-mortem** (peça 12) ataca de um ângulo distinto da Lente 3
(QA pergunta "e se?"; pre-mortem afirma "já falhou — por quê?"), e as **lentes por arquétipo** do Gate A
(peça 11) herdam dos critérios produzidos aqui.

### Como o porteiro verifica que o Three Amigos foi feito (e não foi teatro)

O porteiro (`aceita(output)` em `pipeline.config.mjs`, peça 7) deve checar **estrutura**, não intenção.
Verificações mecânicas propostas, em ordem de força:

1. **Completude das 3 respostas** — para **todo** comportamento: `proposito` não-vazio **E** `regras[]`
   não-vazio **E** `criterios[]` não-vazio. (Falha = uma das lentes foi pulada.) Espelha o critério já
   listado no PIPELINE: "Three Amigos feito — critérios escritos de forma testável".
2. **Toda regra tem ≥1 critério (verde sob azul).** Regra azul sem exemplo verde = critério não ilustrado =
   reprovar — é o sinal de "rule with no example" de Example Mapping.
3. **Todo critério é binário e tem método de verificação.** Cada item de `criterios[]` precisa de
   `given/when/then` preenchidos **e** `verificacao ∈ {ao-vivo, código, manual}`. (Combate o critério vago;
   garante que o Gate B saiba *como* checar.)
4. **Cobertura mínima de borda.** Para arquétipos de risco (MUTACAO, DRAWER, BOARD), exigir que ao menos um
   critério não seja happy-path — a Lente *Protest* tem que ter mordido. (Calibrável por arquétipo, peça 15.)
5. **Sinais de imaturidade são bloqueio honesto, não reprovação cega.** Excesso de `perguntas_abertas[]`
   (muito vermelho) ou regras demais (muito azul) = história não pronta / grande demais → **early-exit**
   (peça 10) pedindo fatiamento ou Spike, em vez de empurrar para a frente.

> Nota de método (M4): tudo acima é **fundação a validar contra um caso real** antes de virar CORE/ADR.
> O teste decisivo — "o critério produzido pela Lente 3 é literalmente executável pela etapa 9?" — só se
> responde com um comportamento concreto da primeira feature-piloto. Até lá, vive aqui e em `ABERTO.md`.

---

## Fontes

- **Three Amigos — definição canônica.** Agile Alliance, glossário: as 3 perguntas (Negócio/Dev/Teste),
  "collaborate to define what to do, and agree on how they know when it is done correctly", saída em forma de
  exemplos. https://agilealliance.org/glossary/three-amigos/
- **George Dinwiddie — origem do termo (2009).** Blog de Dinwiddie (tag Three Amigos): negócio, programadores
  e testadores usando exemplos para uma visão compartilhada. https://blog.gdinwiddie.com/tag/three-amigos/ ·
  Entrevista: https://www.infoq.com/interviews/george-dinwiddie-three-amigos/
- **John Ferguson Smart — anatomia do workshop + as posturas Request/Suggest/Protest.** Time-box 30–45 min;
  "One to Request / Suggest / Protest"; "Can you give me an example?"; defere Given-When-Then para depois;
  Example Mapping como técnica leve. https://johnfergusonsmart.com/three-amigos-requirements-discovery/
- **Automation Panda — The Behavior-Driven Three Amigos.** Divisão *what / how / verify*; Given-When-Then como
  "common format"; ACs formalizadas como Gherkin alimentam dev e tester.
  https://automationpanda.com/2017/02/20/the-behavior-driven-three-amigos/
- **Matt Wynne / Cucumber — Example Mapping (técnica).** 4 cartões (história/regra/exemplo/pergunta), ~25 min,
  *unknown unknown → known unknown*, leitura do mapa (vermelho/azul/regra-com-muitos-exemplos), exemplos como
  base dos testes de aceitação.
  https://cucumber.io/blog/bdd/example-mapping-introduction/ ·
  https://cucumber.io/docs/bdd/example-mapping/ ·
  https://medium.com/@mattwynne/introducing-example-mapping-42ccd15f8adf ·
  https://automationpanda.com/2018/02/27/bdd-example-mapping/
- **Gojko Adzic — Specification by Example (2011).** 7 padrões-chave (derivar escopo de objetivos, ilustrar com
  exemplos, especificar colaborativamente, refinar, automatizar sem mudar a spec, validar com frequência,
  evoluir living documentation); exemplos viram a especificação executável e testável.
  https://www.manning.com/books/specification-by-example ·
  https://gist.github.com/rpivo/1469476d9c4cd3ea41f8709eaae94920
- **Test Double — Three Amigos with AI (single-agent / 3 lentes).** A IA veste 3 personas em fases sequenciais
  (BA → Arquiteto → QA Challenger); separação por fase impede colapso de lentes ("BA deliberately avoids looking
  at the codebase"); ACs em Given/When/Then com tag de verificação (AUTO/MANUAL/CODE) como contrato.
  https://testdouble.com/insights/three-amigos-with-ai-stop-building-the-wrong-thing-faster

> Cross-reference interno: `docs/REFERENCIAS.md` (verbete Three Amigos), `docs/PIPELINE.md` (etapa 4 e
> briefing do Gate B), `docs/ANATOMIA-DE-ETAPA.md` (peças 4/6/7/10/11/12/15). Não duplicar — referenciar.
