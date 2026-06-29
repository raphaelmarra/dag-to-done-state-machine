# 02 — Paralelismo Seguro: file-disjointness, merge conflicts e caminho crítico

> Pesquisa de fundamentação para a etapa 5 (Mapa de dependências). Confronta a REGRA central
> da etapa — "paralelo SÓ onde os arquivos são disjuntos" — com a literatura de merge conflicts,
> teoria de concorrência (disjoint-access-parallelism) e Critical Path Method.
> Data: 2026-06-28.

---

## Resumo executivo

A etapa 5 declara "o que pode rodar em paralelo (com quais arquivos cada unidade toca)" e impõe a
regra: **paralelo só onde os conjuntos de arquivos são disjuntos**. A pesquisa confirma que essa regra
é **a base operacional correta**, mas mostra com evidência que **interseção de arquivos vazia é condição
NECESSÁRIA, não SUFICIENTE** para segurança total. O resultado em três pontos:

1. **File-disjointness elimina o conflito TEXTUAL — comprovadamente.** O Git só reporta conflito quando
   as duas branches alteram as **mesmas linhas do mesmo arquivo** (ou apagam/modificam o mesmo arquivo).
   Conjuntos de arquivos disjuntos **nunca** produzem merge conflict textual: o merge é automático.
   Para o objetivo declarado da etapa 5 — *evitar que duas unidades colidam no merge* — a regra é sólida
   e é exatamente o que a indústria de desenvolvimento agêntico paralelo recomenda ("se duas tarefas têm
   listas de arquivos sobrepostas, elas precisam ser sequenciais, não paralelas").

2. **Existe um limite real: o conflito SEMÂNTICO (ou "de ordem superior").** Quando duas unidades editam
   arquivos **diferentes** mas uma muda um contrato que a outra consome (renomeia uma função, altera a
   assinatura, muda o tipo de retorno, muda uma suposição compartilhada), o Git aplica os dois lados em
   silêncio — **sem nenhum marcador de conflito** — e o resultado quebra no *build* ou no *teste*, não no
   merge. Estudos empíricos medem isso: conflitos de build (compilação) e de teste (comportamento)
   ocorrem em uma fração menor mas não-desprezível dos merges, e são **mais difíceis de detectar** porque
   nenhuma ferramenta textual os enxerga. Esse caso é estruturalmente idêntico ao "U1 muda algo que U3
   consome" — disjunção de arquivos não o cobre.

3. **A reconciliação já existe no pipeline: é o DAG (etapa 1).** A dependência semântica que escapa à
   disjunção de arquivos é precisamente uma **aresta de dependência de consumo** — o objeto que a etapa 1
   mapeia. Logo, a regra completa de paralelismo seguro da etapa 5 é composta: **(a) interseção de arquivos
   vazia** (verificável mecanicamente pelo porteiro) **E (b) ausência de aresta de dependência entre as
   unidades no DAG** (herdada da etapa 1). A condição (a) sozinha previne o conflito textual; (b) cobre o
   semântico. O porteiro verifica (a) por construção; (b) vem de montante.

**Veredito:** manter "paralelo só onde arquivos são disjuntos" como a **regra dura e mecanicamente
verificável** da etapa 5 (é o filtro que o porteiro consegue checar sem fé). Mas declarar explicitamente
que ela garante apenas a ausência de **colisão no merge** — não a ausência de **interferência semântica**
— e que esta última é coberta pela ausência de dependência no DAG da etapa 1. A segurança do paralelismo
é verificável pelos arquivos *para o conflito textual*; para o conflito semântico, é verificável pelas
*arestas do DAG*. Em nenhum dos dois casos depende de fé. Detalhes e aplicação abaixo.

---

## 1. File-disjointness elimina o conflito textual (a evidência a favor da regra)

### 1.1 Quando — e só quando — o Git reporta conflito

A definição operacional é estreita e bem-documentada. Um merge conflict textual ocorre quando:

- as duas branches **modificam as mesmas linhas do mesmo arquivo**; ou
- uma branch **apaga** um arquivo enquanto a outra o **modifica** (o Git não sabe se mantém ou remove); ou
- a **mesma seção** de um arquivo foi alterada nos dois lados.

E, simetricamente, o Git **resolve automaticamente** (sem intervenção) quando:

- **arquivos diferentes** são modificados em branches diferentes;
- **seções não-sobrepostas do mesmo arquivo** são modificadas em cada branch.

A consequência direta para a etapa 5: **se duas unidades tocam conjuntos de arquivos disjuntos, é
*impossível* haver merge conflict textual entre elas** — não há sequer um arquivo comum onde linhas
pudessem colidir. Isto não é heurística; é uma propriedade da mecânica do merge de três vias (3-way
merge), que opera arquivo a arquivo e, dentro do arquivo, hunk a hunk. (Fonte: Atlassian Git Tutorial;
GitHub Docs; W3Schools Git Merge Conflicts.)

### 1.2 É o que a prática de desenvolvimento paralelo recomenda

Guias de desenvolvimento paralelo (inclusive agêntico, com múltiplos agentes/worktrees) convergem na
mesma regra que a etapa 5 já adota, em linguagem quase idêntica:

- "Se duas tarefas têm listas de arquivos sobrepostas, elas precisam ser **sequenciais, não paralelas**."
- O passo de decomposição **exige documentar**: "Quais arquivos cada tarefa toca?" — e então
  "**verificar que não há sobreposição de arquivos** entre as tarefas" antes de criar os worktrees.
- Pular esse passo é descrito como "**o erro mais caro**".

Ou seja, "declarar os arquivos que cada unidade toca + paralelizar só os disjuntos" é hoje uma prática
estabelecida, não invenção do nosso pipeline. A etapa 5 a formaliza num gate. (Fonte: MindStudio,
*Parallel Agentic Development With Git Worktrees*.)

### 1.3 Fundamento teórico em concorrência: disjoint-access-parallelism e resource groups

A regra tem um análogo direto e mais antigo na teoria de sistemas concorrentes:

- **Disjoint-access-parallelism**: o princípio de que "operações que afetam **partes diferentes** de uma
  estrutura **não interferem** entre si" e por isso podem executar em paralelo. Trocando "estrutura" por
  "base de código" e "partes" por "arquivos", obtém-se exatamente a regra da etapa 5.
- **Particionamento por grupos de recursos (resource groups)**: divide-se o recurso compartilhado em
  **grupos disjuntos**; a regra de formação do grupo é precisa — "**se qualquer tarefa precisa acessar
  dois recursos simultaneamente, eles pertencem ao mesmo grupo de recurso**". Aplicado a arquivos: se
  uma unidade precisa tocar os arquivos X e Y juntos, X e Y caem no mesmo "grupo" e nenhuma outra unidade
  que toque X ou Y pode paralelizar com ela. Isto é a justificativa formal de por que a **interseção** é
  o critério certo: o paralelismo seguro é o paralelismo entre grupos disjuntos.
- **Data partitioning** (particionamento de dados): "divide tarefas ao longo de barreiras funcionais em
  domínios onde as tarefas **rodam em paralelo sem conflito**, com mínimo compartilhamento de dados".

(Fontes: Gray et al., *Granularity of Locks* — clássico de 1976; ScienceDirect, *Coarse/Fine Granularity*;
revisão de protocolos de locking multiprocessador, arXiv 1909.09600; patente USPTO 11301430 sobre
particionamento de dados.)

---

## 2. O limite: arquivos disjuntos podem AINDA conflitar (conflito semântico)

Esta é a seção decisiva para a pergunta "interseção vazia é condição **suficiente**?". A resposta da
literatura é **não — é necessária, não suficiente**. A disjunção mata o conflito *textual*; não mata o
conflito *semântico*.

### 2.1 Definição: conflito semântico (de ordem superior)

> "Um conflito de merge **semântico** ocorre quando **não há conflito textual**, mas o merge resulta em
> um **build quebrado**, um **teste que passaria falhando**, ou comportamento inesperado em runtime."

O ponto crucial, declarado em pesquisa:

> "Quando duas branches editam **linhas diferentes** modificando a semântica do programa de formas
> conflitantes, o git-merge **aplica os dois edits silenciosamente, sem reportar nenhum conflito**."

A taxonomia consolidada dos estudos distingue três níveis:
- **Textual** — mesmas linhas/mesmo arquivo; o Git detecta.
- **Sintático / de build** — compila individualmente, mas o merge não compila (erro de compilação).
- **Semântico dinâmico / de teste (interferência)** — compila, mas o comportamento muda: "integrar
  contribuições de duas branches **altera inesperadamente o comportamento** de uma das branches ou do
  programa-base". Estes são os que "**compilação e teste frequentemente falham em capturar**".

(Fontes: arxiv 2111.11904, *Can Pre-trained LMs Resolve Textual and Semantic Merge Conflicts?*; DEV
Community, *Semantic vs Code Conflicts*; survey arXiv 2102.11307, *Automatic Detection and Resolution of
Software Merge Conflicts: Are We There Yet?*; arXiv 2310.04269, *Detecting Semantic Conflicts using
Static Analysis*.)

### 2.2 O exemplo canônico — idêntico ao nosso caso U1/U3

Um exemplo da literatura mapeia 1:1 no formato da etapa 5 ("U1 muda algo que U3 consome"):

- A unidade **FeatureX** adiciona um parâmetro `currency` a `remove_money()` — **muda a assinatura**
  (arquivo A).
- A unidade **FeatureY** chama `remove_money()` no formato antigo de três parâmetros, **sem saber da
  mudança** (arquivo B, **disjunto** de A).
- Resultado: a cobrança troca de yuan para dólar — prejuízo financeiro. **Nenhum conflito textual** é
  reportado, "porque elas editam arquivos diferentes, mas o código quebra".

E o diagnóstico da causa-raiz: "**O Git é um robô. Não faz ideia do que está acontecendo nas mudanças**" —
ele não enxerga a relação de consumo entre os dois arquivos. (Fonte: DEV Community, *Semantic vs Code
Conflicts*.)

O caso clássico de **build conflict** é o mesmo fenômeno na camada de compilação: renomear/remover um
símbolo (função, método) no arquivo A sem atualizar o arquivo B que o referencia → o linker não resolve
o símbolo entre os arquivos → **build quebra**, embora A e B sejam disjuntos e o merge textual seja limpo.
(Fonte: Microsoft Learn, LNK2019 *unresolved external symbol* — "o compilador não consegue dizer quando o
símbolo não está definido porque a definição pode estar em outro arquivo-fonte".)

### 2.3 Frequência — não é raro o suficiente para ignorar

Evidência empírica de que o fenômeno é material (não teórico):

- **Estudo de caracterização (208 repositórios Java)**: usando merge textual + compilação + testes,
  encontrou **15.886** cenários com conflito **textual**, **79** com conflito de **build**, e **33** com
  conflito de **teste**. Embora build/teste sejam ordens de magnitude mais raros que o textual, o estudo
  conclui que os "**conflitos de ordem superior são mais difíceis de detectar e resolver**", e que as
  ferramentas existentes "**focam principalmente em conflitos textuais**" — ou seja, justamente o que a
  disjunção de arquivos *não* protege é o que fica desassistido.
- **Achado revelador sobre a natureza cross-file**: "desenvolvedores resolveram a maioria dos conflitos de
  ordem superior **aplicando edits similares a MÚLTIPLAS localizações do programa**". Isto comprova que o
  conflito semântico é **inerentemente multi-arquivo** — a correção exige tocar vários pontos, porque a
  dependência atravessa fronteiras de arquivo.
- **Estudos com testes (várias bases)** reportam conflitos semânticos **dinâmicos** entre **~3% e 35%**
  dos cenários de merge avaliados, e conflitos de build (semânticos estáticos) entre **~2,1% e 14,7%**,
  dependendo do projeto. A faixa é ampla, mas o piso já é suficiente para não tratar a disjunção como
  garantia absoluta.
- Da Silva et al. coletaram **239 build conflicts** só para estudar suas causas-raiz e padrões de
  resolução — o suficiente para constituir um corpus de estudo dedicado.

(Fontes: par.nsf.gov/10515782 e dl.acm.org/10.1145/3546944, *A Characterization Study of Merge Conflicts
in Java Projects*; SPGroup, *Build Conflicts in The Wild*; survey arXiv 2102.11307.)

### 2.4 Por que "verificar por arquivos" não basta para o semântico — e o que basta

A razão técnica: detectar interferência semântica exige analisar **fluxo de dados e de controle ENTRE os
arquivos/métodos** — não basta comparar conjuntos de arquivos. Ferramentas de detecção (estáticas, como
as de *Detecting Semantic Conflicts using Static Analysis*, ou de detecção de edição concorrente, como o
**ConE — Concurrent Edit Detector** da Microsoft) existem **precisamente porque** o merge textual é cego a
isso. A independência de tarefas, na teoria de runtimes paralelos, é igualmente declarada como
**necessária mas não suficiente**: "tanto tarefas independentes quanto SPMD dependem de o usuário escrever
programas livres de hazard — o runtime **não garante a correção** sozinho". Tradução para a etapa 5:
disjunção de arquivos é o hazard-freedom **estrutural** (sem colisão de escrita); a ausência de
dependência semântica é o hazard-freedom **de contrato**, e essa vem do DAG.

(Fontes: arXiv 2310.04269; ConE, arXiv 2101.06542; arXiv 1606.04282, *Myrmics* / *Dependency-Aware
Execution* — independência necessária mas não suficiente.)

---

## 3. Caminho crítico (CPM): o que determina a duração mínima

A etapa 5 também declara "ordem de execução" e "o que bloqueia o quê". O conceito que governa isso é o
**Critical Path Method**:

- O caminho crítico é "a **mais longa sequência de tarefas dependentes** que determina a **duração mínima**
  do projeto". A duração total não pode ser menor que esse caminho, por mais paralelismo que se adicione
  em outros ramos.
- Tarefas no caminho crítico têm **folga (float) zero**: "não podem atrasar sem mover a data final".
  "Se uma tarefa crítica desliza, a data de término do projeto move-se na mesma medida."
- **Implicação para o paralelismo**: paralelizar tarefas que **não estão** no caminho crítico **não encurta**
  o projeto (elas já cabiam dentro da folga); paralelizar/encurtar o caminho crítico é o **único** ganho
  real de tempo. Logo, a etapa 5 deve identificar não só "o que pode rodar junto" (disjunção de arquivos),
  mas **qual é a cadeia de dependências mais longa** — é ela que define o piso da duração e onde o
  paralelismo compensa.

A ligação com o DAG é direta: o caminho crítico é o **caminho mais longo no grafo acíclico de
dependências entre unidades**. As arestas "U bloqueia V" (que a etapa 5 declara) formam esse grafo; a
duração mínima é o caminho mais longo nele. Paralelismo seguro acontece **entre ramos disjuntos** desse
grafo; a duração é ditada pelo **ramo mais longo**.

(Fontes: Galorath, *Critical Path Method*; Asana, *Critical path method*; Wrike, *2026 guide*;
GeeksforGeeks, *CPM in Project Management*; Atlassian Work Management, *Critical Path*; Leopard,
*Critical Path vs Longest Path*.)

---

## 4. Aplicação à etapa 5 (paralelo verificável por arquivos disjuntos)

### 4.1 A regra, decomposta em invariante e variável (M3)

| Elemento | Natureza | Onde vive |
|----------|----------|-----------|
| "Paralelo exige interseção de arquivos vazia" | **invariante** (mecânica) | regra do CORE da etapa 5 |
| Quais arquivos cada unidade toca | **variável** (leitura da demanda) | declarado por unidade no entregável |
| "Paralelo exige ausência de aresta de dependência no DAG" | **invariante** (mecânica) | regra do CORE, herdada da etapa 1 |
| Quais arestas existem entre as unidades | **variável** | vem do DAG (etapa 1) |
| Qual é o caminho crítico | **derivado** (calculado do grafo) | calculado, não declarado à mão |

O critério é ensinado pelo CORE; os dados (arquivos, arestas) vêm do contexto. Trocar de projeto não
muda a regra — muda só a lista de arquivos e de arestas. (Coerente com M1/M3.)

### 4.2 A regra completa de paralelismo seguro (dupla condição)

Duas unidades U_i e U_j são **seguras para paralelizar** se, e só se:

1. **`arquivos(U_i) ∩ arquivos(U_j) = ∅`** — interseção de arquivos vazia → **previne o conflito textual
   no merge** (Seção 1). *Condição necessária e mecanicamente verificável.*
2. **Não existe aresta de dependência de consumo entre U_i e U_j no DAG** (nem direta, nem via um
   contrato compartilhado que uma muda e a outra consome) → **previne o conflito semântico** (Seção 2).
   *Condição que cobre a insuficiência da (1); herdada da etapa 1.*

A condição (1) é o que a etapa 5 já declara. A contribuição desta pesquisa é tornar explícito que (1)
**sozinha não é suficiente** e que a salvaguarda (2) **já existe no pipeline** — é o DAG. O "U1 || U3" do
caso real é seguro não só porque os arquivos são disjuntos (`{command-run-section.tsx, args-form.tsx}` ∩
`{commands-tab.tsx} = ∅`), mas porque, além disso, U1 e U3 **não têm aresta de consumo entre si** no DAG.
Se U3 consumisse um símbolo exportado por um dos arquivos de U1, a disjunção de arquivos continuaria
vazia — e ainda assim seria **inseguro** paralelizar (caso `remove_money()` da Seção 2.2).

### 4.3 Como o porteiro verifica mecanicamente (a segurança é dos arquivos, não da fé)

O princípio "a segurança do paralelismo é verificável pelos arquivos, não pela fé" sustenta-se assim:

- **Verificação da condição (1) — barata, total, sem fé.** Cada unidade declara seu conjunto de arquivos
  (campo obrigatório no entregável, p.ex. `arquivos: [...]`). O porteiro, para cada par declarado como
  paralelo, computa a **interseção dos conjuntos** e exige que seja **vazia**. É uma operação de conjuntos
  — determinística, sem julgamento. Qualquer par paralelo com interseção não-vazia → **reprova o mapa**
  (viola o critério de aceitação "paralelo só onde arquivos são disjuntos — confirmado"). Isto é
  exatamente o "verificar que não há sobreposição de arquivos antes de paralelizar" da prática da Seção
  1.2, elevado a gate automático.
- **Verificação da condição (2) — herdada, por cruzamento com o DAG.** O porteiro pode cruzar os pares
  paralelos com as arestas do DAG (etapa 1): se há aresta de consumo entre dois nós cobertos por unidades
  declaradas paralelas, sinaliza. (Onde o DAG não desce ao nível do símbolo, esta verificação é parcial e
  vira **aviso explícito de incerteza**, não silêncio — no mesmo espírito do "candidato a verificar" do
  CORE-DAG/A4. Detecção total de interferência semântica exige análise de fluxo entre arquivos, que está
  fora do executor read-only — ver Seção 2.4 — e portanto é declarada como limite conhecido, não como
  falsa garantia.)
- **O que NÃO se verifica por arquivos e deve ser dito.** Mesmo com (1) e (2), permanecem fora do alcance
  da disjunção: contratos de API/schema que ambas as unidades assumem congelados. A prática recomenda
  tratá-los explicitamente: "**contratos de API são congelados durante execuções paralelas; mudá-los exige
  pausar o trabalho paralelo**" (MindStudio). A etapa 5 deveria, portanto, declarar os contratos
  compartilhados como **congelados** durante o paralelismo — uma terceira salvaguarda, declarativa.

### 4.4 Recomendações concretas para o CORE da etapa 5 (a testar contra caso real, M4)

1. **Tornar `arquivos` um campo obrigatório por unidade** no schema do mapa — é o dado que torna a regra
   verificável. Sem ele, "paralelo só onde arquivos são disjuntos" não é checável; vira fé.
2. **Declarar a regra como dupla condição** (interseção de arquivos vazia **E** ausência de dependência no
   DAG), nomeando que (1) cobre o conflito textual e (2) o semântico. Não vender disjunção de arquivos como
   garantia total — isso seria um falso negativo silencioso para o conflito semântico, o erro mais caro.
3. **O porteiro computa a interseção dos conjuntos de arquivos de cada par paralelo** e reprova se alguma
   for não-vazia. Especificar isto como verificação determinística (operação de conjuntos), não como
   revisão por julgamento.
4. **Cruzar pares paralelos com as arestas do DAG da etapa 1**; onde houver aresta de consumo, sinalizar.
   Onde o DAG não cobre o nível de símbolo, emitir **aviso de incerteza** (coerente com A4), nunca silêncio.
5. **Declarar contratos compartilhados (API/schema) como "congelados" durante o paralelismo** — terceira
   salvaguarda declarativa para o que nem arquivos nem arestas capturam.
6. **Calcular o caminho crítico do grafo de unidades** (caminho mais longo) e usá-lo para priorizar: o
   paralelismo só encurta o projeto se atacar o caminho crítico; paralelizar ramos com folga não muda a
   duração (CPM, Seção 3). A "ordem de execução" do entregável deveria derivar do caminho crítico, não de
   intuição.

**Síntese:** a regra "paralelo só onde arquivos são disjuntos" está **correta como núcleo verificável** e
é o que a etapa 5 consegue checar sem fé — ela elimina, por construção, o conflito de merge textual. Mas
**interseção de arquivos vazia é necessária, não suficiente**: o conflito semântico (assinatura/contrato
que uma unidade muda e outra consome) atravessa arquivos disjuntos e o Git o aplica em silêncio. A
salvaguarda já está no pipeline — é a ausência de aresta de dependência no DAG da etapa 1 — e deve ser
declarada junto. Assim o paralelismo é verificável **pelos arquivos** (condição 1, no porteiro) e **pelas
arestas** (condição 2, do DAG): em nenhum ponto por fé.

---

## Fontes

**Merge conflicts — mecânica e quando ocorrem (condição textual)**
- Atlassian, *How to Resolve Merge Conflicts in Git*: https://www.atlassian.com/git/tutorials/using-branches/merge-conflicts
- GitHub Docs, *Resolving a merge conflict using the command line*: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/resolving-a-merge-conflict-using-the-command-line
- GeeksforGeeks, *Merge Conflicts and How to Handle Them*: https://www.geeksforgeeks.org/git/merge-conflicts-and-how-to-handle-them/
- W3Schools, *Git Merge Conflicts*: https://www.w3schools.com/git/git_merge_conflicts.asp

**Conflito semântico / de ordem superior (o limite da disjunção)**
- *Can Pre-trained Language Models be Used to Resolve Textual and Semantic Merge Conflicts?* (arXiv 2111.11904): https://arxiv.org/pdf/2111.11904
- *Automatic Detection and Resolution of Software Merge Conflicts: Are We There Yet?* (survey, arXiv 2102.11307): https://arxiv.org/pdf/2102.11307
- *Detecting Semantic Conflicts using Static Analysis* (arXiv 2310.04269): https://arxiv.org/pdf/2310.04269
- DEV Community, *What is a Merge Conflict? Semantic vs Code Conflicts* (exemplo `remove_money()` yuan→USD): https://dev.to/lecrepont01/what-is-a-merge-conflict-understanding-the-difference-between-semantic-and-code-conflicts-5d0
- SPGroup, *Build Conflicts in The Wild*: https://spgroup.github.io/papers/build-conflicts.html
- Microsoft Learn, *Linker Tools Error LNK2019* (unresolved external symbol cross-file): https://learn.microsoft.com/en-us/cpp/error-messages/tool-errors/linker-tools-error-lnk2019

**Frequência empírica dos conflitos (caracterização)**
- *A Characterization Study of Merge Conflicts in Java Projects* (NSF PAR 10515782): https://par.nsf.gov/servlets/purl/10515782
- *A Characterization Study of Merge Conflicts in Java Projects* (ACM TOSEM, 10.1145/3546944): https://dl.acm.org/doi/10.1145/3546944
- *On the Nature of Merge Conflicts: A Study of 2,731 Open Source Java Projects* (Semantic Scholar): https://www.semanticscholar.org/paper/On-the-Nature-of-Merge-Conflicts:-A-Study-of-2,731-Ghiotto-Murta/50202e00774dd41f746cf4bab6b41c920dc6ee64

**Detecção de edição concorrente / interferência (verificação mecânica)**
- *ConE: A Concurrent Edit Detection Tool for Large Scale Software Development* (Microsoft, arXiv 2101.06542): https://arxiv.org/pdf/2101.06542
- *Parallel Changes in Large Scale Software Development: An Observational Case Study* (Perry et al., ACM TOSEM): https://dl.acm.org/doi/10.1145/383876.383878

**Teoria de concorrência — disjoint-access-parallelism, resource groups, particionamento**
- Gray et al., *Granularity of Locks and Degree of Consistency in a Shared Data Base* (resumo, the morning paper): https://blog.acolyer.org/2016/01/05/granularity-of-locks/
- ScienceDirect, *Coarse Granularity — overview*: https://www.sciencedirect.com/topics/computer-science/coarse-granularity
- ScienceDirect, *Fine Granularity — overview*: https://www.sciencedirect.com/topics/computer-science/fine-granularity
- *Multiprocessor Real-Time Locking Protocols: A Systematic Review* (arXiv 1909.09600): https://arxiv.org/pdf/1909.09600
- *Myrmics: Scalable, Dependency-aware Task Scheduling* (independência necessária, não suficiente; arXiv 1606.04282): https://arxiv.org/pdf/1606.04282

**Prática de desenvolvimento paralelo (declarar arquivos por tarefa; verificar disjunção)**
- MindStudio, *Parallel Agentic Development With Git Worktrees* (mapear arquivos por tarefa, verificar não-sobreposição, congelar contratos de API): https://www.mindstudio.ai/blog/parallel-agentic-development-git-worktrees

**Critical Path Method (caminho crítico = duração mínima)**
- Galorath, *Critical Path Method (CPM)*: https://galorath.com/schedule/critical-path-method/
- Asana, *Critical path method (CPM): steps, float, examples*: https://asana.com/resources/critical-path-method
- Wrike, *The critical path method in project management: 2026 guide*: https://www.wrike.com/blog/critical-path-is-easy-as-123/
- GeeksforGeeks, *Critical Path Method for Project management*: https://www.geeksforgeeks.org/project-mgmt/software-engineering-critical-path-method/
- Atlassian, *What Is a Critical Path in Project Management?*: https://www.atlassian.com/work-management/project-management/critical-path-method
- Leopard, *Critical Path vs. Longest Path in Scheduling*: https://consultleopard.com/critical-path-vs-longest-path/
