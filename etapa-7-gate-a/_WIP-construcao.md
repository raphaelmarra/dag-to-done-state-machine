# _WIP — Construção da Etapa 7 (Gate A — Revisão)

> Rotina 0→4. **Status: ✅ RETIRED — etapa cristalizada (ADR 0028) em 2026-06-29.** CORE-GATEA v1.0, suíte
> 164/164, encadeamento de 7 etapas verde. Decisão: catálogo de lentes PLANO (sem arquétipo). Anti-viés fechou:
> o furo central (regra de motivo-do-N/A perdida ao simplificar → tudo-N/A+APROVA passava), APROVA+issue-alta,
> colisão de regex (+1-para-1), W2 substring, p0_coberto, DIV-1 doc. Mantido como registro histórico. Caso real:
> `MVP/.../gate_a.output.json` (LISTA+MUTACAO, REPROVA). 2º caso: `research/02` (DRAWER, REPROVA). Pesquisa:
> revisão adversarial empírica + lentes (research/01).

A etapa 7 é a **1ª etapa REFUTADORA** do pipeline. Não produz conhecimento (1-3), nem design (4), nem plano
(5), nem código (6) — **tenta achar defeito** no diff da etapa 6. É o JUIZ do "réu" da etapa 6 (fecha o
anti-viés do projeto: réu nunca é juiz → aqui entra um agente DIFERENTE, com lentes, para refutar).

## A personalidade da etapa 7 (o que MUDA vs. 1-6)
- **Output pode ser REPROVA** — e isso é SAUDÁVEL (o caso real reprovou). Diferente de 1-6, onde o output é
  aprovado e o pipeline avança, aqui REPROVA é resultado válido (faz o fluxo voltar à etapa 6). O porteiro da
  máquina valida que a REVISÃO foi bem-feita (lentes cobertas, veredito claro, issues acionáveis), **NÃO** que
  o veredito é "APROVA". (Um Gate A que só aprova é teatro.)
- **Lentes por ARQUÉTIPO** — a bateria de verificação muda conforme o tipo de tela:
  LISTA→[vazio, erro, paginação/volume, ordenação]; MUTACAO→[confirmação de ação perigosa, validação de input,
  reversibilidade, edge de escrita, concorrência]; DRAWER→[foco, escape, loading, dados obsoletos, fechamento
  acidental]; BOARD→[drag-drop, persistência de ordem, conflito]; DETALHE→[404, permissão, campos opcionais];
  DISCO→[encoding, tamanho, tipo, path traversal, limpeza].
- **Cobertura DECLARADA, não implícita:** cada lente do arquétipo aparece OU em `lentes_cobertas` OU em
  `lentes_descobertas`. A UNIÃO das duas tem que BATER o catálogo do arquétipo (nenhuma lente esquecida).

## TENSÃO DE DESIGN CENTRAL (a decidir na Fase 1)
**D-1 — O catálogo arquétipo→lentes:** deve ser um DADO no CORE (como `CATALOGO_ESTADOS_UI` da etapa 4 /
`CATALOGO_GATES` da etapa 6), e o porteiro verifica "união(cobertas,descobertas) ⊇ lentes(arquétipo)"?
**D-2 — De onde vem o ARQUÉTIPO da feature?** Do estado (design_output? um campo)? De um campo do próprio
output do Gate A? Isto decide se a regra é dinâmica. (M1: o arquétipo vem da demanda; o catálogo é mecânica.)

**DESCOBERTA (Fase 0):** o arquétipo NÃO existe formalmente em nenhum lugar hoje — só em comentários/
placeholders (`pipeline.config.mjs:845,854`). O `init` aceita `--entry/--desc/--root`, mas NÃO `--arquetipo`
(`dag.mjs:89`). A etapa 4 (Design) já cristalizada NÃO o produz. → 3 opções para D-2:
  (a) **output do Gate A declara o arquétipo** (auto-contido; risco: revisor escolhe arquétipo fácil p/ fugir
      de lentes difíceis — fura o anti-viés);
  (b) **`--arquetipo` no init** → vira parte do estado desde o começo (limpo; muda a fundação; operador informa);
  (c) **inferir do design_output** (a etapa 4 teria de classificar — mas está cristalizada).
  → Decidir na Fase 1 com a pesquisa + a orientação do operador (afeta o pipeline inteiro).

## FASE 0 — Vereditos das mudanças candidatas
### Herdado (mecanismo do motor — custo ZERO, só declarar)
- **M-A** `executor` como dado (code-reviewer; confianca_enum = grau de certeza do achado) — reusado.
- **M-B** `schema` + `schemaEstrutural` (forma recursiva) — reusados.
- **M-C** `precondicoes` (as 6 etapas anteriores — precisa do diff da etapa 6) + promoção — reusados.
- **M-D** `avaliarEtapa` compõe schema + estrutura + `regrasExtras` (agora com `estado` — etapa 6) — reusado.
- **M-E** `regraCatalogoCoberto` (etapa 4, matching 1-para-1 com regex) — CANDIDATO para a cobertura de lentes.
  OU `regraGatesDeclarados` (etapa 6, cobertura por nome exato) — qual molde serve melhor às lentes?

### Novo (regra de domínio da etapa 7)
- **I-A** Cobertura de lentes: união(cobertas, descobertas) ⊇ lentes(arquétipo). NOVA (depende do arquétipo).
- **I-B** Toda issue tem localização + ação acionável (sem issue vazia). Reusa filosofia de evidência.
- **I-C** Coerência veredito↔issues: REPROVA exige ≥1 exigência/issue bloqueante que justifique; APROVA não
  pode ter issue de severidade que contradiga o veredito.
- **I-D** lentes_descobertas → viram issues/exigências? (caso real: ordenação descoberta → ISSUE-03). Relação?

## FASE 1 — Padrão-ouro (quase completa)
- [x] Racional invariante destilado (backend-architect) ✅ — 6 regras propostas, todas reúso de fábricas
- [x] 2º caso cego DRAWER (code-reviewer) ✅ — schema generalizou; 5 lentes DRAWER cobertas; REPROVA; em research/02
- [ ] Pesquisa de mercado (search-specialist, rodando)
- [~] D-1 DECIDIDO (catálogo como dado, sim); D-2 a alinhar com operador (arquétipo não existe no estado hoje)

### RACIONAL DESTILADO (backend-architect) — validado pelos 2 casos (M4)
**Regra-mestra:** o revisor passa o diff sob TODAS as lentes do arquétipo, declara cada uma coberta/descoberta,
e emite veredito binário sustentado por issues acionáveis. A cobertura exaustiva das lentes é a prova de que a
refutação foi séria. **A etapa 7 é a gêmea reflexa da etapa 4:** a 4 produz em forma julgável e empurra o
juízo adiante (ADR 0025); a 7 é onde o juízo acontece. O porteiro valida a FORMA do juízo, não o juízo.

**6 regras (todas reúso de fábrica — zero dialeto novo):**
1. `regraVeredito` — veredito ∈ {APROVA, REPROVA} (enum). NÃO exige APROVA (REPROVA é sucesso da etapa). [INV-2]
2. `regraLentesArquetipoCobertas` — união(cobertas,descobertas) ⊇ CATALOGO_LENTES[arquétipo]. Matching CONCEITUAL
   (regex, lente é conceito difuso como estados de UI — molde `regraCatalogoCoberto` da etapa 4, NÃO nome exato). [INV-1]
3. `regraArquetipoRastreavel` — output.arquetipo == estado.arquetipo (impede escolher arquétipo conveniente;
   molde `regraAncoraRastreavel` da etapa 6). [D-2]
4. `regraIssueAcionavel` — toda issue tem localizacao + acao não-vazios, severidade enum. [INV-3]
5. `regraVeredictoJustificado` — REPROVA ⟹ exigencias ≥1; APROVA ⟹ exigencias == 0. `exigencias_antes_de_mergear`
   é o PIVÔ formal do veredito (como `evidencia` p/ verde na etapa 6 — regraEvidenciaObrigatoria invertida). [INV-4]
6. `regraDescobertaViraIssue` — toda lentes_descobertas[].lente referenciada por alguma issues[].lente (fecha o
   circuito descoberta→issue→ação; molde `regraCircuitoComportamentoCriterio` da etapa 4). [INV-5]

**CATÁLOGO_LENTES (DADO no CORE, M1):** LISTA→[vazio,erro,paginação,ordenação]; MUTACAO→[confirmação,validação
input,reversibilidade,edge escrita,concorrência]; DRAWER→[foco,escape,loading,dados obsoletos,fechamento
acidental]; BOARD/DETALHE/DISCO idem. Adicionar arquétipo = adicionar chave no dado, 0 código.

**Limite epistêmico (declarar por seção):** o porteiro valida que o diff foi submetido à bateria completa de
lentes com veredito sustentado, NÃO que as issues são VERDADEIRAS, que a bateria é EXAUSTIVA (completude é
relativa ao catálogo, não absoluta), nem que o veredito é JUSTO (não detecta sandbagging: rebaixar issue real
para baixa e aprovar). Mais agudo que nas etapas analíticas: o defeito é hipótese sobre AUSÊNCIA, e ausências
bem-formadas são indistinguíveis de ausências reais sem olhos humanos. Correção das issues → etapa 6; aferição
da qualidade da revisão → humano / 2ª passada. "O porteiro não é juiz do juiz, só do seu rito."

### D-1/D-2 — RESOLVIDO pelo operador: CATÁLOGO PLANO, todas as lentes injetadas (sem arquétipo)
**Decisão do operador (melhor que a do architect):** NÃO decidir arquétipo. Injeta TODAS as lentes (de todos
os arquétipos) como uma LISTA PLANA; o agente declara, POR LENTE, se cabe ou não — exatamente como os 6 gates
da etapa 6. **O conceito de "arquétipo" deixa de ser ENTRADA** (vira resultado implícito de quais lentes o
agente marcou aplicáveis). Mata o gargalo D-2 inteiro: sem `--arquetipo` no init, sem mexer na etapa 4, sem
cruzar fonte.

**Por que é superior:**
- **Universal:** features reais raramente são 1 arquétipo puro (a aba CLIs já era LISTA+MUTACAO). Catálogo
  plano cobre LISTA+DRAWER+UPLOAD na mesma feature sem taxonomia rígida que quebra.
- **Anti-viés preservado SEM cruzar nada:** o revisor não escolhe escopo (recebe o catálogo completo) — só
  presta contas de cada lente. "N/A" para uma lente difícil EXIGE motivo (visível/auditável). Muito mais
  difícil de gamear que "esta feature é DETALHE" (que esconderia 5 lentes de MUTACAO em silêncio).
- **Reúso direto da etapa 6:** os 6 gates injetados + `nao_aplicavel exige motivo` (regra-gêmea) → aqui as
  ~25 lentes injetadas + mesma regra. Mecânica idêntica, zero invenção.
- **Pesquisa apoia:** o alerta era "não deixe o agente DESCOBRIR as lentes (esquece as difíceis)". Aqui as
  difíceis (concorrência, autorização, path traversal) são TODAS injetadas — não podem ser esquecidas, só
  declaradas N/A com motivo (decisão consciente, não esquecimento).
- Trade-off aceito: briefing carrega ~25 lentes, a maioria N/A numa feature típica (mais verboso) — mas o
  ganho (universalidade + anti-viés + zero gargalo) compensa, como compensou na etapa 6.

### SCHEMA FINAL (revisado para catálogo plano — substitui as 6 regras do architect)
```
executor: { nome: "code-reviewer", capacidade: "revisão ADVERSARIAL — tenta refutar o diff sob todas as
  lentes; não valida, não conserta", confianca_enum: ["achado confirmado no diff", "risco potencial"] }
precondicoes: [..., dag_output, descoberta_output, gap_output, design_output, mapa_dependencias_output, implementacao_output]  # 6 anteriores
schema (presença): [veredito]
schemaEstrutural:
  veredito: { obrigatorio, enum: ["APROVA","REPROVA"] }   # NÃO exige APROVA — REPROVA é sucesso
  resumo: obrigatorio
  lentes: lista-de-objetos minItens (=|CATALOGO|) { lente*, situacao* (enum coberta|descoberta|nao_aplicavel),
          nota* }   # nota = onde(coberta)/exigência(descoberta)/motivo(nao_aplicavel) — SEMPRE obrigatória
  issues: lista-de-objetos { id*, severidade* (enum alta|media|baixa), lente*, localizacao*, descricao*, acao* }
  p0_coberto: { obrigatorio, enum: ["sim","não"] }
  exigencias_antes_de_mergear: presente (lista-de-strings)
regrasExtras (todas reúso de fábrica — zero dialeto novo):
  1. regraCatalogoLentesDeclaradas — TODAS as ~25 lentes do CATALOGO aparecem em lentes[].lente (cobertura
     total, molde regraGatesDeclarados da etapa 6). [substitui INV-1; sem arquétipo]
  2. regraEvidenciaObrigatoria("lentes","lente","situacao","nao_aplicavel","nota") — N/A exige motivo (a
     regra-gêmea da etapa 6). [anti-fuga]
  3. regraEvidenciaObrigatoria("lentes","lente","situacao","descoberta","nota") — descoberta exige a exigência.
  4. regraIssueAcionavel — toda issue tem localizacao + acao não-vazios (severidade já é enum no schema). [INV-3]
  5. regraVeredictoJustificado — REPROVA ⟹ exigencias ≥1; APROVA ⟹ exigencias == 0 (pivô formal). [INV-4]
  6. regraDescobertaViraIssue — toda lente 'descoberta' referenciada por alguma issues[].lente (circuito;
     molde regraCircuitoComportamentoCriterio da etapa 4). [INV-5]
```
**CATÁLOGO_LENTES (DADO plano no CORE, M1):** ~25 lentes com {nome, re} (matching CONCEITUAL por regex, lente
é conceito difuso). Fontes canônicas: USWDS (a11y por componente) + OWASP ASVS (por operação). Adicionar lente
= adicionar item no dado, 0 código.

**Custo de motor: ZERO.** Tudo reúso (regraGatesDeclarados já existe; regraEvidenciaObrigatoria já existe;
regraCircuitoComportamentoCriterio já existe). Sem `estado` nas regras (não cruza arquétipo) — nem usa o 3º arg.

## FASE 2 — Escrever CORE + declarar etapa ✅ CONCLUÍDA
- [x] CATALOGO_LENTES (21 lentes, DADO plano) + 4 regras: regraCatalogoLentesDeclaradas, regraIssueAcionavel,
      regraVeredictoJustificado, regraDescobertaViraIssue. Todas reúso de mecanismo; corrigido o bug do
      placeholder gate_a (regraCampoIgual "APROVA" → schema enum APROVA/REPROVA; REPROVA é sucesso).
- [x] Etapa `gate_a` declarada (executor code-reviewer; 6 pré-condições; schemaEstrutural; catalogoBriefing).
- [x] Motor: placeholder genérico `{catalogo_lentes}` (3 linhas, M1 — qualquer etapa com catálogo o reusa).
- [x] CORE-GATEA.md (4 famílias L/I/V/C + limite epistêmico por seção + 4 partes + catálogo injetado) + sync.
- [x] Testes: gate_a.test.mjs (18 — inclui "REPROVA bem-feita PASSA", invariante do catálogo, circuito);
      e2e estendido; encadeamento das 7 etapas. Referências placeholder migradas → acessibilidade. **157/157.**
- [x] BUG ACHADO/CORRIGIDO na construção: lente "validação de arquivo" não casava o próprio nome (regex) →
      a lente nunca se reconhecia. Corrigido + virou INVARIANTE testado (toda lente casa seu nome).

## FASE 3 — Testar (3 checagens + anti-viés saturado) ✅ CONCLUÍDA
- [x] 3 checagens da auditoria-base (paridade completa; encanamento testado; só regrasExtras declarativo)
- [x] Anti-viés saturado: 3 verificadores cegos. backend-arch: aceitável-com-dívida → **SÓLIDO após fixes**.
      code-reviewer: ratificado-com-ressalvas. auditor-v2: paridade substancial.

### ACHADOS DO ANTI-VIÉS — TODOS CORRIGIDOS (o método se pagou de novo)
**O furo central (backend-arch, provou rodando):** eu PLANEJEI a regra "nao_aplicavel exige motivo" (WIP rule
#2) e a PERDI ao "simplificar" achando que `nota:{obrigatorio}` bastava. Mas `nota:"n/a"` é não-vazia! Um
output tudo-N/A com "n/a" + APROVA PASSAVA — teatro de revisão, a forma do anti-viés sem a substância. A
vantagem nº1 do catálogo plano (N/A auditável) NÃO estava imposta. → `regraNaoAplicavelComMotivo` (rejeita
nota oca: n/a, -, não, na, x). Sem o anti-viés eu não pegaria meu próprio erro (réu nunca é juiz).
**Demais (convergentes):**
- APROVA + issue 'alta' passava (sandbagging grosseiro, mecânico) → severidade no regraVeredictoJustificado.
- Colisão de 3 regex (ordem/rollback/stale) → desambiguei + matching 1-para-1 (estrutural, molde etapa 4).
- Falta teste anti-colisão (C1) → invariante "nenhum regex casa nome de OUTRA" (travaria o bug original).
- W2 substring largo (issue "estado" cobria 3 descobertas) → só li.includes(nome), dropei a inversa.
- p0_coberto incoerente (APROVA+p0=não) → checagem no veredito (auditor-v2).
- DIV-1 doc (PIPELINE.md dizia "lentes do arquétipo") → atualizado p/ catálogo plano.
+7 testes. **164/164.** Regras finais: 5 (regraCatalogoLentesDeclaradas 1-para-1, regraNaoAplicavelComMotivo,
regraIssueAcionavel, regraVeredictoJustificado [3 checagens], regraDescobertaViraIssue).

## FASE 4 — Cristalizar (ADR 0028 + governança) — EM ANDAMENTO
