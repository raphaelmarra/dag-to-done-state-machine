# 0024 — Etapa 3 (GAP) + regras de aceitação declarativas (regrasExtras)

- Status: accepted
- Data: 2026-06-28
- Relacionado: CORE-GAP (etapa 3); resolve A012; reusa infra das etapas 1-2 (ADR 0020/0021/0022/0023)

## Contexto e Problema
A etapa 3 (GAP) confronta o que foi descoberto (DAG + API) com o que a feature precisa. O critério
oficial exige rigor: cada gap com evidência, "impossível" só com ângulos tentados, no-gos explícitos,
complexidade justificada. Além disso, o `aceita` das etapas estava fragmentado em 3 dialetos (presença,
estrutura, e condição custom — em dois sabores: `.filter` imperativo e `comCondicao`). A012 pedia unificar.

## Decisão
1. **`regrasExtras` declarativo (resolve A012):** uma etapa declara `schema` + `schemaEstrutural` +
   `regrasExtras: [(output)=>{ok,faltando}]`. O motor compõe as três camadas (`avaliarEtapa`): presença
   → estrutura → regras. O `aceita` custom imperativo foi eliminado; `comCondicao` foi deletado e os 4
   gates migrados para `regrasExtras`. Fábricas reutilizáveis: `regraEvidenciaObrigatoria` (usada pela
   etapa 2 E 3), `regraCampoIgual` (gates).
2. **Executor `error-detective`** — analista que CONFRONTA o já descoberto; não re-descobre, não toca rede.
3. **Honestidade estrutural da etapa 3:** o porteiro REPROVA — gap sem evidência (E1); gap "impossível"
   sem `angulos_tentados` (E3); no-go sem os 3 campos (o_que/motivo/destino); resumo que mente sobre a
   lista; complexidade incoerente com os drivers (X2, computada — não opinada).

## Motivo
Validado por teste de generalidade (um error-detective cego executou o briefing gerado, confrontando o
código real do ravi; achou 4 gaps provados, complexidade computada; o porteiro aprovou) + anti-viés
saturado (3 verificadores: code-reviewer, auditor-v2, backend-architect — acharam e corrigiram 4 itens,
incl. o mesmo bug F3 de paridade — `angulos_tentados` prometido e não exigido). A tese de amortização
foi confirmada com número: a etapa 3 custou ~16 linhas de mecanismo novo (uma regra própria) + ~47 de
dados, e ZERO mudança no motor.

## Consequências
O padrão de validação agora é único e declarativo — os gates (etapas 7/9), quando destilados, já nascem
com `regrasExtras`. A regra de complexidade impõe só a coerência grosseira (pesos provisórios — a banda
exata fica para validação futura quando houver mais casos). A heurística de "impossível" (E3) é por texto
na descrição — registrada como aproximação até haver um campo estruturado, se necessário.
