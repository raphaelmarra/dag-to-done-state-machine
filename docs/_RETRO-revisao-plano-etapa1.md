# Retrospectiva — revisão cega do PLANO-DE-ETAPA (etapa 1)

> Registro da revisão adversarial do plano da etapa 1, feita por um verificador cego independente
> (subagente sem o contexto da conversa) em 2026-06-28, ANTES de iniciar a execução. Provou o valor
> do portão anti-viés: o crítico achou 3 problemas graves que o autor (eu) não tinha visto sozinho.

## Por que esta revisão existe
O operador pediu "revisar o plano para achar gaps ou viés". Revisar o próprio plano seria réu=juiz
(Furo 1 da `_RETRO-metodologia-core.md`). Então apliquei ao plano a mesma regra que o plano impõe às
peças: verificador independente cego. Em paralelo, fiz minha própria auto-crítica e cruzei.

## Cruzamento: o que cada um pegou
- **Eu (auto-crítica) peguei:** exclusão de peças sem evidência; risco de parsear markdown; verificador
  compartilha viés; DoD subjetiva. (4 dos 5 que listei foram confirmados pelo cego.)
- **O cego pegou e eu NÃO vi:** F1 (placeholder `{next_stage}` nunca substituído — bug real no motor),
  F2 (a ordem 1→2→3 se inverte ao ler o código), F7 (estado curado está hardcoded no MOTOR, não no
  config — blast radius nas 13 etapas).
- **Confirmação:** sem o cego, eu teria executado com a ordem errada e classificado um bug como "peça
  ok/trivial". O portão anti-viés se pagou já na primeira aplicação.

## Os 10 findings (resumo; detalhe na crítica original)

| # | Sev | Essência | Correção aplicada no plano |
|---|-----|----------|----------------------------|
| F1 | ALTA | `{next_stage}` nunca substituído; `next_stage` nem existe no estado. Peças Briefing/Handoff presentes mas INERTES, marcadas "ok". | Nova peça 1 (substituição de placeholder no motor); auditoria-base passa a checar consistência CORE↔motor, não só presença. |
| F2 | ALTA | Cadeia "1→2→3" se inverte: executor-como-dado habilita o enum; schema+validação são inseparáveis. | Tracker reordenado (2→3; 4+5 fundidas) com dependências verificadas no código. |
| F3 | ALTA | Derivar schema parseando prosa markdown é frágil e colide com o teste de sincronia byte-a-byte. | Trocado por "schema como DADO ÚNICO (objeto/JSON), injetado no briefing E no validador". Parsing de markdown → DESCARTADO. |
| F4 | MÉDIA | Verificador "cego" é o mesmo modelo/repo → viés compartilhado; plano prometia eliminação. | Contrato regra 4 reescrita: verificador reduz erro de transmissão, NÃO neutraliza viés sistemático; esforço F exige evidência mecânica primária. |
| F5 | MÉDIA | 3 de 5 caixas da DoD são subjetivas (justificado/cita/ratificou). | DoD endurecida: cada caixa com critério objetivo; "citar ≠ sustentar". |
| F6 | MÉDIA | Exclusão de peças 🔵/⚪ é auto-referente (cita a própria taxonomia); spike está no grupo errado. | Tabela de escopo com teste por peça ("o DAG precisa disto p/ a etapa 2?"); spike reavaliado à luz de A5. |
| F7 | MÉDIA | "Estado curado" está hardcoded no MOTOR (montarBriefing), não no config; blast radius nas 13 etapas. | Peça 7 reclassificada como mudança de motor (M-alto), com aviso de blast radius + teste antes. |
| F8 | BAIXA | Sincronia dupla docs↔v1/cores não tratada como restrição da execução autônoma. | Seção "Restrição operacional" adicionada ao plano. |
| F9 | BAIXA | Retry tem evidência no código (bloqueio já feito); marcado "decidir do zero". | Tabela de escopo: Retry = parcial-implementado, falta só destino de regressão. |
| F10 | BAIXA | Drift: comentário de teste lista 3 campos, schema real tem 6. | Sintoma de F3; resolvido ao tornar schema dado único (deriva comentários). |

## O viés-raiz (o achado mais importante)
> A auditoria-base do plano verificou **presença de campos no schema**, não **consistência
> CORE↔motor↔teste**. E a DoD/verificador checavam **presença de citação/ratificação**, não
> **pertinência**. O plano combatia, no produto (o `camposPresentes` do porteiro), exatamente o viés
> que cometia no próprio processo.

Lição permanente para as etapas 2–13: **a auditoria-base de uma etapa deve verificar consistência
entre os artefatos (CORE, motor, teste, config), não apenas presença de campos.** Isso entra como
regra do método.

## Limite desta própria revisão (honestidade recursiva)
O crítico cego é o mesmo modelo que eu. Ele pegou erros de *consistência e lógica* (verificáveis no
código) muito bem — mas um viés que EU e ELE compartilhamos (ambos formados no mesmo treino) pode ter
passado por nós dois. A defesa real contra isso continua sendo o **teste mecânico** e, idealmente, um
revisor humano (você). Esta revisão reduz erro; não o zera.
