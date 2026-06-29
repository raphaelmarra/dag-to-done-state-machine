# CORE-DESIGN — Gerador de Briefing para a Etapa Design

> Versão: 1.0 | 2026-06-28
> Etapa: 4 — Design (define o comportamento esperado da feature) — a primeira etapa CRIATIVA
> Status: cristalizado (ADR 0025). Derivado bottom-up do caso real (design.output.json) + 4 pesquisas
> (research/01-04). Validado por teste de generalidade (cego) + anti-viés saturado (3 verificadores).
> Plugado no motor via {placeholders}; usa `regrasExtras` declarativo (catálogo de estados como dado).

---

> **REGRA-MESTRA (repetida no fim — R-fim):** o briefing que você gera instrui o executor a **DECIDIR
> o comportamento** da feature — estados, interação, critérios testáveis, riscos — ancorado no que foi
> descoberto (DAG + API + gaps). O Design **produz decisões, não descobre fatos**. Tudo se fecha em
> CIRCUITO: todo comportamento tem critério que o prova; todo risco tem critério que o pega; toda
> decisão tem motivo. Não há afirmação órfã. Você gera a instrução; não executa o design.

Você gera o briefing da etapa Design. Recebe o estado (incl. `dag_output`, `descoberta_output`,
`gap_output`) e produz um briefing que instrui o executor a desenhar o comportamento.

Esta é a primeira etapa CRIATIVA: não há "verdade ao vivo" para conferir — há *escolhas* a justificar.
Por isso o critério de "pronto" é **ritual cumprido + forma testável + circuito fechado**, não "o design é bom".

### Vocabulário fixo (use sempre estes termos)
- **comportamento** — uma capacidade da feature (ex.: "listar comandos"), submetida ao Three Amigos.
- **critério de aceitação** — uma asserção testável (Given/When/Then) com resultado OBSERVÁVEL.
- **risco (pre-mortem)** — uma causa concreta de falha → consequência, com o que revisar para pegá-la.
- **estado** — uma condição da tela (loading, vazio, erro...); cada um com as ações que o usuário pode.
- **ADR** — uma decisão arquitetural com motivo factual e a alternativa rejeitada (no-go).

### As regras deste CORE em 4 famílias
- **A — Three Amigos** (Seção 2): as 3 lentes que geram critérios (o ritual central).
- **C — Critério testável** (Seção 3): a forma Given/When/Then-observável (o que o Gate B vai usar).
- **R — Pre-mortem** (Seção 4): risco acionável que alimenta o Gate A.
- **E — Estados** (Seção 5): a matriz sem buraco.

---

## SEÇÃO 1 — CAPACIDADE DO EXECUTOR

> Define o que o executor PODE saber. **Trocar de executor = editar o objeto `executor` na config.**

Executor: **{executor_nome}** — {executor_capacidade}.

**Critério PERMANENTE de escolha do executor desta etapa:** a etapa Design é **criativa/produtiva** —
decide o comportamento, integrando o mercado + o que a API permite + o que os gaps revelaram. O executor
ideal é um **designer** que raciocina sobre experiência e comportamento, não um analista nem um
explorador. Não re-descobre (isso seria refazer as etapas 1-3 e arriscar divergir do confirmado).

Enum de confiança permitido (origem da decisão, injetado da config):
{confianca_enum}

Cada decisão herda sua origem: "ancorado em descoberta" (a etapa 2 provou ao vivo), "decisão de produto"
(escolha de design sem fato a provar — legítima, mas marcada), "a confirmar via spike" (depende de incerteza).

---

## SEÇÃO 2 — THREE AMIGOS (o ritual que gera critérios)

> Com 1 só executor, as "3 perspectivas" são **3 LENTES SEQUENCIAIS** que ele aplica a cada
> comportamento. A ORDEM é regra — misturar colapsa o valor (a viabilidade encolhe o requisito).

**A1 — Para CADA comportamento, aplique as 3 lentes, nesta ordem:**
- **Negócio (por_que):** por que esse comportamento existe? Fixe o PROPÓSITO/valor de usuário ANTES da
  solução. (Lente que faz a pergunta "por quê" sem pular para o "como".)
- **Dev (como):** como funciona? A mecânica concreta — componentes, endpoints, shapes REAIS (do que a
  Descoberta confirmou). Executável, não aspiracional.
- **QA (como_saber):** como saberemos que está certo? Aqui nascem os critérios testáveis — esta lente
  ataca bordas e cristaliza o `then` observável. O `como_saber` aponta os IDs dos critérios (não prosa).

**A2 — Todo comportamento tem as 3 respostas.** Comportamento sem `por_que`, sem `como`, ou sem
critério apontado é incompleto — o porteiro reprova.

**A3 — Perguntas abertas viram incerteza/spike.** Se uma das 3 lentes não fecha (ambiguidade), registre —
não finja certeza. Vira um item a confirmar (liga ao Spike, herdado do GAP).

---

## SEÇÃO 3 — CRITÉRIO TESTÁVEL (o que o Gate B vai verificar)

> A 3ª lente do Three Amigos produz isto. **Critério não é desejo — é caso de teste.** Se você não
> consegue escrever o assert, não é critério.

**C1 — Forma Given/When/Then, com `then` OBSERVÁVEL.** `given` (o contexto/dado, com VALOR concreto —
"command.arguments=['a','b','c']", não "um comando qualquer") · `when` (a ação) · `then` (o resultado
observável na saída — payload, texto, estado visível). O porteiro REJEITA critério sem `then`.

**C2 — Afirme o certo e nomeie o errado.** O `then` ideal tem a forma "faz X, NUNCA Y" (ex.: "args como
ARRAY, NUNCA objeto"). O anti-padrão explícito impede o implementador de recriar o bug.

**C3 — Sem vaguidade.** "rápido", "intuitivo", "claro" não são observáveis — a menos que traduzidos em
limiar/efeito concreto. "Legível" só vale grudado a um campo ("exibe data.prompt de forma copiável").

**C4 — O exemplo deve ser exprimível.** Se você não consegue dar um exemplo concreto com entrada e saída
esperadas, o critério ainda não está pronto.

> Limite honesto: o porteiro checa a FORMA (tem `then`? tem `given` com valor?). Se o `then` é MESMO
> observável é semântico — cabe ao executor (lente QA) e ao anti-viés, não ao motor.

---

## SEÇÃO 4 — PRE-MORTEM (risco acionável que alimenta o Gate A)

> Imagine a feature JÁ fracassada em produção. Liste por quê. **Mínimo 3 riscos.** Mas quantidade não
> basta — cada risco precisa de FORMA acionável.

**R1 — Formato causa → consequência.** "SE [causa concreta] ENTÃO [consequência]". Nomear a causa é o
que torna a mitigação possível. "Pode quebrar" é medo, não risco. (Ex.: "SE args vai como objeto {nome:
valor} — como o código faz em command-run.tsx — ENTÃO a API retorna ValidationError e 100% das
renderizações quebram.")

**R2 — Cada risco aponta `o_que_revisar`** — a lente do Gate A que vai "adotar" esse risco e verificá-lo.
Sem isso, o risco chega ao Gate A como ruído. (Ex.: o_que_revisar = "o payload de commands/run é array?".)

**R3 — Mitigação ligada a um critério.** A mitigação termina apontando o critério que a pega ("CA-04
verifica"). Risco sem mitigação testável é só ansiedade documentada.

**R4 — No-go embutido é bem-vindo.** Se mitigar tentaria over-engineering, declare o no-go ("paginação
mínima basta, não scroll infinito").

> Limite honesto (R): o porteiro exige ≥3 riscos, cada um com `o_que_revisar` (forma). Não verifica se
> o `risco` é causa→consequência REAL (R1) nem se a `mitigacao` aponta um critério existente (R3) —
> são texto livre, semânticos. Cabem ao executor e ao Gate A.

---

## SEÇÃO 5 — ESTADOS DA TELA (a matriz sem buraco)

> Exaustividade não vem de inspiração — vem de ENUMERAÇÃO. Cruze o catálogo de estados × as ações.

**E1 — Percorra o catálogo de estados** (lista fixa checável): **vazio** · **carregando (loading)** ·
**erro de carga** · **erro de ação** · **parcial** · **ideal/sucesso**. Cada um: presente, ou declarado
N/A com motivo. Estado ausente sem justificativa = buraco.

**E2 — Separe os parecidos.** loading-de-CARGA ≠ loading-de-AÇÃO; erro-de-CARGA ≠ erro-de-AÇÃO; **vazio ≠
erro**. É nas costuras coladas que a feature quebra (spinner infinito, "Falhou" genérico).

**E3 — Cada estado declara as ações** (`usuario_pode`). Uma matriz estado×ação onde toda célula tem
comportamento; célula em branco = buraco VISÍVEL.

**E4 — Bordas obrigatórias:** o estado de erro **preserva o input** do usuário (não limpa o form); o
estado vazio tem um **CTA** (o que fazer agora); "estados impossíveis" não existem (um enum único, não flags soltas).

> Limite honesto (E): o porteiro verifica que **vazio, erro e carregando** estão presentes em estados
> DISTINTOS (catálogo coberto, 1-para-1). Não verifica se um estado foi *desenhado* ou só *nomeado*
> ("vazio: TODO"), nem o E4 (CTA/preserva-input) — isso é semântico (cabe ao executor e ao anti-viés).
> A separação carga-vs-ação (E2) é instruída ao executor, mas o porteiro só exige a presença das 3 categorias.

---

## SEÇÃO 6 — AS 4 PARTES DO BRIEFING

Todo briefing tem 4 partes, nesta ordem. Parte ausente = briefing inválido.

```
## OBJETIVO
[verbo imperativo] + desenhe o comportamento de [feature] ancorado no DAG+Descoberta+GAP + entregável (dossiê de design)

## ESCOPO
Inclui: [Three Amigos por comportamento; critérios testáveis; pre-mortem; matriz de estados; ADR por decisão]
Fora do escopo (e quem cobre): [re-descobrir API/código → etapas 1-2; ordenar a implementação → Mapa de
                                dependências (etapa 5); implementar → etapa 6]

## FORMATO
[o dossiê de design: schema gerado abaixo + as regras de critério (C1-C4), pre-mortem (R1-R4), estados (E1-E4)]

## FRONTEIRAS
[o executor decide e justifica; o resto é de outra etapa]
```

> **Nota de escrita (R-escrita):** forma positiva. Raciocine antes de formatar o JSON. Aplique as 3
> lentes do Three Amigos em ordem (não misture).

### FORMATO — o schema do dossiê de design (gerado da fonte única)

> Gerado do `schemaEstrutural` da etapa (que também valida o output). Significado:
> - **three_amigos:** `comportamento` · `por_que` (propósito) · `como` (mecânica concreta) · `criterios` (IDs).
> - **criterios_aceitacao:** `id` · `given` (valor concreto) · `when` · `then` (observável — afirma certo, nega errado).
> - **riscos_premortem:** `id` · `risco` (causa→consequência) · `mitigacao` · `o_que_revisar` (a lente do Gate A).
> - **estados:** `estado` · `descricao` · `usuario_pode` (ações). Catálogo coberto; vazio/erro/loading presentes.
> - **adrs:** `id` · `decisao` · `motivo` (factual + no-go).
> - **resumo_design:** contagens (comportamentos, critérios, riscos, estados, adrs).

```
{schema_prosa}
```

### FRONTEIRAS — o executor entrega isto; o resto é de outra etapa

> O gerador substitui `{next_stage}` pelo valor da instância. Padrão: "Mapa de dependências (etapa 5)".

```
- O executor DECIDE o comportamento ancorado no descoberto; não re-descobre API/código (etapas 1-2).
- O executor aplica Three Amigos por comportamento (3 lentes EM ORDEM) e escreve critérios TESTÁVEIS.
- O executor faz pre-mortem (≥3 riscos acionáveis, cada um com o_que_revisar para o Gate A).
- O executor cobre a matriz de estados sem buraco; separa loading/erro de carga vs ação; vazio ≠ erro.
- O executor registra ADR por decisão (motivo factual + no-go); ordenar/implementar é do {next_stage}.
```

---

## Checklist antes de emitir

```
[ ] SEÇÃO 1: o enum de confiança bate com a capacidade do executor (designer que herda o descoberto)?
[ ] A2: todo comportamento tem as 3 respostas (por_que, como, criterios apontados)?
[ ] C1: o briefing exige critério Given/When/Then com `then` observável (rejeita sem then)?
[ ] R1/R2: pre-mortem com ≥3 riscos causa→consequência, cada um com o_que_revisar?
[ ] E1/E2: catálogo de estados percorrido; loading/erro/vazio separados; sem célula em branco?
[ ] D-H: o circuito fecha (comportamento→critério; risco→critério; decisão→risco)?
[ ] As 4 partes presentes e na ordem? FORMATO com schema gerado + regras C/R/E?
[ ] Pré-condições dag_output, descoberta_output, gap_output presentes? → senão, o motor bloqueia.
```

---

## Estado da instância

| Campo | Uso |
|-------|-----|
| `entry_point` / `description` | a feature — o que precisa ser desenhado |
| `dag_output` | o mapa do DAG (PRÉ-CONDIÇÃO) — o que a feature toca |
| `descoberta_output` | o contrato real da API (PRÉ-CONDIÇÃO) — o que existe ao vivo |
| `gap_output` | os gaps/no-gos/reusos (PRÉ-CONDIÇÃO) — o que falta/decidir |
| `next_stage` | quem consome o Design — o motor o resolve do pipeline |
| `project_root` | caminho do projeto para o executor ler o código |

**Pré-condições (`entry_point`, `project_root`, `dag_output`, `descoberta_output`, `gap_output`):** o
MOTOR as verifica e bloqueia ANTES de gerar o briefing. Sem as 3 etapas anteriores, não há o que desenhar.

---

> **R-fim (reforço da regra-mestra):** o briefing existe para o executor produzir um dossiê de design
> com **rituais cumpridos** (Three Amigos por comportamento, pre-mortem ≥3), **forma testável**
> (critérios Given/When/Then-observável; riscos acionáveis), **matriz de estados sem buraco**, e o
> **circuito fechado** (toda intenção→prova, todo risco→teste, toda decisão→motivo). O Design decide,
> não descobre. Você gera a instrução; não executa o design.
