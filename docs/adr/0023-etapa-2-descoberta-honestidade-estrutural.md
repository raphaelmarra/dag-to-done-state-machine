# 0023 — Etapa 2 (Descoberta da API): honestidade imposta pelo porteiro

- Status: accepted
- Data: 2026-06-28
- Relacionado: CORE-DISCOVERY (etapa 2); reusa a infra da etapa 1 (ADR 0020/0021/0022); pesquisas etapa-2-descoberta/research/01-04

## Contexto e Problema
A etapa 2 (Descoberta da API) verifica endpoints AO VIVO e marca cada campo como "confirmado ao vivo",
"inferido do código" ou "não verificado". O risco: marcar "confirmado" é uma **auto-atestação** do
agente — e a literatura (SLSA/in-toto sobre claimed-vs-verified; pesquisa de overconfidence de LLM)
mostra que auto-atestação sem prova não basta. Deixar a honestidade depender da boa-fé do agente
repetiria o erro que o projeto combate.

## Decisão
1. **Executor `fiscal`** — ao contrário do Explore (etapa 1, read-only por construção), a etapa 2
   PRECISA tocar a rede, mas o acesso deve ser **read-only por construção** (credencial de leitura,
   ambiente isolado), não por promessa do prompt. Mesmo princípio do executor da etapa 1.
2. **Honestidade ESTRUTURAL:** o porteiro REPROVA todo endpoint marcado "confirmado ao vivo" sem
   `evidencia_ao_vivo` (o que foi chamado + o que retornou) preenchida — e evidência vazia ({}, [],
   string em branco) conta como ausente. A honestidade é imposta pelo formato, não pela boa-fé.
3. **Divergência doc↔realidade é entregável de 1ª classe** (campo próprio), não nota de rodapé.
4. **Promoção de output:** o motor promove `<etapa>_output` para o estado ao aprovar uma etapa, para
   que a etapa seguinte possa exigi-lo como pré-condição (a Descoberta exige `dag_output`).

## Motivo
Validado por teste REAL ao vivo (um fiscal cego executou o briefing gerado, chamando a API de produção
do ravi read-only; achou 3 surpresas e 1 divergência DAG↔realidade) + anti-viés saturado (3
verificadores acharam e corrigiram 4 problemas, incl. o bug da evidência vazia). A etapa 2 reusou a
infra da etapa 1 sem duplicar mecanismo (~50 linhas de config, 0 de motor) — confirmando que a infra
da etapa 1 era investimento amortizável.

## Consequências
O `aceita()` da etapa carrega a regra estrutural (além de presença + schema). Para os GATES (etapas
7/9) que também terão regras próprias, fica registrado o caminho de evoluir o `aceita` custom para um
`regrasExtras` declarativo composto pelo motor (ABERTO — não bloqueia agora). A bidimensionalização da
confiança (fonte × evidência, estilo Admiralty) fica em ABERTO até um 2º caso justificar (M4).
