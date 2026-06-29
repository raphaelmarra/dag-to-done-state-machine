# Pre-mortem e antecipação de risco — riscos acionáveis que alimentam o Gate A

> Pesquisa para a etapa 4 (Design) da state machine DAG-to-Done.
> Status: pesquisa concluída — subsídio para revisar o ADR 0006 e o porteiro da etapa Design.
> Data: 2026-06-28.
> Relacionado: [`docs/adr/0006-pre-mortem-como-parte-obrigatoria-do-design.md`](../../docs/adr/0006-pre-mortem-como-parte-obrigatoria-do-design.md), [`docs/PIPELINE.md`](../../docs/PIPELINE.md) (etapas 4 e 7).

---

## Resumo executivo

O **pre-mortem** (Gary Klein, *HBR* set/2007) é uma técnica de antecipação de risco em que o time **assume que o projeto JÁ fracassou** — não "pode fracassar" — e trabalha de trás para frente listando *por que* fracassou. A mudança gramatical do condicional ("o que pode dar errado?") para o passado ("o que deu errado?") aciona a **prospective hindsight** (retrospectiva prospectiva): pesquisa de Mitchell, Russo & Pennington (1989, Wharton/Cornell/Colorado) mostrou que imaginar um evento como já ocorrido **aumenta em ~30% a capacidade de identificar corretamente as razões** de um desfecho futuro. O ganho vem de dois mecanismos: a mente passa do modo "possibilidade" para o modo "explicação" (mais concreto e específico), e torna **socialmente seguro** levantar reservas que ninguém diria numa reunião de planejamento normal — combatendo excesso de confiança e groupthink.

A distinção central para este projeto: **pre-mortem ≠ post-mortem**. O post-mortem aprende com o cadáver (depois do fracasso); o pre-mortem encontra o risco no lugar **mais barato possível — antes de escrever código**. A versão estruturada e industrial dessa mesma lógica é o **FMEA** (Failure Mode and Effects Analysis), que não apenas lista falhas mas as **prioriza** (Severidade × Ocorrência × Detecção = RPN) e — o ponto decisivo — exige que **cada falha tenha uma ação com dono e prazo**, senão "vira órfã e nunca é feita".

A conclusão que importa para a etapa 4: o ADR 0006 está **correto, mas insuficiente**. Ele exige *quantidade* (mínimo 3 riscos) mas não exige *forma*. Um pre-mortem cujos riscos são "pode quebrar" ou "talvez não funcione" produz exatamente o medo genérico que a literatura de risk management considera inútil — e, pior, **não dá ao Gate A nada para revisar**. Este documento propõe o critério que falta: todo risco do pre-mortem deve ser **acionável** — nomear a *causa/condição*, a *consequência*, e **apontar explicitamente o que o Gate A deve verificar** (a lente). Esse vínculo "risco → o que revisar" é o que transforma o pre-mortem da etapa 4 no combustível real das lentes do Gate A (já previsto em PIPELINE.md, linhas 314-325 e 380-385).

---

## 1. O que é o pre-mortem (Gary Klein, HBR 2007)

### O método

Klein descreve um procedimento curto (20–30 minutos) que roda **depois** de o time ser informado do plano, mas **antes** de executá-lo:

1. **Preparar o cenário** — o líder pede ao time que imagine um ponto no futuro em que o projeto **fracassou completa e espetacularmente**. Não "pode falhar": **falhou**.
2. **Escrita independente** — cada pessoa escreve **sozinha**, em silêncio (2–3 min), todas as razões plausíveis pelas quais o projeto fracassou. A escrita individual é deliberada: evita ancoragem no primeiro a falar e libera as reservas privadas.
3. **Rodízio (round-robin)** — cada participante compartilha **uma razão por vez**, montando uma lista coletiva, até esgotar.
4. **Identificação de padrões** — o time discute quais modos de falha são mais plausíveis e mais severos.
5. **Revisão do plano** — fortalece-se o plano para endereçar os riscos levantados.

A própria *HBR* resume o porquê: *"projetos fracassam a uma taxa espetacular. Uma razão é que gente demais reluta em falar de suas reservas durante a fase de planejamento, a mais importante de todas."* O pre-mortem *"torna seguro para os dissidentes — que conhecem o empreendimento e se preocupam com suas fraquezas — falar"* (HBR, 2007).

### A frase que define a técnica

Klein contrasta com a medicina: um post-mortem clínico pergunta o que **matou** o paciente; o pre-mortem *"presume que o paciente morreu, e então pergunta o que **deu** errado"* — em vez de "o que **pode** dar errado". Essa inversão verbal é o coração da técnica.

### O que a pesquisa mostra: prospective hindsight (+30%)

A base científica é o estudo de **Deborah J. Mitchell (Wharton), J. Edward Russo (Cornell) e Nancy Pennington (Colorado), 1989**: *"imaginar que um evento já ocorreu — em vez de imaginar que ele pode ocorrer — aumenta em 30% a capacidade de identificar corretamente as razões de desfechos futuros."* (citado por Klein, HBR 2007, e amplamente reproduzido — Ness Labs, get-alfred).

Por que funciona (mecanismo): perguntar "por que falhou?" ativa **modo de explicação** em vez de **modo de possibilidade**. Explicar um fato (mesmo hipotético) força a mente a produzir causas **concretas e específicas**; especular sobre possibilidades produz nuvens vagas. O resultado prático, nas palavras de uma síntese da técnica, são *"os riscos que as pessoas privadamente suspeitavam mas não levantariam numa reunião normal"*.

### Benefícios psicológicos (por que o time "vê mais")

- **Combate o excesso de confiança / viés de otimismo** no início do projeto (quando ele é mais alto).
- **Quebra o groupthink** — a escrita individual antes da discussão neutraliza a pressão de concordar.
- **Reduz o "damn-the-torpedoes"** (a inércia de quem já decidiu seguir em frente).
- **Legitima o dissenso** — transforma "ser do contra" em "estar fazendo o exercício".

---

## 2. Pre-mortem vs. post-mortem

| Dimensão | **Post-mortem** | **Pre-mortem** |
|----------|-----------------|----------------|
| **Quando** | Depois do fracasso | Antes de executar (na fase de planejamento) |
| **Pergunta** | Por que *aconteceu*? | Por que *aconteceu* (em um futuro imaginado)? |
| **Custo de descobrir o risco** | Alto — o dano já ocorreu | Mínimo — ainda dá para mudar o plano |
| **Objetivo** | Aprender para a próxima | **Prevenir esta** |
| **Postura emocional** | Análise de culpa (risco de defensividade) | Exercício seguro, sem culpado real |
| **Saída** | Lições registradas | Riscos a mitigar/monitorar **agora** |

No nosso pipeline os dois coexistem em pontos diferentes: o **pre-mortem é a etapa 4 (Design)** — encontra o risco antes do código; a **Retrospectiva de cicatriz é a etapa 13** — o post-mortem que aprende com o que escapou e alimenta as lentes futuras do Gate A (PIPELINE.md, etapa 13). O pre-mortem alimenta o Gate A **deste** ciclo; a retrospectiva alimenta o Gate A dos **próximos**.

---

## 3. FMEA — a versão estruturada da mesma ideia

O **FMEA (Failure Mode and Effects Analysis)** é a forma industrial, rastreável e priorizada do pre-mortem. Onde o pre-mortem brainstorma, o FMEA **tabela, pontua e responsabiliza**. Quatro passos canônicos (ASQ, Quality-One, AIAG-VDA):

1. **Escopo + time** — delimitar o sistema e reunir quem conhece.
2. **Identificar modos de falha e efeitos** — para cada função, *como* pode falhar e qual o *efeito*.
3. **Pontuar e priorizar (RPN)** — calcular o **Risk Priority Number**:

   **RPN = Severidade (1–10) × Ocorrência (1–10) × Detecção (1–10)** → escala 1 a 1.000.

   - **Severidade** = gravidade do efeito se a falha ocorrer.
   - **Ocorrência** = probabilidade de a falha acontecer.
   - **Detecção** = quão difícil é *detectar* a falha antes que ela cause dano (10 = quase impossível detectar).

   RPN alto = prioridade alta. A Detecção é o elo direto com revisão/gates: **uma falha que ninguém consegue detectar é mais perigosa que uma falha óbvia** — exatamente o que um gate de revisão existe para abaixar.

4. **Agir e recalcular** — para cada modo relevante, definir **ação corretiva**, executá-la e **recalcular o RPN** para confirmar a redução.

### Os três ensinamentos do FMEA que o nosso pre-mortem deve herdar

1. **Toda ação tem dono e prazo — ou é órfã.** Na regra do FMEA, *"uma ação sem dono ou sem data é órfã: é frequentemente esquecida e nunca concluída"* (Quality-One / iSixSigma). No nosso caso, o "dono" de um risco de pre-mortem é **a lente do Gate A que vai cobri-lo** (ou, quando não dá para revisar estaticamente, o cenário do Gate B). Um risco sem destino é órfão e morre na etapa 4.

2. **Há exatamente três tipos de resposta a um risco** (ASQ): **(a) reduzir Ocorrência** (eliminar a causa no design), **(b) melhorar Detecção** (adicionar/forçar um controle — *é aqui que entra a lente do Gate A*), ou **(c) reduzir Severidade** (último recurso, quando (a) e (b) não são viáveis). Isso dá ao porteiro um vocabulário fechado para cobrar de cada risco: *"qual destes três você está fazendo com este risco?"*

3. **Documentar controles que existem hoje, não os ideais.** O FMEA separa *current controls* (o que já protege) de *recommended actions* (o que falta). No pre-mortem isso vira: o risco deve dizer **o que ainda NÃO está coberto** — senão não é risco, é tranquilidade disfarçada.

> Nota de calibração: não estamos propondo trazer o RPN numérico 1–1.000 para a etapa 4 (seria peso desnecessário — M3 do projeto: separar invariante de variável). Trazemos o **racional**: priorizar por severidade × detectabilidade e exigir ação com dono. A "ação com dono" no nosso contexto é o **vínculo do risco a uma lente verificável do Gate A**.

---

## 4. O que faz um risco ser ACIONÁVEL (e não um medo genérico)

Este é o núcleo da pesquisa para o nosso problema. A literatura de risk management é unânime: a diferença entre um risco útil e um medo inútil é **estrutura**, não esforço.

### A regra de ouro: nomeie causa, evento e consequência

O padrão consolidado (SEI / DAU — *Defense Acquisition University*; PMI) define que um risco bem-escrito tem **dois elementos obrigatórios — o evento incerto e a consequência — e, se conhecida, um terceiro: a condição/causa existente**. Dois formatos canônicos:

- **Condição → Consequência**: *"Existe uma condição que causa preocupação; portanto, um impacto negativo sobre o objetivo pode resultar."*
- **Se → Então (if-then)**: *"**SE** [evento disparado por uma causa], **ENTÃO** [consequência sobre o objetivo]."*
  Exemplo da DAU: *"SE o programa não atingir as propriedades estruturais da longarina da asa (condição), ENTÃO o peso da asa aumentará ou o envelope de manobra será reduzido (consequência)."*

Por que nomear a **causa** é o que torna o risco acionável: *"declarações de risco eficazes dão visibilidade ao porquê o risco existe ao mencionar a causa-raiz ou fator contribuinte, o que ajuda os stakeholders a entender a origem do risco e a identificar estratégias de mitigação"* (DAU). **Sem causa nomeada, não há mitigação possível — só ansiedade.** Você não pode mitigar "o projeto pode falhar"; você pode mitigar "se a API paginar e o componente não tratar a página 2, então a lista mostrará dados incompletos".

### O contraste, em uma linha

| Medo genérico (inútil) | Risco acionável (útil) |
|------------------------|------------------------|
| "Pode quebrar." | "**Se** o endpoint retornar 429 sob carga **e** não houver retry, **então** a lista falha silenciosa → **revisar:** tratamento de erro/rate-limit na lente LISTA." |
| "Usuários podem não estar prontos." | "**Como** a adesão ao treino está <60% e o grupo de super-users está incompleto, **há risco** de erro de processo no go-live → **mitigar:** [ação] / **monitorar:** [gatilho]." (exemplo Sprinto) |
| "Talvez tenha problema de performance." | "**Se** a lista carregar todos os registros sem paginação **e** o dataset > 1k linhas, **então** o render trava → **revisar:** paginação + estado de loading (lente LISTA)." |

### Os atributos de um risco acionável (checklist destilado)

Cruzando Klein (HBR), FMEA (ASQ) e os padrões de risk register (Asana, Sprinto, DAU), um risco é **acionável** quando tem:

1. **Causa/condição nomeada** — *o que*, especificamente, dispara a falha (não "algo").
2. **Consequência concreta sobre um objetivo** — *o que* o usuário/sistema sofre, observável.
3. **Especificidade testável** — descrito de forma que dê para dizer "ocorreu / não ocorreu" (não opinião).
4. **Resposta definida** — uma das três do FMEA: eliminar causa (design), **detectar (lente do gate)** ou reduzir impacto.
5. **Dono / destino** — quem ou *o que* cuida dele. **No nosso pipeline: a lente do Gate A (ou o cenário do Gate B).** Risco sem destino = órfão.
6. **Gatilho de monitoramento** (quando aplicável) — o sinal observável de que o risco está se materializando (o *trigger* do risk register — "uma das partes mais subutilizadas do registro").

Um risco que falha em (1), (2) ou (5) **não deve passar pelo porteiro da etapa 4** — porque chegará ao Gate A como ruído, não como lente.

---

## 5. Aplicação à etapa 4 (pre-mortem que alimenta o Gate A)

### 5.1 O elo que já existe — e o que falta

PIPELINE.md já desenha o circuito certo: o pre-mortem da etapa 4 produz riscos que entram no **briefing automático do Gate A** como item a *"cobrir especificamente"*, ao lado das lentes por arquétipo (linhas 314-325), e reaparecem no briefing do Gate B (linhas 380-385). **O encanamento está pronto.** O que falta é garantir que **o que circula por ele tenha qualidade** — exatamente o princípio central do produto ("a state machine controla a qualidade do que circula entre as etapas").

Hoje o critério de aceitação da etapa 4 diz apenas: *"Pre-mortem feito — mínimo 3 riscos levantados"* (PIPELINE.md linha 237; ADR 0006). Isso é **quantidade sem forma**. Um agente LLM cumpre essa exigência com três frases vazias ("pode quebrar", "pode dar erro", "talvez não funcione") e passa pelo porteiro — entregando ao Gate A três não-instruções.

### 5.2 O critério que o porteiro da etapa Design deve exigir

Proposta concreta: cada risco do pre-mortem só é **aceito** pelo porteiro da etapa 4 se for **acionável e revisável**, isto é, se contiver os campos abaixo. O campo que faz a diferença para o Gate A é o **vínculo de revisão**.

```
RISCO (formato exigido pelo porteiro da etapa 4):
  - causa/condição:  SE <o que dispara, específico>
  - consequência:    ENTÃO <o que o usuário/sistema sofre, observável>
  - resposta:        [eliminar no design | detectar no gate | reduzir impacto]
  - ▶ o-que-revisar: <lente/arquétipo do Gate A que cobre este risco,
                      OU cenário do Gate B se só verificável ao vivo>
  - gatilho (opc.):  <sinal observável de que está se materializando>
```

O campo **`o-que-revisar`** é a tradução direta do ensinamento do FMEA ("toda ação tem dono") para o nosso contexto: **o "dono" de um risco de pre-mortem é a lente do Gate A que vai persegui-lo.** Um risco que não consegue nomear o que deve ser revisado é, por definição, ou vago demais (não sabemos o que olhar) ou fora de escopo (nada a revisar) — e nos dois casos o porteiro deve rejeitá-lo ou exigir reescrita.

### 5.3 Vínculo risco → lente (o que torna o risco "útil para o Gate A depois")

As lentes do Gate A já são específicas por arquétipo (PIPELINE.md 318-325). O risco acionável **aponta para uma delas** — fechando o ciclo design→revisão:

| Risco de pre-mortem (acionável) | Aponta para a lente do Gate A |
|---------------------------------|-------------------------------|
| "SE a lista não paginar e dataset > 1k, ENTÃO trava o render" | **LISTA** → performance, paginação |
| "SE a mutação não validar input, ENTÃO grava dado corrompido" | **MUTACAO** → validação de input |
| "SE o drawer não restaurar foco no escape, ENTÃO usuário de teclado fica preso" | **DRAWER** → foco/escape |
| "SE o board perder a ordem ao recarregar, ENTÃO o usuário re-arrasta tudo" | **BOARD** → persistência de ordem |
| "SE o detalhe não tratar 404, ENTÃO tela branca em registro removido" | **DETALHE** → dado inexistente (404) |
| "SE o upload não limitar tipo, ENTÃO path traversal / arquivo malicioso" | **DISCO** → tipo de arquivo, path traversal |

Quando o risco **não** mapeia para nenhuma lente existente, isso é informação valiosa, não um erro: ou (a) o risco é genuinamente novo → o Gate A ganha uma **lente nova** (e a etapa 13 registra a evolução), ou (b) só é verificável ao vivo → vira **cenário do Gate B** (PIPELINE.md 380-385). O porteiro força essa escolha explícita; nada fica órfão.

### 5.4 Resposta direta: o ADR 0006 é suficiente?

**Não — está correto mas incompleto.** O ADR 0006 acerta no *porquê* (prospective hindsight, "o lugar mais barato de achar risco é antes do código") e no *gatilho* ("alimenta as lentes do Gate A"). Mas ele especifica **só quantidade** (≥3 riscos) e deixa a **forma** implícita. Lacunas concretas:

1. **Falta o critério de acionabilidade.** "Mínimo 3 riscos" não impede 3 riscos vazios. Falta exigir causa + consequência + o-que-revisar. → *Sugestão: aditar o ADR 0006 ou criar um ADR-filho "formato do risco de pre-mortem", referenciando os padrões SEI/DAU (if-then) e o racional do FMEA (ação com dono).*

2. **Falta nomear o vínculo risco→lente como obrigatório.** O ADR diz que os riscos "alimentam as lentes" mas não exige que **cada risco aponte sua lente**. Sem isso, o Gate A recebe riscos que não sabe onde encaixar. → *Tornar `o-que-revisar` um campo obrigatório do entregável de Design.*

3. **Falta o tratamento do risco "sem lente".** O ADR não diz o que fazer quando um risco não mapeia para lente nenhuma (criar lente nova? mandar pro Gate B? aceitar conscientemente?). Klein é explícito que parte dos riscos é para **aceitar conscientemente** ("acknowledge risks you are choosing to accept") — e essa aceitação consciente deveria ser registrável (vira "risco residual conhecido" na aprovação humana, PIPELINE.md 409). → *Definir os três destinos: vira-lente / vira-cenário-Gate-B / aceito-conscientemente-com-registro.*

4. **(Menor) Falta blindar o mecanismo contra o teatro.** Como o executor é um LLM, "mínimo 3" sem forma convida ao cumprimento ritual. Exigir o **formato if-then + lente** é o que separa pre-mortem real de pre-mortem encenado — coerente com a M1 do projeto (dinâmico/específico) e com o princípio "tudo específico e acionável, nunca vago".

> Em resumo: o ADR 0006 garante que o pre-mortem **acontece**; falta garantir que ele **serve**. A diferença está em um único campo obrigatório — **o-que-revisar** — que transforma cada risco em uma instrução verificável para o Gate A, exatamente como o FMEA transforma cada modo de falha em uma ação com dono.

---

## 6. Fontes

**Pre-mortem / prospective hindsight (primárias e de síntese)**
- Klein, Gary. *Performing a Project Premortem.* Harvard Business Review, set/2007 — https://hbr.org/2007/09/performing-a-project-premortem
- Klein, Gary. *Pre-mortem method of risk assessment* (site do autor) — https://www.gary-klein.com/premortem
- Klein, Gary. *The Pre-Mortem Method.* Psychology Today, jan/2021 — https://www.psychologytoday.com/us/blog/seeing-what-others-dont/202101/the-pre-mortem-method
- Ness Labs. *Pre-mortem: how to anticipate failure with prospective hindsight* — https://nesslabs.com/pre-mortem-anticipate-failure-with-prospective-hindsight
- Alfred. *The Pre-Mortem Technique: Gary Klein's 30% Risk-Spotting Method* (síntese do estudo Mitchell, Russo & Pennington 1989) — https://get-alfred.ai/blog/pre-mortem-technique
- *Premortems: Reflections of the Future, Not the Past* (PDF) — https://inovaconsulting.com.br/wp-content/uploads/2018/08/Premortems-Reflections-of-the-Future-Not-the-Past.pdf
- *Performing a Project Premortem* (cópia acadêmica do artigo HBR, PDF) — http://homepages.se.edu/cvonbergen/files/2013/01/Performing-a-Project-Premortem.pdf

**FMEA (Failure Mode and Effects Analysis)**
- ASQ. *What is FMEA? Failure Mode & Effects Analysis* — https://asq.org/quality-resources/fmea
- Quality-One. *FMEA — Failure Mode and Effects Analysis* (dono+prazo, current controls vs recommended actions) — https://quality-one.com/fmea/
- iSixSigma. *FMEA Quick Guide* — https://www.isixsigma.com/fmea/fmea-quick-guide/
- IQA System. *FMEA RPN — Risk Priority Number: How to Calculate and Evaluate* — https://www.iqasystem.com/news/risk-priority-number/

**Risco acionável / formato de risk statement / risk register**
- DAU (Defense Acquisition University). *Risk Statement* (formatos condição-consequência e if-then) — https://www.dau.edu/cop/risk/resources/risk-statement
- DAU. *How to Write a Good Risk Statement* (nov/dez 2017) — https://www.dau.edu/library/damag/november-december2017/how-write-good-risk-statement
- Project Risk Coach. *The Power of If-Then Risk Statements* — https://projectriskcoach.com/the-power-of-if-then-risk-statements/
- Strategic Decision Solutions. *3 Components of an Effective Risk Statement* — https://strategicdecisionsolutions.com/effective-risk-statement/
- Asana. *Risk Register: How to Create One (Template + Example)* (vago vs acionável; dono; status) — https://asana.com/resources/risk-register
- Sprinto. *What Is a Risk Register? And How to Create One?* (exemplo "vago → acionável") — https://sprinto.com/blog/risk-register/
- TrustCloud. *Risk Registers — Ultimate Guide* (gatilhos/triggers) — https://www.trustcloud.ai/risk-management/risk-registers-ultimate-guide/

**Internas (contexto do projeto)**
- [`docs/adr/0006-pre-mortem-como-parte-obrigatoria-do-design.md`](../../docs/adr/0006-pre-mortem-como-parte-obrigatoria-do-design.md)
- [`docs/PIPELINE.md`](../../docs/PIPELINE.md) — etapa 4 (Design, linhas 207-239) e etapa 7 (Gate A, linhas 307-336)
