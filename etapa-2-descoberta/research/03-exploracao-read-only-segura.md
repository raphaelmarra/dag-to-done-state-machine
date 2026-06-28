# Exploração read-only segura — como sondar uma API de produção sem dano

> Pesquisa LOCAL que fundamenta o protocolo de sondagem do agente `fiscal` na **etapa 2 (Descoberta da API)**.
> A etapa verifica endpoints **AO VIVO contra produção** e **não pode causar efeito colateral destrutivo**.
> Caso-semente vivido no projeto: o endpoint `commands/run` *parecia* executar algo (perigoso), mas só
> renderizava o prompt (seguro) — e tivemos que descobrir isso **com cuidado**, não chamando às cegas.

---

## Resumo executivo

1. **O método HTTP é uma *promessa de intenção*, não uma garantia de comportamento.** A RFC 9110 (§9.2.1)
   define `GET/HEAD/OPTIONS/TRACE` como *safe* ("semântica essencialmente read-only") e
   `GET/HEAD/PUT/DELETE/OPTIONS/TRACE` como *idempotentes* — mas isso descreve o que o método **deveria**
   fazer, não o que o servidor **faz**. Um `GET` mal projetado pode mutar estado; um `POST` pode só ler.
   Logo, **não dá para sondar com segurança confiando apenas no verbo.**

2. **Mutação disfarçada existe e tem dois sentidos.** (a) *Falso-perigoso*: `POST commands/run` que só
   renderiza (nosso caso). (b) *Falso-seguro*, muito pior: um verbo ou nome que parece leitura mas escreve
   (`GET /jobs/123/retry`, `POST /search` que persiste a busca, `GET ...?action=delete`). O protocolo
   trata os dois, mas otimiza contra o segundo, porque o custo do erro é irreversível.

3. **A defesa primária não é "ler bem o nome" — é a *capacidade física* do agente.** A lição mais cara da
   indústria (incidente PocketOS/Railway, abril/2026: um agente de codificação apagou um banco de produção
   em **9 segundos** com uma única mutation `volumeDelete`) é que *instrução em prompt não é guardrail*. O
   trilho real é **credencial read-only escopada** + **ambiente isolado**: se o token não consegue escrever,
   o agente não escreve, independentemente do que ele "achar" do endpoint.

4. **Camada de discovery sem invocar a operação.** `OPTIONS` (safe, idempotente, sem efeito) devolve o
   header `Allow` com os métodos suportados; specs (OpenAPI/GraphQL introspection) declaram operação e, em
   GraphQL, separam formalmente `query` (read) de `mutation` (write). Sempre prefira **descobrir pela
   declaração** antes de **descobrir pela chamada**.

5. **Quando a chamada for inevitável, ela é *dry-run* ou nada.** O padrão consolidado (Kubernetes
   server-side dry-run, `terraform plan`) é executar o caminho de validação **garantindo não-persistência**.
   Sem dry-run nativo, a sondagem só prossegue sob credencial read-only; um endpoint ambíguo **sem** prova
   de não-mutação é classificado como mutação e **não é chamado** — registra-se como "não verificável ao vivo".

6. **Sondagem é gradual e observável.** Probe → observa (status, `Location`, contagem antes/depois) →
   decide. Um por vez, com backoff em `429`, jamais em lote. O protocolo abaixo é o procedimento operacional
   dessa disciplina.

---

## Parte 1 — O alicerce: safe vs. idempotente (RFC 9110)

A RFC 9110 (que consolidou e tornou obsoleta a RFC 7231) define duas propriedades **independentes**:

- **Safe (§9.2.1):** "Request methods are considered *safe* if their defined semantics are essentially
  read-only." O propósito declarado é exatamente o nosso: *"This allows general-purpose clients to be
  directed to fetch resources without worrying about altering the server's state."* — ou seja, a
  propriedade safe existe **para que agentes automáticos (crawlers, spiders, o nosso `fiscal`) possam
  navegar sem medo de alterar estado**.
- **Idempotente (§9.2.2):** o efeito de N>0 requisições idênticas é o mesmo de uma só. Importa para *retry*:
  posso repetir sem acumular dano.

| Método  | Safe | Idempotente | Leitura para a sondagem |
|---------|:----:|:-----------:|--------------------------|
| GET     | ✅   | ✅          | Candidato a sondar — *se* o servidor honrar a semântica |
| HEAD    | ✅   | ✅          | O mais seguro: GET sem corpo; ideal p/ "existe? que headers?" |
| OPTIONS | ✅   | ✅          | Discovery puro: header `Allow`, zero efeito |
| TRACE   | ✅   | ✅          | Eco do request; raramente exposto |
| PUT     | ❌   | ✅          | **Escreve.** Idempotente ≠ seguro |
| DELETE  | ❌   | ✅          | **Destrói.** Idempotente ≠ seguro |
| POST    | ❌   | ❌          | Ambíguo: o "saco de gatos" — pode criar, pode só ler |
| PATCH   | ❌   | ❌          | **Escreve** parcial |

**Evidência destilada (o ponto que muda tudo):** safe e idempotente descrevem a **intenção declarada do
método**, não a implementação. mscharhag resume sem rodeios: *"HTTP methods are considered safe if they do
not alter the server state"* — mas alerta que **implementações reais frequentemente não cumprem**, e que
*"a GET request might create log or audit messages, update statistic values or trigger a cache refresh"*.
A própria RFC isenta efeitos colaterais que o cliente não pediu (log, contador, histórico de revisão) — eles
**não** quebram a classificação safe. A consequência operacional para o `fiscal`:

> **O verbo é uma hipótese sobre o comportamento, a ser confirmada — nunca um fato sobre o que vai acontecer.**

---

## Parte 2 — Mutação disfarçada: por que o nome/método engana

### 2.1 O falso-perigoso (nosso caso `commands/run`)

`POST .../commands/run` carrega três sinais de perigo: verbo `POST` (não-safe), nome imperativo (`run`) e a
palavra `commands`. Ainda assim, só renderizava o prompt. A causa é estrutural: **REST mapeia ações que não
são CRUD para `POST` sobre uma URI-substantivo**, e a indústria reconhece o estilo RPC-verbo
(`/scripts/{id}/execute`, `/commands/run`) como comum, embora "não-REST". Resultado: **`POST` é o verbo da
ambiguidade** — agrupa criar, disparar processo *e* "computar/renderizar/validar sem persistir". O nome
sozinho não decide.

Há razões **legítimas** para um read usar `POST`, o que reforça a ambiguidade:
- **dado sensível na query** — servidores logam a URL inteira; mover o parâmetro para o corpo evita vazar
  (ex.: buscar usuário por telefone);
- **payload de busca complexo / limite de tamanho de URL** (~2 KB no IE, ~4 KB no Apache);
- **accountability** (orientação W3C: use `POST` se o usuário deve ser responsabilizado pela interação).

Por isso GraphQL é instrutivo: **toda** operação trafega por `POST`, e a distinção read/write **não está no
verbo HTTP** — está no tipo da operação (`query` vs `mutation`). É a prova viva de que o verbo HTTP é uma
camada cega para a intenção real.

### 2.2 O falso-seguro (o erro que precisamos evitar de verdade)

Pior que achar perigoso o que é seguro é **achar seguro o que muta**. Padrões de risco:

- **Verbo-ação atrás de `GET`:** `GET /jobs/123/retry`, `GET /users/5/activate`, `GET /cache/flush`. RPC-verbo
  estilo "trigger" colado num `GET` — viola a RFC, mas existe em campo.
- **`?action=` / `?op=` na query:** `GET /resource?action=delete` é o anti-padrão clássico (a web já se
  queimou com prefetchers de browser disparando esses links).
- **Side effect "invisível" num read:** `POST /search` que **persiste** a busca como saved search; `GET` que
  consome cota, gera cobrança, dispara webhook ou avança uma máquina de estado.
- **`POST` de criação com nome neutro:** `POST /reports`, `POST /exports` — soa a "gerar relatório" (read),
  mas cria recurso persistente e talvez agende job.

**Tabela de leitura de sinais** (heurística, não veredito):

| Sinal observado | Inclina para LEITURA | Inclina para MUTAÇÃO |
|---|---|---|
| Verbo HTTP | GET, HEAD, OPTIONS | PUT, POST, PATCH, DELETE |
| Verbo no path | get, list, search, render, preview, validate, dry-run, check | create, update, delete, run, execute, send, trigger, retry, sync, import, flush, reset |
| GraphQL | `query` | `mutation` |
| Spec/contrato | declara 200 + corpo de dados | declara 201 + `Location`, ou 202 (assíncrono/job) |
| Header esperado | nenhum especial | exige `Idempotency-Key` (sinaliza não-idempotente que **quer** ser seguro p/ retry) |
| Corpo do request | vazio ou filtros | payload com campos de novo recurso |

Nenhuma linha decide sozinha. A regra é **convergência**: leitura só quando os sinais **concordam**; qualquer
discordância rebaixa o endpoint para "tratar como mutação até prova em contrário".

---

## Parte 3 — Protocolo de sondagem read-only segura (com evidência)

Princípio-mestre, derivado do incidente PocketOS/Railway: **a segurança vem da arquitetura, não da prudência
do agente.** *"Rules in a config file are not a guardrail. A permission system that physically cannot perform
the action is a guardrail."* O protocolo tem 6 fases, da defesa mais forte (física) para a mais fraca (juízo).

### Fase 0 — Trilho físico (pré-condição, não opcional)

A camada que torna o erro **impossível**, não só improvável:

1. **Credencial read-only escopada.** O token do `fiscal` carrega apenas escopos `*:read`. Convenção da
   indústria: read-only é o default; `:write` é sufixo de privilégio extra. Se o provedor não escopa por
   operação (era exatamente o buraco do Railway: *"Every token is effectively root"*), trate **toda** a API
   como write e force os passos seguintes.
2. **Ambiente isolado/declarado.** Escopo por ambiente: *"a token used in staging could not have reached
   production resources."* Se só há produção, marque-a explicitamente como produção — eleva o limiar.
3. **Confirmação humana para qualquer coisa não-safe** que escape do escopo read-only. *"Destructive
   operations must require confirmation that cannot be auto-completed by an agent."*

> Sem a Fase 0, as fases seguintes são paliativo. Com a Fase 0, mesmo um erro de classificação do `fiscal`
> não persiste dano.

### Fase 1 — Discovery *declarativo* (zero chamada de operação)

Descubra pela **declaração**, antes de qualquer invocação:

- **Spec primeiro.** OpenAPI/GraphQL-introspection dizem método, path, schema de request/response e códigos
  de status. Em GraphQL, a introspecção **separa formalmente** `query` (read) de `mutation` (write) — use-a.
- **`OPTIONS`** no recurso (safe, idempotente, sem efeito): o header `Allow` lista os métodos suportados
  *"without performing actual operations"*. Saber que um recurso aceita só `GET, HEAD` já o classifica.
- **Cruze nome × verbo × status declarado** pela tabela da Parte 2.2 → rótulo provisório
  `LEITURA | MUTAÇÃO | AMBÍGUO`.

### Fase 2 — Triagem por classe (decide *se* chama)

| Rótulo | Ação |
|---|---|
| **LEITURA** (sinais convergem: GET/HEAD + nome de leitura + 200) | Elegível para probe ao vivo (Fase 3). |
| **MUTAÇÃO** (qualquer sinal forte de escrita) | **Não chama.** Verifica só pela spec/`OPTIONS`. Registra "não verificado ao vivo — mutação". |
| **AMBÍGUO** (ex.: `POST commands/run`) | Não chama direto. Vai para Fase 4 (dry-run/sonda mínima) **somente** sob Fase 0 garantida. |

> Regra de ouro: **ambíguo é mutação até prova de não-mutação.** O ônus da prova é da segurança, não da
> conveniência.

### Fase 3 — Probe seguro (só LEITURA)

- **`HEAD` antes de `GET`** quando só preciso "existe? que content-type/headers?": é `GET` sem corpo, o
  toque mais leve possível.
- **Um endpoint por vez**, observando: status, `Location`, tamanho/forma do corpo.
- **Respeite rate limit:** em `429`, **backoff exponencial com jitter** (1s→2s→4s…), honrando `Retry-After`.
  Nunca martelar — *"if your code just retries immediately, you hammer the API even harder."* Sondagem em
  lote/paralela é proibida.

### Fase 4 — Desambiguar o AMBÍGUO sem persistir

Para o `commands/run` da vida, em ordem de preferência:

1. **Dry-run nativo, se existir.** Padrão consolidado: Kubernetes server-side dry-run *"guarantees that
   dry-run requests won't be persisted to storage"* (valida, faz default, passa pelas admission chains, mas
   **não grava**); `terraform plan` *"does not call your cloud provider's mutation APIs, it's safe to run
   repeatedly."* Procure `?dryRun=true`, `dry_run` no corpo, modo `preview/validate`, ou
   `Prefer: return=minimal`-like.
2. **Sem dry-run: sonda mínima com verificação de invariante.** Só sob Fase 0. Capture um **invariante de
   estado** (ex.: contagem de recursos, `updated_at`, saldo) **antes**; faça **uma** chamada mínima; capture
   **depois**. Estado idêntico → evidência de leitura. Qualquer mudança → era mutação: pare, registre,
   reclassifique. (É o espírito do contract testing: o Pact "*does not test the side effects... it just
   checks that the response body matches*" — a verificação de comportamento não deve depender de mutar o
   provedor.)
3. **Sinais de resposta sem corpo destrutivo:** `201 Created`+`Location`, `202 Accepted` (job assíncrono
   disparado) ou efeito observável ⇒ era MUTAÇÃO disfarçada. `200`+corpo de dados, sem novo recurso ⇒
   evidência de leitura.
4. **Inconclusivo após o acima:** permanece AMBÍGUO, registrado como **não verificável ao vivo com
   segurança**. Não há "chutar para confirmar".

### Fase 5 — Registro de evidência (todo endpoint)

Para cada endpoint sondado, registre: rótulo final (`LEITURA/MUTAÇÃO/AMBÍGUO`), **base da decisão** (spec /
`OPTIONS` / dry-run / invariante antes-depois), se foi ou não chamado ao vivo, e o invariante observado
quando houve sonda. Isso vira o **handoff estruturado** da etapa 2 e a trilha de auditoria — espelhando a
disciplina do `_RETRO` do projeto (auditoria checa *consistência*, não só presença).

---

## Aplicação à etapa 2 (como o `fiscal` sonda sem dano)

A etapa 2 verifica endpoints **ao vivo contra produção**. Concretizando o protocolo no agente `fiscal`:

1. **Pré-condição inegociável (Fase 0).** O `fiscal` só roda com **token read-only escopado**. O motor (ou a
   config da etapa) declara o ambiente como produção. Se o provedor não oferece token read-only de verdade
   (o anti-padrão Railway), a etapa **degrada para verificação declarativa** (spec + `OPTIONS`) e marca todo
   endpoint de escrita como "não verificado ao vivo — sem credencial segura". O `fiscal` **não** depende do
   próprio juízo para não escrever: o juízo é a última linha, não a primeira.

2. **Ordem de descoberta = barato e seguro primeiro.** (a) spec/introspection; (b) `OPTIONS`+`Allow`;
   (c) classificação por convergência de sinais; só então (d) probe. Nada de "chamar para ver o que
   acontece".

3. **Política de classe** (o coração da decisão do `fiscal`):
   - `LEITURA` → `HEAD`/`GET`, um por vez, com backoff em `429`.
   - `MUTAÇÃO` → **nunca chama**; documenta pela spec.
   - `AMBÍGUO` (o caso `commands/run`) → tenta **dry-run**; sem dry-run, **sonda mínima com invariante
     antes/depois** sob credencial read-only; sem prova de não-mutação, fica `AMBÍGUO` e **não é chamado**.
   - Recriando nosso caso real: `POST commands/run` entraria como `AMBÍGUO`. O `fiscal` capturaria um
     invariante (ex.: nº de comandos executados / último `run_at`), faria **uma** chamada mínima e
     compararia. Estado intacto + `200` com o prompt renderizado no corpo ⇒ promove a `LEITURA` **com
     evidência**. É exatamente "descobrir com cuidado", agora como procedimento, não sorte.

4. **Veredito conservador por padrão.** Qualquer ambiguidade não resolvida **com prova** mantém o endpoint
   fora da verificação ao vivo. A etapa 2 entrega um **mapa de endpoints rotulado e evidenciado**, não um
   "testei tudo". Melhor um endpoint marcado "não verificável com segurança" do que um `volumeDelete`
   disparado por engano.

5. **Saída estruturada (Fase 5)** alimenta a próxima etapa: cada endpoint com rótulo, base da decisão,
   se foi chamado, invariante observado. Coerente com o princípio central do produto — a state machine
   controla a **qualidade do que circula**: a etapa 3 recebe um inventário onde já se sabe o que lê, o que
   muta e o que é arriscado tocar.

**Síntese:** o `fiscal` é seguro por **três anéis concêntricos** — (1) **não pode** escrever (token
read-only: o anel físico), (2) **descobre antes de chamar** (spec/`OPTIONS`: o anel declarativo), (3) **só
confirma ambiguidade via dry-run ou invariante antes/depois** (o anel de juízo). O nome do endpoint é dica,
nunca decisão. Assim, "parece perigoso mas é seguro" se resolve com evidência, e "parece seguro mas muta"
não consegue causar dano — porque o trilho físico veio antes do juízo.

---

## Fontes

**RFCs e padrões (a fundação normativa)**
- RFC 9110 — HTTP Semantics (safe §9.2.1, idempotente §9.2.2; consolida e obsoleta a 7231): https://www.rfc-editor.org/rfc/rfc9110.html · ficha: https://www.rfc-editor.org/info/rfc9110/
- RFC 7231 — HTTP/1.1 Semantics and Content (predecessora): https://datatracker.ietf.org/doc/html/rfc7231
- IETF draft — The Idempotency-Key HTTP Header Field (torna POST/PATCH retry-safe): https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/
- MDN — HTTP OPTIONS (safe, idempotente, sem efeito; header `Allow`): https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/OPTIONS
- MDN — Idempotency-Key header: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Idempotency-Key

**Safe vs. idempotente — leitura prática e a ressalva "intenção ≠ implementação"**
- mscharhag — HTTP methods: Idempotency and Safety (tabela; alerta de que GET pode ter efeito colateral): https://www.mscharhag.com/api-design/http-idempotent-safe
- http.dev — HTTP Methods explained: https://http.dev/methods

**Mutação disfarçada / POST que lê / RPC-verbo**
- The Startup (Medium) — Why would you use POST instead of GET for a read operation: https://medium.com/swlh/why-would-you-use-post-instead-of-get-for-a-read-operation-381e4bdf3b9a
- restfulapi.net — Resource Naming (RPC-verbo `/execute`, ação não-CRUD via POST): https://restfulapi.net/resource-naming/
- GraphQL — Mutations (query=read vs mutation=write): https://graphql.org/learn/mutations/ · Queries: https://graphql.org/learn/queries/

**Dry-run / preview (não-persistência garantida)**
- Kubernetes — APIServer dry-run e kubectl diff ("won't be persisted to storage"): https://kubernetes.io/blog/2019/01/14/apiserver-dry-run-and-kubectl-diff/
- Spacelift — Terraform Dry Run Explained ("does not call your cloud provider's mutation APIs"): https://spacelift.io/blog/terraform-dry-run

**Incidente real: agente apaga produção (o porquê do trilho físico)**
- Zenity — AI Agent Destroys Production Database in 9 Seconds (Railway `volumeDelete`; token = root; guardrail ≠ prompt): https://zenity.io/blog/current-events/ai-agent-database-deletion-pocketos
- Penligent — AI Agent Deleted a Production Database, The Real Failure Was Access Control: https://www.penligent.ai/hackinglabs/ai-agent-deleted-a-production-database-the-real-failure-was-access-control/

**Least privilege / token read-only escopado**
- Curity — OAuth Scopes Best Practices (read default, `:write` como sufixo): https://curity.io/resources/learn/scope-best-practices/
- Auth0 — OAuth 2.0 Access Tokens and The Principle of Least Privilege: https://auth0.com/blog/oauth2-access-tokens-and-principle-of-least-privilege/

**Teste em produção sem mutar / contract testing / rate limit**
- Speakeasy — Testing Best Practices in REST API Design: https://www.speakeasy.com/api-design/testing
- Pact — Provider Verification (não testa side effects, só compara resposta): https://docs.pact.io/implementation_guides/javascript/docs/provider
- OWASP — Web Security Testing Guide, Information Gathering (recon antes de tocar): https://owasp.org/www-project-web-security-testing-guide/stable/4-Web_Application_Security_Testing/01-Information_Gathering/
- Postman Blog — HTTP Error 429 / backoff exponencial com jitter: https://blog.postman.com/http-error-429/
