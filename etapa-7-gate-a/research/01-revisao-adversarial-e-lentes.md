# Pesquisa 01 — Revisão adversarial por LLM, lentes por arquétipo, o porteiro que valida a revisão (2026)

> Fonte: search-specialist, 2026-06-29. 10 buscas + 6 fetches. Decide a estrutura da etapa 7 (Gate A) e como
> o porteiro a valida. Confirmou: enquadramento adversarial é EMPÍRICO (não estilo); catálogo de lentes FIXO;
> o porteiro valida a FORMA de uma busca genuína, não a verdade dos achados.

## Achado central (evidência empírica forte)
**Enquadramento confirmatório DESTRÓI a detecção; adversarial a maximiza.**
- arxiv 2603.18740 (mar/2026, 4 modelos SOTA): enquadrar o código como "livre de bugs" derruba a detecção em
  16–93 pontos (GPT-4o-mini 97.2%→3.6%, −93.5pp, Cohen's h=2.42; Claude 3.5 Haiku −59.9pp; todos p<.001).
  Efeito ASSIMÉTRICO: falsos-negativos disparam, falsos-positivos quase não mudam. "Bug presente" MELHORA.
  → A regra-mestra "tente refutar, não valide" tem prova quantitativa. O viés de "aprovar p/ não atritar" é
  mensurável e devastador.

## Ressalva crítica (muda a redação do CORE)
**Estrutura rígida demais PREJUDICA a detecção.**
- arxiv 2602.16741 (fev/2026): forçar metodologia passo-a-passo ("enumere fontes→sinks→trace") PIOROU os
  misses (race conditions, lógica). O que funcionou: ancorar em sinais externos concretos (SAST) → 96.9%
  detecção. Race/timing/autorização escapam independente de prompt.
  → A lente deve dizer O QUÊ verificar (garante cobertura) mas deixar o COMO livre. NÃO engessar o raciocínio.

## O porteiro que valida a REVISÃO (não re-revisa)
- CodeFuse-CR-Bench (arxiv 2509.14856): revisão abrangente = Location + Severity + Issue type + Actionable
  suggestion + coverage. Exclui "LGTM" explicitamente. → é o esqueleto do porteiro: checa presença/forma
  desses campos, não se o achado "está certo".
- ASDLC "Adversarial Code Review" pattern: Critic Agent em SESSÃO SEPARADA do Builder ("limpa o drift"),
  prompt "rejeite código que viola a spec, mesmo que funcione", output PASS ou {Descrição, Impacto, Remediação,
  Requisitos de teste}, favorece falso-positivo. → é literalmente o Gate A desenhado por terceiros.
- "LGTM vazio" é combatido por CONSTRUÇÃO DO OUTPUT (schema rico), não exortação: impossível aprovar sem
  preencher os campos. → reforça a cobertura declarada como defesa anti-LGTM verificável.

## Calibração (não medir reprovação como meta)
- Greiler: NUNCA criar métrica que incentive taxa de rejeição (vira gaming). Reprovação é sinal de qualidade
  só interpretada, não otimizada. Ordem de grandeza: dezenas de %, maior em PRs grandes (87% aprovação <200
  linhas). → o porteiro exige SUBSTÂNCIA, não um % de reprovação. Declarar isso no CORE.
- Code Review Agent Benchmark (arxiv 2603.23448): LLM-reviewers acham só ~40% do que humanos acham. → o Gate A
  é UMA camada, não o oráculo final.

## Lentes por arquétipo de UI (fontes canônicas — o catálogo NÃO é inventado, é consolidado)
- **LISTA** (USWDS Table a11y): estado-vazio, loading, erro, paginação/scroll/lazy (0/min/max dados),
  ordenação (anunciada a SR), navegação por teclado, dados extremos (texto longo/emoji).
- **MUTACAO** (OWASP ASVS V5/V4): validação de input (allow-list, tipo, range) client+server, autorização
  (least privilege), erro de campo (aria-invalid), confirmação/reversibilidade de destrutiva, concorrência/
  submissão dupla/idempotência, encoding de saída (anti-XSS).
- **DRAWER/MODAL** (USWDS Modal a11y): role=dialog + aria-modal + aria-labelledby, focus trap, restauração de
  foco ao fechar, escape fecha, scroll do body desabilitado, contraste/foco visível.
- **BOARD/KANBAN** (MDN DnD): drag-drop por teclado + ARIA, optimistic update + rollback, indicadores de drop,
  lazy por coluna, estado 0 cards/coluna cheia, validação pre-move.
- **DETALHE** (USWDS): loading, vazio/404, erro de fetch, campos nulos (fallback gracioso), permissão de leitura.
- **UPLOAD** (USWDS File input + UploadKit): validação MIME + magic bytes + tamanho + scan, upload por teclado,
  progresso (aria-live), erro (tipo/tamanho/rede), segurança (presigned URL, rate limit, path traversal, audit).
- USWDS publica "accessibility tests" POR COMPONENTE — evidência de que dimensões canônicas por arquétipo já
  existem na prática, mantidas por autoridade. Consolidação, não invenção.

## RECOMENDAÇÃO da pesquisa (e o que o operador decidiu)
- **Catálogo FIXO no CORE** (M3 — a bateria de uma LISTA é invariante), arquétipo da DEMANDA. Lentes como DADO
  injetável, não código. A lente APONTA onde olhar, não dita passos (senão reduz detecção).
- **Porteiro exige:** veredito binário; cobertura declarada por lente (cada lente → finding OU negação
  explícita — silêncio = incompleto = barra); findings bem-formados (location+severity+type+remediation+
  evidence); ancoragem concreta; coerência veredito↔severidade (única checagem lógica permitida). NÃO julga se
  o bug é real, se a severidade está certa, nem se faltou achado — isso seria re-revisar (reintroduz o viés).
- **DECISÃO DO OPERADOR (supera a recomendação):** em vez de decidir arquétipo e cruzar, INJETAR TODAS as
  lentes (catálogo plano) e o agente declara por lente coberta/descoberta/nao_aplicavel+motivo — igual aos 6
  gates da etapa 6. Elimina o conceito de arquétipo como entrada; universal (features multi-arquétipo);
  anti-viés preservado sem cruzar fonte (N/A exige motivo auditável). Ver _WIP-construcao.md.

## Fontes principais
- arxiv 2603.18740 (confirmation bias) · arxiv 2602.16741 (harder to fool / rigidez prejudica) · arxiv
  2509.14856 (CodeFuse-CR-Bench) · arxiv 2603.23448 (benchmark ~40%) · ASDLC adversarial-code-review pattern
- OWASP ASVS v5 · USWDS accessibility-tests (Table/Modal/File input) · Greiler (rejection metric) · CodeRabbit
  (walkthrough + reviewed/skipped) · Qodo Rule System · Graphite Diamond
