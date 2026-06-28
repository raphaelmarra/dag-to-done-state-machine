# 04 — Descoberta sistemática de limites e bordas de uma API

> Pesquisa LOCAL que fundamenta a etapa 2 (Descoberta da API). Executor da etapa: `fiscal`
> (toca a rede, verifica ao vivo, read-only). Objetivo: dar ao agente um **protocolo de sondagem
> de fronteiras** — descobrir limites e comportamentos de borda REAIS por método, não por acaso.
> Princípios herdados: sondagem **SEGURA** (não destrutiva) e **HONESTA** (só reporta o observado).
> Diátaxis: Explanation + How-to. Última atualização: 2026-06-28.

---

## Resumo executivo

Descobrir os limites de uma API sem confiar na documentação é um problema clássico de **teste
de caixa-preta**: você só tem entradas e saídas, e precisa inferir o "envelope" do sistema —
onde ele aceita, onde rejeita, e como rejeita. A literatura de teste resolve isso há décadas com
duas técnicas centrais: **Particionamento por Equivalência** (EP), que agrupa entradas que o
sistema *deveria* tratar igual, e **Análise de Valor de Fronteira** (BVA), que ataca exatamente
as bordas dessas partições — porque "defeitos se aglomeram nos limites de faixa" ([Guru99](https://www.guru99.com/equivalence-partitioning-boundary-value-analysis.html)).
Sobre essa base, o teste moderno de API adiciona **fuzzing leve guiado por schema** (enviar
nulo, vazio, tipo errado, string gigante, JSON malformado) e **sondagem incremental** (subir o
volume ou o tamanho até bater no teto) para mapear paginação, rate limit, timeout e payload máximo.

O caso real que motiva esta etapa — um param de paginação que **só funcionava como STRING**
(número dava erro de validação), dois campos **duplicados** na resposta, e um **erro específico**
ao faltar um param obrigatório — é exatamente o tipo de comportamento de borda que **nenhuma doc
captura** e que só aparece quando você sonda o tipo, a presença e a forma de cada parâmetro de
modo sistemático. Esses três achados mapeiam, um a um, em três sondas do protocolo abaixo
(tipo/coerção, forma da resposta, parâmetro ausente).

A tensão central é: **descobrir o máximo sem causar dano**. A solução vem da própria semântica
HTTP — métodos **"safe" (GET/HEAD) não alteram estado** e são **idempotentes** ([Nordic APIs](https://nordicapis.com/understanding-idempotency-and-safety-in-api-design/)) —
combinada com a regra de governança do projeto: o enum de confiança do `fiscal` (`confirmado ao
vivo` / `inferido do código` / `não verificado`) **proíbe estruturalmente** afirmar um limite que
não foi observado. Sondagem que precisaria de método mutante (POST/DELETE) sobre dado real **não
é executada** — é declarada como `não verificado` com a hipótese, nunca como fato.

---

## Parte 1 — O fundamento: mapear o "envelope" de uma API é teste de caixa-preta

Quando a doc é incompleta ou suspeita, você está na situação canônica do **teste de caixa-preta**:
sem acesso à implementação, infere o comportamento pelas respostas. Duas técnicas, **complementares
e quarenta anos consolidadas**, formam a espinha dorsal.

### 1.1 Particionamento por Equivalência (EP) — agrupar o que é tratado igual

> "Técnica de caixa-preta que divide os dados de entrada em grupos de valores equivalentes. O
> testador escolhe um representante por classe, assumindo que o software se comporta igual para
> cada membro." — [Guru99](https://www.guru99.com/equivalence-partitioning-boundary-value-analysis.html)

A ideia: se um endpoint aceita `limit` de 1 a 100, não há sentido em testar 1, 2, 3, …, 100. Você
particiona o domínio em **classes de equivalência** e testa **um representante de cada**:

| Partição | Faixa | Representante | Expectativa |
|----------|-------|---------------|-------------|
| Inválida (abaixo) | ≤ 0 | `0`, `-1` | rejeição |
| Válida | 1 – 100 | `50` | aceitação |
| Inválida (acima) | > 100 | `101`, `9999` | rejeição (ou silenciosamente *clampado* ao teto!) |

Regra de seleção do representante: **"se ele passa, todos passam; se ele falha, a classe inteira
falha"** ([Guru99](https://www.guru99.com/equivalence-partitioning-boundary-value-analysis.html)).
O EP é o que torna a sondagem **econômica**: poucos requests cobrem o espaço.

Crucial para API: as partições não são só de *valor*, são também de **tipo, presença e forma**:
- classe "tipo correto" vs "tipo errado" (número vs string — o nosso caso real);
- classe "presente" vs "ausente" (param obrigatório faltando — o nosso caso real);
- classe "bem-formado" vs "malformado" (JSON válido vs corpo truncado).

### 1.2 Análise de Valor de Fronteira (BVA) — atacar as bordas

> "Também chamada *range checking*, valida os extremos de cada classe de equivalência. Como
> defeitos se aglomeram nos limites de faixa, a BVA mira cinco pontos: mínimo, logo acima do
> mínimo, um valor nominal, logo abaixo do máximo, e máximo." — [Guru99](https://www.guru99.com/equivalence-partitioning-boundary-value-analysis.html)

EP diz *onde* há classes; BVA diz *onde dentro de cada classe atacar*. O padrão clássico é
testar o ponto da fronteira e seus vizinhos imediatos — **min−1, min, min+1 … max−1, max, max+1**
([Katalon](https://katalon.com/resources-center/blog/boundary-value-analysis-guide), [Testsigma](https://testsigma.com/blog/boundary-value-analysis-and-equivalence-class-partitioning/)).
A intuição é direta: bugs de `<` vs `<=`, de *off-by-one*, de overflow e de "o teto documentado
não é o teto real" vivem exatamente em min±1 e max±1.

Para a etapa 2, a BVA é a ferramenta que **acha o teto de paginação real**: você não pergunta à
doc qual é o `limit` máximo — você sonda em torno do valor suspeito (ex.: pedir `limit=100`,
`limit=101`, `limit=1000`) e observa se a API **rejeita** (erro), **clampa** (devolve 100 sem
reclamar) ou **honra** (devolve 1000). Cada um desses é um comportamento de borda diferente que
*precisa estar na ficha*.

### 1.3 Por que as duas juntas

> "Combinar essas técnicas resolve as limitações individuais e maximiza a detecção de defeitos —
> agrupando entradas similares e mirando suas bordas para cobertura mais forte com menos casos."
> — [Commencis](https://www.commencis.com/thoughts/unleashing-the-power-of-equivalence-partitioning-and-boundary-value-analysis-in-software-testing/)

EP **sem** BVA testa o meio confortável de cada classe e perde os off-by-one. BVA **sem** EP não
sabe quantas faixas existem. Juntas, formam a varredura mínima que cobre o envelope com custo baixo
— o que importa quando cada sonda é um request real contra um sistema vivo.

---

## Parte 2 — As seis dimensões do envelope e como sondar cada uma

Cada endpoint tem um "envelope" multidimensional. Abaixo, cada dimensão com **a técnica de
descoberta**, **o sinal observável** e **a evidência da literatura**.

### 2.1 Paginação — limit/offset, cursor e o TETO

**O que existe no mercado.** Dois modelos dominam ([Gusto/Embedded](https://embedded.gusto.com/blog/api-pagination/), [Knit](https://www.getknit.dev/blog/api-pagination-techniques)):
- **Offset/limit**: `?offset=50&limit=20` ("pule 50, traga 20"). Simples; sofre de *skip/duplicate*
  se dados mudam entre páginas e fica lento em tabelas grandes.
- **Cursor/keyset**: a resposta devolve um `next_cursor` (um ponteiro opaco); você o reenvia para a
  próxima página até ele vir vazio/ausente, sinalizando fim ([Zendesk](https://developer.zendesk.com/documentation/api-basics/pagination/paginating-through-lists-using-cursor-pagination/)).
  Estável e rápido em milhões de registros.

**Como descobrir o teto sem doc** (BVA aplicada):
- A maioria dos endpoints **limita o page size a 100 por padrão** ([Zendesk](https://developer.zendesk.com/api-reference/introduction/pagination/), [UserVoice](https://help.uservoice.com/hc/en-us/articles/360060835594-Pagination-with-the-API)).
  Use isso como hipótese inicial, **não como verdade**.
- Sonde em torno da fronteira: peça `limit=` no valor suspeito, no valor−1, no valor+1 e num valor
  absurdamente alto (ex.: 10000). Conte **quantos itens realmente voltaram**.
- Três comportamentos possíveis, cada um um achado distinto:
  1. **Rejeita** → erro de validação ("limit must be ≤ 100"). Teto explícito.
  2. **Clampa silenciosamente** → você pede 10000, volta 100, sem erro. **Teto implícito** —
     perigoso, porque o código que assume "pedi 10000, tenho tudo" quebra.
  3. **Honra** → volta 10000. Sem teto (ou teto acima disso).
- Para cursor: o teto é descoberto **paginando até o fim** e contando, ou observando se o cursor
  expira/muda de forma. O sinal de fim é "**sem next_cursor na resposta**" ([Zendesk](https://developer.zendesk.com/documentation/api-basics/pagination/paginating-through-lists-using-cursor-pagination/)).

> ⚠️ **Tipo do parâmetro de paginação é uma borda.** O caso real do projeto — `limit`/`page`
> aceito **só como string**, número dando erro — não é exótico: **query params são, por natureza,
> strings no HTTP** ([Postman/Zuplo](https://zuplo.com/learning-center/input-output-validation-best-practices)),
> e o validador do servidor pode ou não fazer *coerção* de string→número. Ver §2.6.

### 2.2 Rate limiting — descobrir o limite por headers e por 429

**Caminho honesto e barato (preferencial): ler os headers.** O padrão de fato — e agora um draft
IETF (`draft-ietf-httpapi-ratelimit-headers`, v11, 2026) — define campos que a própria resposta
carrega ([IETF datatracker](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/)):

| Campo | Semântica (draft IETF) |
|-------|------------------------|
| `RateLimit-Limit` / `X-RateLimit-Limit` | cota máxima de requests na janela atual |
| `RateLimit-Remaining` / `X-RateLimit-Remaining` | quanto resta na janela atual |
| `RateLimit-Reset` / `X-RateLimit-Reset` | segundos até a janela resetar (ou epoch) |
| `RateLimit-Policy` | a política de cota (janela `w` em segundos) — informativo |

Muitos provedores grandes expõem isso (X/Twitter usa `x-rate-limit-limit/remaining/reset`;
GitHub e Stripe documentam os seus). **Uma única chamada já pode revelar o limite inteiro sem
precisar estourá-lo.**

**Quando não há headers: descoberta por 429 (sondagem incremental).** Ao exceder o limite, o
servidor responde **429 Too Many Requests** (RFC 6585) até a janela resetar ([restfulapi.net](https://restfulapi.net/rest-api-rate-limit-guidelines/), [Postman](https://blog.postman.com/http-error-429/)).
Aumentando o volume de requests de forma incremental até receber 429, infere-se empiricamente o
limiar. O 429 normalmente traz **`Retry-After`** (segundos ou data) dizendo quanto esperar
([dev.to/robertobutti](https://dev.to/robertobutti/how-to-handle-api-rate-limits-and-http-429-errors-in-an-easy-and-reliable-way-14e6)).

> ⚠️ **Honestidade obrigatória sobre rate limit.** O draft IETF é explícito: *"Clients MUST NOT
> assume that a positive RateLimit-Remaining value is a guarantee that further requests will be
> served"* e *"a server MAY artificially lower RateLimit values … in case of resource saturation"*
> ([IETF v05](https://www.ietf.org/archive/id/draft-ietf-httpapi-ratelimit-headers-05.html)). Ou
> seja: o número observado é **uma leitura do instante**, não um SLA. A ficha deve registrar "rate
> limit observado: X (via header Y)" — não "o rate limit é X".

> ⚠️ **Segurança:** estourar deliberadamente o rate limit é uma sonda **potencialmente disruptiva**
> (pode degradar o serviço para outros, ou bloquear a credencial). Por padrão, **prefira os headers**;
> só sonde até o 429 com autorização explícita e em ambiente onde isso é seguro (ver Parte 4).

### 2.3 Timeout — quanto a API espera antes de desistir

Timeouts têm duas faces: o **timeout do servidor** (quanto ele processa antes de cortar, tipicamente
**504 Gateway Timeout** atrás de proxy) e o **do cliente** (quanto você espera a resposta). Descoberta
honesta e segura é majoritariamente **passiva**: medir a **latência real** de chamadas normais
(p50/p95) e registrar. Forçar timeout exige provocar trabalho pesado no servidor (ex.: filtro caro,
range gigante), o que beira o disruptivo — então, por padrão, **observe e meça**, não force. Se um
endpoint tem comportamento de timeout conhecido, registre como `inferido` até confirmar com uma
medição real e barata.

### 2.4 Payload máximo — o teto do corpo da requisição

**Sinal:** **413 Content Too Large** (antes "Payload Too Large") — "o servidor recusa porque a
entidade da requisição é maior que os limites definidos" ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/413)).
Aplica-se **só ao corpo**, não aos headers, e é **medido em bytes**.

**Como descobrir (BVA sobre tamanho):**
> "Comece com um payload pequeno que funciona (200), e aumente gradualmente o tamanho até bater no
> 413 — isso revela o limite exato." — [apidog](https://apidog.com/blog/status-code-413-payload-too-large/)

Cuidado de mapeamento: o teto pode vir de **qualquer camada no caminho** — proxy, load balancer,
WAF, ou o servidor de origem — e a **camada mais restritiva vence** ([Cloudflare](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/4xx-client-error/error-413/), [Tyk](https://tyk.io/docs/basic-config-and-security/control-limit-traffic/request-size-limits)).
Defaults comuns dão referência (ex.: Apigee ≈ 10 MB), mas **só servem de hipótese**. Para a etapa 2,
sondar payload máximo só faz sentido em endpoints de escrita/upload, o que **é método mutante** —
ver a ressalva de segurança na Parte 4 (em geral: **não execute, declare a hipótese**).

### 2.5 Comportamento de erro — códigos e mensagens de validação

O **formato e a especificidade dos erros** são parte do contrato e quase nunca estão na doc. Mapear
exige **teste negativo deliberado** ([apisec](https://www.apisec.ai/blog/api-fuzzing-for-security-testing-complete-guide), [StackHawk](https://www.stackhawk.com/blog/api-fuzz-testing/)):

- **Param obrigatório ausente** → qual status? `400`? `422`? Qual mensagem? (nosso caso real: faltar
  um param obrigatório dava **erro específico** — esse texto exato é o que o consumidor precisa para
  tratar.)
- **Tipo errado** → ver §2.6.
- **Valor fora de faixa** → 400/422 com mensagem de limite (e é como você descobre o teto de §2.1).
- **Recurso inexistente** → 404, e qual corpo.
- **Auth ausente/inválida** → 401 vs 403.

O objetivo do teste negativo, segundo a literatura: *"não testar o comportamento documentado — é
achar o NÃO-documentado: 500, bypass de validação, respostas inesperadas"* ([Redocly](https://redocly.com/learn/testing/contract-testing-101)).
A ficha deve registrar, por endpoint, a **tabela de erros observados**: condição → status → corpo/
mensagem real (verbatim, porque o consumidor vai casar string).

### 2.6 Valores de borda de input — vazio, nulo, tipo, gigante (fuzzing leve guiado por schema)

Aqui mora o coração dos três achados reais. O **fuzzing leve** (não o fuzzing de segurança de
milhões de casos — uma bateria curta e dirigida) consiste em enviar, por campo, os representantes
das classes inválidas ([apisec](https://www.apisec.ai/blog/api-fuzzing-for-security-testing-complete-guide), [Nordic APIs](https://nordicapis.com/what-is-rest-api-fuzz-testing/)):

> "Exemplos de fuzz incluem strings longas demais, valores nulos em campos obrigatórios, tipos de
> dado inválidos (string onde se espera número), JSON/XML malformado." — [apisec](https://www.apisec.ai/blog/api-fuzzing-for-security-testing-complete-guide)
>
> "Casos de borda nulo/vazio/opcional — null em JSON, arrays vazios, chaves opcionais ausentes —
> revelam null-dereferences não guardados e suposições de valor-default." — [StackHawk](https://www.stackhawk.com/blog/api-fuzz-testing/)

A bateria mínima por campo (representantes de classes inválidas, em ordem de menor risco):

| Sonda | Envia | Por que / o que revela |
|-------|-------|------------------------|
| **Vazio** | `""` (string vazia) | aceita? rejeita? trata como ausente? |
| **Nulo** | `null` | null-dereference, default silencioso |
| **Tipo trocado** | `123` onde espera string, e `"123"` onde espera número | **coerção vs estrito** — o nosso caso da paginação |
| **Gigante** | string muito longa / array enorme | trunca? 413? 400? |
| **Ausente** | omitir o campo | obrigatório vs opcional; mensagem de erro exata |

Sobre o caso real **número vs string**: *"query params são, por natureza, strings no HTTP"*
([Zuplo](https://zuplo.com/learning-center/input-output-validation-best-practices)). Se o servidor
valida com **JSON Schema sem coerção** (o default — *"não há coerção de tipo na especificação JSON:
1 é número, não boolean"* — [json-schema.org](https://json-schema.org/understanding-json-schema/reference/type)),
então um `page` declarado como `string` no schema **rejeita** o número. Se usa **Ajv com
`coerceTypes`** ([Ajv](https://ajv.js.org/coercion.html)), aceita os dois. **Você não sabe qual sem
sondar os dois.** A sonda "tipo trocado" é o que transforma "estranho, deu erro" em achado
documentado: *"`page` deve ser enviado como STRING; número → 422 com mensagem X"*.

Sobre **campos duplicados na resposta** (o terceiro achado): isso não se descobre por input, mas
por **inspeção sistemática da shape real** de cada resposta — comparar a estrutura devolvida campo a
campo com a esperada. É a face de *saída* do envelope. A literatura de contrato avisa: *"o provedor
pode mudar algo que parece retrocompatível mas quebra um consumidor que dependia de comportamento
não-documentado — um campo que sempre vinha numa ordem, um timestamp que sempre tinha um timezone"*
([Redocly](https://redocly.com/learn/testing/contract-testing-101)). Por isso a etapa 2 captura a
**shape real, não a do doc** (já está no entregável do PIPELINE) — e duplicação/ordem/extras entram aí.

---

## Parte 3 — O paradigma por trás: exploração estruturada, não aleatória

A diferença entre "descobrir por acaso" e "descobrir por protocolo" tem nome na literatura de teste:
**Exploratory Testing estruturado**, formalizado por Cem Kaner e refinado por James Bach e Michael
Bolton como *"aprendizado, design de teste e execução simultâneos"* ([Xray](https://www.getxray.app/blog/complete-guide-to-exploratory-testing)).
Duas peças desse corpo são diretamente reaproveitáveis pelo `fiscal`:

- **Charter (carta de missão):** *"um enunciado breve — 1 a 3 frases — que guia a sessão sem
  super-estruturá-la: o que testar, como abordar, o que procurar"* ([Xray](https://www.getxray.app/blog/test-charters-exploratory-testing)).
  Cada endpoint da etapa 2 vira um charter ("sondar o envelope de `GET /x`: tipos, fronteiras,
  erros").
- **Heurística SFDIPOT** (Structure, Function, Data, Interfaces, Platform, Operations, Time) e
  **tours** dão **direções sistemáticas sem passos roteirizados**, prevenindo *confirmation bias*
  ([yrkan.com](https://yrkan.com/blog/test-charter-writing/)). É o oposto de "só testei o caminho
  feliz".

No nível **automatizável**, a referência é o **property-based testing guiado por schema** —
**Schemathesis** (sobre Hypothesis) *"gera milhares de casos a partir do schema OpenAPI/GraphQL,
detecta crashes, violações de schema de resposta, bypass de validação e bugs de fluxo"*, com
**negative testing** e **cinco oráculos** (status, content-type, headers, body) e **testes stateful**
encadeados por *links* do schema ([Schemathesis](https://schemathesis.io/), [GitHub](https://github.com/api-evangelist/schemathesis), [arXiv 2204.08348](https://arxiv.org/pdf/2204.08348)).
Para a etapa 2 **não precisamos** automatizar com Schemathesis — mas a sua taxonomia de oráculos
("o que olhar numa resposta") é um excelente checklist para o `fiscal` aplicar à mão.

---

## Parte 4 — Aplicação à etapa 2: o protocolo de sondagem de fronteiras

> **Quem executa:** `fiscal` (toca a rede, read-only). **Entrada:** lista de endpoints que a feature
> usará (vem do DAG + da própria descoberta). **Saída:** acrescenta à *Ficha de API* a seção
> **"Envelope"** por endpoint. **Dois invariantes mandatórios:** SEGURO (não destrutivo) e HONESTO
> (só o observado). Estes dois invariantes são regra do CORE da etapa 2; o resto é leitura do contexto.

### 4.1 Os dois invariantes (regra de CORE — não negociável)

**INVARIANTE A — Sondagem SEGURA (não destrutiva).** A escolha do método decide o que pode ser
sondado ao vivo:
- **Sempre seguro:** métodos **safe/idempotentes** — `GET`, `HEAD`, `OPTIONS`. *"Um método é 'safe'
  quando não altera o estado do servidor — opera em modo read-only"* ([Nordic APIs](https://nordicapis.com/understanding-idempotency-and-safety-in-api-design/)).
  Toda sondagem de **leitura** (paginação, shape, erros de GET, headers de rate limit) é livre.
- **Requer cautela / em geral NÃO executar:** métodos **mutantes** (`POST`, `PUT`, `PATCH`,
  `DELETE`) sobre dado real, e **sondas potencialmente disruptivas** (estourar rate limit de
  propósito, forçar timeout, achar payload máximo subindo corpo). Para esses: **não execute** —
  registre a **hipótese** e o **status `não verificado`**, com o motivo ("exigiria POST destrutivo"
  / "exigiria estourar rate limit"). Se houver ambiente seguro (sandbox, recurso descartável,
  autorização explícita), aí sim sonde — e marque a evidência.
- **Regra prática de payload/escrita:** a literatura recomenda *"isolar e reproduzir num ambiente
  controlado com cURL"* ([apidog](https://apidog.com/blog/status-code-413-payload-too-large/)) —
  exatamente para **não** sondar limites de escrita contra produção.

**INVARIANTE B — Reporte HONESTO (só o observado).** Casa direto com o **enum de confiança** do
`fiscal` já definido no projeto (`confirmado ao vivo` / `inferido do código` / `não verificado` —
[ANATOMIA-DE-ETAPA §2](../../docs/ANATOMIA-DE-ETAPA.md), ADR 0019). Aplicado a limites:
- Limite **observado numa resposta real** (um 429 visto, um 413 visto, um header lido, um clamp
  contado) → `confirmado ao vivo` **com a evidência** (o status + o corpo/header verbatim).
- Limite **lido no código/doc mas não exercido** → `inferido`. Nunca vira "o limite é X".
- Limite que **exigiria sonda insegura** → `não verificado` + hipótese + por que não foi sondado.
- **Proibição estrutural:** afirmar um teto que não foi observado é mentira estrutural — o mesmo
  erro que o enum existe para impedir. "Rate limit observado: 100/min via `x-rate-limit-limit`" é
  honesto; "o rate limit é 100/min" (sem ter visto) não é.

### 4.2 O protocolo — uma bateria por endpoint (ordem de menor → maior risco)

Para **cada** endpoint da feature, o `fiscal` roda esta sequência. Toda ela é read-only por padrão;
os passos que exigiriam mutação/disrupção são **declarados, não executados** (Invariante A).

1. **Baseline feliz.** Uma chamada válida mínima. Captura: status 2xx, **shape real da resposta**
   (campo a campo — aqui se pegam **campos duplicados/extras/ordem**), latência p50, e **todos os
   headers** (rate limit, cache, content-type).
2. **Headers de rate limit (grátis).** Da resposta do passo 1, extrair `RateLimit-*` / `X-RateLimit-*`
   e `Retry-After`. Registrar como limite **observado**. (Preferir isto a estourar o limite.)
3. **Particionar cada parâmetro (EP).** Listar params (de query/body) e, para cada, identificar as
   classes: válida, abaixo, acima, tipo-certo, tipo-errado, presente, ausente.
4. **Sonda de TIPO (o caso real nº1).** Para cada param, enviar **o valor como string E como número**
   (e boolean onde fizer sentido). Observar qual o servidor aceita. → revela coerção vs estrito;
   documenta "`page` deve ser STRING; número → \<status\> \<mensagem verbatim\>".
5. **Sonda de AUSÊNCIA (o caso real nº3).** Omitir cada param, um de cada vez. Observar status +
   **mensagem de erro exata**. → distingue obrigatório/opcional e **captura o texto do erro** que o
   consumidor vai tratar.
6. **Fronteira de PAGINAÇÃO (BVA, o teto).** Pedir `limit`/`page[size]` no valor suspeito, ±1, e num
   valor absurdo (ex.: 10000). **Contar itens retornados.** Classificar: rejeita / **clampa
   silenciosamente** / honra. → o teto real, não o documentado.
7. **Valores de borda de input (fuzzing leve).** Por param: `""`, `null`, string gigante. Observar
   status + mensagem. → null-defaults, truncamento, validação de tamanho.
8. **Mapa de erros.** Consolidar os passos 4–7 numa **tabela condição → status → corpo verbatim**
   por endpoint.
9. **[DECLARAR, não executar] sondas inseguras.** Rate limit por 429, timeout forçado, payload
   máximo (413) e qualquer escrita: **registrar a hipótese** e marcar `não verificado` com o motivo
   — a menos que exista ambiente seguro e autorização (Invariante A).

### 4.3 Formato de saída — a seção "Envelope" da Ficha de API

Por endpoint, acrescentar à ficha (o entregável da etapa 2 já pede "limites e comportamentos de
borda documentados" — isto operacionaliza o como):

```
### GET /recurso  —  Envelope
- Shape real: { ... }   [⚠️ campo `x` aparece DUPLICADO — confirmado ao vivo]
- Paginação: param `page` (STRING obrigatório); `limit` teto=100, CLAMPA silenciosamente acima  [confirmado ao vivo: pedi 9999, vieram 100]
- Rate limit: 100/min  [confirmado ao vivo: header `x-rate-limit-limit: 100`]  — Retry-After presente no 429 [inferido, não estourado]
- Timeout: p95 ~420ms [confirmado ao vivo]; corte do servidor [não verificado — exigiria forçar]
- Payload máx: [não verificado — endpoint é GET, sem corpo]
- Erros observados:
  | condição                | status | corpo (verbatim)                |
  | param `page` ausente    | 422    | {"error":"page is required"}    |
  | `page` como número (5)  | 422    | {"error":"page must be a string"}|
  | `limit=0`               | 400    | {"error":"limit must be >= 1"}  |
- Confiança geral: confirmado ao vivo (sondas read-only) | inseguras declaradas, não executadas
```

### 4.4 Por que isto fecha o caso real

| Achado real do projeto | Sonda do protocolo que o pega | Técnica de origem |
|------------------------|-------------------------------|-------------------|
| Param de paginação só funciona como **STRING** | Passo 4 (sonda de TIPO: string E número) | EP por tipo + coerção JSON Schema |
| Dois campos **duplicados** na resposta | Passo 1 (shape real campo a campo) | oráculo de body (contract testing) |
| Param obrigatório ausente → **erro específico** | Passo 5 (sonda de AUSÊNCIA, mensagem verbatim) | EP presente/ausente + teste negativo |

Nenhum dos três dependeu de método mutante — todos são **read-only**, logo **seguros**, e todos
produzem **evidência observada**, logo **honestos**. O protocolo transforma os três "descobrimos por
acaso" em três passos determinísticos que rodam para qualquer endpoint de qualquer projeto (M1:
dinâmico; M3: o protocolo é a gramática invariante, o endpoint é o programa).

---

## Fontes

**Boundary Value Analysis & Equivalence Partitioning (fundamento de caixa-preta)**
- Guru99 — definições e os 5/6 pontos de fronteira, regra do representante: https://www.guru99.com/equivalence-partitioning-boundary-value-analysis.html
- Katalon — guia de BVA (min−1/min/min+1 … max+1): https://katalon.com/resources-center/blog/boundary-value-analysis-guide
- Testsigma — BVA vs Equivalence Class Partitioning: https://testsigma.com/blog/boundary-value-analysis-and-equivalence-class-partitioning/
- Commencis — por que combinar EP+BVA: https://www.commencis.com/thoughts/unleashing-the-power-of-equivalence-partitioning-and-boundary-value-analysis-in-software-testing/

**Paginação (limit/offset, cursor, teto)**
- Gusto/Embedded — offset vs cursor: https://embedded.gusto.com/blog/api-pagination/
- Knit — 5 técnicas de paginação: https://www.getknit.dev/blog/api-pagination-techniques
- Zendesk — referência de paginação (teto 100, page[size]): https://developer.zendesk.com/api-reference/introduction/pagination/
- Zendesk — cursor pagination (sinal de fim = sem next_cursor): https://developer.zendesk.com/documentation/api-basics/pagination/paginating-through-lists-using-cursor-pagination/

**Rate limiting (headers, 429, descoberta)**
- IETF — draft-ietf-httpapi-ratelimit-headers (campos e semântica): https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/
- IETF v05 — "MUST NOT assume positive Remaining is a guarantee": https://www.ietf.org/archive/id/draft-ietf-httpapi-ratelimit-headers-05.html
- restfulapi.net — 429 (RFC 6585) e Retry-After: https://restfulapi.net/rest-api-rate-limit-guidelines/
- dev.to (Roberto Butti) — lidar com 429 e Retry-After: https://dev.to/robertobutti/how-to-handle-api-rate-limits-and-http-429-errors-in-an-easy-and-reliable-way-14e6
- Postman — HTTP 429: https://blog.postman.com/http-error-429/

**Payload máximo (413)**
- MDN — 413 Content Too Large: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/413
- apidog — descobrir o limite subindo o payload até 413: https://apidog.com/blog/status-code-413-payload-too-large/
- Cloudflare — 413 e camada mais restritiva: https://developers.cloudflare.com/support/troubleshooting/http-status-codes/4xx-client-error/error-413/
- Tyk — request size limits: https://tyk.io/docs/basic-config-and-security/control-limit-traffic/request-size-limits

**Fuzzing leve / teste negativo / valores de borda**
- APIsec — fuzzing (nulo, tipo errado, string longa, JSON malformado): https://www.apisec.ai/blog/api-fuzzing-for-security-testing-complete-guide
- StackHawk — null/empty/optional edge cases: https://www.stackhawk.com/blog/api-fuzz-testing/
- Nordic APIs — o que é REST API fuzz testing: https://nordicapis.com/what-is-rest-api-fuzz-testing/

**Tipo/coerção (string vs número — o caso real)**
- Zuplo — query params são strings por natureza; validação de input/output: https://zuplo.com/learning-center/input-output-validation-best-practices
- json-schema.org — sem coerção de tipo por padrão: https://json-schema.org/understanding-json-schema/reference/type
- Ajv — regras de coerção (coerceTypes): https://ajv.js.org/coercion.html

**Contract testing / exploração estruturada / property-based**
- Redocly — contract testing 101 (achar o não-documentado): https://redocly.com/learn/testing/contract-testing-101
- Schemathesis — property-based, oráculos, negative & stateful: https://schemathesis.io/
- Schemathesis (mirror/desc.) — taxonomia de oráculos: https://github.com/api-evangelist/schemathesis
- arXiv 2204.08348 — "Automated Test Generation for REST APIs": https://arxiv.org/pdf/2204.08348
- Xray — guia de exploratory testing e charters: https://www.getxray.app/blog/complete-guide-to-exploratory-testing
- Yuri Kan — test charter writing, SFDIPOT/HICCUPPS: https://yrkan.com/blog/test-charter-writing/

**Segurança / idempotência (sondagem não destrutiva)**
- Nordic APIs — safety & idempotency (safe = read-only): https://nordicapis.com/understanding-idempotency-and-safety-in-api-design/
