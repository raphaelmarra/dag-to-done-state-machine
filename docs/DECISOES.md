# Decision Log

> Índice cronológico de todas as decisões de design (ADRs). Cada decisão vive em
> `docs/adr/NNNN-*.md` (formato MADR, imutável). Para reverter uma decisão, NÃO edite o ADR:
> crie um novo e marque o antigo como `superseded`. Manter via skill `manter-governanca`.

| ADR | Título | Status | Data |
|-----|--------|--------|------|
| [0001](adr/0001-state-machine-nativa-em-nodejs-puro.md) | State machine nativa em Node.js puro | accepted | 2026-06-26 |
| [0002](adr/0002-briefing-gerado-automaticamente-pelo-estado-da-instancia.md) | Briefing gerado automaticamente pelo estado da instância | accepted | 2026-06-26 |
| [0003](adr/0003-criterio-de-aceitacao-por-etapa-como-checklist-binario.md) | Critério de aceitação por etapa como checklist binário | accepted | 2026-06-26 |
| [0004](adr/0004-lentes-de-revisao-diferenciadas-por-arquetipo-no-gate-a.md) | Lentes de revisão diferenciadas por arquétipo no Gate A | accepted | 2026-06-26 |
| [0005](adr/0005-indicador-de-confianca-obrigatorio-nos-entregaveis.md) | Indicador de confiança obrigatório nos entregáveis | accepted | 2026-06-26 |
| [0006](adr/0006-pre-mortem-como-parte-obrigatoria-do-design.md) | Pre-mortem como parte obrigatória do Design | accepted | 2026-06-26 |
| [0007](adr/0007-dag-como-primeira-etapa-antes-da-descoberta-da-api.md) | DAG como primeira etapa (antes da Descoberta da API) | accepted | 2026-06-26 |
| [0008](adr/0008-pesquisa-de-mercado-paralela-ao-dag.md) | Pesquisa de mercado paralela ao DAG | accepted | 2026-06-26 |
| [0009](adr/0009-prep-gate-b-paralela-ao-gate-a.md) | Prep Gate B paralela ao Gate A | accepted | 2026-06-26 |
| [0010](adr/0010-walking-skeleton-como-decisao-do-mapa-de-dependencias.md) | Walking Skeleton como decisão do Mapa de dependências | accepted | 2026-06-26 |
| [0011](adr/0011-acessibilidade-entre-gate-a-e-gate-b.md) | Acessibilidade entre Gate A e Gate B (só arquétipos de interação) | accepted | 2026-06-26 |
| [0012](adr/0012-smoke-pos-deploy-e-retrospectiva-como-etapas-formais.md) | Smoke pós-deploy e Retrospectiva como etapas formais | accepted | 2026-06-26 |
| [0013](adr/0013-estimativa-de-complexidade-no-gap.md) | Estimativa de complexidade no GAP | accepted | 2026-06-26 |
| [0014](adr/0014-retrospectiva-propoe-melhorias-nao-so-registra.md) | Retrospectiva propõe melhorias, não só registra | accepted | 2026-06-26 |
| [0015](adr/0015-padrao-meta-prompt-mais-structured-handoff.md) | Padrão: Meta-Prompt + Structured Handoff | accepted | 2026-06-26 |
| [0016](adr/0016-testar-antes-de-registrar-decisao-de-design.md) | Testar antes de registrar decisão de design | accepted | 2026-06-26 |
| [0017](adr/0017-output-schema-por-familia-de-etapa-predefinido-no-core.md) | Output schema por família de etapa: pré-definido no CORE | accepted | 2026-06-26 |
| [0018](adr/0018-output-schema-em-json-via-tool-use-renderizado-como-listas.md) | Output schema em JSON via tool_use, renderizado como listas | accepted | 2026-06-26 |
| [0019](adr/0019-state-machine-faseada-um-core-por-etapa.md) | State machine faseada: um CORE por etapa | accepted | 2026-06-26 |

---

## Skill replicável `criar-state-machine` — escrita, NÃO validada — proposed (2026-06-30)

- **ADR 0033** — Entrega a frente A022 (empacotar o método de criar state machines numa skill replicável p/ qualquer
  domínio). A skill EXISTE em `~/.claude/skills/criar-state-machine/` (SKILL.md ponteiro + recursos + scaffold). Destilada
  por 6 fases delegadas a agentes dedicados (Explore/task-decomposition-expert/search-specialist → Plan ×2 →
  auditor-v2+code-reviewer → builder), bottom-up de 32 ADRs + estado-da-arte (Meta-Prompting/DSPy/SECI/CTA) + pré-mortem
  adversarial. **Coração:** o "CORE do CORE" — meta-método de 8 passos para destilar o CORE de uma etapa, com a ordem do
  batismo+expansão CORRIGIDA e um passo 4 NOVO (verificação de ajuste, anti-viés da Grounded Theory). **Status `proposed`,
  não `accepted`:** a validação (Fase 7 — replicar num 2º domínio) foi PULADA por decisão do operador (validará em outro
  cenário); cristalizar como validada seria o falso-verde que o projeto combate (n=1, "parece genérico ≠ é genérico"). A
  própria skill DECLARA o n=1 (aviso de maturidade + aceite obrigatório). Pré-mortem se pagou: pegou "fábricas extraídas
  de graça" inexistentes antes da escrita. **Falta p/ accepted:** Fase 7 + dívidas técnicas declaradas.

## Etapa 0 (Censo de Fontes) — construída ISOLADA, pendente de inserção — proposed (2026-06-30)

- **ADR 0032** — Resolve PARCIALMENTE a A020 (cegueira de fonte, achado-ouro do E2E). Etapa antes do DAG que
  estabelece o território: HITL híbrida em 4 movimentos (humano declara → agente confronta com busca independente
  dupla e marcada por `proveniencia` → diff explícito → humano julga, fail-closed). Porteiro reusa
  `regraEvidenciaObrigatoria` (fonte ao vivo exige evidência) + nova `regraCensoConfrontado` (nenhuma fonte fica
  `a_decidir`; descarte exige motivo) + `regraCampoIgual` fail-closed (só `censo_completo` avança). `tipo` de fonte
  é campo ABERTO (M1). **Status `proposed`, não `accepted`:** a etapa está FORA do array `PIPELINE`
  (`ETAPA_CENSO_FONTES` exportada isolada — decisão do operador de não tocar os 227 testes agora), exercitada por
  teste direto contra o porteiro real (8 casos; suíte 235/235). ZERO motor novo. **Falta para cristalizar (M4/ADR
  0016):** (1) inserir em `PIPELINE[0]` (vira `PRIMEIRA_ETAPA`; DAG consome `censo_output`) + adaptar ~3 testes que
  assumem `dag` como 1ª; (2) validar contra 2º caso real (E2E #3). Até lá, A020 permanece ABERTA.

## Etapa 10 (Aprovação humana) — HITL com garantia processual — cristalizada (2026-06-29)

- **ADR 0031** — 1ª etapa de gênero NÃO-CORE (executor = humano). Sem meta-prompt: o `next` injeta um DOSSIÊ
  derivado do estado (o que foi construído + vereditos dos 3 gates + o que ficou FORA: fica_para_humano +
  riscos do pre-mortem + limite A018). Porteiro fail-closed binário (só `decisao:"aprovado"` avança; rejeitado
  bloqueia). **KISS-com-fala-humana:** gate formal pesado (tamper_hash/cripto) é over-engineering — num pipeline
  dirigido por agente o motor não prova autenticidade; a garantia é PROCESSUAL (o agente mostra o dossiê, espera
  a fala humana de OK e não a fabrica). Respaldo: pesquisa HITL 2026 ("approvals before side effects"; gate
  cerimonioso vira fadiga). ZERO mecanismo de validação novo (1 `regraCampoIgual` + 1 ramo `dossie:true`). 3
  peças TDD + verificador cego (24 estados degenerados; 2 fraquezas corrigidas). Encadeamento das 10 etapas
  testado. Abre A019 (autenticidade processual, irmã de A018).

## Etapa 9 (Gate B — Verificação ao vivo) — o JUIZ DA AUTENTICIDADE — cristalizada (2026-06-29)

- **ADR 0030** — Verifica a VERDADE (chama a API ao vivo read-only, confronta o real com os critérios do
  design), não a forma de uma declaração — gênero diferente das etapas 7/8. **Veredito QUATERNÁRIO**
  (`verificado/diverge/inconclusivo/precisa-humano`) que DERIVA das situações por-critério, e **FAIL-CLOSED**:
  só `verificado` avança; os outros 3 são outputs válidos mas BLOQUEIAM (a feature não está pronta / não pôde
  ser confirmada). `inconclusivo` exige motivo de enum fechado (anti-fuga — o "motivo obrigatório do SKIP").
  Evidência substantiva por critério (request+response+asserção) + cobertura de TODO critério do design
  (cruza o estado, id ancorado por palavra inteira). Executor `fiscal` (parente da etapa 2). Validado por 2
  casos cegos opostos (chamadas REAIS + `diverge`) + 2 rodadas de revisão cega que fecharam furos via teste
  mecânico (evidência oca por substring/sufixo/objeto/número). ZERO motor novo; 5 regras reusam moldes 2/6/8.
  Abre A016 (autenticidade da evidência não-forjável).

## Etapa 8 (Acessibilidade) — o "Gate A do runtime" — cristalizada (2026-06-29)

- **ADR 0029** — Verifica a tela EM MOVIMENTO (foco, teclado, leitura, contraste com dado real), não o código.
  É o espelho da etapa 7 no eixo runtime: catálogo WCAG operacional (16 critérios, WCAG 2.2+APG) injetado
  inteiro, o verificador declara cada um coberto/violado/nao_aplicavel + **`evidencia_operacional`** (a âncora
  que prova que a tela foi operada — o campo decisivo). A 1ª etapa CONDICIONAL: roda sempre + N/A com motivo
  (não pula — VPAT+CI/CD convergem: pular = falso-verde). Veredito binário; reprovado é sucesso. Fronteira com
  a etapa 10 (`fica_para_humano`: a IA julga forma, o humano julga vivência). Validado por 2 casos OPERADOS ao
  vivo (Playwright+axe) — aba CLIs (cobertura plena) + DETALHE read-only (validou a condicionalidade) + 3
  verificadores (acharam/fecharam: violação órfã por token, coberto com evidência oca). A fábrica de
  motivo-substantivo foi GENERALIZADA (momento M4 — beneficia a etapa 7). ZERO motor novo; ~85% dado. Dívida
  A017 (feature sem UI). Atualiza ADR 0011.

## Etapa 7 (Gate A) — revisão adversarial com catálogo plano — cristalizada (2026-06-29)

- **ADR 0028** — A 1ª etapa REFUTADORA: revisão ADVERSARIAL do diff (tenta refutar, não validar — empírico:
  "valide" derruba a detecção até 93pp). Fecha o anti-viés "réu nunca é juiz" (o réu da etapa 6 encontra seu
  juiz, um agente DIFERENTE). **Decisão do operador (catálogo PLANO):** injeta TODAS as ~21 lentes (sem
  classificar arquétipo) e o revisor declara cada uma coberta/descoberta/nao_aplicavel — elimina o gargalo
  "de onde vem o arquétipo", serve features multi-arquétipo, e o N/A exige motivo SUBSTANTIVO (a defesa
  central). Veredito binário; REPROVA é SUCESSO (o porteiro NUNCA exige APROVA). Coerência mecânica:
  REPROVA⟹≥1 exig; APROVA⟹0 exig ∧ P0 coberto ∧ 0 issue 'alta'. Validado por 2 casos (LISTA+MUTACAO; DRAWER,
  ambos reprovaram) + 3 verificadores (acharam/fecharam um furo que EU introduzi: a regra de motivo-do-N/A
  perdida ao "simplificar" → tudo-N/A+APROVA passava). 5 regras, todas moldes reusados; placeholder genérico
  de 3 linhas no motor. Atualiza ADR 0004 (lentes agora em catálogo plano).

## Etapa 6 (Implementação) — handoff verificável + rastreabilidade — cristalizada (2026-06-29)

- **ADR 0027** — A 1ª etapa que toca CÓDIGO. O executor APLICA o código e roda os checks, mas entrega um
  HANDOFF VERIFICÁVEL (diff ancorado + golden_path + riscos + `prontidao`: cada gate com prova — verde→exit/
  log, n/a→motivo, vermelho→erro) e o porteiro valida forma + rastreabilidade + prova-anexada, NUNCA "é
  verdade" (Gate A refuta, Done re-roda). **Resolve A014/A015:** o motor foi estendido 1× (`estado` às regras,
  retrocompatível) para a `regraAncoraRastreavel` cruzar cada âncora com os ids reais das etapas anteriores
  (B-restrito, dinâmica M1, recursiva). Decidido com pesquisa (o agente jamais é juiz do próprio trabalho).
  Validado por 2 casos (LISTA + MUTACAO, este com o agente cego rodando tsc exit 0) + 3 verificadores (acharam/
  fecharam: varredura rasa deixando fantasma passar, ids espúrios, vermelho sem evidência, nota fora do schema).
  Reusou a fábrica `regraEvidenciaObrigatoria` 3×. Tese de amortização confirmada (3 linhas de motor, genéricas).

## Etapa 5 (Mapa de dependências) — grafo de tarefas com paralelo provado — cristalizada (2026-06-28)

- **ADR 0026** — O mapa é um GRAFO de tarefas: a disciplina do DAG da etapa 1 aplicada a unidades de
  trabalho (unidade=nó, `depende_de`=aresta, ordem=topo-sort). O porteiro PROVA o paralelo por arquivos
  disjuntos (`regraParaleloDisjunto`) + valida ordem topológica (`regraOrdemTopologica`, pega ciclo sem
  travar) + exige âncora e arquivos por unidade + Walking Skeleton decidido com fato. Executor `Plan`
  (planeja, não implementa). Concretiza ADR 0010. Validado por cego + 3 verificadores (acharam/fecharam:
  ordem com id duplicado mascarando violação, unidade sem arquivos como "disjunta", enum misto). Limite
  declarado: âncora↔fonte não é cruzada (exigiria estado no porteiro — ABERTO A014). 0 mecanismo de motor.

## Etapa 4 (Design) — validação de etapa criativa — cristalizada (2026-06-28)

- **ADR 0025** — A primeira etapa CRIATIVA. O porteiro valida RITUAL (Three Amigos, pre-mortem ≥3, ≥1
  ADR) + FORMA (critério com `then`; risco com `o_que_revisar`; estados difíceis distintos; resumo não
  mente) + CIRCUITO (comportamento↔critério, sem órfão) — não "qualidade" (semântico, vai ao Gate A). O
  CORE declara o limite epistêmico por seção. Catálogo de estados como DADO (M1). Validado por cego + 3
  verificadores. Custou ZERO mecanismo no motor — a tese de amortização vale até na etapa mais atípica.

## Etapa 3 (GAP) + regrasExtras — cristalizada (2026-06-28)

- **ADR 0024** — Etapa 3 (GAP): confronta DAG+API com o que a feature precisa; executor analista
  (error-detective); honestidade estrutural (gap exige evidência; "impossível" exige ângulos; no-go
  com 3 campos; resumo não mente; complexidade computada dos drivers). E **resolve A012**: regras de
  aceitação unificadas no `regrasExtras` declarativo (`comCondicao` deletado, gates migrados). Validado
  por cego + 3 verificadores. Tese de amortização confirmada: ~16 linhas de mecanismo, 0 de motor.

## Etapa 2 (Descoberta da API) — cristalizada (2026-06-28)

- **ADR 0023** — Honestidade imposta pelo porteiro: "confirmado ao vivo" sem evidência anexada é
  REPROVADO; executor `fiscal` read-only por construção; divergência doc↔real é entregável; o motor
  promove `<etapa>_output` para o estado. Validado por teste REAL ao vivo + anti-viés saturado (3
  verificadores acharam e corrigiram 4 problemas). Reusou a infra da etapa 1 (~50 linhas, 0 de motor).
  Dívida do `regrasExtras` declarativo em ABERTO A012.

## CORE-DAG v4.0 — cristalizado (2026-06-28)

- **ADR 0020** — Fronteira do DAG com profundidade dinâmica (não "1 hop" fixo).
- **ADR 0021** — Nó no nível Component (C4) + blast radius com amplitude graduada.
- **ADR 0022** — Aciclicidade verificável no DAG de dependências de consumo.

Validados pela rotina 0→4 contra 2 casos (CRM amplo + aba CLIs estreita) e 9 pesquisas
(`research/0006–0014`). A regra A5 (condensação de ciclo) fica **provisória** (validada só em
sintético) — ver `ABERTO.md` A010. A fundação do v3.0 (A008) foi absorvida e superada.
