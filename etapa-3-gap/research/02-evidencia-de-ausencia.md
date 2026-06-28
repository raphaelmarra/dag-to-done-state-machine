# Evidência de ausência — como PROVAR que algo falta (vs. supor que falta)

> Pesquisa LOCAL que fundamenta o CORE da **etapa 3 (GAP)**. Foco: o problema epistemológico de
> demonstrar uma AUSÊNCIA ("a API não suporta X", "o sistema não tem Y") com rigor — distinguir
> *não existe* de *não procurei direito*. Irmã da pesquisa da etapa 2 (honestidade de verificação,
> NATO/ICD-203/SLSA); a etapa 3 herda a mesma filosofia: **confiança estrutural, não achismo**.
> Cada afirmação abaixo carrega sua fonte (Fontes ao final).

---

## Resumo executivo

O critério de aceitação da etapa 3 — *"cada gap tem evidência (não é suposição)"* e *"nenhum gap
declarado 'impossível' sem ter tentado outros ângulos"* — é, no fundo, um problema epistemológico
clássico: **como provar uma negativa**. A literatura é convergente e dá ao projeto uma base sólida:

1. **"Ausência de evidência não é evidência de ausência" tem uma exceção precisa e quantificável.**
   A ausência É evidência de ausência *na exata medida em que a evidência apareceria SE a coisa
   existisse e você procurou onde ela apareceria*. Formalmente (Bayes): se `P(achar | existe)` é
   alta e você procurou, então *não achar* derruba fortemente a probabilidade de existir. Se a busca
   foi rasa ou o detector é cego, não achar quase nada informa. Logo, **um gap só "tem evidência"
   quando vem acompanhado da prova de que a busca seria capaz de encontrar o recurso caso existisse**.

2. **Provar uma negativa É possível — quando o domínio é fechado e a busca é exaustiva.** "Não há
   leite NESTA tigela" se prova olhando a tigela inteira; "não há leite em LUGAR NENHUM do universo"
   não. A diferença é domínio limitado vs. ilimitado. Um gap de API ("este endpoint NÃO aceita o
   param Z") é um negativo *existencial num domínio fechado* — provável. Já "o sistema NUNCA poderá
   fazer X" tende ao ilimitado — exige cautela e outros ângulos.

3. **Há uma assimetria útil herdada da etapa 2 (Dijkstra/Popper):** *tentar e falhar* (deduz, é
   conclusivo) vale mais que *procurar e não ver* (induz, é frágil). Receber **404/405/erro de
   validação** ao chamar a API é evidência dedutiva de ausência; *"não vi na doc"* é, na melhor das
   hipóteses, evidência fraca — e frequentemente uma falácia (*ad ignorantiam*).

4. **O método de inteligência (ACH, Heuer) dá o protocolo dos "outros ângulos":** não declare
   "impossível" sem antes tentar *refutar a hipótese de que é possível*. Prefira a evidência que
   **desconfirma** ("tentei o ângulo B e também falhou") à que apenas confirma seu palpite inicial.

5. **A engenharia já distingue "não consigo reproduzir" de "não existe":** em triagem de bugs,
   *non-reproducible* ≠ *non-existent* — são status diferentes com causas diferentes. O mesmo vale
   para gaps: *"não consegui confirmar"* (limite da busca) é honesto e diferente de *"a API não tem"*
   (ausência provada). Colapsar os dois é o erro central que o porteiro deve barrar.

6. **Existe um padrão jurídico/profissional para "busca suficiente": due diligence.** Não é busca
   *exaustiva* (impossível), é *"o esforço que uma pessoa razoável faria nas mesmas circunstâncias"*
   — proporcional ao risco. Isso dá ao porteiro um teto pragmático: exigir **ângulos proporcionais à
   gravidade do gap**, não infinitos.

**Conclusão operacional:** o critério da etapa 3 deve exigir, por gap de ausência, um **trio**:
(a) *o que se afirma que falta*; (b) *a sonda/busca executada* (o que foi tentado, onde, com que
detector); (c) *o sinal observado que comprova a ausência* (o erro recebido, o resultado vazio da
busca no código). Sem o trio, é suposição — e o porteiro rebaixa de "gap provado" para "a confirmar".

---

## 1. O coração do problema: "ausência de evidência" e quando ela É evidência

A frase popular — *"absence of evidence is not evidence of absence"* (atribuída a Martin Rees e
popularizada por Carl Sagan, mas em circulação desde 1888) — é uma **cautela contra concluir cedo
demais a partir de uma busca inadequada**, não uma lei que proíbe usar a ausência como prova
(Wikipedia, *Evidence of absence*; Sarsen.org).

A correção precisa vem do **enquadramento Bayesiano** (joelvelasco.net; Wikipedia; informallogic.ca):

> A ausência de evidência É evidência de ausência **na exata medida em que evidência seria esperada
> caso a hipótese fosse verdadeira.**

Formalmente, por Bayes: a observação "não encontrei E" atualiza a crença em H *para baixo* quando
`P(não encontrar E | H é verdadeira)` é **baixa** — ou seja, quando, *se H fosse verdadeira, você
quase certamente teria encontrado E*. Isso depende de duas grandezas (joelvelasco.net):

- **Exaustividade da busca** — quão completa foi a investigação?
- **Probabilidade de detecção** — *se* a coisa existisse, qual a chance de você ter achado?

A exceção lógica: quando `P(E | H) = 0` (a evidência é *impossível* mesmo se H for verdadeira — um
detector cego), não achar nada não informa nada (informallogic.ca). É exatamente o caso do **dragão
invisível de Sagan**: cada teste é neutralizado ("é invisível, não esquenta, não pesa"), então
nenhum experimento poderia detectá-lo — o que, diz Sagan, *equivale a não haver dragão nenhum*. A
lição é falseabilidade: uma afirmação que nenhuma busca poderia refutar não é evidência de nada
(Sagan, *The Demon-Haunted World*; whitman.edu/Sagan PDF).

**Tradução para a etapa 3:** declarar um gap ("a API não suporta paginação acima de 100") só é
honesto se o agente puder dizer *com que busca/detecção chegou lá* e que *essa busca acharia o
recurso se ele existisse*. "Olhei e não vi" com um detector fraco é o dragão invisível: inútil.

---

## 2. Provar uma negativa: possível num domínio fechado, não num aberto

O folclore diz "não se pode provar uma negativa". É **falso como regra geral** (Wikipedia, *Proving
a negative*; Hales, citado na Wikipedia *Evidence of absence*):

> Steven Hales: pode-se estar tão confiante ao *negar* uma afirmação quanto ao *provar* uma — há
> muitos casos em que provamos que algo NÃO existe com a mesma certeza com que provamos que existe.

O que separa o provável do improvável é a **fronteira do domínio**:

| Tipo de negativa | Exemplo | Provável? |
|------------------|---------|-----------|
| **Existencial, domínio fechado** | "Não há leite NESTA tigela"; "este endpoint NÃO aceita `type=array`" | **Sim** — busca exaustiva sobre um domínio finito (olhar a tigela inteira; testar o param e ver o erro). |
| **Universal, domínio aberto** | "Não há leite em LUGAR NENHUM"; "a API NUNCA conseguirá fazer X" | **Não / muito difícil** — não há como varrer o ilimitado. |

A ferramenta lógica é o ***modus tollens*** e a **busca exaustiva sobre domínio finito** (Wikipedia,
*Proving a negative*; *Evidence of absence* — o exemplo do "sótão": inspeção completa do sótão *é*
evidência genuína de ausência). É o mesmo princípio do **model checking** em verificação formal: a
verificação é uma *busca exaustiva do espaço de estados*; se a propriedade falha, o checker devolve
um **contraexemplo** (o traço concreto que viola) — prova positiva da falha. Quando o espaço é
**ilimitado**, recorre-se a *bounded model checking* (só acha contraexemplos até uma profundidade) e
a indução — e a confiança fica condicionada ao limite (cs.cmu.edu, *Model Checking*; busca formal).

**Tradução para a etapa 3:** a maioria dos gaps de API/sistema é do tipo **fechado** — logo,
*provável*. "A API não tem endpoint de bulk-delete" é checável: varre-se a superfície conhecida
(spec, rotas, OPTIONS) e tenta-se a chamada. Já um gap do tipo "é impossível implementar X"
escorrega para o aberto — e é justamente esse que o critério *"nenhum gap declarado 'impossível'
sem ter tentado outros ângulos"* mira: rebaixar a alegação ilimitada a uma série de **negativas
fechadas testáveis** ("tentei o ângulo A → falhou assim; o B → falhou assim").

---

## 3. A falácia a evitar — e quando ela deixa de ser falácia

Declarar "não existe" só porque "não foi encontrado" é o ***argumentum ad ignorantiam*** (apelo à
ignorância): afirmar algo verdadeiro/falso pela *falta* de prova do contrário (Wikipedia, *Argument
from ignorance*; fallacyfiles.org). É a forma-falha exata do gap-por-suposição.

Mas a literatura é clara: **o apelo à ignorância NÃO é falácia quando vale o "princípio de
fechamento epistêmico"** (epistemic closure) — quando o domínio foi *adequadamente buscado*, de modo
que, se a coisa existisse, ela já teria aparecido (Walton, *Argument from Ignorance*; scholarly
Leiden). Em termos práticos (fallacyfiles.org):

> Em relação a uma alegação para a qual *nenhuma evidência poderia ser obtida apesar de busca
> adequada*, é legítimo rejeitá-la por *ad ignorantiam*: não há evidência de que P, logo não-P.

A linha divisória é **a qualidade da busca**. O mesmo raciocínio ("não achei, logo não tem") é
falácia com busca rasa e válido com busca fechada+sensível. **Esse é o pivô de todo o critério da
etapa 3:** o porteiro não proíbe a inferência "não achei → não tem"; ele exige a *prova de que a
busca satisfez o fechamento* (testei os ângulos onde o recurso apareceria).

---

## 4. Como demonstrar que uma API NÃO tem um recurso (404 ≠ "não vi na doc")

Esta é a aplicação mais direta do critério. Há uma **hierarquia de força de evidência** para "a API
não suporta X", da mais fraca à mais forte:

| Força | Evidência | Por quê |
|-------|-----------|---------|
| ❌ Suposição | *"Não vi na documentação."* | Doc desatualizada é a causa nº 1 de falsos negativos; endpoints somem/renomeiam e o doc não acompanha (Devzery; ThatAPICompany). É o "dragão invisível" da doc. |
| 🟡 Fraca | *"Não está no código que li."* | Melhor (é busca no domínio real), mas depende de ter lido o lugar certo — risco de busca incompleta. |
| 🟢 Forte | *"Chamei e recebi erro determinístico."* | Evidência **dedutiva**: a própria API declarou o limite. |

A semântica HTTP dá **sinais distintos e citáveis** — e o agente precisa lê-los corretamente, porque
cada código prova uma coisa diferente (apihandyman.io; MDN; RFC 7231):

- **404 Not Found** — o recurso/rota não existe (ou o servidor não quer revelar que existe). Prova
  que *aquele caminho* não está lá — mas cuidado: pode ser método/verbo errado ou versão errada
  (`/v1` vs `/v2`), não ausência da capacidade.
- **405 Method Not Allowed** — *o recurso existe, mas não por esse verbo*. O servidor **DEVE** mandar
  o header `Allow` listando os métodos suportados → isso é **evidência positiva do que existe** (e,
  por exclusão, do que não existe). Um `405` com `Allow: GET` prova que `DELETE` ali não é suportado.
- **501 Not Implemented** — o servidor *não reconhece o método para recurso nenhum*. Ausência global
  da capacidade — o sinal mais forte de "não tem".
- **ValidationError / 400** ao enviar um param — define o **perímetro do aceito** (a etapa 2 já trata
  isto como E3: "falhas são DADOS"). Um `400: "type must be string"` prova que `type=array` não é
  aceito *naquele endpoint*.

**Antes de sondar às cegas**, o agente deve esgotar o que revela a superfície *sem* chamar (técnica
de reverse-engineering de API; herda S3 da etapa 2): **spec/OpenAPI**, **introspection** (GraphQL
separa query de mutation), **`OPTIONS`/`Allow`**, e a **leitura do roteador** no código (Express,
Rails, Flask concentram as rotas num lugar) (medium/reverse-engineering; ThatAPICompany; vollragm).
Só assim a busca atinge o *fechamento epistêmico* — varreu onde o recurso apareceria.

**Regra prática para o gap de API ser "provado":** precisa de **pelo menos uma** evidência 🟢/forte:
o **erro recebido** (com código + corpo verbatim) **ou** a **busca no roteador/spec** que cobre a
superfície. Só "não vi na doc" → o porteiro classifica como *suposição*, não gap.

---

## 5. "Exhaustive search" vs. "não encontrei" — e o limite de testar

Há uma fronteira epistemológica dura, a mesma da etapa 2 (Dijkstra):

> *"Program testing can be used to show the presence of bugs, but never to show their absence!"* —
> Edsger Dijkstra (citado em Hillel Wayne).

Testar prova **presença** (achei → existe), nunca **ausência** em domínio infinito — testar `f(16)`
não diz nada sobre os outros inputs. O que **pode** provar ausência (Hillel Wayne):

- **Teste exaustivo de espaço finito** (ex.: testar todos os 4 bilhões de floats) — busca completa
  do domínio fechado.
- **Raciocínio por classe de equivalência** — provar para um representante cobre a classe inteira
  (é o que permite *não* testar tudo: testar `type=array` uma vez prova o comportamento da classe).
- **Verificação formal / prova** — demonstra conformidade a uma especificação matematicamente.

Atenção a uma sutileza herdada: provar conformidade a uma spec **não** prova ausência de bugs — o
código pode obedecer à spec e ainda ter defeito (a spec pode estar errada). Por isso a etapa 3 não
pede "prova matemática": pede **busca fechada + sensível**, que é o teto realista para um agente.

Disso decorre a distinção mais importante para o porteiro, já consagrada na **triagem de bugs**:

> Um bug *não-reproduzível* **não é** um bug *inexistente* — são status diferentes, com causas
> diferentes (ambiente mudou, intermitência, duplicata já corrigida, ou era um pedido de feature
> inexistente) (professionalqa.com; arXiv 2108.05316; birdeatsbug).

**Tradução para a etapa 3 — a regra de ouro do enum de confiança:** o agente NUNCA pode colapsar
*"não consegui confirmar"* (limite da minha busca — honesto, mas é uma lacuna na *minha* visão) em
*"a API/sistema não tem"* (ausência *provada* no domínio). São dois valores de confiança distintos —
exatamente como a etapa 2 separa `confirmado ao vivo` de `não verificado`. Colapsá-los é a mentira
estrutural que o critério mira.

---

## 6. Os "outros ângulos": ACH e o padrão de busca suficiente (due diligence)

O critério *"nenhum gap declarado 'impossível' sem ter tentado outros ângulos"* tem dois apoios
prontos na literatura.

**(a) Analysis of Competing Hypotheses (ACH), de Richards Heuer** (CIA; Wikipedia; sosintel;
onlinelibrary.wiley) — o método de inteligência para combater viés de confirmação. Princípio central:

> Desloque o foco de *provar* a hipótese favorita para *refutar* as alternativas; **priorize a
> evidência que DESCONFIRMA** sobre a que confirma; aceite a hipótese que sobra por ter *menos
> evidência inconsistente* — eliminação, não suposição.

Aplicado ao gap: antes de cravar "é impossível fazer X", o agente trata "X é possível" como uma
hipótese viva e tenta **desconfirmá-la por vários ângulos** (outro endpoint, outro verbo, outro
param, composição de chamadas, leitura de outra parte do código). "Impossível" só sobrevive se
*todos* os ângulos plausíveis falharam — e cada falha vira evidência citável. Isto operacionaliza
"tentei outros ângulos": **é uma busca por refutação, não por confirmação do palpite**.

**(b) O padrão de "busca suficiente": due diligence** (Wikipedia, *Due diligence*; CFA Standard
V(A)). Busca exaustiva é impossível na prática; o padrão jurídico/profissional não a exige:

> Due diligence = *"a diligência que uma pessoa razoável usaria nas mesmas circunstâncias: esforço
> razoável, **não necessariamente exaustivo**"* — investigação **proporcional ao risco**.

Isso dá ao porteiro o teto pragmático que evita pedir ângulos infinitos: **o número/profundidade de
ângulos exigidos é proporcional à gravidade do gap.** Um gap P0 (bloqueia o design) merece esgotar
os ângulos; um gap menor, um ângulo sólido basta. (Alinha com a complexidade estimada que a própria
etapa 3 já entrega.)

**(c) O vocabulário de honestidade (ICD-203).** A norma de tradecraft analítico da comunidade de
inteligência dos EUA — irmã citada da etapa 2 — exige explicitamente: *descrever a qualidade e
credibilidade das fontes*; *indicar e explicar as incertezas*; *distinguir a informação subjacente
das suposições/julgamentos do analista*; e *incorporar análise de alternativas* (intelligence.gov,
*ICD 203*; pangearesearch). Os quatro mapeiam direto no entregável de um gap honesto: *com que fonte/
sonda* (a), *qual a confiança* (incerteza), *o que é fato observado vs. inferência minha*, e *que
alternativas/ângulos tentei*.

---

## Aplicação à etapa 3 (o critério "cada gap tem evidência")

A síntese das fontes converte os dois critérios rígidos da etapa 3 em **regras estruturais** que o
porteiro pode exigir — no mesmo espírito da etapa 2 (a honestidade é *imposta pelo formato*, não
confiada à boa-fé do agente).

**Critério "cada gap tem evidência (não é suposição)" → exigir o TRIO de ausência.**
Todo gap do tipo "falta X / a API não tem X" carrega três campos, ou é rebaixado a *suposição*:

1. **afirmação** — o que se diz que falta (ex.: "não há bulk-delete").
2. **busca executada** — *o que foi tentado e onde*, com o detector usado (ex.: "li o roteador
   `routes/api.js`; chamei `OPTIONS /items` → `Allow: GET, POST`; chamei `DELETE /items` → 405").
   É a prova de **fechamento epistêmico** (§3): a busca cobriu onde o recurso *apareceria se
   existisse*. Sem isto, cai na exceção `P(E|H)=0` (dragão invisível, §1).
3. **sinal observado** — a evidência 🟢/forte (§4): o **erro/código verbatim** ou o **resultado
   vazio da busca no domínio fechado** (spec/roteador varrido). "Não vi na doc" **não** preenche este
   campo (§4, força ❌).

> Sem o trio completo → confiança rebaixada automaticamente de `ausência provada` para `a confirmar`
> (espelha o rebaixamento da etapa 2: "confirmado ao vivo" sem `evidencia_ao_vivo` vira "inferido").

**Critério "nenhum gap 'impossível' sem ter tentado outros ângulos" → exigir registro de refutação (ACH).**
Quando um gap usar a palavra **impossível** (ou "não dá", "nunca"), ele deve listar os **ângulos
tentados** e como cada um falhou — porque "impossível" é uma negativa que tende ao *domínio aberto*
(§2) e, sem ângulos, é puro *ad ignorantiam* (§3). O número de ângulos é **proporcional à gravidade**
(due diligence, §6b): P0 esgota; menor, um ângulo sólido. O agente busca **desconfirmar** "é
possível", não confirmar "é impossível" (ACH, §6a).

**O enum de confiança da etapa 3 deve separar três estados (nunca colapsá-los):**

| Valor | Significado | Exige |
|-------|-------------|-------|
| `ausência provada` | testei/varri o domínio fechado e o recurso não está lá | o **trio** (afirmação + busca + sinal forte) |
| `a confirmar` | não consegui buscar o suficiente (limite da minha visão, não do sistema) | o motivo do limite (≈ "não verificado" da etapa 2) |
| `no-go declarado` | ausência **intencional** (fora de escopo de propósito) | a justificativa do escopo (não é uma busca — é uma decisão) |

> A distinção `ausência provada` × `a confirmar` é a tradução direta de *"não existe" vs. "não
> procurei direito"* (§5, triagem de bugs) — e o **erro central** que o porteiro existe para barrar.

**O que o porteiro PODE verificar mecanicamente (sem julgar o mérito técnico):**
- todo gap com `confianca: "ausência provada"` tem os 3 campos do trio **não-vazios**;
- todo gap cuja descrição contém "impossível/não dá/nunca" tem `angulos_tentados` com **≥1 item**
  (idealmente ≥2 para P0);
- o campo `busca_executada` referencia uma **evidência concreta** (um código de erro, um caminho de
  arquivo, uma chamada) — não prosa vaga tipo "pesquisei bastante";
- nenhum gap mistura os enums (ex.: marcado `ausência provada` mas com `busca_executada` vazia →
  rebaixa para `a confirmar`).

Isto mantém o porteiro no seu papel (checa **estrutura/consistência**, não verdade técnica — como na
etapa 2) e ainda assim eleva drasticamente o custo de um gap-por-achismo: o agente é obrigado a
*mostrar a busca*, e mostrar a busca é o que separa "não existe" de "não procurei direito".

**Ponte com a etapa 2 (herança explícita):** a etapa 2 prova **presença** com evidência ("chamei e
retornou X", `evidencia_ao_vivo`); a etapa 3 prova **ausência** com evidência ("chamei e deu 405" /
"varri o roteador e não há"). É a mesma filosofia de confiança estrutural, aplicada ao lado negativo
do contrato. O `nao_verificado` da etapa 2 vira insumo natural de gaps `a confirmar` na etapa 3.

---

## Fontes

**Epistemologia da ausência / Bayes / falseabilidade**
- Evidence of absence — Wikipedia: https://en.wikipedia.org/wiki/Evidence_of_absence
- Absence of Evidence Can Be Evidence of Absence — Sarsen.org: https://www.sarsen.org/2026/01/absence-of-evidence-can-be-evidence-of.html
- Absence of Evidence and Evidence of Absence (PDF, abordagem Bayesiana) — Velasco/teaching: https://joelvelasco.net/teaching/249/Absence%20of%20Evidence%20and%20Ev%20of%20Abs%20dec%201%202008.pdf
- A Bayesian Approach to Absent Evidence Reasoning — Informal Logic: https://informallogic.ca/index.php/informal_logic/article/view/2967/2516
- Replication of "null results" — Absence of evidence or evidence of absence? (arXiv): https://arxiv.org/pdf/2305.04587
- Carl Sagan, "The Dragon in My Garage" (The Demon-Haunted World, PDF): http://people.whitman.edu/~herbrawt/classes/110/Sagan.pdf
- The Demon-Haunted World — Wikipedia: https://en.wikipedia.org/wiki/The_Demon-Haunted_World

**Provar uma negativa / falácia do apelo à ignorância / Popper**
- Proving a negative — Wikipedia: https://en.wikipedia.org/wiki/Proving_a_negative
- Russell's teapot — Wikipedia: https://en.wikipedia.org/wiki/Russell%27s_teapot
- Argument from ignorance — Wikipedia: https://en.wikipedia.org/wiki/Argument_from_ignorance
- Logical Fallacy: Appeal to Ignorance — Fallacy Files: https://www.fallacyfiles.org/ignorant.html
- The Appeal to Ignorance, or Argumentum Ad Ignorantiam (Walton, PDF): https://www.researchgate.net/publication/227217179_The_Appeal_to_Ignorance_or_Argumentum_Ad_Ignorantiam
- There is More to an Argumentum Ad Ignorantiam than Epistemic Considerations (Leiden): https://scholarlypublications.universiteitleiden.nl/access/item:4107926/view
- Criterion of falsifiability — Britannica: https://www.britannica.com/topic/criterion-of-falsifiability
- Karl Popper — Stanford Encyclopedia of Philosophy: https://plato.stanford.edu/entries/popper/

**Verificação formal / busca exaustiva / limites do teste**
- Formal Verification by Model Checking (CMU, PDF): https://www.cs.cmu.edu/~aldrich/courses/654-sp06/slides/14-model-checking.pdf
- Formal Verification — overview (ScienceDirect): https://www.sciencedirect.com/topics/computer-science/formal-verification
- "Testing can show the presence of bugs but not the absence" (Dijkstra) — Hillel Wayne: https://buttondown.com/hillelwayne/archive/testing-can-show-the-presence-of-bugs-but-not-the/
- Test oracle — Wikipedia (o problema do oráculo): https://en.wikipedia.org/wiki/Test_oracle

**API: distinguir 404 / 405 / 501 e reverse-engineering**
- HTTP status code 404 vs 405 vs 501 — API Handyman: https://apihandyman.io/this-is-not-the-http-method-you-re-looking-for-http-status-code-404-vs-405-vs-501/
- 405 Method Not Allowed (header Allow) — MDN: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/405
- 501 Not Implemented — MDN: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/501
- RFC 7231 (HTTP/1.1 Semantics) — IETF: https://datatracker.ietf.org/doc/html/rfc7231
- What is the 404 API Code? (doc desatualizada como causa) — Devzery: https://www.devzery.com/post/what-is-the-404-api-code
- How we Reverse Engineer APIs with no Documentation — ThatAPICompany: https://thatapicompany.com/how-we-reverse-engineer-apis-with-no-documentation-for-clients/
- Reverse Engineering an API (testar sem doc) — Medium/Saravana: https://medium.com/@cjsaravana95/reverse-engineering-an-api-898a801dfd10
- Reverse engineering a Web API — VollRagm: https://vollragm.github.io/posts/web-api/

**Triagem de bug: "não-reproduzível" ≠ "inexistente"**
- Non Reproducible Bug — ProfessionalQA: https://www.professionalqa.com/non-reproducible-bug
- Why are Some Bugs Non-Reproducible? (arXiv 2108.05316): https://arxiv.org/pdf/2108.05316
- Bug Triage Process — Bird Eats Bug: https://birdeatsbug.com/blog/bug-triage-process

**Outros ângulos: ACH (Heuer) e padrão de busca suficiente (due diligence) + tradecraft (ICD-203)**
- Analysis of competing hypotheses — Wikipedia: https://en.wikipedia.org/wiki/Analysis_of_competing_hypotheses
- Mastering the Analysis of Competing Hypotheses (ACH) — SOS Intelligence: https://sosintel.co.uk/mastering-the-analysis-of-competing-hypotheses-ach-a-practical-framework-for-clear-thinking/
- The "analysis of competing hypotheses" in intelligence analysis (Dhami, Wiley): https://onlinelibrary.wiley.com/doi/full/10.1002/acp.3550
- Due diligence (esforço razoável, não exaustivo) — Wikipedia: https://en.wikipedia.org/wiki/Due_diligence
- Standard V(A) Diligence and Reasonable Basis — CFA Institute: https://www.cfainstitute.org/en/ethics-standards/ethics/code-of-ethics-standards-of-conduct-guidance/standards-of-practice-V-A
- ICD 203 Analytic Standards (PDF) — intelligence.gov: https://www.intelligence.gov/assets/documents/intelligence-community-directives/ICD_203.pdf
- Why Analytic Standards Exist — Pangea Research: https://pangearesearch.substack.com/p/why-analytic-standards-exist
