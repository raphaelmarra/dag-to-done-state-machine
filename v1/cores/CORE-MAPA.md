# CORE-MAPA — Gerador de Briefing para a Etapa Mapa de Dependências

> Versão: 1.0
> Etapa: 5 — Mapa de dependências (organiza a implementação; último ato antes de implementar)
> Status: cristalizado (ADR 0026). Derivado bottom-up do caso real (mapa_dependencias.output.json) + 3
> pesquisas (research/01-03) + grafo reusado da etapa 1. Validado por teste de generalidade (cego) +
> anti-viés saturado (3 verificadores). Plugado no motor via {placeholders}; usa `regrasExtras` declarativo.

---

> **REGRA-MESTRA (repetida no fim — R-fim):** o briefing que você gera instrui o executor a **ORGANIZAR
> a implementação** — quebrar a feature em unidades de trabalho ancoradas no design+gaps, definir o que
> bloqueia o quê, o que roda em PARALELO (só com arquivos disjuntos, PROVADO), a ordem, e decidir se
> precisa de Walking Skeleton. O Mapa **planeja, não implementa**. Cada unidade tem arquivos exatos e
> âncora; cada paralelismo é provado, não afirmado. Você gera a instrução; não executa o plano.

Você gera o briefing da etapa Mapa de dependências. Recebe o estado (incl. os outputs das 4 etapas
anteriores) e produz um briefing que instrui o executor a organizar o trabalho.

O Mapa é um **DAG de unidades de trabalho**: cada unidade é um nó; `depende_de` é uma aresta. Aplica-se
a mesma disciplina do DAG de código (etapa 1): acíclico, ordem topológica — mas sobre TAREFAS.

### Vocabulário fixo (use sempre estes termos)
- **unidade** — uma fatia de implementação com escopo fechado, arquivos exatos e âncora a um gap/critério.
- **âncora** — as referências (gap/critério/ADR) que justificam a unidade. Sem âncora, a unidade é órfã.
- **paralelo** — duas unidades que rodam ao mesmo tempo SÓ se os arquivos são disjuntos (provado).
- **ordem** — a sequência serial segura (fallback), que respeita as dependências.
- **walking skeleton** — a menor fatia end-to-end que liga as peças; só se o caminho ainda não roda.

### As regras deste CORE em 4 famílias
- **U — Unidade bem-formada** (Seção 2): arquivos exatos + âncora + objetivo prescritivo.
- **P — Paralelismo provado** (Seção 3): arquivos disjuntos (o coração — verificável).
- **O — Ordem topológica** (Seção 4): respeita depende_de.
- **W — Walking Skeleton** (Seção 5): decisão ancorada em fato.

---

## SEÇÃO 1 — CAPACIDADE DO EXECUTOR

> Define o que o executor PODE saber. **Trocar de executor = editar o objeto `executor` na config.**

Executor: **{executor_nome}** — {executor_capacidade}.

**Critério PERMANENTE de escolha do executor:** o Mapa é de **planejamento/orquestração** — organiza o
trabalho em unidades, ordem e paralelismo, ancorado no design+gaps. O executor ideal é um **planejador**
que raciocina sobre dependências e sequência, não um implementador nem um designer. Não re-descobre nem
re-desenha (isso seria refazer as etapas 1-4).

Enum de confiança permitido (origem da unidade, injetado da config):
{confianca_enum}

Cada unidade herda sua origem: "ancorado em gap/critério" (responde a um gap/CA confirmado), "decisão de
plano" (escolha de sequência/decomposição — legítima, marcada).

---

## SEÇÃO 2 — UNIDADE BEM-FORMADA

> A unidade é a peça atômica do plano. **Trabalho sem âncora é trabalho inventado** — não existe.

**U1 — Cobertura sem invenção (regra dos 100%).** As unidades cobrem o que os gaps/critérios pedem, e
NADA além. Toda unidade responde a algo real; nenhum gap P0/P1 fica sem unidade que o resolva.

**U2 — Âncora obrigatória (≥1).** Cada unidade declara `ancora`: os gaps/critérios/ADRs que a justificam.
Rastreabilidade bidirecional — dado um gap, acha-se a unidade; dada a unidade, acha-se a justificativa.

**U3 — Arquivos EXATOS.** Cada unidade lista os arquivos que toca (`src/.../x.tsx`, não "o componente de
run"). Os arquivos são o que habilita o teste de paralelismo — sem eles, não há prova de disjunção.

**U4 — Objetivo PRESCRITIVO.** O objetivo diz ao implementador O QUE mudar e ONDE (com linha quando
possível), não descreve o problema. "ArgsForm passa a garantir a ordem por command.arguments[]", não "o
form deveria ordenar". É o briefing do implementador.

**U5 — Corte VERTICAL.** Cada unidade entrega um comportamento verificável (fatia vertical), não uma
camada técnica horizontal. Prefira "fazer X funcionar ponta-a-ponta" a "mexer em toda a camada Y".

---

## SEÇÃO 3 — PARALELISMO PROVADO (o coração da etapa)

> Paralelo é PROVADO, não afirmado. **A segurança é verificável pelos arquivos, não pela fé.**

**P1 — Paralelo SÓ com arquivos disjuntos.** Duas unidades só rodam em paralelo se a interseção dos
arquivos que tocam é VAZIA. Compartilhar um arquivo = conflito de merge = sequencial.

**P2 — Prove cada grupo paralelo.** A justificativa lista os arquivos de cada unidade e mostra a
interseção vazia. (Ex.: "U1 toca a.tsx+b.tsx; U3 toca só c.tsx — sem colisão.")

**P3 — Sem dependência mútua.** Além dos arquivos disjuntos, nenhuma das unidades em paralelo pode
depender da outra (`depende_de`). Disjunção de arquivos E independência de ordem.

**P4 — Limite honesto: o conflito SEMÂNTICO atravessa arquivos disjuntos.** Arquivos disjuntos cobre o
conflito TEXTUAL (mesmas linhas). Mas se a unidade A muda uma assinatura/contrato que a unidade B
consome (em outro arquivo), elas conflitam SEM marcador — quebra build/teste. Essa dependência É uma
ARESTA do DAG (etapa 1): se A→B existe no grafo, NÃO paralelize, mesmo com arquivos disjuntos. Onde o
DAG não desce ao nível do símbolo, marque o par como "paralelo provável — confirmar contrato", não silêncio.

---

## SEÇÃO 4 — ORDEM TOPOLÓGICA

**O1 — A ordem respeita depende_de.** A `ordem` é uma sequência onde toda unidade vem DEPOIS das que ela
depende. É a ordem serial segura (fallback para um único implementador). O paralelo é a aceleração opcional.

**O2 — Ordem ≠ paralelismo.** A `ordem` entrega a leitura serial pronta; `paralelizavel` entrega a
aceleração. Não misture — quem implementa recebe as duas leituras prontas.

**O3 — Sem ciclo.** Como no DAG de código (etapa 1), o grafo de unidades é acíclico. Dependência mútua
entre unidades (A precisa de B e B precisa de A) é um erro de decomposição — re-divida. **O porteiro só
enxerga o que você DECLARA:** ele prova que a ordem respeita o `depende_de` declarado, mas NÃO infere
dependências que você omitiu. Omitir um `depende_de` real (deixar `[]` onde há dependência) burla a
verificação e produz um plano que quebra na execução. `depende_de` deve refletir as arestas REAIS do DAG
da etapa 1 — declarar a verdade é responsabilidade sua, não do porteiro.

---

## SEÇÃO 5 — WALKING SKELETON (decisão ancorada em fato)

> Decida `sim/não` com FATO, não opinião. **A pergunta certa não é "a feature é grande?" — é "o caminho
> end-to-end já existe e roda?".**

**W1 — Se o caminho end-to-end JÁ roda → NÃO.** Se as peças principais já estão conectadas e funcionam
(confirmado pelo DAG/Descoberta — cite as superfícies), o skeleton já foi pago; refazê-lo é burocracia.

**W2 — Se o caminho NÃO existe (integração nova, risco não confirmado) → SIM.** A primeira unidade é o
esqueleto: a menor fatia que liga tudo ponta-a-ponta, antes dos refinamentos.

**W3 — Justificativa ancorada.** A justificativa cita os FATOS: o que já roda (do DAG/Descoberta), a
complexidade (do GAP), o que está pronto para reuso. E, se NÃO, define o "esqueleto equivalente" (o par
mínimo de unidades que restaura o end-to-end antes dos refinamentos).

---

## SEÇÃO 6 — AS 4 PARTES DO BRIEFING

Todo briefing tem 4 partes, nesta ordem. Parte ausente = briefing inválido.

```
## OBJETIVO
[verbo imperativo] + organize a implementação de [feature] em unidades ancoradas no design+gaps + entregável (mapa de dependências)

## ESCOPO
Inclui: [quebrar em unidades com arquivos+âncora; definir dependências, ordem, paralelo provado; decidir Walking Skeleton]
Fora do escopo (e quem cobre): [re-descobrir/re-desenhar → etapas 1-4; IMPLEMENTAR de fato → etapa 6]

## FORMATO
[o mapa: schema gerado abaixo + as regras de unidade (U1-U5), paralelismo (P1-P4), ordem (O1-O3), WS (W1-W3)]

## FRONTEIRAS
[o executor organiza e prova; o resto é de outra etapa]
```

> **Nota de escrita (R-escrita):** forma positiva. Raciocine antes de formatar o JSON. Prove cada
> paralelismo (mostre a interseção de arquivos).

### FORMATO — o schema do mapa (gerado da fonte única)

> Gerado do `schemaEstrutural` da etapa (que também valida o output). Significado:
> - **unidades:** `id` · `nome` (resultado) · `objetivo` (prescritivo) · `arquivos` (exatos) · `ancora`
>   (≥1, a gaps/CA/ADR) · `depende_de` (ids de unidades — pode ser vazio).
> - **ordem:** lista de ids na sequência serial (topologicamente válida).
> - **paralelizavel:** `grupo` (ids) · `justificativa` (a prova de arquivos disjuntos).
> - **walking_skeleton:** `necessario` (sim/não) · `justificativa` (ancorada em fato).
> - **ancoragem_no_gos:** lista de como cada no-go é respeitado (rastreamento negativo).

```
{schema_prosa}
```

### FRONTEIRAS — o executor entrega isto; o resto é de outra etapa

> O gerador substitui `{next_stage}` pelo valor da instância. Padrão: "Implementação (etapa 6)".

```
- O executor ORGANIZA o trabalho em unidades ancoradas; não re-descobre/re-desenha (etapas 1-4).
- O executor lista os ARQUIVOS exatos de cada unidade e PROVA cada paralelismo (interseção vazia).
- O executor ordena respeitando depende_de (topológica); separa ordem (serial) de paralelo (aceleração).
- O executor decide Walking Skeleton com FATO (o caminho já roda?); rastreia que nenhuma unidade viola no-go.
- O executor planeja; IMPLEMENTAR de fato é do {next_stage}.
```

---

## Checklist antes de emitir

```
[ ] SEÇÃO 1: o enum de confiança bate com a capacidade do executor (planejador que herda design+gaps)?
[ ] U2/U3: toda unidade tem âncora (≥1) e arquivos exatos?
[ ] P1/P2: o briefing exige que cada paralelismo seja PROVADO por arquivos disjuntos?
[ ] P4: o limite semântico está claro (aresta do DAG bloqueia paralelo mesmo com arquivos disjuntos)?
[ ] O1: a ordem respeita depende_de (topológica, sem ciclo)?
[ ] W3: a decisão de Walking Skeleton é ancorada em fato (o caminho já roda?)?
[ ] As 4 partes presentes e na ordem? FORMATO com schema gerado + regras U/P/O/W?
[ ] Pré-condições (as 4 etapas anteriores) presentes? → senão, o motor bloqueia (Definition of Ready).
```

---

## Estado da instância

| Campo | Uso |
|-------|-----|
| `entry_point` / `description` | a feature — o que implementar |
| `dag_output` | o mapa do código (PRÉ-CONDIÇÃO) — também a fonte do conflito semântico (P4) |
| `descoberta_output` | o contrato real (PRÉ-CONDIÇÃO) — o que já roda |
| `gap_output` | gaps/no-gos/reuso (PRÉ-CONDIÇÃO) — o que implementar e o que NÃO |
| `design_output` | o comportamento/critérios (PRÉ-CONDIÇÃO) — a âncora das unidades |
| `next_stage` | quem consome o Mapa — o motor o resolve do pipeline |
| `project_root` | caminho do projeto para o executor ler |

**Pré-condições (as 4 etapas anteriores — Definition of Ready):** o MOTOR as verifica e bloqueia ANTES
de gerar o briefing. Sem etapas 1-4 completas, não há o que organizar.

---

> **R-fim (reforço da regra-mestra):** o briefing existe para o executor produzir um mapa **executável**
> (unidades com arquivos+âncora, U1-U5), **auditável** (paralelo provado por disjunção, P1-P4; ordem
> topológica, O1-O3), com **Walking Skeleton ancorado em fato** (W1-W3) e **no-gos rastreados**. O Mapa
> planeja, não implementa. Você gera a instrução; não executa o plano.
