# 0028 — Etapa 7 (Gate A): revisão adversarial com catálogo de lentes PLANO

- Status: accepted
- Data: 2026-06-29
- Relacionado: CORE-GATEA (etapa 7); fecha o anti-viés "réu nunca é juiz" na mecânica do pipeline (o réu da
  etapa 6 encontra seu juiz); reusa `regrasExtras` (ADR 0024), o padrão `CATALOGO_*`+regra (ADR 0025), a
  fábrica de evidência (ADR 0023); complementa ADR 0004 (lentes por arquétipo — agora catálogo plano).

## Contexto e Problema
A etapa 7 é a 1ª etapa REFUTADORA: revisão ADVERSARIAL do diff da etapa 6 — tenta achar defeito, não validar.
Há evidência empírica (2026) de que pedir ao revisor para *validar* DERRUBA a detecção de defeitos em até 93
pontos; pedir para *refutar* a maximiza. O critério oficial pedia "lentes por arquétipo" (LISTA/MUTACAO/
DRAWER...) — mas o arquétipo da feature **não existe formalmente no estado** (nem no `init`, nem no design
cristalizado). E deixar o revisor escolher o próprio arquétipo o deixaria escolher o escopo do próprio exame
(fura o anti-viés). Como gatear uma revisão adversarial de forma determinística, sem o gargalo do arquétipo?

## Decisão
**Catálogo de lentes PLANO, injetado inteiro; o revisor declara cada lente; o porteiro valida a FORMA da
revisão, nunca o veredito.** Concretamente:
1. **Catálogo plano (sem arquétipo).** O `CATALOGO_LENTES` (21 lentes de todos os arquétipos — LISTA/MUTACAO/
   DRAWER/BOARD/DETALHE/UPLOAD + transversais; fontes canônicas USWDS + OWASP ASVS) é injetado INTEIRO no
   briefing. O revisor declara, por lente, a `situacao` ∈ {coberta, descoberta, nao_aplicavel} com `nota`
   (onde/exigência/motivo). **Elimina o conceito de arquétipo como entrada** — vira resultado implícito de
   quais lentes ficaram aplicáveis. Serve features multi-arquétipo (a aba CLIs já era LISTA+MUTACAO).
2. **N/A é decisão consciente, não fuga.** `nao_aplicavel` exige um motivo SUBSTANTIVO (`regraNaoAplicavel
   ComMotivo` rejeita nota oca: "n/a", "-", "não"). É a defesa central: sem ela, marcar tudo N/A + APROVA
   passaria — teatro de revisão. Cada lente difícil (concorrência, autorização, path traversal) está
   fisicamente no briefing e precisa de um N/A individual auditável (a superfície de fuga vira 21 mentiras
   pontuais em vez de 1 escolha taxonômica).
3. **Veredito binário; REPROVA é sucesso.** `veredito` ∈ {APROVA, REPROVA}, sem "depende". O porteiro NUNCA
   exige APROVA — REPROVA bem-feita PASSA (faz o fluxo voltar à etapa 6). Coerência mecânica (`regraVeredicto
   Justificado`): REPROVA⟹≥1 exigência; APROVA⟹0 exigência ∧ P0 coberto ∧ 0 issue 'alta'. `exigencias_antes_
   de_mergear` é o pivô formal (como `evidencia` p/ gate verde na etapa 6).
4. **Issues acionáveis + circuito.** Toda issue tem localização + ação (`regraIssueAcionavel`). Toda lente
   descoberta é referenciada por ≥1 issue (`regraDescobertaViraIssue` — circuito descoberta→issue→ação;
   molde da etapa 4). Cobertura total: TODAS as lentes do catálogo declaradas (`regraCatalogoLentesDeclaradas`,
   matching conceitual 1-para-1 contra colisão).
5. **Executor `code-reviewer`** (refutador, agente DIFERENTE do que implementou); confiança = "achado
   confirmado no diff" / "risco potencial".

## Motivo
Decisão do catálogo plano: do operador, superando a recomendação (arquétipo+cruzamento) — mata o gargalo D-2
sem tocar etapas fechadas e preserva o anti-viés sem cruzar fonte. Validado pela rotina 0→4 contra 2 casos de
arquétipos diferentes (aba CLIs LISTA+MUTACAO; drawer de pedido DRAWER — ambos REPROVARAM, saudável) — o schema
generalizou. Anti-viés saturado (3 verificadores) achou e FECHOU um furo grave que eu mesmo introduzi: a regra
de motivo-do-N/A foi planejada e PERDIDA ao "simplificar" (eu achei que `nota` obrigatória bastava, mas "n/a"
é não-vazia) — um output tudo-N/A+APROVA passava. Reposta. Mais: APROVA com issue 'alta', colisão de regex,
substring largo no circuito, p0_coberto incoerente. O enquadramento adversarial é empírico, não estilo.

## Consequências
**A tese de amortização se confirma:** mecanismo genuinamente novo ~0 (as 5 regras são moldes reusados; o
placeholder `{catalogo_lentes}` no motor é 3 linhas genéricas — qualquer etapa futura com catálogo o reusa).
**Limite epistêmico declarado por seção:** o porteiro valida que a revisão tem FORMA de busca genuína (cobertura
total, veredito coerente, issues acionáveis), NÃO que as issues são VERDADEIRAS, que o catálogo é EXAUSTIVO, nem
que o veredito é JUSTO (sandbagging semântico — rebaixar issue real para baixa — fica fora; só a incoerência
mecânica APROVA+alta-declarada é pega). "O porteiro não é juiz do juiz, só do seu rito." A decisão do catálogo
plano sobre a taxonomia por arquétipo: a força dela depende inteiramente do porteiro cobrar o motivo do N/A —
sem isso, vira 21 caixas marcadas no automático. Por isso a regra de motivo-substantivo é o coração, não um
detalhe. **Atualiza ADR 0004** (lentes por arquétipo): o catálogo agora é plano e injetado inteiro, não
filtrado por arquétipo — mais rigoroso (cobre o critério oficial com folga).
