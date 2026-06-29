# 01 — Como escrever critério de aceitação realmente testável

> Pesquisa LOCAL que fundamenta a etapa 4 (Design). Classificação Diátaxis: **Explanation** (o porquê)
> + **Reference** (as regras). Fontes citadas ao final. Data: 2026-06-27.
> Confronta o ADR 0003 ("critério é checklist binário") — ver seção 6.

---

## Resumo executivo

Um critério de aceitação é **testável** quando qualquer pessoa (ou agente) consegue responder
"foi atendido? sim ou não" sem julgamento subjetivo, porque o critério descreve um **resultado
observável** que sai do sistema. A forma canônica para isso é **Given/When/Then** (Gherkin/BDD):
*dado* um contexto conhecido, *quando* uma ação ocorre, *então* um efeito observável acontece. O
que separa o testável do vago não é o tom binário da frase — é o **"então" apontar para algo que
o sistema produz** (tela, resposta, mensagem, valor), não para uma qualidade interna ("ser rápido",
"ser intuitivo"). A literatura (Cucumber, Gojko Adzic, Bill Wake/INVEST, George Dinwiddie/Three
Amigos) converge num único teste de qualidade: **se você não consegue escrever um exemplo concreto
com entrada e saída esperadas, o critério ainda não está pronto.** A consequência direta para o
nosso projeto: o porteiro da etapa 4 não pode aceitar qualquer frase sim/não — ele precisa exigir
estrutura Given/When/Then com um **"então" observável e binário**, e rejeitar critérios sem ele.

---

## 1. O núcleo: o que torna um critério testável

A definição mais limpa vem de Bill Wake (autor do acrônimo INVEST):

> "A **testable** story is one for which, given any inputs, we can agree on the expected system
> behavior and/or outputs."
> — Bill Wake, *Testable Stories in the INVEST Model*

Três elementos saltam dessa frase, e são exatamente os três do Given/When/Then:

| Elemento de Wake | Papel | Keyword Gherkin |
|---|---|---|
| "given any inputs" | o contexto/estado de partida | **Given** (dado) |
| (a ação implícita que processa os inputs) | o gatilho | **When** (quando) |
| "expected system behavior **and/or outputs**" | o efeito observável | **Then** (então) |

O teste de Wake não é "está perfeito e completo?" — é "**conseguimos concordar sobre qual seria
a saída esperada?**". Ele explicita que testabilidade **não exige** todos os testes escritos antes
do código; exige que estejamos "appropriately confident that we _could_ define and agree on them".
Ou seja: testável = **especificável sem ambiguidade**, não = "já tem teste automatizado".

Wake ainda dá um detector prático de critério vago: certas **palavras-gatilho** ("appropriate",
"best", "fun", "any of") denunciam pensamento ainda não acordado — onde o time *acha* que concorda
mas não concorda. São o sintoma de um "então" que não é observável.

---

## 2. Given/When/Then (Gherkin/BDD): a gramática do critério observável

O formato Given/When/Then resolve o problema de "como escrever um critério que dá para testar"
oferecendo um padrão fixo:

- **Given** — "the initial context of the system - the scene of the scenario... put the system
  in a known state". É a pré-condição. Algo que *já é verdade* antes da ação. (Cucumber Reference)
- **When** — "an event, or an action. This can be a person interacting with the system, or an
  event triggered by another system." É **um** gatilho. (Cucumber Reference)
- **Then** — "an expected outcome, or result". E aqui está a regra de ouro do projeto inteiro:

> "Then steps... should be on an **observable output**. That is, something that comes out of the
> system (report, user interface, message), and **not a behaviour deeply buried inside the system**."
> — Cucumber, *Gherkin Reference*

Essa é a frase mais carregada de toda a pesquisa. Ela diz, em linguagem do projeto: **o "então"
tem de ser verificável de fora.** "O cache é invalidado" (estado interno enterrado) não serve;
"a lista exibe o item recém-criado no topo" (saída observável) serve. A implementação do passo
`Then` "use an assertion to compare the actual outcome... to the expected outcome" — ou seja, o
Then é, por construção, uma **comparação binária**: esperado vs. real.

**Forma do Then = asserção = resultado binário.** É por isso que Given/When/Then não é só um estilo
de escrita bonito: é a forma que **força** a saída a ser binária e observável, que é precisamente
o que um gate precisa.

### 2.1 Declarativo, não imperativo (o anti-padrão a barrar)

A documentação do Cucumber (*Writing Better Gherkin*) e a comunidade BDD são enfáticas: o cenário
descreve **comportamento (o quê), não implementação (o como)**.

- Imperativo (frágil, ruim): "When user clicks the email field, types 'x@y.com', clicks password,
  types '1234', clicks Login" — amarrado à mecânica da UI atual.
- Declarativo (resiliente, bom): "When Frieda logs in with valid credentials" — sobrevive à
  mudança de implementação.

Teste do Cucumber para detectar o vício imperativo: *"Will this wording need to change if the
implementation does?"* Se sim, reescreva. Para o nosso porteiro, isto vira um sinal de alerta:
critério recheado de "clica", "digita", nomes de botão = provavelmente imperativo demais (acoplado),
e também difícil de o Gate B verificar de forma estável.

### 2.2 Um resultado por cenário

Anti-padrão clássico do Cucumber: "Testing more than one outcome... can blur the essence of your
scenario." Um cenário, um `When`, um efeito observável no `Then`. Isto é o que garante a
**binariedade**: com um único resultado, a resposta "passou?" é literalmente sim ou não. Vários
"então" no mesmo critério reintroduzem o "depende" que o gate quer eliminar.

---

## 3. Vago vs. testável: o contraste, com evidência

A literatura de acceptance criteria é unânime: termos como "rápido", "fácil", "intuitivo",
"user-friendly", "as expected" são **intestáveis** porque cada leitor os interpreta diferente.
O princípio operacional repetido em todas as fontes:

> "Each criterion must be written so it can be **proven true or false, with no grey area**.
> Subjective words... are impossible to test and must be translated into concrete, measurable
> conditions." — síntese (Nulab / Next Generation Analysts / altexsoft)

Exemplos de tradução (do vago → ao testável), retirados das fontes:

| Vago (rejeitar) | Testável (aceitar) |
|---|---|
| "A busca deve ser rápida" | "**Given** um catálogo de 1.000 itens, **when** o usuário busca 't-shirt', **then** os resultados carregam em menos de 200 ms" |
| "O dashboard deve carregar rápido" | "**Given** conexão broadband padrão, **when** o usuário abre o dashboard, **then** todos os widgets renderizam em menos de 2 s" |
| "A interface deve ser intuitiva" | "**Given** um usuário novo, **when** ele faz checkout, **then** conclui em 3 passos ou menos" |
| "O sistema deve se recuperar de erros" | "**When** desconectamos o cabo, **then** o sistema não trava" (exemplo de Gojko Adzic) |

O insight de **Gojko Adzic** (*Specification by Example* / *Bridging the Communication Gap*) é o
mecanismo por trás de todas essas traduções: **pedir um exemplo concreto transforma a discussão
abstrata em uma testável.** "The system needs to recover from error situations" é vago; o exemplo
"When we unplug the cable, the system should not crash" é concreto, comunicável e testável. Para
Adzic, exemplos bons são "specific, concise, and they should not use negatives; in a word, they
should be **testable**". O exemplo concreto **é** o critério de aceitação em estado bruto — e é
o que vira o cenário Given/When/Then.

**Regra prática derivada:** se ninguém consegue dar um exemplo concreto com entrada e saída
esperadas, o critério não está testável ainda — independentemente de estar escrito como "sim/não".

---

## 4. Three Amigos: de onde o critério testável nasce (e por que isto importa para a etapa 4)

A pergunta-mãe do Three Amigos (George Dinwiddie) é literalmente o teste de testabilidade:

> "How will I know that this requirement has been accomplished?"

Três perspectivas respondem juntas — **Business** ("qual o problema/regra"), **Development** ("como
se constrói"), **Testing** ("como sabemos que funciona") — e o produto da conversa **são** os
critérios de aceitação, formalizados como cenários Given/When/Then (Gherkin). Técnica de apoio:
**Example Mapping** (Matt Wynne) — cartões para regra (azul), exemplo (verde), pergunta aberta
(vermelha): "Examples can easily be turned into Gherkin scenarios."

Isto valida diretamente o desenho atual da nossa etapa 4: o `PIPELINE.md` já manda o Three Amigos
produzir "critério de aceitação **testável**" como resposta à pergunta "como saberemos que está
certo?". A pesquisa confirma que a **terceira pergunta do Three Amigos só está respondida quando
existe um Given/When/Then com "então" observável** — não quando existe uma frase de intenção.

---

## 5. INVEST e SMART: onde o "testável" se encaixa

- **INVEST** (Bill Wake, 2003) — o **T** é de **Testable**. A regra operacional (Boost / xp123):
  > "If there isn't a **Yes or No** answer to the question 'Have each of the acceptance criteria
  > been met?' then developers can't write automated tests and the product owner can't check the
  > story." — ou seja, intestável = não-pronto; deve voltar para refinamento antes de seguir.
  Promessa implícita ao escrever a story (Wake): *"I understand what I want well enough that I
  could write a test for it."*

- **SMART** (também repurposed por Wake, para **tasks**): **S**pecific, **M**easurable,
  **A**chievable, **R**elevant, **T**ime-boxed. O **M (Measurable)** é o que dá o limiar numérico
  que torna um "então" não-funcional ("rápido") em observável ("< 200 ms"). Nuance das fontes:
  INVEST avalia a **story** inteira; SMART calibra **tarefas/metas** — mas o "Measurable" é o
  parâmetro que transforma critérios não-funcionais em testáveis.

**Não confundir com Definition of Done.** A literatura Scrum separa claramente:

| | Acceptance Criteria | Definition of Done (DoD) |
|---|---|---|
| Escopo | **um** item específico | **tudo** que o time produz |
| Foco | funcionalidade/comportamento daquele item | qualidade/não-funcional transversal |
| Varia? | sim, item a item | estável entre sprints |
| Quando | guia dev e teste durante o trabalho | checado no fim, p/ declarar "pronto" |

Para a etapa 4: o que o Three Amigos produz são **acceptance criteria** (por comportamento, por
estado), não DoD. O DoD do projeto já é outra coisa (os critérios binários de *cada etapa* no
`PIPELINE.md`). O ADR 0003 cita "inspirado no DoD do Scrum" — correto como inspiração da *mecânica
binária do gate*, mas o conteúdo que circula na etapa 4 é acceptance criteria, e estes exigem mais
que binariedade (ver §6).

---

## 6. CONFRONTO: "critério é checklist binário" (ADR 0003) é suficiente?

**Veredicto: necessário, mas insuficiente.** O ADR 0003 acerta na *mecânica do gate* (o porteiro
decide sim/não, sem julgamento) e isso deve ser preservado. Mas "ser uma pergunta sim/não" é uma
propriedade da **forma da frase**, não uma garantia de **testabilidade do conteúdo**. As fontes
mostram que dá para escrever lixo binário:

- "O sistema é rápido o suficiente? (sim/não)" — é binário e **intestável** (sem limiar, sem saída
  observável; cada juiz responde diferente). A binariedade não impede subjetividade.
- "A interface é intuitiva? (sim/não)" — idem. Forma binária, conteúdo vago.

A própria síntese das fontes diz isso explicitamente:
> "Achieving this requires **more than just binary structure** — it requires concrete, measurable
> specificity."

**O que falta no ADR 0003, e que a pesquisa exige adicionar:**

1. **Estrutura Given/When/Then** — o critério precisa nomear *contexto*, *gatilho* e *resultado*,
   não só ser uma pergunta. (Cucumber, Three Amigos)
2. **"Então" observável** — o resultado tem de ser algo que **sai do sistema** (tela, resposta,
   mensagem, valor), não um estado interno enterrado nem uma qualidade. (Gherkin Reference — a
   regra do "observable output")
3. **Resultado binário por construção** — um único efeito esperado por critério, comparável
   (esperado vs. real). Sem "depende", sem múltiplos "então" no mesmo critério. (anti-padrões
   Cucumber)
4. **Exemplo concreto possível** — entrada + saída esperadas precisam ser exprimíveis; se não dá
   exemplo, não está testável. (Gojko Adzic — *Specification by Example*)
5. **Sem palavras-gatilho de vaguidade** — "rápido", "fácil", "intuitivo", "adequado", "como
   esperado": ou são traduzidas para limiar/observável, ou o critério é rejeitado. (Wake; síntese
   de NFR)

Em uma frase: **o ADR 0003 define que o gate é binário; esta pesquisa define o que torna o
critério-de-entrada binário-E-testável.** Os dois não brigam — o segundo é o pré-requisito de
conteúdo que faltava ao primeiro. Candidato a novo ADR (ou emenda ao 0003): "Critério de aceitação
testável = Given/When/Then com 'então' observável e único."

### 6.1 Por que isto é mecanicamente verificável por um agente depois (Gate B)

Given/When/Then não é só legível por humano — é **parseável por máquina**. A literatura de
executable specification descreve o fluxo: `feature file → gherkin parser → JSON IR → test runner`,
onde o parser segmenta em "preconditions (Given), user triggers (When), and **verifiable outcomes
(Then)**". Implicações diretas para o nosso Gate B (o agente `fiscal` que verifica ao vivo):

- **Given** diz ao Gate B **qual estado montar / qual dado real usar** antes de testar (é a entrada
  do "Plano de verificação" da Prep Gate B).
- **When** diz **qual ação disparar** — exatamente uma, reproduzível.
- **Then** diz **o que observar e comparar** — a asserção. O Gate B olha a saída real do sistema e
  responde verificado/diverge. Se o "então" fosse interno ("o cache invalidou"), o Gate B *não
  conseguiria observar de fora* → inconclusivo estrutural. Por isso a regra do "observable output"
  é o que torna o critério **verificável ao vivo**, não só no papel.

Ou seja: um critério Given/When/Then bem-formado é, por construção, um **roteiro de teste** que o
Gate B executa quase sem tradução. Um critério vago não é roteiro de nada — e é aí que o Gate B
trava (vira "inconclusivo" / "precisa-humano"). **A testabilidade do critério na etapa 4 é a
condição de possibilidade da verificação ao vivo na etapa 9.**

---

## 7. Aplicação à etapa 4 (como o porteiro EXIGE critério testável)

Tradução das evidências acima em regras concretas para o CORE/porteiro da etapa Design. O porteiro
**rejeita** o entregável se qualquer critério de aceitação falhar nas checagens abaixo. Todas são
**verificáveis estruturalmente** (não dependem de julgar mérito):

**R-CT1 — Estrutura tripla obrigatória.** Cada critério deve conter contexto + gatilho + resultado
(pode ser Given/When/Then explícito, ou um par "dado/quando → então"). *Rejeita se:* falta o
"então" (resultado) — o erro mais comum e o que o enunciado do projeto pediu para barrar.
*Verificação do porteiro:* presença dos três segmentos (parse de "dado…/quando…/então…" ou campos
`given/when/then` no schema).

**R-CT2 — "Então" observável.** O resultado tem de referenciar uma saída do sistema (tela exibe X,
endpoint responde Y, mensagem Z aparece, valor W é gravado e relido). *Rejeita se:* o "então"
descreve estado interno não observável de fora ("o cache invalida", "a flag muda") **sem** uma
manifestação observável correspondente, ou descreve uma qualidade ("fica rápido", "fica fácil").
*Verificação:* o "então" cita um artefato observável OU um limiar mensurável.

**R-CT3 — Binário, resultado único.** Um efeito esperado por critério. *Rejeita se:* o critério tem
"e também", múltiplos "então" independentes, ou contém "depende/talvez/idealmente". *Verificação:*
um único `then`; ausência de hedge words.

**R-CT4 — Sem vaguidade não-traduzida.** Lista dinâmica de palavras-gatilho ("rápido", "fácil",
"intuitivo", "adequado", "amigável", "como esperado", "performático", "robusto") — se aparecem no
"então", precisam vir com limiar/observável anexo. *Rejeita se:* palavra-gatilho sem tradução.
(Coerente com M1 do projeto: a *lista* de gatilhos pode ser semente, mas o **critério** é "tem
resultado observável?" — descoberto do conteúdo, não fixado.)

**R-CT5 — Exemplo concreto exprimível (Three Amigos / Adzic).** Para cada critério deve ser possível
dar 1 exemplo com entrada e saída esperadas. *Rejeita se:* o autor não consegue instanciar um
exemplo (sinal de que ainda é abstrato). *Verificação:* opcionalmente o schema da etapa 4 pede um
campo `exemplo` por critério — presença = prova de que é concreto.

**R-CT6 — Declarativo o suficiente para sobreviver à implementação.** Sinal de alerta (não rejeição
automática): excesso de mecânica de UI ("clica no botão azul, digita no campo email"). Preferir
intenção ("o usuário faz login com credenciais válidas"). Acoplamento à UI atual fragiliza tanto o
critério quanto a verificação do Gate B. (Cucumber — declarativo vs. imperativo.)

**Ligação com o resto do pipeline (já desenhado):** estes critérios são a saída do **Three Amigos**
(etapa 4) e a entrada do **Prep Gate B → Gate B** (etapas “Prep”/9). O `Given` alimenta "qual dado
real usar"; o `When` alimenta "qual cenário"; o `Then` é o que o Gate B compara ao vivo. Se a etapa
4 deixar passar critério intestável, o custo aparece lá na frente como Gate B "inconclusivo" — por
isso o porteiro da etapa 4 é a barreira certa e mais barata para isso (custo de corrigir cresce
downstream — princípio Three Amigos de "surfacing ambiguity when it is cheapest").

**Forma de schema sugerida (candidata, validar bottom-up — M2/M4):** cada item de
`criterios_de_aceitacao` como objeto `{ given, when, then, exemplo }` em vez de string solta. Isso
torna R-CT1/R-CT2/R-CT5 verificáveis pelo motor por **presença de campo**, não por análise de
prosa — alinhado ao GAP-04 (endurecer validação de estrutura) e à mecânica atual do `aceita()`.

> Nota de honestidade epistêmica: R-CT2/R-CT4 dependem de detectar "observável" vs. "interno" e
> "vago" vs. "concreto" — isso é parcialmente semântico, não 100% sintático. A parte sintática
> (existe `then`? é único? tem campo `exemplo`?) o motor checa sozinho; a parte semântica ("este
> `then` é mesmo observável?") é trabalho do gerador de briefing/LLM porteiro. Documentar esse
> limite evita a ilusão de que um regex resolve tudo (coerente com o aprendizado do `_RETRO`:
> auditoria que só checa presença, não consistência, é o viés-raiz).

---

## 8. Síntese (uma régua de bolso para o porteiro)

> **Um critério é testável quando descreve um RESULTADO OBSERVÁVEL e ÚNICO que sai do sistema, a
> partir de um CONTEXTO conhecido e um GATILHO definido, de forma que "passou? sim/não" tenha
> resposta sem julgamento — e que dê para dar um EXEMPLO concreto com entrada e saída.**

Falhou em qualquer das quatro maiúsculas (RESULTADO / OBSERVÁVEL / CONTEXTO / GATILHO) ou não dá
exemplo → **não é testável → o porteiro rejeita.** "É binário" não basta: binário é a forma do
*gate*; observável-e-único é a forma do *critério*.

---

## Fontes

**Primárias / canônicas**
- Cucumber — *Gherkin Reference* (definições oficiais de Given/When/Then; regra do "observable
  output"): https://cucumber.io/docs/gherkin/reference/
- Cucumber — *Writing Better Gherkin* (declarativo vs. imperativo; comportamento, não
  implementação): https://cucumber.io/docs/bdd/better-gherkin/
- Cucumber — *Cucumber anti-patterns* (um resultado por cenário; detalhes de implementação demais):
  https://cucumber.io/blog/bdd/cucumber-anti-patterns-part-two/
- Bill Wake — *Testable Stories in the INVEST Model* (definição de "testable"; palavras-gatilho;
  promessa implícita): https://xp123.com/testable-stories-in-the-invest-model/
- Bill Wake — *INVEST in Good Stories, and SMART Tasks* (origem de INVEST e SMART, 2003):
  https://xp123.com/invest-in-good-stories-and-smart-tasks/
- Gojko Adzic — *Specification by Example* (exemplos concretos como base de critério testável):
  https://gojko.net/books/specification-by-example/  ·  síntese:
  https://www.codurance.com/publications/2017/04/03/learning-specification-by-example-from-gojko-adzic
- George Dinwiddie / John Ferguson Smart — *Three Amigos requirements discovery* ("how will we
  know?"; Example Mapping): https://johnfergusonsmart.com/three-amigos-requirements-discovery/
- *The Behavior-Driven Three Amigos* (Automation Panda — papéis → Gherkin):
  https://automationpanda.com/2017/02/20/the-behavior-driven-three-amigos/

**Secundárias / aplicação**
- INVEST — *Testable = resposta Yes/No* (Boost): https://www.boost.co.nz/blog/2021/10/invest-criteria/
- Agile Alliance — *INVEST* (glossário): https://agilealliance.org/glossary/invest/
- Agile Alliance — *Three Amigos* (glossário): https://agilealliance.org/glossary/three-amigos/
- Definition of Done vs. Acceptance Criteria (Scrum.org):
  https://www.scrum.org/resources/blog/what-difference-between-definition-done-and-acceptance-criteria
- Acceptance Criteria — formatos e boas práticas (altexsoft):
  https://www.altexsoft.com/blog/acceptance-criteria-purposes-formats-and-best-practices/
- Acceptance criteria mensuráveis / traduções vago→testável (Nulab):
  https://nulab.com/learn/software-development/acceptance-criteria/
- *Clear and Concise Acceptance Criteria* (Next Generation Analysts):
  https://nextgenanalysts.co.uk/how-to-write-clear-and-concise-acceptance-criteria-with-practical-examples/
- *Given-When-Then for Better User Stories* (ParallelHQ):
  https://www.parallelhq.com/blog/given-when-then-acceptance-criteria
- Executable specification / Gherkin parser → JSON IR (máquina-verificável):
  https://hapy.co/journal/gherkin-language/

**Cruzamento interno do projeto**
- `docs/REFERENCIAS.md` (Three Amigos, Spike, Pre-mortem, DoR já fichados)
- `docs/PIPELINE.md` (etapa 4 já manda Three Amigos produzir critério testável; Gate B na etapa 9)
- `docs/ANATOMIA-DE-ETAPA.md` peça 7 (critério = o porteiro) e peça 6 (schema = handoff)
- `docs/adr/0003-...md` (alvo do confronto da §6); GAP-04 (endurecer validação de estrutura)
