# Pesquisa 01 — Verificação ao vivo + veredito de incerteza honesta (estado-da-arte 2026)

> Fonte: search-specialist, 2026-06-29. 5 eixos, fontes canônicas (Pact, k6, NUnit, JUnit, TAP, arxiv 2026).
> Resolveu as 3 tensões do Gate B com um princípio unificador: FAIL-CLOSED. O agente nunca é sua própria
> autoridade de verdade; o porteiro audita a evidência (não re-executa).

## O veredito QUATERNÁRIO está certo (e é mais honesto que a maioria)
A literatura é unânime: colapsar "não pude verificar" em pass (falso-verde) ou fail (falso-vermelho) é erro
reconhecido. Precedentes diretos:
- **NUnit `Assert.Inconclusive`:** status de 1ª classe — "o teste não pôde ser completado com os dados
  disponíveis; outra execução poderia dar pass ou fail". = o `inconclusivo` (ambiente indisponível).
- **JUnit XML `<failure>` vs `<error>`:** failure = rodou mas divergiu (assertion); error = condição impediu de
  rodar (ambiente). A indústria reporta em MÁQUINA a diferença "diverge" vs "não pude verificar".
- **TAP `# SKIP` (motivo OBRIGATÓRIO) + `Bail out!`:** skip sem motivo é inválido. "Bail out" = ambiente
  irrecuperável (distinto de skip pontual).
- **k6 checks vs thresholds:** check que falha mas não falha o gate = o falso-verde a evitar (informação ≠ veredito).
- **googletest #160:** a comunidade pediu SKIPPED porque binário forçava uma das duas mentiras (validação histórica).

## Os 2 perigos nomeados
- **Falso-verde** (inconclusivo→verificado): ambiente não respondeu, ninguém olhou, feature avança. O PIOR
  porque é silencioso (o "check sem threshold").
- **Falso-vermelho** (inconclusivo→diverge): bloqueia feature talvez correta, gera ruído, ensina a equipe a
  ignorar o vermelho (tratar `<error>` como `<failure>`).

## A TRAVA do inconclusivo (impede "marco tudo inconclusivo e passo")
**FAIL-CLOSED / DEFAULT-DENY** é a chave: "Se não consigo verificar, não permito." Incerteza = negação, não
avanço (AuthZed/DevSecOps 2026; gate de auth nega quando IdP cai). `inconclusivo` NUNCA avança o pipeline sozinho
— bloqueia/escala. **Marcar inconclusivo não faz passar — faz parar. A fuga deixa de ser fuga.** Reforçado por:
- Ônus de prova: `inconclusivo` exige motivo ENUMERADO (lista fechada) + prova-da-tentativa (request feito + a
  falha que voltou). Inconclusivo sem prova = output malformado (o motivo-obrigatório-do-SKIP do TAP).
- Orçamento agregado: >N% inconclusivos → veredito global precisa-humano (não verde silencioso).
- Pact `can-i-deploy` + pending pacts: contrato nunca-verificado é tratado como BLOQUEADOR, estado próprio
  (verified/failed/unverified — 3 estados, não 2). O porteiro CONSULTA evidência registrada, NÃO re-roda.

## O mecanismo ANTI-ALUCINAÇÃO (a frase-âncora)
**"Nunca deixe o agente auto-reportar conclusão. O orquestrador deve ser a ÚNICA autoridade sobre se a chamada
teve sucesso."** (ysquaretechnology 2026). O LLM "prevê como seria o output da tool e apresenta como fato
consumado" (3 modos: param alucinado, tool errada, BYPASS da chamada). Se o mesmo sistema gera a ação E verifica
o sucesso, alucinação é inevitável → o porteiro TEM que ser independente do fiscal.
- **Tool Receipts (arxiv 2603.10060):** o RUNTIME (não o LLM) emite recibo HMAC com hash de input/output +
  contagem; o LLM nunca tem a chave → não forja. Detecta tool fabricada (94%), contagem mentida (88%), falsa
  ausência (91%). O valor durável é a ARQUITETURA (evidência não-forjável capturada FORA do agente).
- **Anthropic evals:** verifique OUTCOME/estado real (existe a reserva no SQL?), não a narração. O trace é a
  evidência. Para read-only, o "outcome" é o response real observado, capturado independentemente.
- **Agent-Diff (arxiv 2602.11224):** avalia por state-diff (antes vs depois), não pela palavra do agente; e
  modela "não consegui acessar a API" como categoria à parte (= inconclusivo).

## Ground truth / segurança contra produção
- Dado real é necessário quando o critério depende do ESTADO DO MUNDO (saldo, pedidos do usuário) — fixture
  mente. Mas o dado real muda → a evidência captura o SNAPSHOT do instante (ground truth pontual, não reproduzível).
- READ-ONLY por construção (USPTO write-protect: o testador fisicamente não muta produção). Operação destrutiva
  = categoria diferente, salvaguarda explícita, staging > produção.

## O porteiro valida a verificação SEM re-executar
Por critério `verificado`/`confere`, exige um BLOCO DE EVIDÊNCIA: request real (método + URL do ambiente-alvo,
não localhost) + response real (status + corpo + latência + timestamp do run) + a ASSERÇÃO ("critério X ⇒ esta
parte da response satisfaz X"). O porteiro RE-AVALIA a asserção sobre a evidência capturada (determinístico,
barato, sem efeito colateral) — é assim que distingue verificação substantiva de "fiscal disse que passou". É o
`can-i-deploy` (consulta evidência) + Tool Receipts (não-forjável) + re-asserção barata.

## RECOMENDAÇÃO (e o que foi decidido)
(a) Quaternário CERTO. Refinamento: modelar como 2 eixos ortogonais — (1) consegui verificar? verificado/
inconclusivo; (2) bate? confere/diverge/ambíguo. Fecha a porta para "inconclusivo E diverge". A trava: fail-closed
+ ônus de prova + orçamento agregado.
(b) Porteiro exige por critério verificado: request+response real + asserção re-avaliável + (ideal) proveniência
não-forjável + coerência (host=ambiente, timestamp=run atual).
(c) "Sem ambiente" = inconclusivo honesto com motivo `ambiente-indisponivel` + prova-da-tentativa, FAIL-CLOSED
(nunca verificado; bloqueia/escala). A honestidade não abre buraco porque inconclusivo não avança.

## Tensão registrada
Crédito parcial (Anthropic/Agent-Diff) é bom p/ AVALIAR agentes, mas tende ao falso-verde num GATE de release.
Para o Gate B (decisão avançar/barrar), o discreto fail-closed é mais seguro; reserve "parcial" para o RELATÓRIO,
não para a decisão de passe. (gate ≠ benchmark.)

## Dívida p/ futuro
A proveniência não-forjável (proxy/runtime que captura request/response fora do controle do agente) é o ponto
técnico que sustenta toda a confiança do Gate B — o motor não tem isso hoje. Merece ADR próprio. Até lá, o
porteiro audita a FORMA/coerência da evidência mas não prova sua autenticidade (vai ao humano da etapa 10).

## Fontes principais
- Pact can-i-deploy / pending pacts · k6 thresholds vs checks · NUnit Assert.Inconclusive · JUnit failure vs
  error · TAP 14 (SKIP/Bail out) · Tool Receipts (arxiv 2603.10060) · Tool-Use Hallucination (ysquaretechnology)
- Anthropic Demystifying Evals · Agent-Diff (arxiv 2602.11224) · AuthZed/DevSecOps fail-closed · USPTO write-protect
