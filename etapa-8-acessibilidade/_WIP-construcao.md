# _WIP — Construção da Etapa 8 (Acessibilidade)

> Rotina 0→4. **Status: ✅ RETIRED — etapa cristalizada (ADR 0029) em 2026-06-29.** CORE-A11Y v1.0, suíte
> 186/186, encadeamento de 8 etapas verde. SEM caso real no MVP — construí 2 casos cegos (ambos OPERADOS ao vivo
> via Playwright+axe). Decisões: "Gate A do runtime" (espelho da etapa 7); condicionalidade por N/A (não pular);
> evidencia_operacional como defesa anti-teatro. Anti-viés fechou: C1 (violação órfã por token), D1 (coberto com
> evidência oca), + 2 lacunas de doc; dívida A017 (feature sem UI). A fábrica de motivo-substantivo foi
> generalizada (M4, beneficia a etapa 7). Mantido como registro histórico. Pesquisa em research/01; casos em
> research/02-03.

A etapa 8 verifica a tela **EM MOVIMENTO** (foco, teclado, leitura de tela, contraste com dado real) — o que o
Gate A (etapa 7) leu estaticamente, esta vê operando. WCAG operacional, não análise estática. Posição: entre
Gate A e Gate B. Executor: `web-accessibility-checker`.

## A personalidade da etapa 8 (o que MUDA vs. 1-7) — e as TENSÕES de design
- **É CONDICIONAL** (1ª do pipeline): só se aplica a arquétipos de INTERAÇÃO (MUTACAO/DRAWER/BOARD). Para
  LISTA/DETALHE puros, deveria ser "pulada". MAS o motor é LINEAR (não pula). **Tensão D-1.**
- **O ARQUÉTIPO volta:** na etapa 7 decidimos NÃO ter arquétipo como entrada (catálogo plano). Aqui a
  condicionalidade parece exigir saber o arquétipo. **Tensão D-2** (resolver com simetria à etapa 7?).
- **Verifica MOVIMENTO, não código:** "tela funcionando, não lendo o código". Mas no nosso contexto a etapa 6
  produz um PLANO de diff (não código aplicado/rodando). O que a etapa 8 verifica então? **Tensão D-3**
  (mesma família da etapa 6/9: declaração com prova vs. execução real).
- **WCAG é catálogo canônico:** WCAG 2.2 A/AA tem critérios operacionais fixos (2.1.1 Keyboard, 2.4.3 Focus
  Order, 2.4.7 Focus Visible, 4.1.2 Name/Role/Value, 1.4.3 Contrast, 3.3.x formulários). Candidato a
  CATALOGO_WCAG (como CATALOGO_LENTES da etapa 7).

## TENSÕES A DECIDIR (Fase 1, com pesquisa + orientação do operador)
- **D-1 (condicionalidade):** etapa pulada p/ não-interativo, OU roda sempre e declara N/A com motivo (simetria
  com as lentes da etapa 7 — o agente declara "read-only, sem interação → critérios X/Y/Z não se aplicam")?
  **Inclinação:** rodar sempre + N/A com motivo (não reintroduz "pular etapa" no motor linear; consistente c/ 7).
- **D-2 (arquétipo):** se D-1 = "roda sempre + N/A", o arquétipo NÃO precisa ser entrada (o agente declara o que
  se aplica, como na etapa 7). Mata a tensão por simetria.
- **D-3 (movimento vs. plano):** a etapa 8 declara as checagens WCAG com EVIDÊNCIA (como a etapa 6 com gates:
  "rodei o teste de teclado, resultado X, evidência Y") — o porteiro valida forma+evidência-anexada, NÃO a
  verdade (Gate B / humano re-verificam ao vivo). Mesma família da etapa 6.

## FASE 0 — Vereditos das mudanças candidatas
### Herdado (mecanismo do motor — custo ZERO, só declarar)
- **M-A** `executor` como dado (web-accessibility-checker; confianca_enum = grau de certeza da checagem).
- **M-B** `schema` + `schemaEstrutural` (forma recursiva).
- **M-C** `precondicoes` (as 7 etapas anteriores — precisa do Gate A aprovado) + promoção.
- **M-D** `avaliarEtapa` (schema + estrutura + regrasExtras).
- **M-E** `regraCatalogoLentesDeclaradas`/`regraGatesDeclarados` (cobertura de catálogo) — molde p/ CATALOGO_WCAG.
- **M-F** `regraNaoAplicavelComMotivo` (etapa 7) — molde p/ "critério N/A exige motivo".
- **M-G** `regraEvidenciaObrigatoria` (etapa 2/6) — molde p/ "critério verificado exige evidência".
- **M-H** `catalogoBriefing` + placeholder `{catalogo_lentes}` (etapa 7) — injeta o CATALOGO_WCAG no briefing.

### Novo (regra de domínio da etapa 8)
- **I-A** Cobertura: TODOS os critérios WCAG operacionais do catálogo declarados (coberto/violado/nao_aplicavel).
- **I-B** "verificado/coberto" exige evidência da verificação operacional (não só "ok").
- **I-C** Veredito coerente: aprovado ⟹ sem item de severidade bloqueante; reprovado ⟹ ≥1 item a corrigir.
- **I-D** Item a corrigir tem severidade + critério WCAG + ação (acionável).

## FASE 1 — Padrão-ouro (pesquisa primeiro, depois 2 casos cegos)
- [x] Pesquisa de mercado (WCAG operacional + condicional) ✅ — resolveu as 3 tensões com evidência forte
- [x] D-1/D-2/D-3 DECIDIDOS (abaixo) — respaldo duplo (VPAT + CI/CD compliance)
- [x] 1º caso cego (aba CLIs MUTACAO+LISTA) ✅ — operou a tela (Playwright+axe REAL), 6 violações, em research/03
- [x] 2º caso cego (DETALHE read-only) ✅ — VALIDOU a condicionalidade: 9/17 N/A com motivo real, em research/02
- [x] Destilar racional dos 2 casos ✅ (abaixo)

### FUSÃO DOS 2 CASOS (M4 cumprido — 2 arquétipos, schema estável, condicionalidade provada)
| Dimensão | Caso 1 (aba CLIs MUTACAO+LISTA) | Caso 2 (DETALHE read-only) | Veredito |
|----------|----------------------------------|----------------------------|----------|
| Cobertura do catálogo | TODOS declarados (16) | TODOS declarados (17) | regra de cobertura total ✅ |
| N/A com motivo | 5 (modal+drag) | 9 (form+modal+drag) | condicionalidade por N/A ✅ |
| `evidencia_operacional` | âncoras concretas ("Tab2→button#renderBtn") | idem ("axe #4caf50/#fff=2.77") | o campo DECISIVO funciona ✅ |
| Veredito | reprovado (6 issues) | reprovado (3 issues) | binário; ambos acharam defeito real |
| Violação → issue | cada violado tem issue | idem | circuito ✅ |
| `fica_para_humano` | 6 itens (NVDA, foco vs anúncio) | 5 itens (roteamento define A11Y-03) | fronteira 8↔10 ✅ |

**Confirmações:** (a) o schema espelho-da-etapa-7 + `evidencia_operacional` serve a 2 arquétipos opostos
(interação plena vs read-only); (b) a condicionalidade resolve-se por N/A com motivo (D-1 validado na prática);
(c) `fica_para_humano` emergiu naturalmente (declarar o que vai p/ etapa 10).
**Nuance:** os critérios de MODAL aparecem como 4 itens distintos (foco-entra / trap / Escape / foco-retorna) —
não 1. O catálogo reflete isso. E 1.4.3 só pega com DADO REAL (axe sobre cor computada, não token).

### SCHEMA FINAL (confirmado pelos 2 casos — espelho da etapa 7 + evidencia_operacional)
```
executor: { nome: "web-accessibility-checker", capacidade: "opera a tela (Playwright+axe) e verifica WCAG
  operacional — foco/teclado/leitura/contraste em movimento; não lê código", confianca_enum:
  ["verificado operando a tela", "julgamento semântico (falível)"] }
precondicoes: [..., implementacao_output, gate_a_output]  # 7 anteriores (Gate A aprovado)
schema (presença): [veredito]
schemaEstrutural:
  veredito: { obrigatorio, enum: ["aprovado","reprovado"] }   # binário; reprovado é resultado válido
  resumo: obrigatorio
  criterios: lista-de-objetos minItens(=|CATALOGO_WCAG|) { criterio*, situacao* (enum coberto|violado|
             nao_aplicavel), evidencia_operacional* }   # nota=âncora(coberto)/observado(violado)/motivo(N/A)
  issues: lista-de-objetos { id*, severidade* (enum alta|media|baixa), criterio*, localizacao*, descricao*, acao* }
  fica_para_humano: presente (lista-de-strings)   # a fronteira p/ etapa 10 (screen reader real)
regrasExtras (todas reúso — zero dialeto novo):
  1. regraCatalogoWcagDeclarado — TODOS os critérios do CATALOGO_WCAG declarados (1-para-1, molde etapa 7).
  2. regraNaoAplicavelComMotivo("criterios","criterio","situacao","evidencia_operacional") — N/A exige motivo
     (REÚSO da etapa 7, generalizada p/ campo configurável — ver nota abaixo).
  3. regraIssueAcionavel — toda issue tem localizacao+acao (REÚSO etapa 7).
  4. regraVeredictoA11y — aprovado⟹0 issue 'alta'; reprovado⟹≥1 issue. (molde regraVeredictoJustificado etapa 7).
  5. regraViolacaoViraIssue — todo critério 'violado' referenciado por ≥1 issue (molde regraDescobertaViraIssue).
```
**NOTA de reúso:** `regraNaoAplicavelComMotivo` (etapa 7) hoje é hardcoded p/ `lentes`/`situacao`/`nota`. Para
reusá-la na etapa 8 (`criterios`/`situacao`/`evidencia_operacional`), GENERALIZAR em fábrica
`regraNaoAplicavelComMotivo(listaCampo, situCampo, valorNA, motivoCampo)` — e a etapa 7 passa a chamar a
fábrica. É a mesma "extração ao 2º caso" do M4 (como `regraEvidenciaObrigatoria` virou fábrica na etapa 3).
**CATALOGO_WCAG:** ≈16 critérios com {nome, re}. Regex DISJUNTOS (anti-colisão da etapa 7) + invariante
"casa o próprio nome" e "não casa o de outro". Injetado no briefing via `catalogoBriefing` (reúso etapa 7).
**Custo de motor: ZERO** (catalogoBriefing/placeholder já existem; regras são moldes; a generalização da fábrica
beneficia a etapa 7 também).

## FASE 2 — Escrever CORE + declarar etapa ✅ CONCLUÍDA
- [x] `regraNaoAplicavelComMotivo` GENERALIZADA em fábrica (etapa 7 passa a chamá-la; etapa 8 reusa) — o
      padrão M4 "extrair ao 2º caso" (como regraEvidenciaObrigatoria na etapa 3). Beneficia ambas.
- [x] CATALOGO_WCAG (16 critérios, DADO) + 3 regras novas (regraCatalogoWcagDeclarado, regraVeredictoA11y,
      regraViolacaoViraIssue — todas moldes da etapa 7) + reúso de regraIssueAcionavel. Colisão de regex
      (2.1.1/2.1.2) pega ANTES do anti-viés (lição da etapa 7) e corrigida.
- [x] Etapa `acessibilidade` declarada (executor web-accessibility-checker; 7 pré-condições; schemaEstrutural
      com `evidencia_operacional` obrigatória; catalogoBriefing).
- [x] CORE-A11Y.md (4 famílias W/I/V/H + limite epistêmico por seção + catálogo injetado + fronteira etapa 10) + sync.
- [x] Testes: acessibilidade.test.mjs (20 — inclui "reprovado bem-feito PASSA", os 2 invariantes, N/A oco,
      coberto-sem-evidência); e2e estendido; encadeamento das 8 etapas. Referências migradas → gate_b. **184/184.**

## FASE 3 — Testar (3 checagens + anti-viés saturado) — EM ANDAMENTO
- [x] 3 checagens da auditoria-base (paridade completa; encanamento testado; só regrasExtras declarativo)
- [~] Anti-viés: auditor-v2 ✅ chegou (paridade funcional, 1 divergência real); code-reviewer + backend-arch pendentes
- [ ] Corrigir achados convergentes

### ✅ FASE 3 — CONCLUÍDA (anti-viés saturado: 3 verificadores). Veredito: backend-arch SÓLIDO, code-reviewer
ratificado (após C1), auditor-v2 paridade funcional. TODOS os achados corrigidos:
- **C1 (BUG REAL, code-reviewer provou):** `regraViolacaoViraIssue` ancorava no 1º TOKEN → "foco" casa 2
  critérios de modal sem código; issue de "foco retorna" satisfazia a violação órfã de "foco entra". A etapa 7
  já ancorava por nome inteiro; a 8 regrediu. **FIX:** âncora por nome inteiro + teste do cenário.
- **D1/W1 (auditor-v2 + code-reviewer):** `coberto` com evidência oca ("ok"/"n/a") passava — só N/A era
  protegido. A "defesa anti-teatro" (W2) era cosmética para coberto. **FIX:** `regraNaoAplicavelComMotivo` com
  `valorNA=null` = TODA situação exige evidência substantiva; `NOTA_OCA` ampliado ("ok"/"sim"/"feito"/...).
- **tem_interface (backend-arch):** feature sem UI → 16 N/A indistinguíveis de fuga (falso-verde um nível acima
  do que D-1 combateu). **→ A017** (dívida, M4 — sem caso real de feature sem UI; correção é decisão de fundação).
- **D2 (doc):** W4 sem limite no CORE §2 → limite ampliado (porteiro não verifica dado real nem distingue
  feature-sem-tela de fuga). **D3 (doc):** PIPELINE.md "testada" → qualificado (declarada-com-evidência).
- **S2 (code-reviewer):** fábrica de veredito (a7/a8 compartilham "aprovado+alta") → **NÃO** (backend-arch
  confirmou: lógicas divergentes, fábrica precoce esconde diferenças, M4 — clone deliberado, não preguiça).
+3 testes (C1 + D1 coberto-oco + o ampliado). **186/186.**

## FASE 4 — Cristalizar (ADR 0029 + governança) — EM ANDAMENTO

## FASE 4 — Cristalizar (ADR 0029 + governança) (pendente)

### DECISÕES DA FASE 1 (pesquisa + simetria com a etapa 7)
**D-1 (condicionalidade) → RODAR SEMPRE + N/A com motivo (NÃO pular).** Respaldo DUPLO e independente:
- VPAT/Section508: a11y NUNCA pula critérios — declara `not applicable` com justificativa obrigatória.
- CI/CD compliance: "stage pulado aparece como SUCESSO" = falso-verde indistinguível de esquecimento.
- Simetria com a etapa 7 (catálogo plano, ADR 0028) — o setor de a11y chegou à MESMA forma independentemente.
- O registro `.dag/<feature>/acessibilidade.output.json` prova que a11y foi considerada (e por que foi leve p/
  feature read-only), em vez de um silêncio. **Não reintroduz "pular etapa" no motor linear.**
**D-2 (arquétipo) → NÃO é entrada.** Consequência de D-1: o agente declara quais critérios se aplicam (read-only
→ marca os de interação como nao_aplicavel com motivo). Mata a tensão por simetria com a etapa 7.
**D-3 (movimento vs. plano) → declarar com `evidencia_operacional`.** Cada critério COBERTO cita a âncora que
SÓ existe se a tela foi operada (seletor focado, tecla pressionada, activeElement, output do axe/Playwright). É
o campo NOVO decisivo que distingue "gate operacional" de "gate de leitura". O porteiro valida forma+evidência-
presente, NÃO a verdade (Gate B/etapa 10 humano re-verificam). Mesma família da etapa 6.

### A ETAPA 8 É O "GATE A DO RUNTIME" (molde quase literal da etapa 7)
Mesmo esqueleto epistêmico do Gate A (ADR 0028): catálogo FIXO injetado inteiro, declaração por item, veredito
binário, porteiro valida forma não substância. TROCAS: fonte do catálogo (USWDS/OWASP → WCAG 2.2 A/AA + APG por
arquétipo); eixo (ler diff → operar tela); + campo `evidencia_operacional`. CORE-GATEA = molde do CORE-A11Y.

### PROVA DE QUE A ETAPA NÃO É REDUNDANTE (Deque, 13k páginas)
Focus Order **0%** automatizável, Focus Visible **0%**, Keyboard **2,5%** — exatamente o núcleo da etapa 8. O
Gate A (lê código) é CEGO para isso (propriedades emergentes do runtime). A média agregada (~30% por critério,
~57% por volume) ESCONDE o ponto; o detalhe por critério o prova. (Métrica certa: POR critério.)

### CATÁLOGO_WCAG OPERACIONAL (destilado da norma — validar com 2 casos antes de cristalizar, M4)
Ancorado em WCAG 2.2 A/AA + APG. ≈12-15 critérios operacionais:
- **Foco/teclado (transversais a interação):** 2.1.1 Keyboard · 2.1.2 No Keyboard Trap · 2.4.3 Focus Order ·
  2.4.7 Focus Visible · 2.4.11 Focus Not Obscured (2.2).
- **FORMULÁRIO (MUTACAO):** 3.3.1 Error Identification · 3.3.2 Labels/Instructions · 3.3.3 Error Suggestion ·
  4.1.3 Status Messages (erro/sucesso anunciado).
- **MODAL/DRAWER:** foco entra ao abrir (APG) · focus trap · Escape fecha · foco retorna ao gatilho ao fechar ·
  4.1.2 Name/Role/Value (role=dialog, aria-modal, aria-labelledby).
- **BOARD/drag-drop:** 2.5.7 Dragging Movements (alternativa a arrastar) · status do move anunciado.
- **Transversais:** 1.4.3 Contrast (com DADO REAL, não o token CSS) · 4.1.2 Name/Role/Value.
**Limite:** o agente verifica o operacional determinístico (foco entrou, Escape fechou) + julga forma semântica
(alt parece significativo); o screen reader REAL + experiência vivida → etapa 10 (humano). Declarar essa fronteira.

## FASE 2 — Escrever CORE + declarar etapa (pendente)
## FASE 3 — Testar (3 checagens + encadeamento das 8 + anti-viés saturado) (pendente)
## FASE 4 — Cristalizar (ADR 0029 + governança) (pendente)
