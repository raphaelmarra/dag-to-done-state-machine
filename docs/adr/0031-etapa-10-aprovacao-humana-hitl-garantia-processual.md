# 0031 — Etapa 10 (Aprovação humana): HITL com dossiê derivado e garantia processual (KISS)

- Status: accepted
- Data: 2026-06-29
- Relacionado: 1ª etapa de gênero NÃO-CORE (executor = humano, não agente LLM); reusa `regraCampoIgual`
  fail-closed (ADR 0024/0030), o validador estrutural `tipo:"string"` (ADR 0030), a injeção de conteúdo
  derivado por placeholder (espelho de `{schema_prosa}`); abre A019 (autenticidade processual, irmã de A018).

## Contexto e Problema
A etapa 10 é o último checkpoint humano antes do deploy (10 → 11 Done → 12 Smoke/produção). Ela QUEBRA o molde
das etapas 1-9: não há agente executor (o "executor" é o humano), logo não há CORE meta-prompt. E o risco se
INVERTE — nas etapas 1-9 o risco é o agente fingir trabalho; aqui é o agente, que DIRIGE o pipeline, fingir a
APROVAÇÃO humana (escrever `decisao:"aprovado"` sem que ninguém tenha aprovado). Três tensões: (1) que forma
dar a uma etapa sem CORE? (2) quanto gate formal é demais? (3) como manter o "H" do HITL se o agente pode rodar
qualquer comando?

## Decisão
**KISS-com-fala-humana: dossiê derivado do estado + garantia PROCESSUAL declarada honesta.** Concretamente:

1. **Mecanismo de motor leve, não CORE.** O `dag next` injeta `{dossie_aprovacao}` — um resumo LEGÍVEL para o
   HUMANO (não briefing-para-LLM), derivado do estado das 9 etapas: o que foi construído (design), o veredito
   de cada gate (A/B/a11y), e **o que ficou FORA** (`fica_para_humano` do Gate B + riscos do pre-mortem + o
   limite A018). É conteúdo gerado de fonte única (o estado real), como `{schema_prosa}`. O motor permanece
   genérico: a etapa declara `dossie:true` e o motor injeta — não cita a etapa por nome (M1).

2. **Porteiro fail-closed binário.** Schema mínimo (`aprovado_por` texto + `decisao` ∈ {aprovado,rejeitado};
   `observacao` opcional). Só `decisao:"aprovado"` avança; `rejeitado` é output VÁLIDO mas BLOQUEIA (a feature
   fica parada — reabrir a implementação é do operador; o motor não rebobina o DAG). É a regra inviolável do
   HITL: aprovação ANTES do side-effect irreversível (o deploy).

3. **Garantia PROCESSUAL, não criptográfica (dívida A019).** Gate formal pesado (tamper_hash, frase-segredo,
   cripto) é over-engineering: num pipeline dirigido por agente, um hash gerado pelo motor que o agente invoca
   não prova nada contra o agente. A garantia real e barata: o core INSTRUI o agente a mostrar o dossiê,
   ESPERAR uma fala humana de OK ("tá bom" basta) e NÃO fabricá-la. A diferença para "o agente aprova sozinho"
   é uma linha — e é o que mantém o H do HITL.

## Motivo
Decidido com pesquisa de HITL 2026 (Awesome Agentic Patterns; cordum.io; n8n Production AI Playbook): o consenso
é "gate por blast radius, não cerimônia em todo ponto — vira fila/fadiga", MAS "approvals must happen before
side effects, not after, senão é retrospective review, não HITL". O deploy é esse side-effect, então remover o
gate humano (deixar o agente aprovar sozinho) descaracterizaria o HITL — e mantê-lo cerimonioso seria o
over-engineering que a pesquisa condena. KISS-com-fala-humana é o ponto entre os dois. Validado em 3 peças, cada
uma TDD (RED→GREEN) + verificador cego independente: peça 1 (schema+fail-closed) ratificada sem furo; peça 2
(dossiê) resistiu a 24 estados degenerados + o ataque de re-substituição de placeholder, com 2 fraquezas
latentes corrigidas (fica_para_humano como lista-de-objetos; objetivo como string direta). Encadeamento real
das 10 etapas testado (o dossiê embute dados promovidos pelo fluxo, não montados à mão). Suíte v1 **227/227**.

## Consequências
**A tese de amortização sustenta-se na etapa de gênero mais distante (HITL):** ZERO mecanismo de validação novo
(o porteiro é 1 `regraCampoIgual`); a única adição de motor é 1 ramo declarativo (`dossie:true` →
`{dossie_aprovacao}`), espelho de `{schema_prosa}`. O gerador de dossiê é conteúdo, fail-safe (nunca crasha,
vaza `[object Object]`, nem mente verde em campo ausente). **Limite epistêmico declarado (dívida A019):** a
autenticidade da aprovação é processual — o motor não prova que um humano aprovou; confia na fala humana real
na conversa, mitigado por fail-closed + o operador acompanhando. A correção estrutural (aprovação num canal que
o agente não controla — GitHub Environments com required reviewers, ou webhook humano) sai do "Node puro, zero
deps" (ADR 0001) e fica adiada até o pipeline rodar não-supervisionado em CI (M4). **Marco:** 10/13 etapas
completas. Próximo: etapas 11 (Done), 12 (Smoke), 13 (Retrospectiva) — gêneros sistema/devops/documentador.
