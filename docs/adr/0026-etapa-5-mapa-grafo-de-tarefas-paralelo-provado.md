# 0026 — Etapa 5 (Mapa de dependências): grafo de tarefas com paralelo PROVADO

- Status: accepted
- Data: 2026-06-28
- Relacionado: CORE-MAPA (etapa 5); concretiza ADR 0010 (Walking Skeleton como decisão do mapa); reusa
  o grafo da etapa 1 (ADR 0021/0022) aplicado a TAREFAS; reusa `regrasExtras` (ADR 0024); ABERTO A014.

## Contexto e Problema
A etapa 5 é o **último ato antes de implementar**: organiza o trabalho em unidades, define a ORDEM segura
e diz o que pode rodar em PARALELO. O risco real do paralelismo é silencioso — duas unidades "paralelas"
que tocam o mesmo arquivo geram conflito de merge; pior, uma que muda um contrato que a outra consome quebra
o build SEM marcador textual. Como gatear "isto pode ser paralelo" de forma mecânica, não por fé na prosa?

## Decisão
**O mapa é um GRAFO de tarefas — a mesma disciplina do DAG de código (etapa 1), aplicada a unidades de
trabalho.** Unidade = nó; `depende_de` = aresta; a ordem é uma topo-sort; paralelo exige independência.
Concretamente, o porteiro valida:
1. **Unidade bem-formada:** `ancora` (≥1 — trabalho sem âncora é inventado), `arquivos` exatos (habilitam
   a prova de paralelismo), `objetivo` prescritivo. Sem âncora ou sem arquivos → REPROVA.
2. **Paralelo PROVADO por arquivos disjuntos** (`regraParaleloDisjunto`): cada grupo paralelo tem interseção
   de arquivos vazia E nenhuma dependência mútua interna (P1+P3). É prova mecânica, não afirmação.
3. **Ordem topológica** (`regraOrdemTopologica`): a ordem cobre todas as unidades exatamente uma vez e toda
   dependência aparece ANTES. Ciclos são pegos (um ciclo torna qualquer ordem linear não-topológica) sem
   travessia recursiva — O(V·E), termina sempre.
4. **Walking Skeleton decidido com FATO** (`necessario` sim/não + justificativa): a pergunta é "o caminho
   end-to-end já roda?", não "a feature é grande?".
5. **Executor `Plan`** (planejador — organiza, não implementa); confiança = origem ("ancorado em
   gap/critério" / "decisão de plano").

## Motivo
Validado pela rotina 0→4: um `task-decomposition-expert` cego executou o briefing gerado e produziu um mapa
aprovado pelo porteiro (4 unidades com arquivos+âncora exatos, ordem topológica, grupo paralelo provado
disjunto, Walking Skeleton=não ancorado em fato) + anti-viés saturado (3 verificadores). A revisão achou e
FECHOU: ordem com ids duplicados mascarava violação topológica (`Map.get` pegava a última posição);
unidade sem arquivos era tratada como "trivialmente disjunta"; enum misto string/boolean → padronizado
`["sim","não"]`. E adicionou rede de regressão para o caso mais perigoso — CICLO (incl. auto-dependência),
confirmado que REPROVA sem travar. Custou ZERO mecanismo novo no motor: duas regras de domínio (~40 linhas),
nada de fontanária — a tese de amortização (ADR 0024) se mantém na 5ª etapa.

## Consequências
**Reuso conceitual do grafo, não só da infra:** o conflito SEMÂNTICO do paralelismo (mudança de contrato
que atravessa arquivos disjuntos) É uma aresta do DAG da etapa 1 — as duas etapas se referenciam no mesmo
grafo. **Limite epistêmico declarado (CORE §4 O3, §3 P4):** o porteiro só enxerga o que é DECLARADO — prova
que a ordem respeita o `depende_de` declarado, mas não infere dependências omitidas, nem cruza `ancora` com
os ids reais das etapas anteriores. Cruzar âncora↔fonte exigiria passar o ESTADO às `regrasExtras` (mudança
de fundação no motor) — adiado por M4 (sem 2º caso) e registrado em ABERTO A014; a honestidade vive no CORE
e o Gate A (etapa 7) revisa o plano adversarialmente. Concretiza ADR 0010: "Walking Skeleton é decisão do
mapa" deixa de ser intenção e vira campo gateado com justificativa ancorada em fato.
