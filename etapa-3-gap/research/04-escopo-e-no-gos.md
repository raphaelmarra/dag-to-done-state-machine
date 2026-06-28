# Fronteira de escopo e no-gos — declarar explicitamente o que fica de fora de propósito

> Pesquisa LOCAL que fundamenta a etapa 3 (GAP). Tema: como software/produto declara a **fronteira
> de escopo** — o que NÃO se faz, conscientemente. Foco no critério de aceitação da etapa 3: *"no-gos
> declarados explicitamente"*. Fontes citadas ao final. Princípio do projeto que isto serve: **tudo
> explícito e com evidência/motivo, nunca silêncio** (CLAUDE.md; M1–M4).

---

## Resumo executivo

A literatura de gestão de projeto e produto converge num ponto raramente intuitivo: **declarar o que
NÃO se vai fazer é tão importante quanto declarar o que se vai fazer** — e, segundo o PMI, a maioria
das disputas de escopo nasce de coisas que foram *presumidas dentro* do escopo, não de coisas que
foram explicitamente acordadas. Quatro corpos de conhecimento dão nome e forma a essa fronteira:

1. **MoSCoW — "Won't have *this time*"** (Agile Business Consortium / DSDM): a quarta categoria de
   priorização existe *de propósito* para registrar o que o time **acordou não entregar** nesta janela.
   É gravada na lista priorizada justamente para "evitar que seja reintroduzida informalmente depois".
2. **Scope statement do PMI (PMBOK) — "project exclusions"**: a declaração de escopo é o documento de
   fronteira; suas *exclusões* nomeiam o que está explicitamente fora, **para fixar expectativa e
   reduzir scope creep**. Sem exclusões, "o projeto vira um cheque em branco".
3. **BABOK — solution scope / scope modelling** (IIBA): definir escopo é definir fronteira — o que o
   sistema é **e o que não é** —, e o context diagram torna o "fora" visível antes da elicitação.
4. **Non-goals em design docs** (prática Google / product management): a peça conceitualmente mais
   próxima do nosso "no-go". Um non-goal **não** é um requisito negado ("o sistema não deve cair"); é
   *"algo que poderia razoavelmente ser um objetivo, mas que se escolheu explicitamente que não é"*.

O fio que une tudo: um **no-go legítimo é uma decisão consciente com motivo registrado**; uma omissão
é silêncio. A diferença não está no resultado ("isso não foi feito") — está na **rastreabilidade da
decisão**. O PMI e o ADR/MADR formalizam isso: requisitos e decisões devem carregar *fonte e racional*;
o MADR torna a seção "opções consideradas / por que rejeitadas" **obrigatória, não opcional**, porque
"um ADR que só registra o que você escolheu, e não o que você descartou, falha — times futuros não
entendem por que a alternativa óbvia não foi escolhida, e debates velhos se repetem". Para a etapa 3,
isso traduz-se num critério operacional: **cada no-go deve vir com (a) o que fica de fora, (b) o motivo,
e (c) o destino** (adiado / fora de propósito permanente / responsabilidade de outra etapa).

---

## 1. MoSCoW — a categoria "Won't have this time" é o não-escopo formalizado

MoSCoW (Must / Should / Could / **Won't have this time**) é uma técnica de priorização de requisitos
para alinhar com stakeholders a importância da entrega de cada item. As três primeiras letras
ordenam o que *entra*; a quarta — frequentemente esquecida — existe **só** para registrar o que **não
entra**.

**Definição (Agile Business Consortium / DSDM):** "Won't have" são "requisitos que o time de projeto
**acordou que não serão entregues** (como parte deste período)". São "gravados na Prioritised
Requirements List, onde **ajudam a esclarecer o escopo do projeto**. Isso evita que sejam reintroduzidos
informalmente mais tarde". O sufixo **"this time"** é deliberado e temporal: exclusão desta fase **não
significa rejeição permanente** — promete reconsideração futura sem comprometer-se com ela.

**Por que importa (evidência):**
- "Listar explicitamente o que você **não** vai fazer é tão importante quanto listar o que vai. Itens
  Won't Have estabelecem expectativa clara e previnem scope creep." (ProductPlan / múltiplas fontes.)
- "O que é deliberadamente deixado de fora deve estar documentado de forma visível — isso evita debates
  depois." (síntese de fontes MoSCoW.)
- Efeito psicológico de foco: "Won't Haves podem ser muito poderosos para manter o foco, *neste momento*,
  nos Could/Should/Must mais importantes." (DSDM Handbook.)

**Leitura para a etapa 3:** o no-go é o "Won't have this time" do nosso pipeline — mas com uma diferença
de natureza. No MoSCoW ele é uma *escolha de priorização* ("cabe, mas não agora"). Na etapa 3 o no-go
costuma ser mais forte: "decidimos conscientemente NÃO fazer isto **nesta feature**, por um motivo". O
sufixo temporal ("this time") nos ensina algo prático: **um bom no-go declara o seu prazo de validade**
— é "fora de escopo desta feature" (pode voltar em outra) ou "fora de propósito sempre" (decisão de
produto)? Declarar isso protege quem lê de tratar todo no-go como rejeição definitiva.

---

## 2. PMI / PMBOK — scope statement e "project exclusions"

O **project scope statement** é a descrição detalhada do que o projeto **vai e não vai** entregar — é o
documento de fronteira que define o que está dentro, o que está explicitamente fora (exclusions), e
quais premissas/restrições governam o trabalho. Seus componentes canônicos incluem: descrição do escopo
do produto, **critérios de aceitação**, **project exclusions** (o que explicitamente não está incluído)
e **assumptions/constraints**.

**A tese central do PMI (a mais citável para nós):**
> "Documentar o que o projeto **não** vai entregar é tão crítico quanto documentar o que vai, porque a
> maioria das disputas de escopo surge de coisas que foram **presumidas dentro** do escopo — não de
> coisas que foram explicitamente acordadas."

**Evidência adicional:**
- "Exclusões são requisitos, entregáveis e recursos **não** dentro do escopo, usados para estabelecer
  fronteiras e prevenir scope creep." (síntese PMP.)
- "Se você não define exclusões, o projeto é tratado como um **cheque em branco**." (ProjectManager.)
- Recomendação prática direta: "Liste explicitamente itens que stakeholders *poderiam presumir incluídos*
  mas estão fora — certificação, suporte contínuo, integrações de terceiros." A proteção mais forte
  contra scope creep é nomear **os itens que têm mais chance de serem presumidos como dentro**.
- Proteção de fases seguintes (rework): "Ao capturar escopo cedo no planejamento, o gestor **reduz o
  risco de retrabalho** e melhora a precisão de estimativa para as **fases downstream**." (Anexas / PMP.)

**Leitura para a etapa 3:** a etapa 3 é, na prática, o ponto do pipeline onde produzimos o equivalente a
um *scope statement* da feature — gaps (o que falta), reuso (o que já existe) e **no-gos (as project
exclusions)**. O insight operacional do PMI é o **teste da presunção**: um no-go é mais valioso quanto
mais provável seria alguém **presumir aquilo dentro do escopo**. O no-go ideal não diz o óbvio
("não vamos construir um foguete"); ele desarma a presunção perigosa ("parece que esta tela deveria ter
exportação CSV — **não nesta feature**, porque [motivo]"). É exatamente o item que, não declarado,
viraria scope creep no Design ou na Implementação.

---

## 3. BABOK / IIBA — solution scope e fronteira visível

O BABOK trata escopo como **fronteira**: "entender o que o projeto/solução abrange **e o que não
abrange**". A análise de negócio insiste que o **solution scope** seja definido **antes** da elicitação
de requisitos — porque a maior parte do scope creep "ocorre por falta de acordo entre stakeholders,
entendimento inconsistente, ou análise insuficiente do escopo da solução".

Técnicas que tornam o "fora" **visível**: functional decomposition, interface analysis, **scope
modelling** e, em especial, o **context diagram** — que mostra fronteiras do sistema, atores externos e
fluxos de dados, "ajudando a esclarecer o que está dentro e fora do escopo". Acordo sobre fronteira
"aumenta a probabilidade de satisfação do stakeholder e de sucesso do projeto".

**Leitura para a etapa 3:** o BABOK reforça o *timing* do nosso pipeline. A etapa 3 vem **antes** do
Design (etapa 4) e da Implementação (etapa 6) **de propósito** — declarar a fronteira cedo é a função.
O no-go é a aresta do "context diagram" da feature: marca onde o sistema **deliberadamente não toca**.
Isso conecta diretamente com a peça 8 do nosso catálogo (gaps direcionais) e com o teste C1: enquanto o
*gap* aponta "falta X para a próxima etapa", o *no-go* aponta "a próxima etapa **não deve** perseguir Y
— está fora da fronteira por decisão".

---

## 4. Non-goals em design docs — a peça conceitualmente idêntica ao "no-go"

Esta é a fonte mais alinhada ao que a etapa 3 chama de "no-go". Na prática de **design docs do Google**:

> Non-goals **não** são objetivos negados como "o sistema não deve cair". São coisas que **poderiam
> razoavelmente ser objetivos, mas que se escolheu explicitamente que NÃO são.**

O exemplo canônico: ao projetar um banco de dados, "você certamente quer saber se *conformidade ACID* é
um goal ou um non-goal" — é uma escolha legítima de fronteira, não uma obviedade. E o ato de listar
goals/non-goals existe para **"forçar os autores a de fato tomar decisões sobre o escopo"**.

**Por que declarar non-goals (síntese The Clever PM + Product Teacher + Google):**
- **Controle de escopo:** "A coisa mais importante que identificar non-goals faz é controlar escopo.
  Quando identificamos especificamente o que **não** estamos incluindo, os outros entendem claramente a
  extensão do escopo."
- **Gerir expectativa cedo:** declarar non-goals "ajuda a gerir expectativa desde a primeira conversa";
  quanto mais cedo, "menos provável sermos pegos de surpresa pelo caminho".
- **Fonte da verdade contra disputa retroativa:** stakeholders frequentemente travam reuniões levantando
  pontos "que nunca estiveram no escopo desde o início". Com non-goals documentados, o PM "aponta para
  a documentação como fonte da verdade que **existia desde o começo**", em vez de defender decisões
  retroativamente. Isso **transfere a responsabilidade** para quem deveria ter revisado.
- **Anti bike-shedding / anti over-engineering:** non-goals "previnem discussões tangenciais, previnem
  refatoração desnecessária e over-engineering" — criam guard-rails de execução.
- **Definição (Clever PM):** non-goals são "coisas que intencionalmente escolhemos não fazer; coisas
  que não esperamos mudar com nosso esforço; ou áreas que (por algum motivo) não queremos endereçar
  neste momento".

**A nuance que define legitimidade:** um non-goal pode até ser atendido por acaso — "mesmo designado
non-goal, o time pode escolher uma solução que o forneça, desde que isso não crie trade-offs que
prejudiquem os objetivos primários". Ou seja, **non-goal não é proibição absoluta de existir; é renúncia
a perseguir ativamente**. Isso é exatamente o tom certo para um no-go da etapa 3.

---

## 5. O motivo é o que separa no-go de omissão — ADR/MADR, YAGNI e traceability

O projeto exige "tudo explícito e com evidência/motivo". Três corpos confirmam que **o registro do
racional é o que confere legitimidade** a uma decisão de não-fazer:

**ADR / MADR.** Um ADR documenta uma decisão **justificada** e seu racional. O template **MADR** elevou
isso a obrigação: inclui uma seção **"Considered Options"** (opções consideradas) que é **requerida, não
opcional** — "o leitor vê o que foi **rejeitado**, não só o que foi escolhido". O anti-padrão nomeado:
"um ADR que só documenta o que você escolheu, não o que você **não** escolheu, falha — times futuros não
entendem por que alternativas óbvias não foram escolhidas, e debates antigos se repetem. A correção é
**sempre documentar as alternativas consideradas e por que foram rejeitadas**." Um no-go bem declarado é,
estruturalmente, uma micro-decisão MADR: a opção (fazer X) foi considerada e **rejeitada com motivo**.

**YAGNI ("You Aren't Gonna Need It").** Distingue **deferral consciente** de **requisito ausente**.
YAGNI aplica-se a capacidade construída para suportar uma feature *presumida* (especulativa) — "você
adia uma feature **só se confia** que pode adicioná-la depois a baixo custo". Não se aplica a requisito
atual real nem a forethought barato em decisões caras de reverter (modelo de dados, API pública). Para
nós: um no-go do tipo "não vamos construir Y agora" é **YAGNI legítimo** quando há (a) confiança de que
Y pode entrar depois e (b) motivo de por que Y não é necessário **nesta** feature. Sem isso, não é um
no-go — é uma lacuna disfarçada (ou pior, uma decisão cara tomada por omissão).

**Requirements traceability (fonte + racional).** "Documentação de requisitos deve identificar a **fonte
e o racional** de cada requisito" — trilha de auditoria de cada item até sua origem e justificativa.
E o custo do silêncio é mensurável: ">80% das falhas em projetos críticos de larga escala vêm de
problemas **não detectados nas fases iniciais**"; "dois subsistemas podem atender perfeitamente seus
requisitos individuais e **falhar catastroficamente na interface** porque as premissas não se alinham —
a rastreabilidade horizontal torna essas interfaces explícitas". Tradução: a omissão não é neutra; ela
produz falha silenciosa rio abaixo. O no-go declarado é a "interface explícita" entre a etapa 3 e as
seguintes.

**Estratégia de produto — a legitimidade do "não".** A literatura de produto trata o "não" como ato de
estratégia, não de preguiça: "Inovação é dizer 'não' a 1.000 coisas" (Jobs); Pichler: "Inovação não é
dizer sim a tudo — é dizer não a tudo menos às features mais cruciais". Foco **é** a renúncia explícita.
Isso ancora o tom: um no-go não é uma falha em entregar; é **uma escolha que se tem orgulho de tornar
visível**.

---

## 6. Aplicação à etapa 3 — no-go legítimo vs. omissão

### 6.1 A distinção operacional

| Dimensão | **No-go legítimo** | **Omissão (silêncio)** |
|---|---|---|
| Origem | Decisão consciente | Esquecimento / não-consideração |
| Motivo | Registrado e verificável | Ausente |
| Visibilidade | Explícito no output da etapa | Invisível até virar problema |
| Destino declarado | Sim (adiado / fora-de-propósito / outra etapa) | Indefinido |
| Efeito downstream | Protege Design/Impl. (guard-rail) | Vira scope creep ou falha de interface |
| Equivalente na literatura | Won't-have / exclusion / non-goal / opção MADR rejeitada | "orphan" / presunção não-detectada |

**Regra-síntese:** *um no-go é uma omissão que foi tornada consciente, justificada e endereçada.* O que
o torna legítimo não é o conteúdo ("isso não será feito") — é a **trilha de decisão** atrás dele. Sem
motivo, não é no-go; é só uma coisa que faltou.

### 6.2 Como o agente (error-detective) deve declarar cada no-go

Cada no-go no output da etapa 3 deveria carregar, no mínimo, **três campos** (espelhando MADR + MoSCoW
"this time" + PMI exclusions):

1. **o-que** — a capacidade/comportamento que está fora de escopo, nomeada de forma concreta (não vaga).
   Preferir o item que alguém **presumiria dentro** (teste da presunção do PMI) — é o que de fato protege.
2. **motivo** — por que está fora **nesta feature**. Idealmente ancorado em evidência da própria etapa:
   um gap da API que torna a coisa inviável agora, um limite descoberto na etapa 2, uma decisão de
   produto, ou YAGNI explícito ("não há demanda atual; reversível depois a baixo custo").
3. **destino / horizonte** — o sufixo "this time": é `fora-desta-feature` (pode voltar), `fora-de-
   propósito` (decisão de produto permanente) ou `responsabilidade-de-outra-etapa` (pertence ao Design,
   à infra, a outro time)? Isso evita que o no-go seja lido como rejeição definitiva quando não é.

Campo opcional, mas valioso quando o no-go nasce de incapacidade técnica: **distinguir no-go de gap**.
Se a coisa está fora porque *escolhemos*, é no-go. Se está fora porque *não conseguimos e precisaríamos*,
é **gap** (peça 8) — e talvez **Spike**. O agente não deve transformar uma limitação não-investigada em
no-go: o critério de aceitação da etapa já proíbe "gap declarado impossível sem ter tentado outros
ângulos". O mesmo rigor vale para o no-go — **não-fazer por escolha**, nunca **não-fazer por desistência
silenciosa**.

### 6.3 Teste de legitimidade (porteiro da etapa 3)

Um no-go passa se responde **sim** a todas:
- **É consciente?** Alguém poderia razoavelmente esperar isto dentro do escopo (non-goal do Google: "algo
  que poderia ser um objetivo")? Se ninguém jamais presumiria, é ruído, não no-go.
- **Tem motivo?** Há um "porque" registrado (evidência da etapa, decisão de produto, ou YAGNI explícito)?
  Sem motivo → reprovar: é omissão fantasiada de decisão.
- **Tem destino?** Está claro se é desta-feature, de-propósito ou de-outra-etapa? Sem horizonte → ambíguo.
- **Não é gap disfarçado?** Está fora por **escolha**, não por **incapacidade não-investigada**? Se for
  incapacidade → mover para gaps (e talvez Spike).

### 6.4 Como o no-go protege as etapas seguintes

Este é o "porquê" final, ancorado nas fontes:

- **Design (etapa 4)** recebe os no-gos explicitamente (PIPELINE.md: "Recebe: ... + no-gos"). Eles atuam
  como os **non-goals do design doc**: previnem que o ui-ux-designer desenhe estados/ações para algo
  que foi conscientemente cortado — exatamente o "previne discussões tangenciais e over-engineering" da
  literatura de non-goals. Sem o no-go declarado, o Design preencheria a fronteira por conta própria
  (scope creep silencioso).
- **Implementação (etapa 6)** tem o no-go como **briefing automático** e como **entregável verificável**:
  "Nenhum no-go violado (declarado explicitamente)". Isto transforma o no-go de intenção em **contrato**
  — é a "interface explícita" da traceability, fechando a porta para a "falha catastrófica na interface
  porque as premissas não se alinham". O implementador sabe não só o que fazer, mas o que **não** tocar,
  e por quê.
- **Contra disputa retroativa:** como nos non-goals, o no-go declarado na etapa 3 vira **fonte da verdade
  que existia desde o começo**. Se na aprovação humana (etapa 10) alguém perguntar "cadê a feature Z?",
  a resposta não é defesa improvisada — é "no-go #N, motivo [...], horizonte [...]", registrado e
  rastreável. Isso é o oposto de "esquecemos": é "decidimos, e está escrito".

### 6.5 Encaixe com os princípios do projeto

- **M1 (dinâmico):** o CORE da etapa 3 não deve trazer uma **lista fixa** de no-gos típicos — deve
  ensinar o *critério* (consciente + motivado + com destino + não-gap) e deixar o agente **descobrir os
  no-gos do contexto** (dos gaps reais da API, dos limites da etapa 2, da intenção da feature). Listar
  no-gos no CORE seria o "último recurso" que M1 condena.
- **M3 (invariante × variável):** invariante = a **gramática do no-go** (os três campos, o teste de
  legitimidade); variável = **quais** no-gos esta feature tem (lido da demanda). O CORE define a forma;
  o contexto fornece o conteúdo.
- **Polaridade positiva (PADRAO-BRIEFING R-positiva):** declarar no-go é **compatível** com a regra de
  evitar "NÃO faça X" no briefing — porque aqui o no-go é um **dado estruturado de saída** ("isto está
  fora, por isto"), não uma instrução negativa solta. Para a etapa seguinte, ele se traduz em forma
  positiva: "faça apenas A e B; C está fora (no-go #N) e pertence a [destino]".

---

## Fontes

**MoSCoW / Won't have this time**
- Agile Business Consortium (DSDM) — MoSCoW Prioritisation: https://www.agilebusiness.org/dsdm-project-framework/moscow-prioritisation.html
- ProductPlan — MoSCoW Prioritization (glossário): https://www.productplan.com/glossary/moscow-prioritization
- Wikipedia — MoSCoW method: https://en.wikipedia.org/wiki/MoSCoW_method

**PMI / PMBOK — scope statement e exclusions**
- ProjectManager — Project Scope Statement (How to Write One, exemplos): https://www.projectmanager.com/blog/project-scope-statement
- TrustEd Institute — Project Exclusions (Scope Baseline, PMP): https://trustedinstitute.com/concept/pmp/scope-baseline/project-exclusions/
- Anexas — Project Scope Management Best Practices (rework / downstream): https://anexas.net/project-scope-management-best-practices-techniques-for-pmp-professionals/
- Project Management Academy — Project Scope Statement (PMP): https://projectmanagementacademy.net/resources/blog/project-scope-statement-pmp/

**BABOK / IIBA — solution scope, scope modelling**
- IIBA — 10.41 Scope Modelling (BABOK Guide): https://www.iiba.org/knowledgehub/business-analysis-body-of-knowledge-babok-guide/10-techniques/10-41-scope-modelling/
- ModernAnalyst — Solution Scope: An Insight: https://www.modernanalyst.com/Resources/Articles/tabid/115/ID/2366/Solution-Scope-An-Insight.aspx
- Corporate Education Group — How Business Analysts Should Define Project Scope: https://www.corpedgroup.com/ba/HowShouldBADefineScope.asp

**Non-goals em design docs / product management**
- Industrial Empathy (Malte Ubl) — Design Docs at Google (goals/non-goals): https://www.industrialempathy.com/posts/design-docs-at-google/
- The Clever PM — Goals & Non-Goals: https://cleverpm.com/2018/01/11/goals-non-goals/
- Product Teacher — Implementing Non-Goals: https://www.productteacher.com/articles/implementing-non-goals

**ADR / MADR — racional e opções rejeitadas**
- MADR — About MADR: https://adr.github.io/madr/
- ZIO (Olaf Zimmermann) — The Markdown ADR (MADR) Template Explained: https://ozimmer.ch/practices/2022/11/22/MADRTemplatePrimer.html

**YAGNI — deferral consciente vs. requisito ausente**
- Martin Fowler — Yagni (bliki): https://martinfowler.com/bliki/Yagni.html
- Wikipedia — You aren't gonna need it: https://en.wikipedia.org/wiki/You_aren't_gonna_need_it

**Requirements traceability — fonte + racional, custo da omissão**
- ScienceDirect Topics — Requirement Traceability (overview): https://www.sciencedirect.com/topics/engineering/requirement-traceability
- Stell Engineering — What Is Requirements Traceability (mission-critical): https://stell-engineering.com/blog/what-is-requirement-traceability

**Scope creep / estratégia de produto — o valor do "não"**
- ProductPlan — Scope Creep (glossário): https://www.productplan.com/glossary/scope-creep
- airfocus — Celebrate the No and Prioritize Ruthlessly (Steve Jobs): https://airfocus.com/blog/celebrate-no-and-prioritize-ruthlessly/
- ZURB — Steve Jobs: Innovation is Saying "No" to 1,000 things: https://zurb.com/blog/steve-jobs-innovation-is-saying-no-to-1-0
