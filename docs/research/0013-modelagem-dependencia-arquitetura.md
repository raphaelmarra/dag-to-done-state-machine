# 0013 — Modelagem de Dependências e Fronteiras Arquiteturais

> Pesquisa de fundamentação para o CORE-DAG (etapa 1). Confronta as regras **A1** (tipos
> de nó descobertos do stack) e **D1** (largura do escopo decidida pelo entry_point) contra
> a literatura canônica de arquitetura de software: C4 model, princípios SOLID/de componentes
> de Robert C. Martin, e Domain-Driven Design.

---

## Resumo executivo

A literatura **não** prescreve um conjunto único e fixo de tipos de nó válido para todo sistema.
Pelo contrário, as três correntes principais convergem na ideia de que **a fronteira e a unidade
de decomposição são escolhas de modelagem, não constantes**:

- **C4 (Simon Brown)** fixa *níveis de zoom* (Context → Container → Component → Code), mas o que
  *é* um "container" ou "component" depende do sistema concreto — um container é "uma aplicação ou
  data store", e componente é um agrupamento interno cuja natureza varia com a stack. Os **níveis**
  são fixos; o **conteúdo** de cada nível é descoberto do projeto. Isso valida parcialmente A1.
- **Robert C. Martin (Clean Architecture)** dá o suporte mais forte ao DAG: o **Acyclic Dependencies
  Principle (ADP)** exige explicitamente que o grafo de dependência **não tenha ciclos**, e ensina
  que ciclos se quebram com o **Dependency Inversion Principle (DIP)**. Forçar DAG é doutrina
  estabelecida, não invenção nossa.
- **DDD (Evans/Fowler/Vernon)** desafia o "1 hop": a fronteira do *bounded context* é traçada por
  **consistência de linguagem/modelo**, não por distância no grafo nem por estrutura técnica. Isso
  é o ponto de maior atrito com nossa regra D1 e merece atenção.

Veredito curto: **A1 está alinhado com C4** (granularidade dinâmica dentro de níveis), **forçar DAG
está validado pelo ADP**, e **D1 (INTENT vs DOMÍNIO) precisa absorver o critério linguístico do DDD**
para não confundir "fronteira de escopo" com "distância de 1 hop".

---

## Princípios com fontes

### 1. C4 model — níveis fixos, conteúdo dinâmico

O C4 (Simon Brown) descreve a arquitetura em **quatro níveis hierárquicos de abstração**, cada um
contando uma história para uma audiência diferente:

| Nível | O que é | Critério |
|-------|---------|----------|
| **1 — System Context** | o sistema em escopo e suas relações com usuários/sistemas externos | fronteira do sistema vs. mundo |
| **2 — Container** | "uma aplicação ou data store" — algo que precisa estar *rodando* para o sistema funcionar | unidade executável/deployável |
| **3 — Component** | agrupamento interno de um container com responsabilidade coesa | agrupamento de código com interface |
| **4 — Code** | classes, interfaces, funções (opcional, geralmente gerado) | elemento de implementação |

Pontos-chave para nós:

- A definição formal é **hierárquica e relativa**: "um sistema é feito de um ou mais *containers*
  (aplicações e data stores), cada um contendo um ou mais *components*, que por sua vez são
  implementados por um ou mais *code elements* (classes, interfaces, objetos, funções...)".
- C4 é **notation independent** e **tooling independent**: o modelo prescreve *abstrações*, não
  desenhos. A natureza concreta de um container (um SPA? um serviço? um app mobile? um CLI?) é
  **descoberta do sistema**, não enumerada pelo modelo.
- Recomendação prática: níveis 1 e 2 quase sempre valem a pena; nível 3 só para containers
  complexos; nível 4 só se a toolchain gerar automaticamente.

**Leitura para o CORE-DAG:** C4 *confirma* que os tipos de nó não são uma lista universal — mas
ancora a flexibilidade em **níveis fixos de zoom**. C4 não diz "invente tipos de nó por projeto";
diz "escolha o nível de zoom certo, e o conteúdo daquele nível emerge do sistema". A1 é compatível
desde que tratemos "superfície-UI / função-API / comando-CLI" como **instâncias do nível Component
descobertas da stack**, não como uma taxonomia paralela ao C4.

Fontes: [c4model.com](https://c4model.com/) · [Abstractions](https://c4model.com/abstractions) ·
[Wikipedia: C4 model](https://en.wikipedia.org/wiki/C4_model) ·
[InfoQ: The C4 Model](https://www.infoq.com/articles/C4-architecture-model/) ·
[Baeldung: C4 abstraction levels](https://www.baeldung.com/cs/c4-model-abstraction-levels)

### 2. Acyclic Dependencies Principle (ADP) — o grafo DEVE ser um DAG

Robert C. Martin (*Clean Architecture*, princípios de componentes):

> "Allow no cycles in the component dependency graph."

Razões pelas quais ciclos são proibidos:
- **Acoplam componentes** e os forçam a serem *liberados/compilados juntos* — a modularidade some,
  o sistema vira um monólito disfarçado.
- Causam o **"morning after syndrome"**: uma mudança aparentemente isolada quebra módulos distantes.
- Tempos de build crescem; mudanças se propagam de forma destrutiva.

E — crucial para nós — Martin afirma: **"é sempre possível quebrar um ciclo com o Dependency
Inversion Principle"** (ou inserindo um componente intermediário). Ou seja: um ciclo aparente
*nunca* é um beco sem saída; é sinal de que falta uma abstração/inversão.

**Stable Dependencies Principle (SDP):** "depend in the direction of stability" — componentes
voláteis devem depender de componentes estáveis, nunca o contrário. A estabilidade é medida pelas
dependências de entrada/saída (fewer outgoing deps = mais estável).

**Stable Abstractions Principle (SAP):** componentes mais estáveis devem ser mais abstratos
(interfaces), para que estabilidade não vire rigidez.

**Leitura para o CORE-DAG:** o ADP é o **endosso direto** da nossa decisão de forçar DAG. Não é
preferência estética — é princípio nomeado com justificativa de engenharia (release/build/blast
radius). E o ADP nos dá a *saída* para o caso difícil: se o gerador detectar um ciclo na demanda,
a resposta correta segundo a literatura é **inverter a dependência (DIP)**, não relaxar o DAG.

Fontes: [Clean Architecture (O'Reilly)](https://www.oreilly.com/library/view/clean-architecture-a/9780134494272/) ·
[The Clean Architecture (blog)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) ·
[ADP on iOS — Axel Springer Tech](https://medium.com/axel-springer-tech/the-acyclic-dependencies-principle-on-ios-7804e6b1bbf9) ·
[Resumo de Clean Architecture](https://ygrenzinger.github.io/posts/clean-architecture-summary/)

### 3. Dependency Inversion Principle (DIP) — fronteiras se criam invertendo dependências

> "High-level modules should not depend on low-level modules; both should depend on abstractions.
> Abstractions should not depend on details. Details should depend on abstractions."

O ponto arquitetural (não apenas OO): **"inverter dependências é como criamos fronteiras entre
módulos"**. A inversão das dependências de código-fonte *contra* o fluxo de controle é literalmente
o que cria uma **fronteira arquitetural (seam)**. A *Dependency Rule* da Clean Architecture
("dependências apontam para dentro, rumo às políticas de alto nível") é a aplicação disso em escala.

**Leitura para o CORE-DAG:** isto formaliza o que é "uma fronteira" no grafo — uma fronteira não é
uma linha desenhada arbitrariamente; é o ponto onde **a direção da dependência se inverte
deliberadamente**. Reforça o critério de A1 ("unidade consumida numa direção"): a *direção* é a
essência do nó. Útil quando o gerador precisar justificar *por que* algo é um nó separado.

Fontes: [DIP — Wikipedia](https://en.wikipedia.org/wiki/Dependency_inversion_principle) ·
[Stackify: SOLID DIP](https://stackify.com/dependency-inversion-principle/) ·
[Khalil Stemmler: Dependency Inversion](https://khalilstemmler.com/wiki/dependency-inversion/)

### 4. DDD — fronteira por linguagem, não por distância

Eric Evans / Martin Fowler / Vaughn Vernon:

- Um **Bounded Context** é "a parte do domínio na qual um dialeto particular da *ubiquitous
  language* é consistente o tempo todo". A fronteira é traçada onde **a linguagem muda** — quando
  o mesmo termo (ex.: "customer", "meter") passa a significar coisas diferentes para grupos
  diferentes, há uma fronteira natural.
- Fowler é explícito: **"o fator dominante é a cultura humana"** — você precisa de um modelo
  diferente quando a *linguagem* muda. Fronteiras técnicas (in-memory vs. relacional) existem, mas
  são secundárias à coerência linguística.
- **Não há tamanho fixo**: DDD não define um bounded context como "um hop" nem por métricas de
  estrutura. Vernon (cap. 2 e 3) trata da divisão em contextos e do *context mapping* (relações:
  Anti-Corruption Layer, Shared Kernel, etc.) — relações *entre* fronteiras, não distância dentro
  de um grafo.

**Leitura para o CORE-DAG:** este é o **maior ponto de confronto**. DDD nos avisa que a fronteira
"natural" de um escopo é **semântica** (onde a linguagem/intenção é coerente), não topológica
(quantos hops). Isso não invalida D1 — mas reinterpreta: um "DOMÍNIO" no D1 deveria corresponder a
um *bounded context* (região de linguagem coerente), e uma "INTENT" a uma operação dentro dele.

Fontes: [Fowler: Bounded Context](https://martinfowler.com/bliki/BoundedContext.html) ·
[Eric Evans @ DDD Europe — InfoQ](https://www.infoq.com/news/2019/06/bounded-context-eric-evans/) ·
[DDD Reference (Evans, PDF)](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf) ·
[Implementing DDD — Vernon](https://www.oreilly.com/library/view/implementing-domain-driven-design/9780133039900/)

---

## CONFRONTO com nosso CORE-DAG (granularidade de nó e fronteira)

### A1 — "tipos de nó descobertos do stack, critério = unidade consumida numa direção"

| Aspecto | Veredito | Justificativa |
|---------|----------|---------------|
| Não fixar uma lista universal de tipos | **VALIDADO** | C4 não enumera tipos; define níveis e deixa o conteúdo emergir. DDD trata fronteira como decisão de modelagem. |
| Critério "unidade consumida numa direção" | **VALIDADO e reforçado** | É exatamente a noção de DIP/ADP: o que define um nó é a *direção* da dependência. |
| Descobrir do *stack* | **PARCIALMENTE — refinar** | C4 descobre do *sistema/domínio*, não só da stack técnica. Risco: a stack é a *implementação* da fronteira, não a fronteira em si. Recomendação: o critério primário deve ser semântico ("unidade que alguém consome com uma intenção"), e a stack apenas *nomeia* o tipo (UI/API/CLI). Caso contrário caímos no nível 4 (Code) do C4, perdendo o nível Component. |

**Recomendação A1:** manter a granularidade dinâmica (correto), mas declarar no CORE que o tipo de
nó vive no **nível Component do C4** e é *nomeado* pela stack, não *definido* por ela. O invariante
é "unidade consumida numa direção"; a stack é a variável que dá o rótulo (M3 do projeto).

### D1 — "largura do escopo: INTENT (estreito) vs DOMÍNIO (amplo)"

| Aspecto | Veredito | Justificativa |
|---------|----------|---------------|
| Ter um seletor de largura no entry_point | **VALIDADO** | C4 já opera assim: escolher o nível de zoom (Container vs Component) é decidir a largura. |
| INTENT ≈ operação única | **OK** | Mapeia para um caso de uso / um hop a partir de uma superfície. |
| DOMÍNIO ≈ amplo por topologia | **DESAFIADO pelo DDD** | "Amplo" deveria significar "bounded context" (região de linguagem coerente), não "muitos hops". Largura por contagem de hops pode atravessar fronteiras semânticas e juntar o que o DDD separaria. |
| Implícito: fronteira em "1 hop" | **DESAFIADO** | DDD: a fronteira certa é onde a linguagem muda, podendo ser <1 ou >1 hop. 1 hop é um *default operacional pragmático*, não a fronteira teórica. |

**Recomendação D1:** manter INTENT/DOMÍNIO como os dois modos (alinha com C4), mas redefinir
"DOMÍNIO" como **bounded context = região onde a linguagem/intenção é coerente**, e tratar o
"1 hop" como heurística de parada para o modo INTENT — explicitamente uma aproximação, com a
ressalva DDD de que a fronteira real é semântica. Quando o grafo cruzar uma mudança de linguagem,
isso é sinal de fronteira de contexto (e candidato a Anti-Corruption Layer), não de mais um hop.

### Forçar DAG

**VALIDADO sem ressalvas pelo ADP.** É princípio nomeado e justificado. Acrescentar ao CORE-DAG a
regra de *resolução*: ciclo detectado ⇒ aplicar **DIP/inversão** (ou nó intermediário), nunca
relaxar a aciclicidade. Opcionalmente, usar SDP/SAP como critério de qualidade: arestas devem
apontar na direção da estabilidade.

---

## Fontes

**C4 model**
- https://c4model.com/
- https://c4model.com/abstractions
- https://en.wikipedia.org/wiki/C4_model
- https://www.infoq.com/articles/C4-architecture-model/
- https://www.baeldung.com/cs/c4-model-abstraction-levels

**Clean Architecture / princípios de componentes (Robert C. Martin)**
- https://www.oreilly.com/library/view/clean-architecture-a/9780134494272/
- https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- https://medium.com/axel-springer-tech/the-acyclic-dependencies-principle-on-ios-7804e6b1bbf9
- https://ygrenzinger.github.io/posts/clean-architecture-summary/

**Dependency Inversion Principle**
- https://en.wikipedia.org/wiki/Dependency_inversion_principle
- https://stackify.com/dependency-inversion-principle/
- https://khalilstemmler.com/wiki/dependency-inversion/

**Domain-Driven Design / Bounded Contexts**
- https://martinfowler.com/bliki/BoundedContext.html
- https://www.infoq.com/news/2019/06/bounded-context-eric-evans/
- https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf
- https://www.oreilly.com/library/view/implementing-domain-driven-design/9780133039900/
