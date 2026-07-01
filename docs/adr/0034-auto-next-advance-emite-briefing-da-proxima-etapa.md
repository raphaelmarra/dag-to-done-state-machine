# 0034 — AUTO-NEXT: `advance` ao aprovar já emite o briefing da próxima etapa

- Status: accepted
- Data: 2026-07-01
- Relacionado: reduz a fricção operacional do ciclo por etapa (2 comandos → 1); NÃO altera o modelo de
  execução (agente DIRIGE, motor JULGA — `FLUXO-EXECUCAO.md`); não toca a folga de generalidade nem a
  tensão A009 (fidelidade da delegação continua com o agente principal). Reusa a geração de briefing e a
  checagem de pré-condições existentes (peça 6). Verbo `next` preservado (retrocompatível).

## Contexto e Problema
O ciclo por etapa custava DOIS comandos manuais do agente: `next` (gera o briefing) → [trabalho] →
`advance` (julga e avança) → **`next`** (gera o briefing da nova etapa) → [trabalho] → `advance` → …
O `next` do meio é puro atrito: ao aprovar, o motor já sabe qual é a próxima etapa (`etapaAtual` recalculado)
e tem todo o estado (incluindo os `<etapa>_output` promovidos). Ele apenas *imprimia uma dica* (`próximo:
node dag.mjs next`) em vez de fazer o próximo passo. O operador pediu para eliminar essa digitação: aprovar
deveria já injetar o próximo briefing. Isso é orquestração, não mudança de contrato — o "trabalho" de cada
etapa (o agente raciocinando e delegando) permanece idêntico e fora do motor.

## Decisão
**Ao APROVAR e havendo próxima etapa, o `advance` gera o briefing dela automaticamente — a mesma geração do
`next`.** Concretamente:

1. **Núcleo compartilhado `emitirBriefing(feature, estado, etapa)`.** Extraída de `cmdNext`: checa
   pré-condições, gera o briefing em disco, retorna `{ok, bPath, oPath}` ou `{ok:false, precondicao:[…]}`.
   Não imprime nem muta estado. `cmdNext` e o auto-next do `cmdAdvance` chamam a MESMA função — o handoff por
   arquivo é bit-a-bit idêntico aos dois caminhos. Zero duplicação de lógica.

2. **`advance` só auto-emite no ramo aprovado-com-próxima-etapa.** Reprovação bloqueia na mesma etapa (não há
   próximo briefing a gerar; o atual já está em disco — o agente refaz o output). Etapa terminal não tem
   próxima. Nenhum caso especial novo.

3. **Fallback seguro por pré-condição.** Se a próxima etapa tem pré-condição ausente (ex.: `project_root`
   vazio quando o `init` correu sem `--root`), `emitirBriefing` recusa e o `advance` avisa + pede `next`
   manual — SEM falhar o advance (a aprovação já é fato consumado no estado salvo). Nunca gera briefing
   meio-pronto.

4. **`next` preservado.** Continua existindo e idempotente — para reemitir um briefing ou destravar o
   fallback do item 3. Nenhum teste que roda `next` explícito regride (o `next` vira redundante, não errado).

## Motivo
É a menor mudança que atende o pedido sem tocar no que dá generalidade ao projeto. O que incomodava o operador
era o vai-e-volta manual (item 1 da análise em conversa), NÃO o modelo de execução — e o vai-e-volta é
puramente mecânico: o motor já tinha todo o estado para dar o próximo passo. Tornar o *conteúdo* de cada etapa
determinístico seria impossível (é julgamento de LLM) e indesejável (mataria o CORE genérico, `FLUXO-EXECUCAO.md`);
fundir `next` no `advance` não faz nada disso — o agente ainda lê o briefing e delega como antes. Validado por
teste E2E dedicado (`e2e.test.mjs`, "AUTO-NEXT"): através das 12 transições do pipeline, sem NENHUM `next`
manual, cada `advance` que aprova gera o briefing da próxima etapa. Suíte v1 **239/239** (era 235; +4 testes de
auto-next: caminho feliz das 12 transições, fallback de unidade, fallback INTEGRADO no advance — retorna 0 e
avança mesmo sem poder emitir —, e idempotência de `next` redundante após auto-next). Prova adicional fora do
harness: simulação de demanda real ("adicionar verbo `verify` ao CLI") com subagente `Explore` LLM produzindo o
DAG de verdade, 2 transições de auto-next em cadeia + reprovação não-emitindo, handoff de dados íntegro
(`dag_output`+`descoberta_output` promovidos, zero `[object Object]`).

## Consequências
**Ganho:** o ciclo por etapa cai de 2 comandos para 1 (`advance`); o operador para de ser o botão entre um
verbo e o outro. **Custo:** ~1 função extraída + 1 ramo em `cmdAdvance` + export para teste — nenhuma mudança
de contrato, schema, ou estado persistido. **Nuance descoberta e registrada:** o auto-next é CONDICIONAL às
pré-condições da próxima etapa; rodar `init` com `--root`/`--entry` continua importando (senão o auto-next da
2ª etapa cai no fallback manual — comportamento correto, mas o operador precisa saber). **Não resolvido (fora
de escopo):** um pipeline 100% autônomo fim-a-fim (loop chamando os verbos sozinho, com teto de tentativas e
escape para humano nos gates HITL) permanece uma frente futura — esta ADR só remove a digitação do `next`, não
automatiza o trabalho da etapa nem o disparo do `advance`. A tensão A009 (fidelidade da delegação) segue
intacta e por resolver.
