# 01 — Como a indústria descobre e documenta o CONTRATO REAL de uma API

> Pesquisa de fundamentação para a **Etapa 2 — Descoberta da API** (agente `fiscal`).
> Objetivo: levantar as melhores práticas para descobrir o **comportamento de fato** de uma API
> (params exatos, shapes reais, limites, bordas) e detectar quando o **doc/código mente** —
> sistematizando o que o projeto já fez ad hoc (ver caso CRM em `ravi-console/docs/gap/crm.md`).
> Data: 2026-06-28.

---

## Resumo executivo

A indústria reconhece, há décadas, que **o contrato declarado de uma API (doc, OpenAPI, tipos no
código) e o contrato observado (o que o servidor de fato responde) divergem rotineiramente** — e
construiu um arsenal específico para descobrir o segundo. Esse arsenal se organiza em quatro famílias
que se complementam:

1. **Contract testing / consumer-driven contracts (CDC, Pact).** A unidade de verdade não é o doc do
   provider, é o conjunto de interações que o **consumidor de fato exige**. O passo decisivo —
   *provider verification* — **reproduz as requisições gravadas contra o provider REAL e vivo** e
   confere se a resposta real contém *ao menos* o que o consumidor espera. É o protótipo do que a
   etapa 2 faz: confirmar contra a realidade, não contra a promessa.

2. **Schema inference a partir de tráfego real** (Optic, traffic2openapi, conversores JSON→OpenAPI).
   Em vez de gerar o spec do zero, essas ferramentas **observam respostas reais** e inferem tipo,
   formato (email/uuid/date-time), campos obrigatórios e estrutura aninhada — e então fazem **diff
   contra o spec existente** para apontar endpoints/campos não documentados ou divergentes. A
   realidade vira a fonte de verdade.

3. **API discovery / exploração black-box** (RESTler, EvoMaster, Schemathesis). Geram chamadas
   sistemáticas (inclusive de borda) e usam **oráculos** para checar se a resposta é válida: status,
   conformidade de schema, e até **propriedades semânticas** ("GET deve falhar após um POST
   malsucedido sobre o mesmo recurso"). É a base teórica para uma descoberta *sistemática* em vez de
   anedótica.

4. **Detecção de "documentation drift"** (PactFlow Drift, oasdiff, FlareCanary, Optic). Uma taxonomia
   explícita de **4 modos de detecção** organiza tudo: *spec-to-spec*, ***spec-to-reality*** (chama
   ao vivo e compara com o doc — exatamente a etapa 2), *reality-to-reality* (aprende baseline do
   tráfego, sem doc) e *traffic-based* (observa produção via proxy/SDK).

O alicerce conceitual é antigo: **Design by Contract** (Meyer) separa *precondição* (o que o chamador
deve garantir — ≈ params exatos) de *poscondição/invariante* (o que o servidor garante na volta —
≈ shape real, limites). E o **Tolerant Reader / Lei de Postel** (Fowler) prescreve como o consumidor
deve *ler* o que recebe sem casar rígido com uma forma — porque a forma observada e a documentada
quase nunca coincidem campo a campo.

**Veredito para a etapa 2:** o instinto do projeto está alinhado com o estado da arte. As práticas
abaixo convertem o "achamos que o doc mentia" em método: (a) a verdade vem do tráfego vivo, não do
doc; (b) cada afirmação carrega proveniência (`confirmado ao vivo` vs `inferido do código`); (c) a
descoberta usa **oráculos** (status, schema, semântica) e **probing read-only** (só métodos *safe*);
(d) divergência doc↔realidade é um *entregável de primeira classe* ("o que foi tentado e não
funcionou", "o doc dizia X, o vivo respondeu Y"), não uma nota de rodapé.

---

## Práticas com evidência

### P1 — A verdade é o provider VIVO, não o doc: o modelo consumer-driven (Pact)

Em CDC, o consumidor escreve testes que descrevem as interações que **ele de fato precisa**; o Pact
gera um *pact file* (o contrato) e, no passo de **provider verification**, **cada requisição gravada
é enviada ao provider real e a resposta real é comparada com a expectativa mínima**. Dois detalhes são
ouro para a etapa 2:

- **"Expectativa mínima" (minimal expected response).** A verificação passa se a resposta real
  contém *ao menos* os campos que o consumidor descreveu — o provider **pode** devolver mais. Isso
  embute o princípio Tolerant Reader: você confirma o que precisa, sem travar no que sobra.
- **Provider states.** Para reproduzir uma interação que exige pré-condição ("o contato X existe"),
  o Pact monta o estado antes de chamar. Tradução p/ etapa 2: descobrir um endpoint às vezes exige
  *primeiro* obter um id real (de uma LISTA), depois consultar o detalhe — descoberta é **stateful**.

> Fonte: docs.pact.io/getting_started/how_pact_works; pactflow.io/what-is-consumer-driven-contract-testing.

### P2 — Schema inference: derivar o shape real do tráfego, depois fazer diff contra o doc

Ferramentas como **Optic** e **traffic2openapi** capturam request/response reais (via proxy, HAR,
Playwright) e **inferem o schema dos valores que de fato passaram** — tipo (string/integer/number/
boolean/array/object) e *formato* (email, uuid, date-time, uri, ipv4). O fluxo canônico do Optic:

1. `capture` — proxy local intercepta o tráfego real (inclusive HTTPS via cert local; nada sai da
   máquina).
2. `verify` — compara o tráfego observado com o OpenAPI existente e **lista as divergências**.
3. `verify --document all` — **promove a realidade a fonte de verdade**, patchando o spec com
   endpoints e campos recém-descobertos.

A lição para a etapa 2 não é "gerar OpenAPI", é o **princípio**: o shape de resposta documentado
deve ser **derivado de respostas reais e versionado com proveniência**, não transcrito do doc. (Nota
prática: o Optic infere o *tipo* mas "esquece o valor" — por isso a etapa 2 deve **colar o exemplo
real**, como o projeto já faz em `crm.md`.)

> Fonte: apisyouwonthate.com/blog/turn-http-traffic-into-openapi-with-optic; github.com/grokify/traffic2openapi.

### P3 — Exploração black-box com oráculos: descoberta sistemática, não anedótica

A pesquisa acadêmica de teste de REST (survey de Golmohammadi/Zhang/Arcuri) formaliza a descoberta
black-box. Três ferramentas-referência e o que cada uma ensina para a etapa 2:

| Ferramenta | Como descobre | Oráculo (como sabe que está certo) | O que importar p/ etapa 2 |
|---|---|---|---|
| **RESTler** (Microsoft) | Lê o OpenAPI, **infere dependências produtor→consumidor** entre requests e gera sequências stateful | Falha do servidor (5xx) | A ordem importa: um endpoint precisa do *output* de outro (id) como *input* — mapeie a cadeia |
| **EvoMaster** | Algoritmo evolutivo gera casos; suporta black/white-box | Foco em **500** (erro interno = bug do provider) | 5xx em chamada read-only legítima ⇒ sinal de divergência/limite, não "vazio" |
| **Schemathesis** | Property-based (Hypothesis): gera milhares de chamadas de borda a partir do schema | **5 oráculos**: status, conformidade de schema, e **propriedades semânticas** ("GET deve falhar após POST malsucedido no mesmo recurso") | A ideia de **oráculo semântico** — checar *comportamento esperado*, não só "respondeu 200" |

Achado empírico recorrente: essas ferramentas encontram, em segundos, APIs que **aceitam input que o
próprio spec dizia rejeitar** e **respondem com dados diferentes do documentado** — a evidência dura
de que "doc mente" é a regra, não a exceção.

> Fonte: arxiv.org/pdf/2212.14604 (survey); github.com/schemathesis/schemathesis; learn.microsoft.com (RESTler); arxiv.org/pdf/2208.03988 (EvoMaster na indústria).

### P4 — Documentation drift tem uma taxonomia: saiba qual modo a etapa 2 usa

A etapa 2 é, em vocabulário da indústria, **spec-to-reality monitoring** (com um toque de
*reality-to-reality* quando não há doc confiável). A taxonomia completa esclarece o que cada modo
pega e perde:

| Modo | Como funciona | Pega | Perde |
|---|---|---|---|
| **Spec-to-spec** | Diffa duas versões de OpenAPI | Breaking changes entre versões | Não vê a realidade; exige que o spec exista |
| **Spec-to-reality** ← *a etapa 2* | Chama ao vivo e compara a resposta com o doc | **Quando o comportamento real contradiz o doc** | Mudanças que não violam o spec; exige doc para comparar |
| **Reality-to-reality** | Aprende baseline das respostas vivas, sem doc | Qualquer mudança estrutural; funciona em API **não documentada** | Falsos positivos de campos condicionais sem multi-amostra |
| **Traffic-based** | Observa tráfego real (proxy/SDK) em produção | Regressões no uso real | Mudanças fora do seu padrão de tráfego |

**Formas concretas de mentira do doc** (catalogadas): campo `obrigatório` que some na resposta; tipo
divergente (**número documentado que vem como string** — idêntico ao caso do projeto); campo
não-nullable que passa a vir `null` sob certa condição; `opcional` que na prática é obrigatório;
endpoint que devolve um shape completamente diferente do declarado; e o caso silencioso clássico — um
endpoint que **parou de executar** e só "completa" sem efeito (ex.: Shopify Scripts deixou de rodar e
"o checkout completa a preço cheio, em silêncio"). Esse último é exatamente o **"endpoint que parecia
executar mas só renderizava"** do projeto.

> Fonte: dev.to/flarecanary/api-schema-drift-detection-tools-compared-2026; totalshiftleft.ai/blog/api-schema-validation-catching-drift; dev.to/exploredataaiml/why-your-api-documentation-lies; pactflow.io/blog/schemas-can-be-contracts.

### P5 — O alicerce: contrato DECLARADO vs contrato OBSERVADO (Design by Contract)

Meyer separa o contrato em **precondição** (obrigação do chamador — *params exatos, tipos, enums*),
**poscondição** (garantia do servidor na volta — *shape, campos presentes*) e **invariante** (sempre
verdadeiro — *limites, paginação, tetos*). A etapa 2 está, na prática, **descobrindo empiricamente as
pré e poscondições reais** porque a versão escrita (doc/tipos) é aproximada ou mente. O ganho de usar
esse vocabulário: força a perguntar, por endpoint, as três coisas certas — *o que devo mandar (e em
que tipo exato)*, *o que recebo garantido de volta*, *o que vale sempre (limites/bordas)*.

> Fonte: en.wikipedia.org/wiki/Design_by_contract; se.inf.ethz.ch/~meyer/publications/old/dbc_chapter.pdf.

### P6 — Como LER o que se descobre: Tolerant Reader / Lei de Postel

Fowler (derivando de Postel: "seja conservador no que envia, liberal no que aceita") prescreve:
**extraia só os elementos de que precisa, ignore o resto, minimize suposições sobre a estrutura, e
isole o parsing numa única camada (DTO)**. Para a etapa 2 isso vira disciplina de descoberta: ao
confirmar um endpoint, **não declare o shape inteiro como contrato rígido** — declare os campos que a
feature vai consumir (confirmados ao vivo) e trate o resto como "presente, não load-bearing". Casar
rígido com a forma completa gera *falsa confiança* e quebra quando o provider adiciona um campo.

> Fonte: martinfowler.com/bliki/TolerantReader.html; martinfowler.com/articles/enterpriseREST.html.

### P7 — Probing READ-ONLY: a fronteira de segurança da descoberta

A descoberta da etapa 2 é, por mandato, **não-mutante**. A RFC de HTTP dá o critério exato: métodos
**safe** (GET, HEAD, OPTIONS, TRACE) não alteram estado *a pedido do cliente*; **idempotentes** (safe
+ PUT, DELETE) podem ser repetidos sem efeito acumulado. Dois alertas que a etapa 2 deve embutir:

- **"Safe" não é "sem efeito colateral".** Um GET pode logar, atualizar estatística, aquecer cache.
  O critério é *o cliente não pediu o efeito* — então a descoberta read-only é defensável, mas a ficha
  deve registrar quando um endpoint *parece* read-only mas dispara efeito.
- **O verbo no doc pode mentir sobre a natureza.** Confirmar que um endpoint é de fato apenas-leitura
  (e não "executa") é parte da descoberta — não se assume pelo nome (`.../execute`, `.../run`) nem
  pelo método declarado. (É o caso "parecia executar, só renderizava".)

> Fonte: developer.mozilla.org/en-US/docs/Glossary/Safe/HTTP; mscharhag.com/api-design/http-idempotent-safe; freecodecamp.org/news/idempotency-in-http-methods.

### P8 — Capturar e congelar a evidência: snapshot/exemplo real (Postman) e proveniência

A prática de engenharia para *fixar* o que se observou é o **response snapshot / saved example**:
salva-se a resposta real como exemplo ao lado da request, e respostas futuras são comparadas contra
esse baseline. Fluxo de **exploratory testing** do Postman, diretamente aplicável à etapa 2: explorar
manualmente → **codificar a validação em assert** → agrupar em coleção → automatizar. O princípio
transversal: **o exemplo real é a prova**; a ficha de API deve **colar o payload vivo** (como
`ravi-console/.../crm.md` já faz) — não parafrasear o doc.

> Fonte: postman.com/templates/collections/response-snapshot-testing; blog.postman.com/4-ways-enhance-exploratory-testing-with-postman.

---

## Aplicação à etapa 2 (Descoberta)

O projeto já tem o instinto certo (PV1 do `CONTRATO-DAG-TO-DONE.md`: "param+enum+shape colado de
curl/OpenAPI **ao vivo** — nunca do doc"; o caso `crm.md` com `crm/opportunity/set` **inexistente** e
o param `key`→`field` corrigido). A pesquisa converte isso em **método sistemático**. Recomendações
concretas para o CORE da etapa 2:

1. **Inverter a fonte de verdade (de P1/P2/P4).** O doc/código é **hipótese**, não fato. A ficha de
   API declara, por endpoint e por campo, a **proveniência**: `confirmado ao vivo` | `inferido do
   código` | `não verificado`. Isso já está no `PIPELINE.md` — a pesquisa o legitima como o modo
   *spec-to-reality* da indústria. Mantê-lo é não-negociável.

2. **Divergência doc↔realidade é entregável de 1ª classe (de P4).** Adicionar à ficha um bloco
   explícito **"Doc dizia X / Vivo respondeu Y"** com as categorias catalogadas: tipo divergente
   (número→string), `obrigatório` ausente, `opcional` que é obrigatório, endpoint que **só renderiza
   / não executa**, nullability não documentada, endpoint **inexistente** apesar do código. Cada um
   é uma *cicatriz* reutilizável (alimenta a Retrospectiva, etapa 13).

3. **Descoberta é STATEFUL — mapear a cadeia produtor→consumidor (de P1/P3 RESTler).** Confirmar um
   detalhe quase sempre exige **primeiro** um id real vindo de uma LISTA. O briefing da etapa 2 deve
   instruir o `fiscal` a **resolver a dependência de dados** (obter id vivo → usar no próximo
   endpoint), espelhando os *provider states* do Pact e a inferência de dependências do RESTler. O
   mapa de dependências da etapa 1 (DAG) é o insumo natural dessa cadeia.

4. **Oráculos explícitos, não "respondeu 200" (de P3 Schemathesis).** Por endpoint, declarar o
   oráculo: (a) **status** esperado; (b) **conformidade de schema** (campos+tipos batem com o
   observado); (c) **oráculo semântico** quando aplicável (ex.: "este endpoint é read-only ⇒ chamar
   2× não muda contagem na LISTA correlata"; "GET de id inexistente ⇒ 404, não 200 com corpo vazio").
   O oráculo semântico é o que pega o "parecia executar, só renderizava".

5. **Probing exclusivamente READ-ONLY, com a ressalva de P7.** Restringir a métodos *safe*; **nunca
   inferir a natureza do endpoint pelo nome/método declarado** — confirmar que é leitura observando
   que o estado não muda (contagem/recurso estável após a chamada). Registrar quando um "GET" tem
   efeito colateral aparente.

6. **Tolerant Reader na declaração do contrato (de P6).** A ficha confirma **os campos que a feature
   vai consumir** (com tipo exato e exemplo vivo colado) e marca o restante como "presente,
   não-load-bearing". Não cristalizar o shape inteiro como rígido — evita falsa confiança e re-loop
   quando o provider evolui.

7. **Congelar a evidência (de P8).** Todo campo `confirmado ao vivo` carrega **o payload real colado**
   (snapshot), não a paráfrase. É o que torna o critério de aceitação da etapa 2 — "zero campos não
   verificado sem justificativa", "nenhuma suposição não verificada" — *auditável* por outro agente.

8. **Vocabulário Design by Contract no template (de P5).** Estruturar a ficha por endpoint em três
   eixos: **precondição** (params exatos + tipo + enum), **poscondição** (shape garantido + campos
   load-bearing), **invariante** (limites: paginação, teto de registros, timeout, rate). Isso dá ao
   `fiscal` a lista fechada de *perguntas certas* a confirmar ao vivo.

**Síntese:** a etapa 2 é, na nomenclatura da indústria, um **agente de spec-to-reality discovery com
oráculos, restrito a probing read-only, que produz um contrato observado com proveniência e evidência
colada** — e cuja saída mais valiosa não é "a API funciona", mas **"onde o declarado mente sobre o
observado"**. Tudo o que o projeto já fez ad hoc no CRM tem nome, teoria e ferramentas de referência;
o CORE da etapa 2 deve destilar esses oito pontos em regras invariantes (o *critério*) que o gerador
preenche com o contexto vivo (os *dados*) — fiel a M1 (dinâmico) e M3 (invariante vs. demanda).

---

## Fontes

**Contract testing / consumer-driven (Pact)**
- How Pact works — https://docs.pact.io/getting_started/how_pact_works
- What is Consumer-Driven Contract Testing — https://pactflow.io/what-is-consumer-driven-contract-testing/
- Schemas Can Be Contracts (PactFlow Drift) — https://pactflow.io/blog/schemas-can-be-contracts/

**Schema inference a partir de tráfego real**
- Turn HTTP Traffic into OpenAPI with Optic — https://apisyouwonthate.com/blog/turn-http-traffic-into-openapi-with-optic/
- traffic2openapi (HAR/Playwright/proxy → OpenAPI) — https://github.com/grokify/traffic2openapi

**API discovery / exploração black-box (papers e ferramentas)**
- Testing RESTful APIs: A Survey (Golmohammadi, Zhang, Arcuri) — https://arxiv.org/pdf/2212.14604
- Schemathesis (property-based, oráculos semânticos) — https://github.com/schemathesis/schemathesis
- Fuzzing Microservices with EvoMaster (estudos na indústria) — https://arxiv.org/pdf/2208.03988

**Documentation drift (taxonomia e exemplos)**
- API Schema Drift Detection Tools Compared (2026) — https://dev.to/flarecanary/api-schema-drift-detection-tools-compared-2026-1ib4
- API Schema Validation: Catching Drift — https://totalshiftleft.ai/blog/api-schema-validation-catching-drift
- Why Your API Documentation Lies — https://dev.to/exploredataaiml/why-your-api-documentation-lies-building-an-ai-powered-validator-to-catch-the-drift-4b4i
- When Swagger Lies: Fixing API Drift — https://dev.to/copyleftdev/title-when-swagger-lies-fixing-api-drift-before-it-breaks-you-ijo

**Contrato declarado vs. observado (fundamento)**
- Design by Contract (Meyer) — https://en.wikipedia.org/wiki/Design_by_contract · https://se.inf.ethz.ch/~meyer/publications/old/dbc_chapter.pdf
- Tolerant Reader (Fowler) — https://martinfowler.com/bliki/TolerantReader.html
- Enterprise Integration Using REST (Fowler) — https://martinfowler.com/articles/enterpriseREST.html

**Probing read-only (segurança da descoberta)**
- Safe (HTTP Methods) — MDN — https://developer.mozilla.org/en-US/docs/Glossary/Safe/HTTP
- Idempotent — MDN — https://developer.mozilla.org/en-US/docs/Glossary/Idempotent
- HTTP methods: Idempotency and Safety — https://www.mscharhag.com/api-design/http-idempotent-safe

**Captura/evidência (prática de engenharia)**
- Response snapshot testing (Postman) — https://www.postman.com/templates/collections/response-snapshot-testing/
- 4 ways to enhance exploratory testing with Postman — https://blog.postman.com/4-ways-enhance-exploratory-testing-with-postman/

**Cruzamento interno (já no repo — não duplicar)**
- `ravi-console/docs/gap/crm.md` — params resolvidos ao vivo (caso real: `crm/opportunity/set` inexistente; `key`→`field`).
- `ravi-console/docs/gap/CONTRATO-DAG-TO-DONE.md` §1 PV1 — "param+enum+shape colado ao vivo, nunca do doc".
