# Decomposição de software em unidades de implementação bem-formadas

> Pesquisa LOCAL que fundamenta a etapa 5 (Mapa de dependências). Reference (Diátaxis).
> Data: 2026-06-28. Fontes citadas ao final (URLs verificadas).
> Aplica M1 (dinâmico > fixo), M2 (bottom-up: caso real → racional → regra) e M3 (separar
> invariante de variável). Consultar `docs/INDEX.md` antes de redescobrir.

---

## Resumo executivo

Quebrar trabalho de software em unidades de implementação é um problema com **quatro fontes
canônicas convergentes**, e elas concordam mais do que parecem:

1. **WBS / PMI** dá a *regra de cobertura*: a decomposição inclui **100% do escopo e nada além**
   (a "regra dos 100%"), é orientada a **entregável** (resultado), não a atividade (método), e os
   irmãos são **mutuamente exclusivos** (sem sobreposição). A unidade-folha é o *work package* —
   a menor unidade que se estima e gerencia.
2. **Vertical slicing (Agile)** dá a *forma certa do corte*: fatie **verticalmente** (atravessando
   todas as camadas necessárias para entregar uma mudança observável de comportamento), nunca
   **horizontalmente** (por camada técnica — UI, depois backend, depois banco). A fatia horizontal
   só entrega valor no fim e adia todo feedback.
3. **INVEST (Bill Wake, 2003)** dá os *atributos de qualidade* de cada unidade: **I**ndependente,
   **N**egociável, **V**aliosa, **E**stimável, **S**mall, **T**estável. Para *tarefas técnicas*
   Wake oferece o par **SMART** (Specific, Measurable, Achievable, Relevant, Time-boxed) — onde
   "Measurable" significa, literalmente, *"dá para marcar como pronto?"*.
4. **Right-sizing** dá o *tamanho certo*: nem grande demais (vira "projeto", fica dias em
   andamento, ilusão de progresso) nem pequeno demais (fragmento sem valor). A regra prática do
   WBS é o **8/80** (entre ~8 e ~80 horas por work package); o equivalente Agile é "cabe num
   sprint / 6–10 por sprint" e, para revisão, "explicável como **uma fatia revisável**".

A síntese para o nosso projeto: uma unidade bem-formada é **um corte vertical, de tamanho
revisável, mutuamente exclusivo dos demais, rastreável a uma evidência (gap/critério/ADR), com
arquivos explícitos e um done-criteria binário**. As quatro fontes batem ponto a ponto nesses
cinco atributos — e o "rastreável a evidência" é exatamente a **matriz de rastreabilidade de
requisitos (RTM)** aplicada ao nível de unidade.

---

## O que faz uma unidade bem-formada (com evidência)

Cada atributo abaixo traz a fonte e o **teste operacional** (a pergunta que o porteiro faria).

### 1. Cobertura sem invenção — "100% e nada além" (WBS/PMI)

A regra dos 100% do PMBOK: *"the WBS includes 100% of the work defined by the project scope ...
and should not include any work that falls outside the actual scope of the project"* — e vale
em todos os níveis: a soma das unidades-filha = 100% do pai, sem extravasar
([PMI](https://www.pmi.org/learning/library/practice-standard-work-breakdown-structures-8063),
[Wikipedia: WBS](https://en.wikipedia.org/wiki/Work_breakdown_structure)). Duas consequências
diretas para nós:

- **Sem buraco:** todo gap/critério do design tem de cair em *alguma* unidade (cobertura).
- **Sem invenção:** nenhuma unidade pode existir fora do que o design pediu. Esta é exatamente a
  cláusula que o nosso princípio de projeto chama de *"nunca trabalho inventado"*. O PMI já a
  tinha em 2003; nós só a ancoramos a um *gap/critério* nomeado.

A WBS é ainda **orientada a entregável, não a atividade**: *"organized around the primary products
... instead of the work needed to produce the products"*
([Wikipedia](https://en.wikipedia.org/wiki/Work_breakdown_structure)). Traduzindo: o **objetivo**
da unidade descreve o *resultado* ("args aceitos como array posicional"), não a tarefa ("editar o
parser"). O *como* é negociável (vem do INVEST-N).

> **Teste do porteiro (cobertura):** todo gap/critério P0–P1 do design aparece ancorado em pelo
> menos uma unidade? Alguma unidade NÃO aponta para nenhum gap/critério/ADR? (Se sim → invenção.)

### 2. Mutuamente exclusivas — sem sobreposição entre irmãs (WBS/PMI)

*"There must be no overlap in scope definition between different elements of a work breakdown
structure"* — sobreposição gera trabalho duplicado e confusão de responsabilidade
([Wikipedia](https://en.wikipedia.org/wiki/Work_breakdown_structure)). No nosso caso isto tem
um efeito técnico forte: **é exatamente a condição que habilita o paralelismo seguro**. Duas
unidades só rodam em paralelo se seus conjuntos de **arquivos são disjuntos** (a regra que o
PIPELINE já exige na etapa 5 e que A005 deixa em aberto para features concorrentes). Mutual
exclusivity no nível de arquivo *é* a definição operacional de "pode paralelizar".

> **Teste do porteiro (exclusividade):** a interseção dos arquivos de quaisquer duas unidades
> marcadas como paralelas é vazia? Há dois objetivos que descrevem a mesma mudança?

### 3. Corte vertical, não horizontal (Agile / vertical slicing)

O consenso é unânime e antigo. Bill Wake, ao definir o **V** de *Valuable*, já manda fatiar
*"vertically through the layers"* e não por camada técnica
([xp123 / Wake](https://xp123.com/articles/invest-in-good-stories-and-smart-tasks/)). Mike Cohn
chama o split horizontal de *"the most common mistake teams make"*: ao criar histórias separadas
para *"the user interface, backend, database, testing, or design"*, cada item depende dos outros
e *"nothing can be demonstrated as a working user flow"*
([Mountain Goat](https://www.mountaingoatsoftware.com/agile/user-stories/story-splitting-how-to-split-user-stories-so-teams-can-finish)).
A Humanizing Work define um bom corte como *"a valuable change in system behavior such that
you'll probably have to touch multiple architectural layers"*
([Humanizing Work](https://www.humanizingwork.com/the-humanizing-work-guide-to-splitting-user-stories/)).
E o motivo do horizontal ser ruim: *"you get no value until the last part is complete, and you
cannot do any end-to-end testing"*
([Growing Scrum Masters](https://growingscrummasters.co.uk/keywords/horizontal-vs-vertical-slicing/)).

**Ressalva honesta para a etapa 5:** vertical slicing nasceu para *user stories* voltadas ao
usuário final. A nossa etapa 5 decompõe a *implementação* de uma feature **já desenhada**, então
às vezes a unidade natural não é "valor para o usuário" e sim "comportamento interno verificável"
(ex.: "U1: args como array posicional" é infraestrutura, não feature de tela). Aqui o INVEST-V
deve ser lido como o ensina o caso técnico: em vez de "valor visível ao usuário", **valor =
critério verificável atendido / gap fechado** (ver §4 e a aplicação à etapa 5). É a leitura que
o próprio mercado já faz para trabalho técnico — transformar *"Optimize backend process"* em
*"Reduce policy approval time by optimizing backend performance"*, amarrando esforço a um
resultado mensurável
([Maxim Gorin / Medium](https://maxim-gorin.medium.com/writing-engineering-tasks-as-a-team-process-afccc9767eb4)).

> **Teste do porteiro (vertical):** a unidade entrega um comportamento *verificável por si* (tem
> done-criteria binário próprio), ou é só "a camada X" que não significa nada sozinha?

### 4. INVEST aplicado à unidade técnica (Wake, 2003)

INVEST é de Bill Wake, *"Invest in Good Stories and Smart Tasks"*, 2003
([xp123](https://xp123.com/articles/invest-in-good-stories-and-smart-tasks/)). Para o nosso nível
(unidade de implementação, mais perto de *tarefa* que de *história*), Wake oferece o par **SMART**.
Combinamos os dois, item a item, com o teste operacional:

| Letra | Definição de Wake | Leitura para a etapa 5 | Teste do porteiro |
|-------|-------------------|------------------------|-------------------|
| **I**ndependent | *"not overlap in concept ... implement in any order"* | arquivos disjuntos ⇒ ordenável/paralelizável | interseção de arquivos = ∅? |
| **N**egotiable | *"details co-created ... not a contract for features"* | a unidade fixa o *resultado* (objetivo), não o *como*; o agente da etapa 6 escolhe a implementação | o objetivo descreve resultado, não passo-a-passo? |
| **V**aluable | *"valuable to the customer ... split vertically"* | valor = gap fechado / critério atendido (leitura técnica) | a unidade aponta para um gap/critério real? |
| **E**stimable | *"just enough to ... rank and schedule"* | arquivos + objetivo dão tamanho aproximado | dá para dizer "pequena/média/grande"? |
| **S**mall | *"at most a few person-weeks ... more accurate estimates"* | revisável de uma vez (ver §5) | cabe numa revisão? (não é "projeto") |
| **T**estable | *"I understand it well enough that I could write a test for it"* | done-criteria binário herdado do critério do design | existe um sim/não que fecha a unidade? |

Sobre **SMART** (tarefa), o ponto que mais nos serve é o **M**easurable de Wake: *"the key measure
is, 'can we mark it as done?'"* — *medível* é literalmente *"dá para marcar como pronto"*. É a
base do nosso done-criteria. E o **R**elevant: *"every task should be relevant, contributing to
the story at hand"* — a versão SMART do "nunca trabalho inventado": toda tarefa contribui para
*algo nomeado*. (Citações: [xp123](https://xp123.com/articles/invest-in-good-stories-and-smart-tasks/).)

### 5. Tamanho certo — right-sizing (WBS 8/80 + Agile)

Não existe tamanho universal, mas existe "grande demais" e "pequeno demais"
([Mountain Goat](https://www.mountaingoatsoftware.com/agile/user-stories/story-splitting-how-to-split-user-stories-so-teams-can-finish)).
Sinais de **grande demais**: *"sound like projects: 'Build reporting', 'Implement payments'"* —
ficam dias em andamento e criam *"the illusion of progress because everyone is busy"*
([Mountain Goat](https://www.mountaingoatsoftware.com/agile/user-stories/story-splitting-how-to-split-user-stories-so-teams-can-finish)).
Réguas concretas, em ordem de utilidade para nós:

- **Revisável de uma vez** (a melhor régua para unidade de implementação): *"if a task can't be
  explained as one reviewable slice, it should be split"*; o diff não deve crescer além de ~2×
  os arquivos originais sem aprovação para expandir o escopo
  ([GitHub Blog](https://github.blog/ai-and-ml/generative-ai/agent-pull-requests-are-everywhere-heres-how-to-review-them/),
  [Artsy](https://artsy.github.io/blog/2021/03/09/strategies-for-small-focused-pull-requests/)).
- **8/80 (WBS):** nenhuma unidade-folha entre o piso e o teto de ~8 a ~80 horas de esforço
  ([Wikipedia](https://en.wikipedia.org/wiki/Work_breakdown_structure)).
- **Cabe num sprint / 6–10 por sprint (Agile):** ratio, não absoluto — escala com time/velocidade
  ([Humanizing Work](https://www.humanizingwork.com/the-humanizing-work-guide-to-splitting-user-stories/)).

**Como cortar** quando está grande demais — padrões reutilizáveis (não inventar dimensão nova):
o **SPIDR** de Cohn — **S**pike (incerteza), **P**aths (caminhos do fluxo), **I**nterfaces
(plataformas/canais), **D**ata (tipo/volume/origem), **R**ules (regras/validações/exceções)
([Mountain Goat](https://www.mountaingoatsoftware.com/agile/user-stories/story-splitting-how-to-split-user-stories-so-teams-can-finish));
e os 9 padrões da Humanizing Work (workflow steps, CRUD, business-rule variations, data
variations, data-entry methods, major effort, simple/complex, defer performance, break out a
spike)
([Humanizing Work](https://www.humanizingwork.com/the-humanizing-work-guide-to-splitting-user-stories/)).
Nota: o **Spike** já é uma peça do nosso pipeline (ramificação entre GAP e Design) — coerente.

> **Teste do porteiro (tamanho):** a unidade é explicável como *uma* fatia revisável? Algum
> objetivo soa como "projeto" (verbo genérico + substantivo amplo: "construir relatórios")?

### 6. Escopo claro = o "delivery packet" da unidade

O que torna o escopo *fechado* (e não só "pequeno") é a unidade carregar os campos que respondem,
sem ambiguidade: **o que muda, quais arquivos, o que está explicitamente fora, qual a prova de
pronto**. O mercado de revisão por agente já formalizou isso como *delivery packet*: *"what are we
changing, ... what's explicitly out of scope, what are the acceptance criteria, what existing
routes/components/APIs/tests are relevant, ... what proof we need before merge"*, com a regra de
ouro *"touch only the files this slice needs. Don't refactor adjacent code"*
([GitHub Blog](https://github.blog/ai-and-ml/generative-ai/agent-pull-requests-are-everywhere-heres-how-to-review-them/)).
Os **arquivos explícitos** não são burocracia: são, ao mesmo tempo, (a) a fronteira de "não toque
o resto", (b) o insumo do paralelismo (disjunção) e (c) o que vira o campo *"arquivos que pode
tocar"* do briefing automático da etapa 6 (PIPELINE §6).

A **rastreabilidade** (a "ÂNCORA") é a RTM aplicada à unidade: *"link each requirement to its
corresponding WBS component ... design specifications, test cases, and source code"*, com
**bidirecionalidade** — do requisito para a verificação e de volta
([Stell](https://stell-engineering.com/blog/requirements-traceability-matrix),
[PMI](https://www.pmi.org/learning/library/requirement-traceability-tool-quality-results-8873)).
Para nós: cada unidade ↔ gap/critério/ADR ↔ done-criteria. A âncora é o que permite ao porteiro
provar *cobertura* (todo gap tem unidade) e *não-invenção* (toda unidade tem gap) — as duas
metades da regra dos 100%.

**Done-criteria vs. critério de aceitação (DoD vs. AC).** O mercado separa: **AC** responde
*"isto faz o que deveria?"* (específico do item) e **DoD** responde *"está pronto para release?"*
(uniforme, do time/projeto)
([Scrum.org](https://www.scrum.org/resources/blog/what-difference-between-definition-done-and-acceptance-criteria)).
Mapeando ao nosso pipeline: o **done-criteria da unidade** é o **AC herdado do critério do design**
(o que o Gate B vai verificar ao vivo); o **DoD da etapa 6** é a barra fixa e uniforme já no
PIPELINE (`tsc` verde, `vitest` verde, zero hardcode, zero TODO). A unidade carrega o AC; a etapa
inteira responde ao DoD.

---

## Aplicação à etapa 5 (unidade ancorada com escopo claro)

**Contexto.** Na etapa 5 o agente `Plan` recebe o design (comportamento + critérios) e os gaps, e
**organiza a implementação** em unidades — cada uma com `id`, `nome`, **arquivos** que toca,
`objetivo` e **ÂNCORA** (gaps/critérios/ADRs a que responde). No caso real, a feature virou 5
unidades (ex.: *"U1: args como array posicional"*). Esta seção define **o que torna cada unidade
bem-formada** e **como o porteiro verifica escopo claro**, destilando a pesquisa acima.

### Anatomia de uma unidade bem-formada (o schema)

```
id          U1                          (estável, ordenável)
nome        args como array posicional  (resultado, não atividade — WBS deliverable-oriented)
objetivo    o comando aceita N args posicionais e os repassa na ordem
            (descreve o COMPORTAMENTO verificável; o "como" fica negociável — INVEST-N)
arquivos    [src/cli/parser.mjs, src/cli/dispatch.mjs]
            (explícitos; fronteira "não toque o resto"; insumo de disjunção/paralelo)
ancora      gaps:    [GAP-03]            (≥1 obrigatório — sem âncora = invenção)
            criterios:[AC-2]             (o done-criteria herda daqui)
            adrs:    [ADR-0019]          (decisões que a unidade respeita)
done        "node test t/args.mjs verde + check:contracts verde"
            (binário, herdado de AC-2 — INVEST-T / SMART-M: "dá para marcar como pronto?")
```

Cada campo é justificado por uma fonte:

- **nome = resultado** (não "editar o parser") → WBS *deliverable-oriented*
  ([Wikipedia](https://en.wikipedia.org/wiki/Work_breakdown_structure)).
- **objetivo fixa o quê, não o como** → INVEST **N**egotiable ([xp123](https://xp123.com/articles/invest-in-good-stories-and-smart-tasks/)).
- **arquivos explícitos** → *delivery packet* + "touch only the files this slice needs"
  ([GitHub Blog](https://github.blog/ai-and-ml/generative-ai/agent-pull-requests-are-everywhere-heres-how-to-review-them/)).
- **ancora ≥ 1** → RTM + regra dos 100% (não-invenção)
  ([PMI RTM](https://www.pmi.org/learning/library/requirement-traceability-tool-quality-results-8873),
  [PMI WBS](https://www.pmi.org/learning/library/practice-standard-work-breakdown-structures-8063)).
- **done binário** → INVEST **T**estable / SMART **M**easurable
  ([xp123](https://xp123.com/articles/invest-in-good-stories-and-smart-tasks/)).

### Como o porteiro verifica "escopo claro" (checklist binário)

O porteiro da etapa 5 (`aceita(output)` em `pipeline.config.mjs`) já exige hoje *"cada unidade com
escopo e done-criteria claros"* e *"paralelo só onde arquivos são disjuntos"* (PIPELINE §5). Esta
pesquisa converte essas frases em **predicados mecânicos**, alinhados ao M3 (mecânica = invariante
do CORE; leitura da demanda = o que `Plan` extrai):

**Por unidade (cada uma tem de passar):**
- [ ] `id`, `nome`, `objetivo`, `arquivos` (≥1), `done` presentes e não-vazios.
- [ ] **Âncora não-vazia** — `ancora.gaps ∪ ancora.criterios ∪ ancora.adrs ≠ ∅`. *(Não-invenção:
      sem âncora, a unidade não pode existir — é a regra dos 100% no nível de unidade.)*
- [ ] **Âncora resolve** — todo id citado existe no output do design/GAP que a etapa 5 recebeu.
      *(Rastreabilidade bidirecional: a ponta de trás existe de verdade.)*
- [ ] **`objetivo` é resultado, não atividade** — heurística: não começa por verbo de método puro
      ("editar/refatorar/mexer em") sem um resultado observável atrelado. *(Deliverable-oriented.)*
- [ ] **`done` é binário** — contém uma asserção verificável (comando/critério com sim-não), não
      prosa. *(INVEST-T / SMART-M.)*
- [ ] **Não soa como projeto** — `nome`/`objetivo` não é verbo genérico + substantivo amplo
      ("construir relatórios"). *(Right-sizing — sinal de "grande demais".)*

**Entre unidades (propriedades do conjunto):**
- [ ] **Cobertura (100%):** todo gap/critério P0–P1 do design aparece na âncora de ≥1 unidade.
      *(Sem buraco — a outra metade da regra dos 100%.)*
- [ ] **Exclusividade mútua:** não há dois `objetivo` descrevendo a mesma mudança; e para
      quaisquer duas unidades marcadas como **paralelas**, `arquivos(A) ∩ arquivos(B) = ∅`.
      *(WBS mutual exclusivity ⇒ paralelismo seguro; conecta a A005.)*

> Hoje o porteiro valida **presença + valor** (PIPELINE §7, GAP-04 aberto). Os predicados de
> **âncora-resolve**, **cobertura** e **disjunção** exigem o porteiro cruzar o output da etapa 5
> com o output do design/GAP — é validação de *consistência entre artefatos*, não só de presença.
> É exatamente o "viés-raiz" que a retro do plano da etapa 1 já apontou (`_RETRO-revisao-plano-etapa1.md`:
> *"auditoria checa presença, não consistência"*). Endurecer isto é o caminho do GAP-04 para a etapa 5.

### Por que isto honra os princípios do projeto

- **M1 (dinâmico > fixo):** o CORE da etapa 5 não fixa *quantas* unidades nem *quais* — ensina o
  *critério* de boa unidade (os predicados acima); os *dados* (ids reais, arquivos, âncoras) `Plan`
  extrai do design/GAP em runtime. Trocar de feature não edita o CORE.
- **M3 (invariante vs. variável):** os 6 atributos (cobertura, exclusividade, vertical, INVEST,
  tamanho, escopo-claro) são **invariantes** → viram regra do CORE e predicado do porteiro. *Quais*
  unidades, *quais* arquivos, *qual* o corte (SPIDR/9-padrões) são **leitura da demanda** → `Plan`
  decide por feature.
- **Nunca trabalho inventado:** não é um lema nosso solto — é a **regra dos 100% do PMI** (nada
  fora do escopo) + **RTM** (toda unidade liga a um requisito), operacionalizada como "âncora
  obrigatória e resolvível".

---

## Fontes

**WBS / PMI (cobertura, work package, deliverable-oriented, mutual exclusivity, 8/80):**
- PMI — Practice Standard for Work Breakdown Structures: https://www.pmi.org/learning/library/practice-standard-work-breakdown-structures-8063
- Wikipedia — Work breakdown structure: https://en.wikipedia.org/wiki/Work_breakdown_structure
- PMI — Requirement traceability, a tool for quality results: https://www.pmi.org/learning/library/requirement-traceability-tool-quality-results-8873

**INVEST / SMART (Bill Wake, 2003 — fonte primária):**
- Bill Wake — Invest in Good Stories, and Smart Tasks (xp123): https://xp123.com/articles/invest-in-good-stories-and-smart-tasks/
- LogRocket — Writing meaningful user stories with the INVEST principle: https://blog.logrocket.com/product-management/writing-meaningful-user-stories-invest-principle/

**Vertical vs. horizontal slicing + right-sizing + padrões de corte:**
- Mike Cohn / Mountain Goat — Story Splitting (SPIDR): https://www.mountaingoatsoftware.com/agile/user-stories/story-splitting-how-to-split-user-stories-so-teams-can-finish
- Humanizing Work — Guide to Splitting User Stories (9 padrões, flowchart, Cynefin): https://www.humanizingwork.com/the-humanizing-work-guide-to-splitting-user-stories/
- Growing Scrum Masters — Horizontal vs Vertical Slicing: https://growingscrummasters.co.uk/keywords/horizontal-vs-vertical-slicing/

**INVEST/SMART aplicado a trabalho técnico:**
- Maxim Gorin — Writing Engineering Tasks as a Team Process: https://maxim-gorin.medium.com/writing-engineering-tasks-as-a-team-process-afccc9767eb4

**Escopo claro / delivery packet / arquivos explícitos / tamanho revisável:**
- GitHub Blog — Agent pull requests are everywhere. Here's how to review them: https://github.blog/ai-and-ml/generative-ai/agent-pull-requests-are-everywhere-heres-how-to-review-them/
- Artsy Engineering — Strategies for Small, Focused Pull Requests: https://artsy.github.io/blog/2021/03/09/strategies-for-small-focused-pull-requests/

**Rastreabilidade (RTM):**
- Stell — What Is a Requirements Traceability Matrix?: https://stell-engineering.com/blog/requirements-traceability-matrix

**Done-criteria vs. acceptance criteria (DoD vs. AC):**
- Scrum.org — Difference between Definition of Done and Acceptance Criteria: https://www.scrum.org/resources/blog/what-difference-between-definition-done-and-acceptance-criteria
