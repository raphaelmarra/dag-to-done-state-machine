# 0011 — Grafo de dependências de software: ACÍCLICO (DAG) ou CÍCLICO? Confronto com o CORE-DAG

> Pesquisa de fundamentação. Pergunta central: nossa decisão de FORÇAR aciclicidade (regras A1/A2/A3) é
> teoricamente sólida, ou é uma simplificação que esconde ciclos reais? A condensação (DAG de SCCs) seria
> mais honesta? Esta nota foi escrita para **confrontar**, não confirmar, a abordagem atual.

---

## Resumo executivo

Há duas afirmações verdadeiras ao mesmo tempo, e a confusão entre elas é a raiz da tensão com a "fonte CRM":

1. **Um grafo de dependências é, em geral, apenas um grafo dirigido — PODE ter ciclos.** "Grafo de
   dependências" e "DAG" não são sinônimos. O DAG é o caso *desejável* (e o alvo de princípios de
   arquitetura), não uma propriedade garantida. Software real contém ciclos: dependência mútua entre
   módulos, recursão, callbacks, imports circulares, e relações de dados navegáveis nos dois sentidos
   (ex.: `Employee → supervisor → Employee`).

2. **Mas a aciclicidade só faz sentido relativa a UMA relação fixada e a UM nível de granularidade.**
   Se você define a aresta como "consumidor → provedor" (precisa-de-para-existir/para-construir) e
   escolhe a granularidade certa, a maioria dos grafos de *build/compilação* converge para DAG — e onde
   não converge, a **condensação** (colapsar cada componente fortemente conexo, SCC, em um super-nó)
   sempre devolve um DAG. Topological sort é impossível com ciclo; com condensação volta a ser possível.

**Veredito antecipado:** nosso CORE-DAG não está "errado", mas A1/A2/A3 não *provam* aciclicidade — elas a
*impõem por construção*, escolhendo qual relação vira aresta e jogando o resto para fora do grafo (vista
calculada). Isso é legítimo e padrão da indústria (Acyclic Dependencies Principle), MAS tem um ponto cego:
quando a feature tem **dependência mútua genuína** numa única relação (A precisa de B *e* B precisa de A no
mesmo sentido), A1/A2/A3 não eliminam o ciclo — elas o tornam invisível ou empurram-no para a vista
reversa. Nesses casos a **condensação é mais honesta**: ela admite o SCC e ordena por cima dele. Recomenda-se
adotar a condensação como *cláusula de escape* explícita do CORE-DAG (detalhe na última seção).

---

## Teoria

### 1. Grafo de dependências ≠ DAG

Um grafo de dependências é, por definição, um grafo dirigido onde a aresta A→B significa "A depende de B".
Um DAG é um grafo dirigido **sem ciclos dirigidos**. Os dois conceitos se sobrepõem mas não são idênticos:
todo DAG é um grafo de dependências válido, mas nem todo grafo de dependências é um DAG. A direção da
aresta é uma *escolha de modelagem* (o que significa "depender"), e é essa escolha que decide se ciclos
podem ou não aparecer.

DAGs são "ideais para cenários em que um caminho cíclico seria sem sentido — agendamento de tarefas,
sistemas de build, resolução de dependências". Mas há cenários onde o caminho de volta *tem* sentido (uma
relação supervisor↔subordinado em dados, mensageria bidirecional), e aí o grafo é legitimamente cíclico.

### 2. Por que ciclos surgem em software

- **Dependência mútua entre módulos / imports circulares**: módulo A importa B e B importa A. Comum em
  ES modules, Python, Java. Manifesta-se como um SCC de tamanho ≥ 2 no import graph.
- **Recursão e dependência mútua de funções**: no call graph, `f` chama `g` e `g` chama `f` (ou `f` chama
  a si mesma) cria um ciclo. Call graphs são *inerentemente* propensos a ciclos.
- **Callbacks / inversão de fluxo**: a camada baixa "chama de volta" a alta em runtime — o fluxo de
  controle volta, mesmo quando a dependência de *código-fonte* foi desenhada para não voltar.
- **Relações de dados navegáveis nos dois sentidos**: o caso clássico do modelo relacional/CRM. Um
  relacionamento `1:n` implica o `n:1` reverso; `Employee.supervisor → Employee` é um ciclo sobre a
  própria entidade. É exatamente esse mundo que diz "não é DAG, é grafo navegado bidirecionalmente".

### 3. SCC, Tarjan e topological sort

- Um **componente fortemente conexo (SCC)** é um conjunto maximal de vértices em que todos alcançam todos.
  Todo ciclo está inteiramente contido em um SCC; ciclos que se sobrepõem fundem-se num único SCC. SCCs
  são os "contêineres naturais" da estrutura cíclica.
- **Algoritmo de Tarjan** (e Kosaraju) encontra todos os SCCs em tempo linear O(V+E). SCC de tamanho 1 =
  nó acíclico; SCC de tamanho ≥ 2 = ciclo (dependência circular) explícito.
- **Topological sort** ordena os nós respeitando todas as arestas (provedor antes do consumidor). É
  **impossível** se houver qualquer ciclo dirigido — não existe ordem linear que respeite A→B e B→A.

### 4. Condensação: o DAG dos SCCs

A **condensação** colapsa cada SCC em um único super-nó. O grafo resultante é **sempre um DAG** — é um
teorema, não uma heurística. Isso permite, mesmo num grafo cíclico:

1. rodar Tarjan → obter os SCCs;
2. condensar → DAG de super-nós;
3. topological sort do DAG → ordem de processamento, com a regra de que os membros de um SCC são tratados
   "em bloco" (consecutivamente / juntos), pois entre eles não há ordem.

Esse padrão "condensar-depois-ordenar" é o método-padrão para escalonar tarefas/dependências em grafos com
ciclos. Ele não *elimina* o ciclo — ele o **isola e o nomeia**, restaurando a aciclicidade num nível de
granularidade mais grosso. É honesto: deixa o ciclo visível como um super-nó.

### 5. Quebrar ciclos (quando se quer um DAG de verdade)

O **Acyclic Dependencies Principle (ADP)** de Robert C. Martin afirma que o grafo de dependências de
pacotes/componentes **não deve ter ciclos**. Para componentes/pacotes, Martin trata ciclos como *problema
de design* a ser quebrado, com duas técnicas:

- **Dependency Inversion Principle (DIP)**: ambos passam a depender de uma abstração (interface) em vez de
  um depender do concreto do outro — a aresta de volta é redirecionada para o abstrato.
- **Extrair um novo módulo**: o que A e B compartilham vira um terceiro módulo C; A→C e B→C, sem A↔B.

Ponto crucial e frequentemente esquecido: o ADP vale para **dependências de código-fonte/build** (o que
precisa compilar antes do quê). Ele *não* afirma que **relações de dados em runtime** devam ser acíclicas —
ali ciclos (`Employee→Employee`) são normais e corretos. Misturar os dois domínios é a origem da
contradição com a "fonte CRM".

---

## CONFRONTO com nosso CORE-DAG

Relembrando nossas três regras que forçam aciclicidade:
- **A1** — "nó" = unidade consumida numa direção; entidades de dados com referência mútua NÃO são nós.
- **A2** — toda aresta é consumidor→provedor, direção única, nunca aresta de volta.
- **A3** — o reverso ("quem me consome" / blast radius) é uma **vista calculada por travessia**, não aresta.

### Onde a premissa SE SUSTENTA (forte)

1. **A relação que escolhemos é a "certa" para gerar DAG.** Nosso grafo modela *dependência de
   construção/consumo de uma feature* — "para fazer X eu preciso que Y exista antes". Esse é precisamente o
   domínio onde o ADP se aplica e onde a indústria *quer* um DAG. Não estamos modelando "relações de dados",
   estamos modelando "ordem de habilitação". A escolha de A2 está alinhada com build dependency graphs.
2. **A3 é teoricamente correta.** "Quem me consome" é literalmente a aresta transposta (grafo reverso). Não
   é informação nova — é a mesma aresta lida ao contrário. Materializá-la como aresta real **criaria**
   ciclos artificiais (A→B *e* B→A) que não existem na semântica de dependência. Computar blast radius por
   travessia do grafo transposto é o que ferramentas reais fazem. A3 está certa e é a regra mais defensável.
3. **A1, como regra de granularidade, tem respaldo.** Escolher a granularidade na qual o grafo é acíclico é
   exatamente o que a condensação formaliza. "Entidades com referência mútua não são nós (separados)"
   equivale, na prática, a tratá-las como um único nó — que é o super-nó da condensação.

### Onde a premissa É FRÁGIL (pontos cegos)

1. **A1/A2/A3 não *provam* aciclicidade — impõem-na por construção.** Elas decidem *a priori* que só existe
   uma relação e que ela nunca volta. Isso é uma *definição*, não um *resultado*. O risco: ao declarar "isto
   não é um nó" ou "esta aresta não existe", podemos estar **mascarando um ciclo real** em vez de não tê-lo.
   A aciclicidade fica garantida no papel, mas talvez por amputar o grafo, não por o grafo ser acíclico.

2. **Dependência mútua GENUÍNA na *mesma* relação.** O caso que A1/A2 não resolvem honestamente: quando, na
   relação consumidor→provedor, **A precisa de B para ser construído E B precisa de A para ser construído**.
   Exemplos plausíveis numa feature:
   - dois módulos com **import circular** legítimo (ainda não refatorado por DIP);
   - **funções mutuamente recursivas** (parser ↔ lexer; render ↔ layout);
   - **máquina de estados** onde a transição da fase X chama a fase Y e Y pode reentrar em X;
   - duas tabelas com **FKs mútuas obrigatórias** (NOT NULL nos dois lados) — nenhuma pode ser criada/povoada
     primeiro sem a outra: um SCC de dados *real* na ordem de migração.
   Nesses casos A2 ("nunca aresta de volta") obriga o agente a **escolher arbitrariamente** uma direção e
   **descartar** a outra. A dependência descartada não some — ela vira um ciclo *escondido*. O CORE-DAG
   produziria um DAG bonito que **mente** sobre a ordem real de habilitação.

3. **A3 esconde, não resolve, ciclos que viram bidirecionais.** A3 está certa *quando* o reverso é mera
   vista. Mas se a relação de volta for **de natureza diferente** da de ida (ex.: A depende de B em build,
   B depende de A em runtime via callback), tratá-la como "vista calculada do mesmo grafo" é incorreto — são
   duas arestas semânticas distintas, e juntas formam um ciclo legítimo que A3 não captura.

4. **A fonte CRM não estava errada — estava em outro domínio.** Ela descreve **relações de dados** (navegáveis
   nos dois sentidos), onde ciclos são a norma. Nós, ao mudar a aresta para "dependência de construção",
   mudamos o domínio e por isso obtemos (quase) um DAG. **A contradição é aparente**: os dois podem coexistir.
   O perigo é usar A1/A2/A3 também para classificar *relações de dados* de uma feature — aí estaríamos
   aplicando a regra fora do domínio em que ela é válida e perderíamos informação real (navegação reversa).

### A condensação seria mais honesta?

**Sim, como cláusula de escape — não como modelo default.** Recomendação:

- **Manter A1/A2/A3 como caso comum** (a maioria das features *é* acíclica na relação de construção; forçar a
  busca por DAG é saudável e segue o ADP). Inclusive incentivar a quebra de ciclo via DIP/extração quando o
  ciclo for um *design smell* (igual ao que Martin prescreve para pacotes).
- **Adicionar uma regra A4 (condensação explícita):** *quando o agente detectar dependência mútua genuína na
  mesma relação (A precisa de B e B precisa de A para existir/ser construído), ele NÃO deve apagar uma das
  arestas (A2) nem fingir que não é nó (A1). Deve declarar um SCC — um super-nó "ciclo: {A, B}" — e tratá-lo
  como uma unidade indivisível no DAG condensado.* Isso preserva a aciclicidade do grafo de alto nível
  (super-nós) **sem mentir** sobre o ciclo interno, e mantém o topological sort possível.
- **Tornar A2 falsificável:** o CORE deve instruir o agente a *testar* a aciclicidade (mentalmente: "existe
  caminho de volta de B para A nesta MESMA relação?"), e só então afirmar DAG. Hoje A2 *assume* a resposta.
  A2 deveria ser uma *meta a verificar*, não um *axioma*. (Alinha com a metodologia M4: "testar antes de
  cristalizar".)

Em resumo, nossa escolha é teoricamente sólida **para o domínio que escolhemos** (dependência de
construção/consumo) e A3 é claramente correta. O elo fraco é tratar a aciclicidade como *dada* em vez de
*verificada*: faltam a detecção de SCC e a condensação como rede de segurança para o caso — minoritário mas
real — de ciclo genuíno. Sem isso, A1/A2 podem produzir um DAG que esconde um ciclo, exatamente a crítica
que a fonte CRM levantou.

---

## Fontes

- Acyclic Dependencies Principle (Robert C. Martin) — Wikipedia: https://en.wikipedia.org/wiki/Acyclic_dependencies_principle
- Dependency Inversion Principle — Wikipedia: https://en.wikipedia.org/wiki/Dependency_inversion_principle
- Tarjan's strongly connected components algorithm — Wikipedia: https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm
- Strongly Connected Components: The Ultimate Guide — PuppyGraph: https://www.puppygraph.com/blog/strongly-connected-components
- Strongly Connected Components Explained — CodeIntuition: https://www.codeintuition.io/blogs/strongly-connected-components
- Graph condensation (condensation → DAG) — MATLAB docs: https://www.mathworks.com/help/matlab/ref/digraph.condensation.html
- 15-451 Strongly Connected Components (Miller/Sutner) — CMU lecture notes: https://www.cs.cmu.edu/~15451-f20/LectureNotes/dfs-scc.pdf
- Directed acyclic graphs (DAGs) — UBB graph algorithms: https://www.cs.ubbcluj.ro/~rlupsa/edu/grafe/dag.html
- DAG vs dependency graph (distinção) — Quora: https://www.quora.com/What-is-the-difference-between-a-directed-acyclic-graph-DAG-and-a-dependency-graph
- Job Scheduling Using Cycle and SCC (condensar-depois-ordenar) — TheAlgorists: https://www.thealgorists.com/Algo/Graph/JobScheduling
- An All-in-One DAG Toolkit — Vaibhav Sagar: https://vaibhavsagar.com/blog/2017/06/10/dag-toolkit/
- On the classification of cyclic dependencies in Java programs — Massey Univ. (PDF): https://mro.massey.ac.nz/server/api/core/bitstreams/37d0316d-5318-488f-b89e-bf8619455c15/content
- Empirical Confirmation (and Refutation) of Presumptions on Software (arXiv 1201.3078): https://arxiv.org/pdf/1201.3078
- Structural and Connectivity Patterns in the Maven Central Dependency Network (arXiv 2508.13819): https://arxiv.org/pdf/2508.13819
- Fix your circular dependencies with dependency inversion — Medium (Louis): https://medium.com/@louismrc/fix-your-circular-dependencies-with-dependency-inversion-e22b6f4c9510
- How to Break a Cyclic Dependency between ES6 modules — Angular In Depth: https://medium.com/angular-in-depth/how-to-break-a-cyclic-dependency-between-es6-modules-fd8ede198596
- Directed Acyclic Graphs (DAGs) data modeling — Software Patterns Lexicon: https://softwarepatternslexicon.com/data-modeling/hierarchical-and-network-modeling/directed-acyclic-graphs-dags/

> Nota: os PDFs do arXiv (1201.3078, 2508.13819) e o PDF de Massey foram localizados via busca mas não
> puderam ser extraídos em texto limpo nesta sessão (conteúdo binário/comprimido). Os pontos teóricos acima
> derivam de fontes textuais verificadas; recomenda-se ler esses PDFs em ferramenta dedicada para corroborar
> dados empíricos de prevalência de SCC em ecossistemas reais (Maven Central, Java).
