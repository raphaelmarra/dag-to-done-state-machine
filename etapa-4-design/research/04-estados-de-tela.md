# 04 — Modelar TODOS os estados de uma tela sem esquecer bordas

> Pesquisa LOCAL que fundamenta a etapa 4 (Design). Objetivo: um **método sistemático** para o
> agente cobrir todos os estados de uma tela (nunca "esqueci um estado") e um **critério verificável**
> para o porteiro confirmar que a matriz estado×ação é completa.
> Diátaxis: Explanation + How-to. Fontes ao final (com URLs).

---

## Resumo executivo

A pergunta "cobri todos os estados desta tela?" não se responde por inspiração — responde-se por
**enumeração mecânica**. Há duas tradições que, combinadas, dão exaustividade:

1. **Taxonomia de estados de UI** (lado do *design*): toda tela que carrega dados tem, no mínimo,
   os mesmos arquétipos de estado — **vazio, carregando, erro, parcial, ideal** (o "UI Stack" de
   Scott Hurff). Sergio De Simone (sergiodxa) expande para **11 estados** ao separar sub-casos
   (erro de carga ≠ erro do usuário; vazio-inicial ≠ vazio-de-busca; etc.). Essa lista é a
   **checklist de linhas** da matriz: você não inventa os estados, você instancia um catálogo
   conhecido contra a sua tela.

2. **State-event matrix** (lado da *engenharia*, de Harel/statecharts e do mundo embarcado): uma
   tabela com **estados em um eixo e eventos/ações no outro**, onde **toda célula deve declarar um
   comportamento** — transição, ação, ou "ignorado/ilegal" *explícito*. A força do método é que a
   incompletude vira **visível**: uma célula em branco é um estado-evento esquecido, não uma
   suposição silenciosa (Barr Group; Embedded.com). É o mesmo princípio das métricas de cobertura
   de FSM (cobertura de estados, de transições/arcos, *0-switch* e *1-switch*).

A síntese para a etapa 4: **as linhas vêm da taxonomia de UI** (garante que nenhum *estado* foi
esquecido) e **as colunas vêm das ações/eventos que a feature permite** (garante que nenhuma
*transição* foi esquecida). Preencher a grade inteira — incluindo as células "não se aplica" de
forma explícita — é a definição operacional de "exaustivo". O porteiro não julga gosto; ele checa
**presença de linhas obrigatórias** (vazio/loading/erro presentes) e **ausência de células em
branco** (todo estado tem suas ações resolvidas). Isso transforma "esqueci um estado" de acidente
em **falha de checklist detectável**.

Princípio de fundo, vindo do XState/statecharts e de "make impossible states impossible": modelar
estados como um **enum único e explícito** (não como booleanos soltos `isLoading`/`isError`) elimina
*estados impossíveis* (spinner + erro ao mesmo tempo) e força o autor a nomear cada estado real.
A matriz não é burocracia — é o artefato que **torna a omissão impossível de passar despercebida**.

---

## Parte 1 — Fundamentos: por que a matriz garante exaustividade

### 1.1 Statecharts (Harel, 1987) — o formalismo que evita a explosão e a omissão

David Harel introduziu os **statecharts** em *"Statecharts: A Visual Formalism for Complex Systems"*
(**Science of Computer Programming, vol. 8, 1987, pp. 231–274**). Statecharts estendem o diagrama
de estados convencional com três elementos: **hierarquia** (estados aninhados — *OR-states*),
**concorrência/ortogonalidade** (regiões paralelas — *AND-states*) e **comunicação** (broadcast),
mais **história** (lembrar o sub-estado anterior). A representação visual usa *higraphs* (grafos +
diagramas de Euler). [Harel 1987; Weizmann; statecharts.dev]

Por que isso importa para "não esquecer estados":

- **Hierarquia combate a explosão combinatória.** Sem aninhamento, cada combinação de condições vira
  um estado solto e a tabela explode — e é exatamente quando estados começam a ser esquecidos.
  Agrupar sub-estados sob um pai (ex.: `Carregado` → `{Ideal, Vazio, Parcial}`) mantém a tabela
  legível e completa. [statecharts.dev; Recurse Center]
- **Bubbling de eventos** (em máquinas hierárquicas): se um sub-estado não trata um evento, ele
  **sobe para o pai**. Isso dá uma resposta padrão definida em vez de "cai no vazio" — todo evento
  tem destino. [Embedded.com; rapidsea]
- **Ortogonalidade** modela dimensões independentes sem multiplicá-las (ex.: estado de *dados* ×
  estado de *seleção* × estado de *conexão* como regiões paralelas), evitando que o autor tente
  enumerar manualmente o produto cartesiano e esqueça combinações.

O ganho central, nas palavras do projeto statecharts.dev: o processo de modelagem **exige a
definição explícita de cada estado e suas transições** — criando "uma única fonte de verdade que
descreve o comportamento" e reduzindo combinações estado-evento não tratadas. A omissão deixa de ser
silenciosa.

### 1.2 A state-event matrix — onde a omissão fica visível

A tradução direta do statechart para verificação é a **state-event matrix** (ou *state table*).
Barr Group descreve: *"uma tabela de estados contendo um array (tipicamente esparso) de transições
para cada estado. A tabela lista os tipos de evento (gatilhos) em uma dimensão e os estados na
outra."* Cada célula especifica **a ação a executar** para aquela combinação estado-evento **e a
transição resultante**. [Barr Group; Embedded.com]

A propriedade que nos interessa é **completude por construção**:

> Em uma state-event matrix, **toda combinação estado×evento é uma célula**. Uma célula vazia não é
> "comportamento óbvio" — é um **buraco**: ou se define a transição/ação, ou se marca explicitamente
> como *ignorado* ou *ilegal*. Não há terceira opção silenciosa.

É por isso que a matriz **previne buracos de UX**: o que normalmente seria esquecido (o que acontece
ao clicar "Salvar" enquanto a tela ainda está `Carregando`? e ao receber um erro 500 no estado
`Editando`?) passa a ser uma **célula que exige resposta**. A ausência de resposta é detectável a
olho nu (e por máquina). Barr Group nota ainda que substituir flags globais espalhados por essa
estrutura reduz "ordens de magnitude" os caminhos de execução convolutos — exatamente os caminhos
onde bordas se escondem.

### 1.3 Cobertura de FSM — a métrica que define "exaustivo"

A literatura de teste de máquinas de estado dá os **critérios de exaustividade** que podemos exigir
do porteiro: [ResearchGate — *Design Verification and Functional Testing of FSMs*; SystemVerilog FSM coverage]

| Critério | O que cobre | Tradução para a tela |
|---|---|---|
| **State coverage** | Todo estado é alcançado | Toda linha da matriz é um estado real e atingível |
| **Transition / arc coverage (0-switch)** | Toda transição (célula) é exercida ao menos uma vez | Toda célula "ativa" da matriz tem comportamento definido e testável |
| **1-switch coverage** | Todo par de transições consecutivas | Sequências de borda (ex.: `Carregando`→`Erro`→*retry*→`Carregando`) |
| **Reachable state set** | Estados alcançáveis a partir do inicial | Nenhum estado "fantasma" sem caminho de entrada; nenhum sem saída |

Para a etapa 4 não precisamos de 1-switch completo, mas o conceito é útil: o porteiro deve exigir
**state coverage + transition coverage** como mínimo — toda linha obrigatória presente e nenhuma
célula ativa em branco.

### 1.4 "Make impossible states impossible" — modelar para não esquecer

Kent C. Dodds (creditando David Khourshid, autor do XState) argumenta que representar estado com
**booleanos independentes** (`isLoading`, `isError`, `isSuccess`) cria **estados impossíveis e
contraditórios** — `isLoading && isError` não tem significado, mas o tipo permite. A solução é um
**estado único e explícito** (enum/status: `idle | pending | resolved | rejected`), que "torna
impossível ter mais de um estado porque só há valores válidos". [Kent C. Dodds; XState]

Consequência para o nosso método: **modelar a tela como um enum de estados (não flags soltas) é o
que torna a enumeração possível.** Se o estado é um conjunto de booleanos, "todos os estados" é um
produto cartesiano nebuloso (2ⁿ combinações, a maioria impossível). Se o estado é um enum, "todos os
estados" é literalmente **a lista de valores do enum** — finita, nomeável, e portanto checável.
XState formaliza isso: ao definir estados finitos, "seu app nunca pode estar em dois estados
conflitantes ao mesmo tempo (como mostrar um spinner e uma mensagem de erro)". [XState; whereisthemouse]

---

## Parte 2 — A taxonomia de estados de UI (as linhas obrigatórias)

### 2.1 O "UI Stack" — os 5 estados (Scott Hurff)

Scott Hurff cunhou o **UI Stack**: todo elemento de UI deve considerar **cinco estados distintos**.
[Scott Hurff; Treehouse; LaunchPad Lab]

| Estado | O que é | Quando ocorre | Por que é esquecido |
|---|---|---|---|
| **Ideal** | Tela com conteúdo cheio e útil — a "screenshot de marketing" | Operação normal, a maior parte do tempo | Designers pulam direto pra ele e tratam o resto como exceção |
| **Vazio (Empty)** | Sem dados pra mostrar (3 sub-casos abaixo) | Primeiro uso, dados limpos, busca sem resultado | Tratado como "afterthought", fica frio/confuso |
| **Carregando (Loading)** | Sistema buscando/preparando dados | Operações assíncronas (fetch, upload) | Inserido por último, não como experiência central |
| **Erro (Error)** | Algo falhou — input inválido, 500, upload incompleto | Quando a operação esperada encontra obstáculo | Complexo e indesejável de desenhar; recebe atenção mínima |
| **Parcial (Partial)** | Dados esparsos mas não vazios; ou parte carregou e parte não | Usuário começou a popular; carga incremental | Parece "meio-termo awkward" entre vazio e ideal |

Diretrizes de design por estado (Hurff): **Vazio** deve responder "e agora?" com CTA e copy que
ensina ("Você ainda não adicionou itens", não "Sem dados"); **Erro** deve **preservar o input do
usuário** e usar linguagem humana, não código críptico; **Carregando** deve cuidar da *velocidade
percebida* (skeleton screens — Luke Wroblewski; ações otimistas — Mike Krieger/Instagram: "ninguém
quer esperar enquanto espera"); **Parcial** deve mostrar a trajetória até o ideal (ex.: barra de
completude do LinkedIn). [Scott Hurff]

### 2.2 A expansão para 11 estados (sergiodxa)

Sergio De Simone separa sub-casos que o UI Stack agrupa, chegando a **11 estados** — útil como
**checklist fina** porque cada separação é uma borda que costuma ser esquecida: [sergiodxa]

1. **Ideal** — tudo certo, conteúdo cheio.
2. **Carregando** — primeira carga em andamento.
3. **Erro de carga (Loading Error)** — a carga inicial falhou (rede/servidor).
4. **Vazio — sem dados (Empty Data)** — não há registros (primeiro uso).
5. **Vazio — sem resultados (Empty Results)** — busca/filtro não retornou nada (≠ não ter dados).
6. **Parcialmente carregado (Partially Loaded)** — parte chegou, parte ainda vem.
7. **Dados estranhos (Weird Data)** — conteúdo fora do esperado (caracteres não-ASCII, textos
   gigantes, valores extremos) que quebram o layout.
8. **Erro do usuário (User Error)** — validação de input falhou (≠ erro de sistema).
9. **Carregando por ação do usuário (User Action Loading)** — spinner de um *submit*, não da carga
   inicial.
10. **UI otimista pendente (Pending Optimistic)** — mostrou o resultado antes de confirmar.
11. **Revalidando (Revalidating)** — tem dado em cache e está atualizando em background.

Tese de De Simone: "um bom designer pensa em todos eles **desde o começo**" — a maioria dos
produtos cobre só 3–4 e o resto é descoberto na implementação. Essa é exatamente a falha que a
etapa 4 quer matar.

### 2.3 A taxonomia do "Vazio" (porque é o mais esquecido)

O estado vazio não é um — são quatro casos com cópia e CTA diferentes (consenso entre Eleken,
Pencil&Paper, Toptal, Rareview): [Eleken; Pencil & Paper; Toptal; UX Design World]

| Sub-caso de vazio | Gatilho | O que a tela deve dizer |
|---|---|---|
| **Primeiro uso** | Produto novo, nada criado ainda | Onboarding: o que é, por que importa, CTA pra criar o primeiro |
| **Limpo pelo usuário** | Inbox zero, tarefas concluídas | Recompensar/celebrar, não cobrar próximo passo |
| **Sem resultados** | Busca/filtro retornou nada | Inferir intenção, sugerir alternativas, limpar filtro |
| **Erro vira vazio** | Falha que resulta em "nada a mostrar" | Distinguir de "não há dados": oferecer *retry*, não CTA de criação |

O ponto crítico (debate da comunidade de UX writing): **"sem resultados", "sem dados" e "erro de
carga" parecem iguais na tela, mas são estados diferentes** com ações diferentes (criar vs. ajustar
busca vs. tentar de novo). Confundi-los é um buraco de UX clássico. [Eleken; sergiodxa]

---

## Parte 3 — O método de cobertura (com evidência)

Junta-se a taxonomia (linhas) com a state-event matrix (grade) em um procedimento de 6 passos que o
agente da etapa 4 executa **mecanicamente** — sem depender de inspiração.

### Passo 1 — Modele o estado como enum único (não flags)
Liste o(s) **eixo(s) de estado** da tela como enum(s) explícito(s). Se houver dimensões
independentes (ex.: estado de *dados* × estado de *seleção*), use regiões ortogonais em vez do
produto cartesiano. *Evidência:* Kent C. Dodds / XState — flags soltas geram estados impossíveis;
enum torna "todos os estados" = "lista de valores".

### Passo 2 — Instancie a taxonomia (gere as linhas)
Percorra o catálogo de 11 estados (§2.2) e, para cada um, decida: **aplica-se a esta tela? sim →
vira linha; não → registre *por que não* (uma frase).** Isso garante *state coverage* e força a
justificar omissões em vez de esquecê-las. *Evidência:* UI Stack (Hurff) + 11 estados (sergiodxa);
"pensar em todos desde o começo".
> Mínimo não-negociável para qualquer tela que carrega dados: **Carregando, Vazio, Erro** presentes
> (e Ideal). Parcial/otimista/revalidando conforme a tela.

### Passo 3 — Liste as ações/eventos (gere as colunas)
Enumere tudo que pode acontecer: **ações do usuário** (clicar, submeter, filtrar, voltar, cancelar)
e **eventos do sistema** (resposta chega, erro chega, timeout, token expira, dado externo muda).
*Evidência:* state-event matrix — eventos são uma das duas dimensões da tabela. [Barr Group]

### Passo 4 — Preencha TODA célula (o coração do método)
Para cada par **(estado, ação/evento)**, a célula declara **{ação executada → próximo estado}** ou
um marcador explícito: **`ignorado`** (sem efeito proposital) ou **`ilegal/impossível`** (não pode
ocorrer aqui — diga por quê). **Célula em branco = buraco.** *Evidência:* a matriz não admite
silêncio — célula vazia é estado-evento esquecido (Barr Group; Embedded.com).

### Passo 5 — Verifique alcançabilidade e bordas
- **Entrada e saída de cada estado:** todo estado tem caminho de entrada e de saída (nenhum estado
  fantasma, nenhum beco sem retry/voltar). *Evidência:* reachable state set / FSM coverage.
- **Bordas obrigatórias por contexto da feature**, puxadas do GAP (etapa 3) e da Descoberta de API
  (etapa 2): timeout, lista vazia vs. erro, paginação no fim, *retry* após erro, double-submit,
  dado estranho (§ "Weird Data"), concorrência (salvar enquanto carrega).

### Passo 6 — Pre-mortem das transições (liga com o obrigatório da etapa 4)
Olhe as células marcadas `ignorado`/`ilegal` e pergunte: "se isso *acontecer mesmo*, o que o usuário
vê?". O pre-mortem da etapa 4 (mínimo 3 riscos) sai naturalmente das transições negligenciadas.
*Evidência:* 1-switch coverage (pares de transição) — as falhas reais moram em sequências, não em
estados isolados.

---

## Parte 4 — Aplicação à etapa 4 (matriz estado×ação completa)

### 4.1 Formato do entregável (o que o `ui-ux-designer` produz)

A etapa 4 já exige "Matriz de estados × ações" e "comportamento por caso (erros, bordas, vazios)".
Este método dá a **estrutura concreta** dessa matriz:

**Bloco A — Declaração de estados (enum).** Lista dos estados da tela como enum único + dimensões
ortogonais se houver. Para cada estado do catálogo de 11: *presente* ou *N/A com motivo*.

**Bloco B — A grade estado×ação.** Linhas = estados (do Bloco A). Colunas = ações do usuário +
eventos do sistema. Cada célula: `{ação → próximo estado}` | `ignorado` | `ilegal (motivo)`.
Nenhuma célula em branco.

**Bloco C — Comportamento por estado.** Para cada linha, o "comportamento por caso" textual: o que a
tela mostra, qual a cópia (especialmente Vazio e Erro), qual CTA, o que preserva (input no erro).

### 4.2 Exemplo aplicado — a aba "Comandos CLI" (nosso caso real)

A feature real tinha os estados *loading, vazio, erro de carga, editando*. Instanciando o método:

**Bloco A — estados presentes** (e por que os outros são N/A):

| Estado (catálogo) | Presente? | Nesta aba |
|---|---|---|
| Carregando (inicial) | sim | `Carregando` — buscando a lista de comandos |
| Erro de carga | sim | `ErroCarga` — falha ao buscar a lista |
| Vazio — sem dados | sim | `Vazio` — nenhum comando cadastrado (primeiro uso) |
| Vazio — sem resultados | sim* | se houver busca/filtro na aba; senão N/A |
| Ideal | sim | `Lista` — comandos carregados e exibidos |
| Carregando por ação | sim | `Salvando` — submit de uma edição |
| Erro do usuário | sim | `Editando` com validação falha (campo inválido) |
| Parcialmente carregado | N/A | lista não é paginada/incremental nesta aba |
| UI otimista pendente | N/A | edição confirma antes de refletir (decisão de design) |
| Revalidando | N/A | sem cache com revalidação em background |
| Dados estranhos | sim | comando com texto muito longo / caracteres especiais |

**Bloco B — recorte da grade** (ações nas colunas; `→` indica próximo estado):

| Estado ↓ \ Ação → | Montar/abrir aba | Resposta chega | Erro chega | Clicar "Editar" | Submeter edição | "Tentar de novo" |
|---|---|---|---|---|---|---|
| **Carregando** | (já nele) | → `Lista` ou `Vazio` | → `ErroCarga` | `ilegal` (sem itens ainda) | `ilegal` | `ignorado` |
| **Lista (ideal)** | → `Carregando` | `ignorado` | → `ErroCarga` (refetch) | → `Editando` | `ilegal` (não está editando) | `ignorado` |
| **Vazio** | → `Carregando` | `ignorado` | → `ErroCarga` | `ilegal` (nada a editar) | `ilegal` | `ignorado` |
| **ErroCarga** | → `Carregando` | `ignorado` | `ignorado` | `ilegal` | `ilegal` | → `Carregando` |
| **Editando** | (mantém) | `ignorado` | mostra erro inline, **mantém edição** | `ignorado` | → `Salvando` (ou erro de validação → fica em `Editando`) | `ignorado` |
| **Salvando** | (bloqueia) | → `Lista` (sucesso) | → `Editando` + erro, **input preservado** | `ignorado` | `ignorado` (anti double-submit) | `ignorado` |

Nenhuma célula em branco: cada combinação é transição, `ignorado` ou `ilegal` com motivo. Os buracos
clássicos ficam explícitos — *double-submit* em `Salvando` (= `ignorado`), *retry* só em `ErroCarga`,
**preservação de input** no erro de `Salvando` e de `Editando`.

**Bloco C — comportamento (recorte):** `Vazio` → "Nenhum comando ainda. Crie o primeiro." + CTA (não
"sem dados"); `ErroCarga` → mensagem humana + botão *Tentar de novo* (não código cru); `Salvando`
falho → volta a `Editando` **sem perder o que foi digitado** + erro inline.

### 4.3 Como o porteiro verifica que a matriz é completa

O critério de aceitação da etapa 4 — "**todos os estados da tela cobertos**" e "**casos de erro e
borda documentados**" — vira checagens **mecânicas e binárias**:

| Verificação do porteiro | Regra (binária) | Fundamento |
|---|---|---|
| **Linhas obrigatórias presentes** | Existem estados marcados como `Carregando`, `Vazio` e `Erro` (e `Ideal`) — ou justificativa N/A explícita para tela que não carrega dados | UI Stack: os 5 estados sempre considerados |
| **Catálogo percorrido** | Cada um dos 11 estados aparece como *presente* **ou** *N/A com motivo de 1 linha* | sergiodxa: "pensar em todos desde o começo" |
| **Sem célula em branco** | Toda célula (estado×ação) tem `{ação→estado}`, `ignorado` ou `ilegal(motivo)` | state-event matrix: célula vazia = buraco (Barr Group) |
| **Toda linha tem ≥1 ação resolvida** | Nenhum estado sem nenhuma ação/saída definida | reachable state set / state coverage |
| **Entrada e saída por estado** | Todo estado tem caminho de entrada e de saída (sem beco-sem-retry) | transition coverage; bubbling de evento (Harel) |
| **Erro preserva input** | Estados de erro pós-edição declaram preservação do input do usuário | UI Stack — diretriz de Erro (Hurff) |
| **Vazio com cópia + CTA** | Estados vazios declaram cópia humana e próximo passo (não "sem dados") | taxonomia do vazio (Eleken/Toptal) |
| **Sem estado impossível** | Estado modelado como enum único; não há flags que permitam combinações contraditórias | make-impossible-states-impossible (Dodds/XState) |

A primeira linha do exemplo já mostra o ganho: ao exigir a *coluna* "Erro chega" cruzada com *toda
linha*, o porteiro detecta se o autor esqueceu o que acontece ao receber um 500 enquanto edita —
algo que uma checklist de "estados" sozinha (sem o eixo de ações) não pegaria. **É a interseção
linha×coluna que mata o buraco**, não a lista de estados isolada.

### 4.4 Conexão com o resto do pipeline

- **Entrada:** as colunas (ações/eventos) saem da **Descoberta de API** (etapa 2 — shapes, timeouts,
  limites) e do **GAP** (etapa 3 — bordas, no-gos, dados estranhos). A matriz não nasce do nada;
  ela cristaliza o que as etapas anteriores descobriram.
- **Saída:** a grade alimenta o **Gate A** (lentes por arquétipo — ex.: LISTA já cobra "estado
  vazio" e "estado de erro"; a matriz prova que foram desenhados) e o **Gate B** (cada célula
  ativa vira um cenário de verificação ao vivo — *transition coverage* na prática).
- **Three Amigos + Pre-mortem** (obrigatórios da etapa 4): cada célula `ilegal`/`ignorado` é um
  candidato a risco do pre-mortem ("e se acontecer mesmo?"); cada `{ação→estado}` vira um critério
  testável do Three Amigos ("como saberemos que está certo?").

### 4.5 Resumo do princípio para o CORE da etapa 4

> **Linhas = catálogo de estados de UI** (invariante: o catálogo é conhecido e fixo — M3).
> **Colunas = ações/eventos da feature** (variável: extraídas do contexto, do GAP e da API — M1/M3).
> **Exaustivo = grade inteira preenchida**, com N/A e `ilegal` *explícitos*.
> O CORE ensina o *critério* (toda célula resolvida, linhas obrigatórias presentes); o contexto dá
> os *dados* (quais ações, quais estados se aplicam). "Esqueci um estado" deixa de ser acidente:
> vira **célula em branco** ou **linha do catálogo não justificada** — ambas detectáveis pelo
> porteiro.

---

## Fontes

**Statecharts e state machines (formalismo):**
- Harel, D. (1987). *Statecharts: A Visual Formalism for Complex Systems*. Science of Computer Programming, 8, 231–274. PDF: https://dubroy.com/refs/Statecharts_a_visual_formalism_for_complex_systems.pdf — Ref.: https://www.scirp.org/reference/referencespapers?referenceid=962499
- Weizmann Institute (registro do paper): https://weizmann.elsevierpure.com/en/publications/statecharts-a-visual-formalism-for-complex-systems
- statecharts.dev — *What is a statechart* (hierarquia, ortogonalidade, fonte única de verdade): https://statecharts.dev/
- Recurse Center — *Paper of the Week: Statecharts*: https://www.recurse.com/blog/59-paper-of-the-week-statecharts-a-visual-formalism-for-complex-systems

**State-event matrix e robustez (engenharia):**
- Barr Group — *State Machines for Event-Driven Systems* (state table: estados × eventos, célula = ação + transição): https://barrgroup.com/blog/state-machines-event-driven-systems
- Embedded.com — *Implementing Finite State Machines in Embedded Systems* (state-event matrix; bubbling de eventos): https://www.embedded.com/implementing-finite-state-machines-in-embedded-systems/

**Cobertura de FSM (exaustividade):**
- *Design Verification and Functional Testing of Finite State Machines* (state/transition/arc coverage, reachable state set): https://www.researchgate.net/publication/221294239_Design_Verification_and_Functional_Testing_of_Finite_State_Machines
- State Transition Testing (0-switch / 1-switch): https://www.softwaretestinghelp.com/state-transition-testing-technique-for-testing-complex-applications/
- Functional FSM Paths Coverage (SystemVerilog): https://www.design-reuse.com/articles/24546/functional-fsm-paths-coverage-systemverilog.html

**Estados de UI (design):**
- Scott Hurff — *The UI Stack* (os 5 estados: blank/loading/partial/error/ideal): https://www.scotthurff.com/posts/why-your-user-interface-is-awkward-youre-ignoring-the-ui-stack/
- Sergio De Simone (sergiodxa) — *The States of the UI* (11 estados): https://sergiodxa.com/articles/the-states-of-the-ui
- Akhileshwar N. Pandey — *Understanding the 5 States of UI Design*: https://medium.com/design-bootcamp/understanding-the-5-states-of-ui-design-simplified-7774856adc40
- Trendyol Tech — *Simple UI Problem: States — Loading, Error, Empty and Content*: https://medium.com/trendyol-tech/simple-ui-problem-states-loading-error-empty-and-content-cbf924b39fcb
- Treehouse — *Five UI States*: https://teamtreehouse.com/library/designing-dynamic-ui-states/five-ui-states
- LaunchPad Lab — *Designing for the 5 States of Web Design*: https://launchpadlab.com/blog/designing-for-the-5-states-of-web-design/

**Estado vazio (taxonomia fina):**
- Eleken — *Empty state UX examples and design rules*: https://www.eleken.co/blog-posts/empty-state-ux
- Pencil & Paper — *Empty State UX Examples & Best Practices*: https://www.pencilandpaper.io/articles/empty-states
- Toptal — *Empty States: The Most Overlooked Aspect of UX*: https://www.toptal.com/designers/ux/empty-state-ux-design
- Rareview/Chuck Pearson — *UI design for empty states, zero data, and on-boarding*: https://medium.com/rareview/ui-design-for-empty-states-zero-data-and-on-boarding-264cdb92826e

**Estados impossíveis / modelagem (XState):**
- Kent C. Dodds — *Make Impossible States Impossible* (booleanos soltos vs. enum único): https://kentcdodds.com/blog/make-impossible-states-impossible
- XState (statelyai) — *State machines, statecharts, and actors* (estados finitos; impossível mostrar spinner + erro): https://github.com/statelyai/xstate
- whereisthemouse — *Avoid impossible UI states with React, TypeScript and XState*: https://whereisthemouse.com/avoid-impossible-ui-states-with-react-typescript-and-xstate
