# _WIP — Construção da Etapa 9 (Gate B — Verificação ao vivo)

> Rotina 0→4. Status: **em execução (autônoma)**. SEM output real no MVP (só o CORE `gate_b.md`). Logo: construir
> 2 casos cegos. Pesquisa é PRÉ-REQUISITO (o veredito quaternário é decisão não-óbvia). Pesquisa: verificação
> E2E contra produção + veredito de incerteza honesta (rodando).

A etapa 9 confronta o COMPORTAMENTO REAL da feature (chamando a API/app ao vivo, dado real) contra os critérios
de aceitação do design (etapa 4). O `fiscal` chama endpoints reais via curl e observa as respostas — NÃO lê
código. É o JUIZ DA AUTENTICIDADE: re-verifica o que a etapa 6 declarou e a etapa 8 afirmou ter operado (fecha
o ciclo "declaração → verdade" que os limites epistêmicos das etapas 6/8 empurraram para cá).

## A personalidade da etapa 9 (o que MUDA vs. 1-8) — e as TENSÕES
- **GÊNERO DIFERENTE do Gate A/8** (backend-arch já sinalizou): verifica EXECUÇÃO REAL, não declaração-com-prova.
  NÃO herda o molde "catálogo + declaração por item + veredito binário". É verificação de VERDADE.
- **Veredito QUATERNÁRIO, não binário:** `verificado | diverge | inconclusivo | precisa-humano`. **Tensão D-1:**
  `inconclusivo` é veredito HONESTO (não consegui verificar ao vivo) — mas como o porteiro impede que vire FUGA
  (marco tudo inconclusivo e passo)? NUnit TEM status "Inconclusive" — pesquisar a sabedoria sobre isso.
- **PARENTE da etapa 2 (Descoberta):** mesmo executor (`fiscal`), mesma verificação ao vivo. A etapa 2 já tem
  `regraEvidenciaObrigatoria` ("confirmado ao vivo" exige evidência). REÚSO provável.
- **Ambiente ao vivo pode não existir:** no nosso contexto o agente pode não ter o app rodando. **Tensão D-2:**
  como tratar isso honestamente sem buraco? (O CORE do MVP: `inconclusivo` com próximo passo.)
- **Mapeia critérios do design (etapa 4):** cada critério de aceitação do Three Amigos é confrontado com o real.
  **Tensão D-3:** o porteiro pode exigir que TODOS os critérios do design sejam endereçados (cobertura)?

## FASE 0 — Vereditos das mudanças candidatas
### Herdado (mecanismo do motor — custo ZERO, só declarar)
- **M-A** `executor` como dado (fiscal; confianca_enum = grau de certeza da verificação).
- **M-B** `schema` + `schemaEstrutural`.
- **M-C** `precondicoes` (as 8 etapas anteriores — precisa do design + da acessibilidade) + promoção.
- **M-D** `avaliarEtapa` (schema + estrutura + regrasExtras, com `estado` da etapa 6).
- **M-E** `regraEvidenciaObrigatoria` (etapa 2/6) — molde p/ "critério verificado exige evidência (request/response)".
- **M-F** `regraVeredictoJustificado`/`regraVeredictoA11y` — molde p/ coerência veredito↔evidência (adaptar ao quaternário).
- **M-G** `regraNaoAplicavelComMotivo` (fábrica generalizada) — molde p/ "inconclusivo exige motivo + próximo passo".
- **M-H** `regraDescobertaViraIssue`/`regraViolacaoViraIssue` — molde p/ "diverge exige a divergência apontada".

### Novo (regra de domínio da etapa 9)
- **I-A** Cada critério verificado exige EVIDÊNCIA REAL (request chamado + response observado) — não "ok".
- **I-B** `inconclusivo` exige motivo + próximo passo (anti-fuga — molde da fábrica de motivo-substantivo).
- **I-C** Coerência veredito quaternário: `verificado`⟹critérios verificáveis passaram; `diverge`⟹≥1 divergência
  apontada; `inconclusivo`/`precisa-humano`⟹o que faltou + próximo passo. (4 estados, não 2.)
- **I-D** (decisão D-3) cobertura: todo critério do design (etapa 4) é endereçado (verificado/diverge/bloqueado)?

## FASE 1 — Padrão-ouro (pesquisa primeiro, depois 2 casos cegos)
- [x] Pesquisa de mercado (verificação ao vivo + veredito de incerteza) ✅ — princípio unificador + precedentes
- [x] D-1/D-2/D-3 DECIDIDOS (abaixo) — respaldo forte (NUnit/JUnit/TAP/Pact + fail-closed)
- [x] 1º caso cego (aba CLIs) ✅ — o fiscal achou o ambiente acessível e fez chamadas REAIS; exercitou os 4
      vereditos num output (confere/inconclusivo/precisa-humano + global inconclusivo). research/03.
- [x] 2º caso cego (DIVERGÊNCIA — API produtos) ✅ — exercitou `diverge` (ESPERADO vs REAL explícito). research/02.
- [x] Destilar racional dos 2 casos ✅ (abaixo)

### FUSÃO DOS 2 CASOS (M4 cumprido — os 4 vereditos cobertos, schema estável)
| Veredito por-critério | Caso 1 (aba CLIs) | Caso 2 (API produtos) |
|-----------------------|-------------------|------------------------|
| `confere` (request+response+asserção) | CA-01/04/05/06 | CA-01/02/03 |
| `diverge` (ESPERADO vs REAL) | — | CA-04 (limit ignorado), CA-05 (200+null vs 404) |
| `inconclusivo` (motivo+prova-da-tentativa) | CA-12 (pre-condicao-de-dado-ausente) | — |
| `precisa-humano` (verificou mas exige julgamento) | CA-07 (no-op exige observar runtime) | — |
| veredito GLOBAL (fail-closed) | inconclusivo (CA-12 não fechou) | diverge (≥1 diverge) |

**Confirmações:** (a) o schema (criterios[] com situacao/evidencia/motivo) serve aos 4 vereditos; (b) o veredito
GLOBAL deriva das situações por-critério (fail-closed); (c) `evidencia` real (request+response+asserção) é o
núcleo — o caso 1 mostrou chamadas REAIS, o caso 2 o ESPERADO-vs-REAL; (d) `fica_para_humano` capturou o que é
genuinamente humano (severidade/blast-radius; a janela de ambiente; aridade não-falsificável).

**NUANCES que os casos revelaram (incorporar):**
- **`precisa-humano` por-critério ≠ `inconclusivo`:** inconclusivo = "não consegui verificar"; precisa-humano =
  "verifiquei a parte possível, mas o critério exige julgamento/observação que o endpoint não dá" (CA-07: provar
  a AUSÊNCIA de execução exige ver o runtime). Os 2 são situações distintas no enum.
- **Fronteira CAMADA DADO-VIVO vs UI/runtime:** o Gate B verifica o COMPORTAMENTO via API (dado-vivo). O que é
  render de UI (camada 2/browser) ou estado interno do runtime fica para a etapa 10 (humano) — declarar via
  fica_para_humano. (O CORE deve declarar este limite — o Gate B confronta a API, não a tela.)
- **`confere` com RESSALVA DE ESCOPO:** o caso real é honesto que "confere" cobre só o que foi exercitado
  (CA-05 com aridade 1 não falsifica a ORDEM). A ressalva vai na própria evidência/asserção. Bom sinal de
  honestidade — não força o porteiro a validar isso (semântico).

### SCHEMA FINAL CONFIRMADO (espelho parcial da etapa 2 + veredito quaternário)
```
executor: { nome: "fiscal", capacidade: "chama a API ao vivo (read-only) e confronta o real com os critérios;
  não lê código, não muta produção", confianca_enum: ["verificado ao vivo", "inconclusivo (não deu p/ checar)"] }
precondicoes: [..., design_output, acessibilidade_output]  # 8 anteriores
schema (presença): [veredito]
schemaEstrutural:
  veredito: { obrigatorio, enum: ["verificado","diverge","inconclusivo","precisa-humano"] }  # GLOBAL, quaternário
  resumo: obrigatorio
  criterios: lista-de-objetos minItens 1 {
    criterio* (id+descrição),
    situacao* (enum confere|diverge|inconclusivo|precisa-humano),  # por-critério
    evidencia* (request+response+asserção; ou ESPERADO-vs-REAL; ou prova-da-tentativa),
    motivo (enum: ambiente-indisponivel|endpoint-fora-do-proxy|timeout|sem-credencial-readonly|pre-condicao-de-dado-ausente — exigido SÓ se inconclusivo)
  }
  fica_para_humano: presente (lista-de-strings)  # a fronteira p/ etapa 10
regrasExtras (reúso/molde):
  1. regraCriterioComEvidencia — todo critério tem evidencia SUBSTANTIVA (molde regraNaoAplicavelComMotivo
     valorNA=null da etapa 8 — evidência oca "ok" reprova em QUALQUER situação).
  2. regraInconclusivoComMotivo — situacao "inconclusivo" exige `motivo` do enum (molde regraNaoAplicavelComMotivo
     valorNA="inconclusivo" + checagem do enum — ou schema com enum condicional? decidir).
  3. regraVeredictoGlobalCoerente — o veredito GLOBAL deriva das situações: todos confere→verificado; ≥1 diverge→
     diverge; senão ≥1 precisa-humano→precisa-humano; senão ≥1 inconclusivo→inconclusivo. (FAIL-CLOSED: só
     "verificado" se TODOS confere.) Molde regraVeredictoA11y adaptado.
  4. regraCriteriosDoDesignCobertos — todo criterios_aceitacao[].id do design_output (no estado) é endereçado
     em criterios[].criterio. CRUZA o estado (molde regraAncoraRastreavel da etapa 6). [se o design_output tiver ids]
```
**FAIL-CLOSED — como o motor trata:** diferente das etapas 7/8 (onde reprovado AVANÇAVA), aqui só `verificado`
deve AVANÇAR. Mas o output `diverge`/`inconclusivo` é VÁLIDO (bem-feito) — o porteiro deve ACEITÁ-LO como
verificação correta, mas o FLUXO não avança (volta à etapa 6 / escala). DECISÃO: o porteiro do Gate B exige
`veredito == "verificado"` para passar (como o gate_a do MVP exigia "APROVA" — e aqui é CORRETO, é fail-closed).
A coerência global↔por-critério garante que "verificado" só é emitido se TODOS conferem. → `regraVeredictoGlobal
Coerente` (deriva e exige coerência) + a regra de avanço é o próprio enum/coerência: se o veredito é verificado
mas há um critério não-confere, REPROVA por incoerência. Confirmar: o porteiro REPROVA diverge/inconclusivo?
SIM — fail-closed: o Gate B só "passa" (avança) com verificado. diverge/inconclusivo = porteiro bloqueia (correto).

## FASE 2 — Escrever CORE + declarar etapa — EM ANDAMENTO

### DECISÕES DA FASE 1 (pesquisa + parentesco com a etapa 2)
**D-1 (anti-fuga do `inconclusivo`) → FAIL-CLOSED + ônus de prova + orçamento agregado.** O achado mais forte:
- **FAIL-CLOSED (default-deny):** `inconclusivo` NUNCA avança o pipeline sozinho — é bloqueio, não passe. "Se
  não consigo verificar, não permito" (como o gate de auth nega quando o IdP cai; como o `can-i-deploy` do Pact
  trata pending como bloqueador). **Marcar inconclusivo não faz passar — faz parar. A fuga deixa de ser fuga.**
  → No motor: o veredito que AVANÇA é só `verificado`. `diverge`/`inconclusivo`/`precisa-humano` são resultados
  válidos do output (o porteiro os ACEITA como verificação bem-feita) mas NÃO avançam (volta à etapa 6 / escala).
- **Ônus de prova:** `inconclusivo` exige `motivo` ENUMERADO (lista fechada: ambiente-indisponivel / endpoint-
  fora-do-proxy / timeout / sem-credencial-readonly / pre-condicao-de-dado-ausente) + `prova_da_tentativa` (o
  request feito + a falha que voltou — connection refused/503). Inconclusivo sem prova = output malformado.
- **Orçamento agregado:** se a maioria dos critérios é inconclusiva, o veredito GLOBAL deveria ser precisa-humano
  (não verde silencioso). [avaliar como regra ou deixar ao executor — decidir nos casos]

**D-2 (sem ambiente ao vivo) → `inconclusivo` honesto com motivo `ambiente-indisponivel` + prova-da-tentativa,
fail-closed.** NUNCA `verificado`. É o `Assert.Inconclusive` do NUnit / o `pending pact`. A honestidade não abre
buraco porque inconclusivo é fail-closed (bloqueia/escala) — que é o comportamento correto.

**D-3 (cobertura) → todo critério do design (etapa 4) é endereçado** (verificado/diverge/inconclusivo/precisa-
humano). Nenhum critério em silêncio (molde da cobertura de catálogo). A diferença: o "catálogo" aqui são os
`criterios_aceitacao` do design_output (no estado) — então a regra CRUZA com o estado (como a etapa 6 fez com
âncora↔fonte). Reúso de `regraAncoraRastreavel`-style.

### REFINAMENTO (2 eixos ortogonais, não 4 valores planos)
Os 4 vereditos = 2 perguntas: (1) "consegui verificar?" → verificado/inconclusivo; (2) "bate com o critério?"
→ confere/diverge/ambíguo(precisa-humano). Modelar assim FECHA a porta lógica para estados incoerentes (não pode
ser "inconclusivo E diverge"). Por critério: `situacao ∈ {confere, diverge, inconclusivo, precisa-humano}`.
O veredito GLOBAL deriva: todos confere → verificado; ≥1 diverge → diverge; senão ≥1 inconclusivo → inconclusivo;
≥1 precisa-humano → precisa-humano. (O porteiro pode checar essa coerência global↔por-critério.)

### MECANISMO ANTI-ALUCINAÇÃO (a frase-âncora da etapa)
"Nunca deixe o agente auto-reportar conclusão. O porteiro é a ÚNICA autoridade sobre se a chamada teve sucesso."
Cada critério `confere`/`verificado` exige um BLOCO DE EVIDÊNCIA: request real (método + URL do ambiente-alvo,
não localhost) + response real (status + corpo + timestamp do run) + a ASSERÇÃO ("critério X ⇒ esta parte da
response satisfaz X"). O porteiro RE-AVALIA a asserção sobre a evidência capturada (determinístico, barato, sem
re-chamar). É o modelo can-i-deploy (consulta evidência) + Tool Receipts (evidência não-forjável). LIMITE: o
porteiro não re-chama a API nem prova que a evidência é autêntica (captura independente do agente seria o ideal
— mas exige proxy/runtime que o motor não tem hoje) → declarar honestamente (vai ao humano da etapa 10). DÍVIDA.

### SCHEMA FINAL (a confirmar com os 2 casos)
```
executor: { nome: "fiscal", capacidade: "chama a API ao vivo (read-only) e confronta o real com os critérios;
  não lê código, não muta produção", confianca_enum: ["verificado ao vivo", "inconclusivo (não deu p/ checar)"] }
precondicoes: [..., design_output, acessibilidade_output]  # 8 anteriores (precisa dos critérios + a11y)
schema (presença): [veredito]
schemaEstrutural:
  veredito: { obrigatorio, enum: ["verificado","diverge","inconclusivo","precisa-humano"] }  # QUATERNÁRIO
  resumo: obrigatorio
  criterios: lista-de-objetos minItens 1 { criterio*, situacao* (enum confere|diverge|inconclusivo|precisa-humano),
    evidencia* (request+response real ou prova-da-tentativa), [motivo* enum se inconclusivo] }
  cobertura: presente (lista-de-strings — quais critérios do design foram endereçados)  # ou derivar
  fica_para_humano: presente (lista-de-strings)
regrasExtras (reúso/molde):
  1. regraCriterioComEvidencia — cada critério tem evidencia não-vazia (molde regraEvidenciaObrigatoria etapa 2/6).
  2. regraInconclusivoComMotivo — situacao "inconclusivo" exige motivo enumerado + prova-da-tentativa (molde da
     fábrica regraNaoAplicavelComMotivo + enum de motivo).
  3. regraVeredictoGlobalCoerente — o veredito global deriva das situações por-critério (fail-closed: só
     "verificado" se TODOS confere; ≥1 diverge → diverge; etc.). Molde regraVeredictoA11y adaptado ao quaternário.
  4. regraDivergeApontado — situacao "diverge" exige a divergência descrita (real vs esperado). Molde circuito.
  5. regraCriteriosDoDesignCobertos — todo criterios_aceitacao[].id do design_output é endereçado (cruza estado).
```
**FAIL-CLOSED no motor:** o veredito que AVANÇA é só `verificado`. Os outros 3 são output VÁLIDO (porteiro aceita)
mas NÃO avançam. → precisa de um mecanismo "porteiro aceita o output MAS não promove/avança" — ou o porteiro
reprova `diverge`/`inconclusivo` (volta à etapa 6)? Decidir: o Gate B que DIVERGE deve BLOQUEAR o avanço (a
feature não está pronta). Então `regraVeredictoGlobalCoerente` + uma regra final `regraGateBAvanca` que exige
veredito=="verificado" para passar o porteiro (como o gate_a do MVP exigia "APROVA" — mas aqui é correto, porque
o Gate B é fail-closed: só verdade comprovada avança). Confirmar nos casos.

## FASE 2 — Escrever CORE + declarar etapa (pendente)
## FASE 3 — Testar (3 checagens + encadeamento das 9 + anti-viés saturado) (pendente)
## FASE 4 — Cristalizar (ADR 0030 + governança) (pendente)
