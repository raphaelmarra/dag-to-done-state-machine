# 0030 — Etapa 9 (Gate B): verificação ao vivo com veredito quaternário e fail-closed

- Status: accepted
- Data: 2026-06-29
- Relacionado: CORE-GATEB (etapa 9); PARENTE da etapa 2 (Descoberta) — mesmo executor `fiscal`, mesma
  verificação ao vivo; reusa `regrasExtras` (ADR 0024), a fábrica de evidência substantiva
  `regraNaoAplicavelComMotivo` (ADR 0029, generalizada na etapa 8), o cruzamento âncora↔estado de
  `regraAncoraRastreavel` (ADR 0027); fecha o ciclo "declaração → verdade" que os limites epistêmicos das
  etapas 6/8 empurraram para cá; abre A018 (autenticidade da evidência ao vivo não-forjável; parente de A016).

## Contexto e Problema
As etapas 7 (Gate A) e 8 (Acessibilidade) validam a FORMA de uma declaração-com-prova: o porteiro vê o
rastro de um trabalho, não o trabalho. A etapa 9 é de **gênero diferente** — verifica a VERDADE: o `fiscal`
chama a API/app AO VIVO (read-only), confronta o comportamento REAL com os critérios de aceitação do design
(etapa 4), e NÃO lê código. Três tensões: (D-1) `inconclusivo` é um veredito honesto ("não consegui
verificar ao vivo") — mas como impedir que vire FUGA (marco tudo inconclusivo e passo)? (D-2) o ambiente ao
vivo pode não existir no contexto do agente — como tratar isso sem abrir buraco? (D-3) o porteiro pode
exigir que TODOS os critérios do design sejam endereçados (cobertura), cruzando o estado?

## Decisão
**A etapa 9 é o JUIZ DA AUTENTICIDADE — veredito QUATERNÁRIO + FAIL-CLOSED.** Concretamente:

1. **Veredito quaternário, não binário.** Por critério: `situacao ∈ {confere, diverge, inconclusivo,
   precisa-humano}` — dois eixos ortogonais ("consegui verificar?" × "bate com o critério?"), que fecham a
   porta a estados incoerentes. O veredito GLOBAL **deriva** das situações (`regraVeredictoGlobalCoerente`):
   ≥1 diverge → diverge; senão ≥1 precisa-humano → precisa-humano; senão ≥1 inconclusivo → inconclusivo;
   só `verificado` quando TODOS conferem. O porteiro REJEITA um veredito global mais OTIMISTA que as
   situações permitem (o coração do fail-closed: a incerteza de qualquer critério rebaixa o todo).

2. **FAIL-CLOSED (default-deny) — só `verificado` avança** (`regraCampoIgual("veredito","verificado")`).
   `diverge`/`inconclusivo`/`precisa-humano` são outputs VÁLIDOS e bem-formados (o porteiro os ACEITA como
   verificação correta) mas BLOQUEIAM o fluxo (a feature não está pronta / não pôde ser confirmada — volta
   à etapa 6 ou escala). **Marcar inconclusivo não faz passar — faz parar; a fuga deixa de ser fuga**
   (D-1/D-2). Respaldo: `Assert.Inconclusive` (NUnit), `pending pact` / `can-i-deploy` (Pact), gate de auth
   que nega quando o IdP cai.

3. **Ônus de prova do `inconclusivo`** (`regraInconclusivoComMotivo`): exige `motivo` de um ENUM FECHADO
   (`ambiente-indisponivel` / `endpoint-fora-do-proxy` / `timeout` / `sem-credencial-readonly` /
   `pre-condicao-de-dado-ausente`) — não texto livre. Inconclusivo sem motivo enumerado = output malformado.

4. **Evidência SUBSTANTIVA por critério** — a frase-âncora: "o agente nunca é sua própria autoridade de
   verdade; o porteiro audita a evidência". Cada critério carrega um bloco de evidência (request real +
   response real + asserção; ou ESPERADO-vs-REAL; ou prova-da-tentativa). Reusa
   `regraNaoAplicavelComMotivo(valorNA=null)` — evidência oca ("ok"/"n/a"/só-pontuação/número-solto/objeto)
   reprova em QUALQUER situação.

5. **Cobertura cruzando o estado** (`regraCriteriosDoDesignCobertos`, D-3): todo `criterios_aceitacao[].id`
   do `design_output` (promovido no estado) é endereçado na verificação. Ancorado por id INTEIRO (não
   substring — `CA-12` não cobre `CA-1`). Limite honesto: se o design não tem ids extraíveis, não dá para
   cobrar — não reprova.

6. **Executor `fiscal`** (chama a API ao vivo read-only, confronta o real, não lê código, não muta produção).

## Motivo
Decidido pela rotina 0→4: pesquisa de verificação E2E + veredito de incerteza honesta (NUnit/JUnit/TAP/Pact
+ fail-closed) e validado contra 2 casos cegos de naturezas OPOSTAS — aba CLIs (ambiente acessível,
chamadas REAIS, exercitou confere/inconclusivo/precisa-humano + global inconclusivo) e API de produtos
(exercitou `diverge` com ESPERADO-vs-REAL explícito). A fusão dos 2 casos cobriu os 4 vereditos e confirmou
o schema estável (M4). **Anti-viés saturado em 2 rodadas de revisão cega** achou e FECHOU furos reais que o
autor não viu: (1ª) evidência oca não-textual passando (`"   "`/`{}`/`0`/`"."`) e cobertura de critério por
SUBSTRING (`CA-1` ⊂ `CA-12`, mesma classe que a etapa 8 corrigira); (2ª) a defesa anti-oco contornável por
SUFIXO de pontuação (`"ok."` escapava de `^ok$`), por OBJETO não-vazio (`{x:1}` → `"[object Object]"`) e por
número não-inteiro (`"-1"`/`"12.5"`). Uma 3ª passada do mesmo verificador ratificou as correções (sem
over-pass nem over-blocking) e achou um furo RESIDUAL de baixa severidade: a rejeição de objeto vivia só no
`oco` da etapa 9 (atrás de `valorNA===null`), deixando um objeto como `nota`/`evidencia_operacional` escapar
nas etapas 7/8. **Fechado na ORIGEM** — os campos de prova textual ganharam `tipo: "string"` no schema
estrutural (o objeto morre na validação, antes da regra), corrigindo a classe inteira nas 3 etapas. Cada
furo virou teste mecânico (RED→GREEN) antes da correção. Suíte v1 **213/213**.

## Consequências
**A tese de amortização sustenta-se no gênero mais distante:** ZERO mecanismo de motor novo; as 5 regras
reusam moldes/fábricas das etapas 2/6/8 — as únicas primitivas novas são `escaparRegex` (ancorar id por
palavra inteira) e o tipo `"string"` no validador estrutural (fecha o furo objeto-como-prova). O enum de motivos e o catálogo de vereditos são DADO. **Limites epistêmicos declarados
(dívida A018):** o porteiro re-avalia a asserção sobre a evidência capturada (determinístico, barato, sem
re-chamar a API), mas NÃO re-chama a API nem prova que a evidência é AUTÊNTICA — o agente poderia FABRICAR o
par request/response e o porteiro não o distinguiria (mitigado por fail-closed + etapa 10, não estruturalmente).
Captura independente do agente (proxy/runtime com "Tool Receipt" não-forjável) seria o ideal, mas o motor não
a tem hoje; a autenticidade última vai ao humano da etapa 10. A defesa
anti-oco é mecânica (forma), não semântica: barra a fuga por token/pontuação/objeto/número, mas um
assentimento com estrutura de frase ("sim, confere") está fora do alcance do porteiro — é o Gate A/humano
que pega o vazio semântico. **Encadeamento real das 9 etapas testado.** Próximo: etapas 10–13 (Aprovação
humana, Done, Smoke, Retrospectiva), de gênero não-CORE (humano/sistema/devops).
