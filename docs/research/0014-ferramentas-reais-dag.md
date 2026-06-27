# 0014 — Como ferramentas reais representam, validam e usam grafos de dependência

> Pesquisa de confronto para o **CORE-DAG**. Objetivo: comparar nossa abordagem (meta-prompt que
> instrui um agente LLM a mapear dependências de uma feature) com o que orquestradores de DAG e
> ferramentas de build/análise estática fazem na prática — para decidir o que **imitar** e o que
> **descartar**.

---

## Resumo executivo

Há um consenso quase universal entre **orquestradores de execução** (Airflow, Dagster, Gradle,
Bazel, Turborepo) de que o grafo de dependência **deve ser acíclico**: ciclos são tratados como
**erro fatal**, detectados via DFS (back-edge na pilha de recursão), e a ferramenta aborta antes de
executar qualquer coisa. A razão é mecânica: sem aciclicidade não existe ordenação topológica, logo
não há ordem de execução determinística. Isso **valida fortemente nossa premissa DAG**.

Duas exceções importantes refinam a premissa: (1) **Prefect 2/3 abandonou o DAG estático** — descobre
o grafo em runtime executando código Python, permitindo loops/while como operação de primeira classe;
(2) **Dagster permite um único caso de ciclo**: um asset que depende de **versões anteriores de si
mesmo** (janela temporal), mas **proíbe** ciclo transitivo real. Lição: o ciclo "proibido" é o
ciclo *de dependência lógica*; auto-referência temporal não é ciclo no sentido que nos importa.

Ferramentas de **análise estática** (madge, dependency-cruiser, Bazel query) tratam ciclos de forma
diferente dos orquestradores: **detectam e reportam, mas não necessariamente abortam** — porque o
objetivo delas é *diagnóstico*, não execução. Isso é o que mais se parece com nosso caso: nós
também produzimos um diagnóstico para o agente, não um cronograma de execução.

Quanto a metadados, as ferramentas mais ricas (Nx, dependency-cruiser) carregam exatamente o que nosso
CORE-DAG já prevê — **tipo de aresta** (static/dynamic/implicit), **arquivo-fonte que originou a
aresta** (≈ nosso `path` + `confiança`) e **regras de fronteira** (visibility no Bazel, allowed/
forbidden no dependency-cruiser). O conceito de **"affected"** do Nx/Turborepo é matematicamente
idêntico ao nosso **blast radius**: pegar os nós alterados e fazer busca recursiva pelos **dependentes
reversos** (rdeps). Isso valida nosso cálculo, mas com uma diferença crítica: eles têm o grafo
**completo e confiável**; nós temos um grafo **parcial inferido por leitura de código**, então
precisamos de algo que eles não têm — **confiança por aresta e gaps direcionais**.

---

## Tabela comparativa: ferramenta × ciclo × metadados × impact analysis

### Grupo 1 — Orquestradores de DAG (grafo de execução)

| Ferramenta | Trata ciclo como… | Metadados de nó / aresta | Impact / affected |
|---|---|---|---|
| **Apache Airflow** | **Proíbe.** DFS na validação; lança `AirflowDagCycleException` ("Cycle detected in DAG") antes de rodar. `Task1 >> Task2 >> Task1` é inválido. | Nó = Task/Operator (retries, timeout, backoff, trigger rules). Aresta = upstream/downstream (`>>`). `DependencyDetector` configurável. | Não tem "affected"; reexecuta DAG inteiro ou por trigger rules. Retry/gate **por nó** (retries, `all_success`, etc.). |
| **Dagster** | **Proíbe ciclo transitivo** ("Assets dependencies form a cycle"). **Permite** o caso especial de self-dependency em **partições anteriores** (janela temporal). | Nó = asset (rico: `metadata`, `tags`, `MaterializeResult`, deps internas/externas). Aresta = dependência asset→asset. | Lineage global; rematerialização seletiva a partir de mudanças no grafo de assets. |
| **Prefect 2/3** | **Não usa DAG estático.** Descobre o grafo em runtime; **loops são first-class**. Dependência implícita por fluxo de dados (future/result de upstream). | Nó = task (`retries=3`, cache, transações). Aresta = dependência de dados inferida em runtime. | Sem "affected" estático — discovery = execução. Retry/gate por task via decorator. |
| **Gradle** | **Proíbe.** Constrói o DAG antes de executar; lança "Circular dependency between the following tasks". DFS / back-edge. | Nó = task (inputs/outputs). Aresta = dependência input→output. | Ordenação topológica; build incremental por inputs/outputs (≈ affected interno). |

### Grupo 2 — Grafos de código/build (grafo de estrutura)

| Ferramenta | Trata ciclo como… | Metadados de nó / aresta | Impact / affected |
|---|---|---|---|
| **Bazel** | **Query é robusto a ciclos** (não erra em `deps`/`rdeps`). Mas `cquery`/`aquery` (grafo configurado) **reportam ciclo como erro**. | Nó = target. Aresta = `deps`. **`visibility`** = regra de fronteira (quem pode depender de quem). | `rdeps(universe, x)` = dependentes reversos transitivos, com **profundidade opcional** (limite de raio). É o blast radius nativo. |
| **Nx** | Detecta ciclo no project graph; lint `nx/enforce-module-boundaries` pode proibir. | Nó = project. **Aresta tem TIPO: `static` / `dynamic` / `implicit`** + **arquivo-fonte que originou a aresta** (rastreável no graph). | **`nx affected`**: pega arquivos do diff (Git) → mapeia para projects → **busca recursiva pelos dependentes** no project graph. `inputs` nomeados reduzem falsos positivos. |
| **Turborepo** | Task graph **é DAG** por construção. | Nó = task de package. Aresta via `dependsOn`: `^build` (deps diretas), `build` (mesmo package), `pkg#task` (alvo preciso). | `--filter=[main]` casa arquivos alterados com globs de `inputs`; `...` traverse no grafo (dependentes/dependências). `turbo prune` = subgrafo. |
| **madge** | **Detecta e reporta** (DFS modificado); colore vermelho. Não aborta por padrão — é diagnóstico. | Nó = módulo. Aresta = import (CommonJS/AMD/ES6). Cores: azul=tem deps, verde=folha, vermelho=cíclico. | Não faz affected; foco em visualização + lista de ciclos. |
| **dependency-cruiser** | **Detecta e configurável** — regra pode emitir error/warn/info e quebrar CI. `via`/`viaOnly` restringem **por quais módulos** o ciclo pode passar. | Aresta com **`dependencyTypes`** (`npm`, `npm-dev`, `core`, `local`…). Regras **`forbidden`/`allowed`/`required`** = fronteira declarativa com `severity`. | Não é "affected" temporal, mas valida arquitetura: "de X não pode ir para Y". |

---

## O que IMITAR / o que DESCARTAR no nosso CORE-DAG

### Imitar (adotar / reforçar)

1. **Premissa DAG está correta — mas pelo motivo certo.** Os orquestradores proíbem ciclo porque
   precisam de ordenação topológica para *executar*. Nós não executamos, mas a aciclicidade ainda
   serve: um ciclo no grafo de dependências de uma feature é sinal de **acoplamento que o agente
   precisa reportar como risco**, não de algo a "ordenar". → **Trate ciclo como o Dagster/madge:
   detectável e reportável, não silenciosamente quebrável.** O CORE-DAG deve instruir o agente a
   *sinalizar* o ciclo encontrado (e classificá-lo), em vez de assumir que nunca ocorre.

2. **Distinção de Dagster entre ciclo lógico e auto-referência temporal.** Reforça que nosso "DAG"
   proíbe o **ciclo de dependência lógica** (A precisa de B que precisa de A), não relações
   recursivas legítimas. Vale uma nota no CORE para o agente não confundir recursão de código com
   ciclo de dependência de feature.

3. **Tipos de aresta do Nx (`static`/`dynamic`/`implicit`).** Mapeia quase 1:1 com nosso campo `tipo`
   da aresta. **Adotar a categoria `implicit`** explicitamente: dependências sem arquivo-fonte
   rastreável (config, convenção, DI, env) — que o agente tende a perder. É justamente a aresta de
   **menor confiança**, então liga direto no nosso `confiança` por aresta.

4. **"Affected" do Nx/Turborepo valida nosso blast radius.** O algoritmo é idêntico: nós alterados →
   busca recursiva pelos **dependentes reversos**. Isso confirma que blast radius = fecho transitivo
   reverso (`rdeps`). **Imitar duas coisas concretas:** (a) o **limite de profundidade** do Bazel
   (`rdeps` aceita depth) — nosso blast radius pode/deve ter raio graduado, não só "tudo que toca";
   (b) os **`inputs` nomeados** do Nx/Turborepo como ideia de **fronteira**: nem toda mudança num nó
   propaga — só mudanças no que o consumidor realmente lê. Isso refina nosso "custo-reverso 🟢🟡🔴".

5. **Fronteira declarativa (Bazel `visibility`, dep-cruiser `forbidden/allowed`).** Confirma que vale
   o agente registrar **gaps direcionais** como violações de fronteira em potencial ("este consumo
   atravessa uma fronteira que normalmente não deveria"). Adotar o conceito de `severity` (error/
   warn/info) para graduar gaps, em vez de tratá-los todos igual.

6. **Rastrear o arquivo-fonte que originou cada aresta (Nx).** Já temos `path`; o Nx mostra que isso
   é o que dá **auditabilidade** ("clique na aresta → veja o arquivo"). Manter como obrigatório:
   toda aresta deve apontar a evidência que a justifica — é o que separa nosso mapa de uma alucinação.

### Descartar (não se aplica ao nosso caso)

1. **Abortar em ciclo (Airflow/Gradle).** Essas ferramentas têm o grafo **completo e confiável** e
   *precisam* executar; abortar é seguro. Nós temos grafo **parcial e inferido por leitura** — abortar
   ao "achar" um ciclo seria frágil, porque o ciclo pode ser artefato de inferência incompleta. Nosso
   papel é **reportar com confiança**, não falhar.

2. **Modelo de retry/gate por nó (Airflow/Prefect/Dagster).** É semântica de *execução* (timeout,
   backoff, trigger rules). Nosso CORE-DAG descreve **estrutura de dependência**, não roda nada.
   Retry/gate pertence à state machine (motor), não ao mapa de dependências da feature. Não importar.

3. **Discovery-em-runtime do Prefect.** Atraente filosoficamente (dinâmico > estático, alinhado à M1),
   mas Prefect descobre executando Python real. Nosso agente **lê código sem executar**; não temos o
   luxo do runtime. Ficamos com inferência estática + confiança — o melhor que dá sem rodar.

4. **`turbo prune` / subgrafo de build.** Otimização de tooling de monorepo (copiar só o necessário
   para CI). Sem análogo no nosso meta-prompt.

5. **Cache por hash de inputs (Nx/Turborepo/Gradle).** Mecânica de performance de build. Irrelevante
   para um mapa de dependências produzido por leitura pontual.

### Ajuste-chave de enquadramento

A diferença que tudo orbita: **essas ferramentas operam sobre um grafo verdadeiro e completo; nós
produzimos uma *inferência* sobre um grafo parcialmente observável.** Por isso os campos que **nenhuma
delas tem e nós precisamos** — `confiança` por nó/aresta e `gaps direcionais` — são exatamente o que
torna nosso CORE-DAG honesto. Imitar a *forma* do grafo (nós tipados, arestas tipadas, rdeps para
blast radius, fronteira graduada por severity); descartar a *pretensão de completude* que só faz
sentido quando você compilou o código em vez de tê-lo lido.

---

## Fontes

**Orquestradores:**
- Airflow — Dags (core concepts): https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dags.html
- Airflow — issue de detecção de ciclo: https://github.com/apache/airflow/issues/23285
- Dagster — asset metadata e tags: https://docs.dagster.io/guides/build/assets/metadata-and-tags
- Dagster — ciclos / self-dependency (discussion): https://github.com/dagster-io/dagster/discussions/13683
- Dagster — graph theory glossary: https://dagster.io/glossary/graph-theory
- Prefect — motor de 2ª geração (sem DAG estático): https://www.prefect.io/blog/second-generation-workflow-engine
- Prefect — tasks (retries, dependências de dados): https://docs.prefect.io/v3/concepts/tasks
- Gradle — Build Lifecycle (DAG, ciclo): https://docs.gradle.org/current/userguide/build_lifecycle.html
- Gradle — issue de ciclo transitivo: https://github.com/gradle/gradle/issues/22850

**Grafos de código/build:**
- Bazel — Query guide (robusto a ciclos, rdeps): https://bazel.build/query/guide
- Bazel — Query language reference: https://bazel.build/query/language
- Bazel — Visibility (fronteira): https://docs.bazel.build/versions/main/visibility.html
- Nx — DependencyType (static/dynamic/implicit): https://nx.dev/nx-api/devkit/documents/DependencyType
- Nx — affected: https://nx.dev/ci/features/affected
- Nx — Mental Model (project graph): https://nx.dev/docs/concepts/mental-model
- Nx — Project Graph Plugins (metadados de aresta): https://nx.dev/docs/extending-nx/project-graph-plugins
- Turborepo — Package and Task Graphs: https://turborepo.dev/docs/core-concepts/package-and-task-graph
- Turborepo — Configuração (dependsOn, ^, filter): https://turborepo.dev/docs/reference/configuration
- madge — repositório / detecção de ciclo: https://github.com/pahen/madge
- madge — circular dependency detection (DFS): https://deepwiki.com/pahen/madge/4.4-circular-dependency-detection
- dependency-cruiser — repositório: https://github.com/sverweij/dependency-cruiser
- dependency-cruiser — rules reference (forbidden/allowed/via/dependencyTypes): https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md
