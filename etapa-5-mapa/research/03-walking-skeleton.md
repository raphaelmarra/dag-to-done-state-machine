# Walking Skeleton e a Ordem de Implementação Incremental

> Pesquisa de fundação para a etapa 5 (Mapa de dependências) — subsídio para decidir
> "Walking Skeleton sim ou não, com justificativa" de forma **ancorada em fatos**, não em opinião.
> Responde diretamente à questão aberta **A006** (`docs/ABERTO.md`): o que define risco alto que aciona o WS.
> Status: pesquisa externa destilada (M2 bottom-up — alimenta um futuro ADR, ainda não cristaliza).

---

## Resumo executivo

O **Walking Skeleton** (Alistair Cockburn, *Crystal Clear*, 2004/2005) é "a implementação da
**fatia mais fina possível de funcionalidade real** que conseguimos automaticamente **construir,
implantar e testar de ponta a ponta**". O ponto não é entregar uma feature pequena — é **ligar as
peças arquiteturais principais** e provar que o **caminho end-to-end existe e roda** antes de
investir na construção completa. É **código de produção** (não protótipo descartável), e arquitetura
e funcionalidade crescem em paralelo a partir dele.

A pergunta certa não é "a feature é grande?" mas **"o caminho de ponta a ponta já existe e roda
hoje?"**. Se já existe (base presente, integrações já provadas, fluxo já funciona), o WS **já foi
pago** — refazê-lo é cerimônia vazia, e o trabalho real é **incremento sobre base existente**. Se
**não** existe (integração nova, infraestrutura não exercitada, caminho inédito, risco técnico não
confirmado), o WS é o **primeiro passo defensável** — ele transforma "achamos que liga" em "vimos
ligar".

Para a etapa 5 isso vira um **teste objetivo de 5 sinais** (abaixo). A decisão do caso real foi
**NÃO** — e ela é defensável precisamente porque os 5 sinais apontaram "base existe / caminho roda":
a aba já funcionava end-to-end, e o "esqueleto andante equivalente" virou **fazer U1+U2 rodarem
ponta-a-ponta antes dos refinamentos** (a mesma disciplina do WS aplicada a trabalho incremental).

---

## 1. O que é o Walking Skeleton (definição canônica)

**Cockburn (*Crystal Clear*)** — a definição-fonte, repetida por Freeman & Pryce:

> "A *walking skeleton* is a tiny implementation of the system that performs a small end-to-end
> function. It need not use the final architecture, but it should link together the main
> architectural components. The architecture and the functionality can then evolve in parallel."

E a forma operacional (Freeman & Pryce, *Growing Object-Oriented Software, Guided by Tests*, cap. 10):

> "an implementation of the thinnest possible slice of real functionality that we can automatically
> **build, deploy, and test end-to-end**."

Quatro propriedades que definem o conceito (e o distinguem de "feature pequena qualquer"):

| Propriedade | O que significa | Evidência |
|---|---|---|
| **End-to-end real** | Atravessa todas as camadas principais (UI → lógica → dados/integração), não um pedaço isolado | Cockburn; Freeman & Pryce cap. 10 |
| **Liga as peças principais** | Prova que os componentes arquiteturais **se comunicam**; não precisa ser a arquitetura final | Cockburn; de hÓra, 97 Things |
| **Automatizável** | Build + deploy + teste rodam de forma automática desde o dia 1 (CI/CD-ready) | Freeman & Pryce ("build, deploy, and test") |
| **Código de produção, não protótipo** | Não é descartável; vira o esqueleto sobre o qual tudo cresce | Freeman & Pryce; Pragmatic Programmer (tracer bullet) |

**Por que o teste end-to-end primeiro importa** (Freeman & Pryce): escrever o **primeiro teste
end-to-end força decisões** de estrutura, deploy e infraestrutura que não podem ser adiadas — e
**aflora cedo o risco de integração/infraestrutura**, antes de investir em código de feature. O valor
está em descobrir que "as peças não conversam" na **semana 1**, não na semana 8.

---

## 2. Tracer Bullet (Pragmatic Programmer) — o primo do WS

Hunt & Thomas (*The Pragmatic Programmer*) chamam quase a mesma coisa de **tracer bullet** (bala
traçante): você dispara um projétil que **acende a trajetória inteira** — do requisito a algum
aspecto do sistema final — de forma rápida, visível e repetível. Como uma bala traçante, mostra **se
você está mirando certo** antes de gastar toda a munição.

**A distinção crítica — tracer bullet ≠ protótipo** (este é o eixo que mais confunde, inclusive na
etapa 3/Spike do nosso pipeline):

| | Tracer Bullet / Walking Skeleton | Protótipo / Spike |
|---|---|---|
| **Destino** | **Permanente** — vira parte do sistema final | **Descartável** — joga fora depois |
| **Completude** | Fino mas **completo**: tem o error-handling de código de produção, só não tem toda a funcionalidade | Incompleto de propósito; explora **uma** questão |
| **Objetivo** | Confirmar que **as peças ligam end-to-end** (estrutura) | Resolver **uma incerteza** (técnica ou de requisito) |
| **Resultado** | Esqueleto operacional sobre o qual se incrementa | Conhecimento / uma decisão |

> "The difference between tracer development and prototyping is that prototyping is **disposable**,
> while tracer code is **not** […] tracer code is lean but complete, and forms part of the skeleton
> of the final system." — *Pragmatic Programmer*

**Nota para o nosso pipeline:** o **Spike** (etapas 3→4) é protótipo descartável → produz uma
*decisão*. O **Walking Skeleton** (etapa 5→6) é tracer bullet → produz *código-esqueleto* que fica.
São ferramentas para perguntas diferentes: Spike pergunta "**dá pra fazer?**"; WS pergunta "**as
peças ligam?**". Confundir os dois é um erro de categoria.

---

## 3. Walking Skeleton ≠ MVP (eixos diferentes)

| Eixo | Walking Skeleton | MVP (Minimum Viable Product) |
|---|---|---|
| **Dirigido por** | **Risco técnico** (a arquitetura se sustenta?) | **Valor de negócio** (alguém quer isto?) |
| **Para quem** | Interno (equipe) — prova de viabilidade | Externo (early adopters) — feedback de mercado |
| **Mínimo em** | Features; **completo em arquitetura** (liga tudo end-to-end) | Features (só o suficiente para ser útil); arquitetura pode ser parcial |
| **Pergunta que responde** | "As peças conversam? O caminho roda?" | "Isto resolve o problema do usuário?" |
| **Ordem** | Tipicamente **vem antes** do MVP — dá ao MVP fundação técnica | Vem depois; cresce em incrementos sobre o esqueleto |

São **ortogonais**, não rivais. O WS reduz **risco de integração**; o MVP reduz **risco de mercado**.
Na nossa etapa 5 a decisão é **só sobre o eixo técnico** (o eixo de valor já foi tratado a montante,
no Design/etapa 4). Por isso o critério de decisão tem de falar de **integração e caminho end-to-end**,
não de "valor para o usuário".

---

## 4. Quando vale a pena (e quando NÃO) — critérios objetivos

A literatura converge: o WS paga quando há **risco de integração/arquitetura não confirmado**, e é
**cerimônia vazia** quando esse risco já está pago.

**Sinais de que VALE (do consenso das fontes):**
- O software precisa **ligar a um ecossistema existente** que ainda não foi exercitado (legado, SAP,
  serviços externos, nova fronteira de API) — *defmyfunc / 67bricks*.
- **Não existe ainda** um caminho end-to-end rodando — "implantar e testar de ponta a ponta" é, em si,
  trabalho não feito — *Freeman & Pryce*.
- **Mudar a arquitetura depois custaria caro** — "making changes to an architecture is harder and
  more expensive the longer it has been around and the bigger it gets" — *de hÓra, 97 Things*.
- Há **suposição arquitetural não testada** ("achamos que essas peças conversam") — o WS a converte
  em fato observado.

**Sinais de que NÃO vale (o complemento, e o caso da etapa 5):**
- O caminho end-to-end **já existe e roda** (a base está presente, as integrações já foram provadas).
  Aqui o WS **já foi pago historicamente** — refazê-lo não revela nada novo. *(67bricks: desnecessário
  quando o risco arquitetural é mínimo.)*
- O trabalho é **incremento/correção sobre base existente**, não construção de caminho novo — é o
  domínio do desenvolvimento **incremental** clássico, não do esqueleto.
- O risco dominante é **de comportamento/qualidade** (a feature funciona, mas precisa estar *certa*),
  não **de integração** (as peças ligam?) — esse risco é endereçado pelos **Gates A/B**, não pelo WS.

> Regra de bolso destilada das fontes: **o WS prova que o caminho existe.** Se o caminho já existe,
> não há o que provar — provar de novo é burocracia (exatamente o risco que A006 aponta: "sem critério
> claro vira ou obrigatório (burocracia) ou ignorado").

---

## 5. A ordem de implementação: risco-primeiro vs valor-primeiro

O WS é um caso particular de uma escolha maior: **o que construir antes?**

**Incremental vs iterativo (Jeff Patton — a "Mona Lisa"):**
- **Incremental** = pintar um cantinho perfeito da Mona Lisa por vez; o resto é tela em branco.
- **Iterativo** = esboçar a tela inteira em linhas, mostrar, ganhar fidelidade a cada passo.
- O **WS é a primeira iteração**: o esboço de linhas que já é *toda* a figura, em baixa fidelidade —
  por isso "anda" (funciona end-to-end) mesmo sem detalhe.

**Risco-primeiro vs valor-primeiro (Mike Cohn — risco × valor):** Cohn ordena o trabalho por dois
eixos combinados:

| Ordem | Quadrante | Racional |
|---|---|---|
| **1º** | Alto valor / **alto risco** | Ataca cedo o que pode derrubar o projeto; ainda há tempo de pivotar |
| **2º** | Alto valor / baixo risco | O ganha-pão, já com o risco fora do caminho |
| **3º** | Baixo valor / baixo risco | Preenchimento |
| **evitar** | Baixo valor / alto risco | Não vale o risco |

> "high-risk/high-value **first**; low-risk/high-value **second**; and finally, low-risk/low-value." — *Cohn (via Hygger)*

O **Walking Skeleton é a materialização do "risco-primeiro"** quando o risco é **de integração**:
construa primeiro a coisa que prova que as peças ligam, porque descobrir tarde que não ligam é o erro
mais caro. **Riskiest Assumption Test (RAT):** identifique e teste a suposição mais arriscada antes de
implementar — se o risco é "as peças não conversam", o teste dessa suposição **é** o Walking Skeleton.

**Síntese para a etapa 5:** a ordem das unidades de implementação deve ser **risco-de-integração
primeiro**. Quando *não* há risco de integração novo (caminho já roda), a ordem passa a ser
**valor/correção-primeiro**, e a disciplina de "ligar antes de refinar" reaparece **dentro** do
trabalho incremental — como o caso real fez ao exigir U1+U2 ponta-a-ponta antes dos refinamentos.

---

## 6. Aplicação à etapa 5 (decisão WS ancorada em fatos)

A etapa 5 deve produzir um campo `walking_skeleton: { decisao: sim|não, justificativa }`. Para que a
justificativa seja **defensável (fato) e não chute (opinião)**, ela deve responder a um **teste de 5
sinais** — cada um respondível com **evidência herdada das etapas 1–4**, não com julgamento novo:

| # | Sinal (pergunta de fato) | Fonte da evidência (já existe no pipeline) | "sim" puxa para… |
|---|---|---|---|
| **S1** | O caminho end-to-end (UI→lógica→dados) **já existe e roda** hoje? | DAG/etapa 1 (componentes tocados, base presente) | **NÃO** fazer WS |
| **S2** | Há **integração nova** ou fronteira de API ainda **não exercitada**? | Descoberta/etapa 2 (`confirmado ao vivo` vs `não verificado`) + GAP/etapa 3 | **SIM** fazer WS |
| **S3** | Existe **risco técnico não confirmado** que bloquearia ligar as peças? | GAP/etapa 3 (incertezas; e o Spike **já** resolveu ou não?) | **SIM** fazer WS |
| **S4** | A complexidade é **alta** *e* envolve **caminho inédito** (não só volume de código)? | GAP/etapa 3 (estimativa simples\|média\|alta) | **SIM** se alta **por integração** |
| **S5** | O trabalho é **construção de caminho novo** ou **incremento/correção sobre base existente**? | DAG/etapa 1 + GAP/etapa 3 | incremento → **NÃO** |

**Regra de decisão (defensável):**
- **WS = SIM** se **S2 ou S3** forem verdadeiros (integração nova **ou** risco técnico de ligação não
  confirmado) — há um caminho a *provar*. (S4 reforça quando a complexidade alta vem de integração.)
- **WS = NÃO** se **S1 for verdadeiro e S2/S3 forem falsos** — a base existe, o caminho roda, o
  trabalho é incremental. **Não há caminho novo a provar.**
- **Empate/dúvida** → não é decisão de WS, é sinal de que a etapa 2 ou 3 deixou um gap aberto
  (`não verificado` / incerteza sem Spike). Devolve para fechar o fato antes de decidir.

**Por que o caso real foi NÃO — e por que isso é fato, não opinião:**
- **S1 = sim** — "a feature (uma aba) **já existia e funcionava** no esqueleto end-to-end". O caminho
  já roda; **não há end-to-end a provar**.
- **S2 = não** — sem integração nova; a aba consumia o que já estava ligado.
- **S5 = incremento** — "o trabalho era **correção incremental, não construção nova**".
- ⇒ Regra "S1 verdadeiro + S2/S3 falsos" ⇒ **WS = NÃO**, com justificativa rastreável às etapas 1–3.

**O "esqueleto andante equivalente" (a sacada do caso real):** mesmo decidindo NÃO ao WS formal, a
**disciplina** do WS foi preservada **dentro** do trabalho incremental — fazer **U1+U2 rodarem
ponta-a-ponta ANTES dos refinamentos**. Isto é *exatamente* o princípio de Cockburn/Freeman ("ligar
as peças e andar primeiro, refinar depois") aplicado a quem **já tem** esqueleto: a primeira iteração
incremental volta a ser end-to-end (a "Mona Lisa em linhas" das **duas** unidades), e só então se
adiciona fidelidade. **O WS não é uma etapa que se faz ou não — é uma disciplina que muda de escala:
caminho novo → esqueleto do sistema; caminho existente → esqueleto do incremento.**

**Fechando A006 (proposta de critério):** A006 pergunta "o que define risco alto?". A resposta
destilada: **"risco alto" para acionar o WS = risco de INTEGRAÇÃO/CAMINHO, não de complexidade ou
volume.** Operacionalmente = **S2 ∨ S3** (integração nova **ou** ligação não confirmada). Isto evita
os dois fracassos que A006 teme: não vira **burocracia** (não dispara quando o caminho já roda) nem é
**ignorado** (dispara objetivamente quando há caminho novo a provar). A decisão fica **ancorada em
campos que as etapas 1–3 já produzem** (`base presente`, `confirmado ao vivo`, `incerteza/Spike`,
`complexidade`) — fato herdado, não opinião nova na etapa 5.

> **Sugestão de cristalização (M4 — testar antes):** o teste de 5 sinais é hipótese destilada de 1
> caso (o real, NÃO) + pesquisa. Antes de virar ADR, validar contra um 2º caso **diferente** — de
> preferência um que force **SIM** (integração nova / caminho inédito), para provar que a regra
> discrimina nos dois sentidos. Até lá, registrar em ABERTO/WIP, não em DECISOES.

---

## Fontes

- Alistair Cockburn — *Crystal Clear: A Human-Powered Methodology for Small Teams* (2004/2005), origem do termo "walking skeleton": https://alistaircockburn.com/Bio · (síntese ResearchGate) https://www.researchgate.net/publication/234820806_Crystal_clear_a_human-powered_methodology_for_small_teams
- Steve Freeman & Nat Pryce — *Growing Object-Oriented Software, Guided by Tests*, cap. 10 "The Walking Skeleton" (definição "thinnest possible slice… build, deploy, and test end-to-end"; primeiro teste end-to-end força arquitetura/infra): https://www.oreilly.com/library/view/growing-object-oriented-software/9780321574442/ch10.html
- Andy Hunt & Dave Thomas — *The Pragmatic Programmer*, "Tracer Bullets" (tracer ≠ protótipo; código fino mas completo, não descartável): https://www.artima.com/articles/tracer-bullets-and-prototypes · https://www.barbarianmeetscoding.com/notes/books/pragmatic-programmer/tracer-bullets/ · https://builtin.com/software-engineering-perspectives/what-are-tracer-bullets
- Bill de hÓra — "Start with a Walking Skeleton", *97 Things Every Software Architect Should Know* (custo de mudar arquitetura cresce com o tempo; comece pelo esqueleto): https://www.oreilly.com/library/view/97-things-every/9780596800611/ch60.html · https://yoshi389111.github.io/kinokobooks/soft_en/Start_with_a_Walking_Skeleton.htm
- defmyfunc — "Integration, integration, integration: walking skeletons in the enterprise" (WS = provar as integrações conhecidas; quando vale: ligar a ecossistema existente): https://www.defmyfunc.com/2019_10_18_walking_skeleton/
- 67bricks — "What is a Walking Skeleton and why do I need one?" (quando precisa / quando pular; não é customer-facing; reduz problemas de integração): https://67bricks.com/blog/what-is-a-walking-skeleton-and-why-do-i-need-one
- Gojko Adzic — "Forget the walking skeleton — put it on crutches" (crítica/refinamento: UI primeiro em "muletas" para entregar valor cedo): https://gojko.net/2014/06/09/forget-the-walking-skeleton-put-it-on-crutches/
- Jeff Patton — incremental vs iterativo (a "Mona Lisa"; o WS como primeira iteração de baixa fidelidade): https://blackswanfarming.com/iterations-vs-increments-mona-lisa-and-mr-fox/ · https://itsadeliverything.com/revisiting-the-iterative-incremental-mona-lisa
- Mike Cohn — risco × valor (ordem high-risk/high-value primeiro): https://university.hygger.io/en/articles/2399041-value-vs-risk-model
- Riskiest Assumption Test (RAT) — testar a suposição mais arriscada antes de implementar: https://modelthinkers.com/mental-model/riskiest-assumption-test · https://services.blog.gov.uk/2022/11/03/prioritise-the-riskiest-assumptions-in-big-problem-spaces/
- Walking Skeleton vs MVP (eixos risco-técnico vs valor-de-negócio): https://youexec.com/questions/what-is-the-difference-between-a-walking-skeleton-and-a · https://fibery.com/blog/product-management/walking-skeleton/
