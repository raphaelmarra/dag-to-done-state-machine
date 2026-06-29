# 0027 — Etapa 6 (Implementação): handoff verificável + rastreabilidade âncora↔fonte

- Status: accepted
- Data: 2026-06-29
- Relacionado: CORE-IMPL (etapa 6); resolve ABERTO A015 (executor aplica + declara com prova) e A014
  (rastreabilidade âncora↔fonte — estende o motor 1×); reusa `regrasExtras` (ADR 0024) e a fábrica
  `regraEvidenciaObrigatoria` (ADR 0023); complementa ADR 0005 (indicador de confiança); abre A016.

## Contexto e Problema
A etapa 6 é a **1ª que toca CÓDIGO**. As 5 anteriores produzem conhecimento-JSON validado por forma; o
critério oficial da etapa 6 (PIPELINE.md) fala em `tsc/check:contracts/vitest/integrity-check verdes` —
coisas que só se sabe RODANDO comando. Mas o porteiro da state machine valida a forma de um output JSON;
ele não executa `tsc`. Como gatear a implementação de forma determinística sem que o porteiro confie
cegamente numa auto-declaração "passou"?

## Decisão
**O executor APLICA o código e roda os checks; entrega um handoff VERIFICÁVEL com prova; o porteiro valida
forma + rastreabilidade + prova-anexada, NUNCA a verdade.** Concretamente:
1. **Executor que aplica.** O dev (frontend/typescript/fullstack) edita os arquivos e roda os checks no loop
   para auto-corrigir (a maior alavanca de confiabilidade — toda a evidência empírica). Internamente segue o
   padrão Aider (raciocina o plano ancorado, depois emite os edits).
2. **Output = handoff verificável.** `arquivos_alterados` (cada mudança com `ancora`≥1 e `confianca`),
   `golden_path_test` (Given/When/Then com `then` observável + `verifica`), `riscos_de_regressao`, e um bloco
   `prontidao`: cada gate do critério oficial declarado com `estado` ∈ {verde, vermelho, nao_aplicavel} e
   `evidencia`. **Todo estado de gate carrega sua justificativa** — `verde`→prova (exit/log), `nao_aplicavel`
   →motivo, `vermelho`→o erro (3 irmãs via `regraEvidenciaObrigatoria`). `confianca: inferido` exige `nota`.
3. **Rastreabilidade âncora↔fonte (B-restrito).** Toda âncora aponta um id que EXISTE nos outputs das etapas
   anteriores (integridade referencial, não pertinência). Para isso o motor foi estendido 1×: `avaliarEtapa
   (etapa, output, estado)` passa o estado às regras (retrocompatível — regras de aridade 2 ignoram o 3º arg).
   A `regraAncoraRastreavel` é DINÂMICA (M1): varre os `*_output` recursivamente coletando ids no formato de
   âncora (`/^[A-Z]+-?\d+$/`), sem hardcodar nomes de campo. Resolve A014.
4. **Divisão sem duplicar:** 6 declara (com prova) · 7 (Gate A) REFUTA o diff (outro agente) · 11 (Done)
   COMPROVA (re-roda, status derivado, tamper_hash). O autor nunca assina o próprio veredito de verdade.
5. **Executor `frontend/typescript/fullstack`**; confiança = `confirmado` (aplicou sabendo) / `inferido`
   (aplicou supondo — exige nota).

## Motivo
Decidido com pesquisa de estado-da-arte 2026 (Aider architect/editor SOTA 85%; o agente JAMAIS é juiz do
próprio trabalho — reward hacking + ICSE 2026: 28,6% dos patches que passam estão errados; regra de ouro:
verificação por sistema DIFERENTE do gerador). **Restrição-chave:** se o porteiro não executa, o agente não
pode ser juiz (só ele executaria) → a etapa 6 DECLARA, não JULGA. Validado pela rotina 0→4 contra **2 casos
de arquétipos diferentes** (aba CLIs LISTA+correção; editar-perfil MUTACAO+greenfield, com o agente cego
escrevendo 4 arquivos e rodando `tsc` exit 0) — o schema generalizou; o bloco `prontidao` (hipótese) foi
VALIDADO e revelou a regra-gêmea "`nao_aplicavel` exige motivo". Anti-viés saturado (3 verificadores) achou e
FECHOU: varredura de ids rasa que deixava fantasma passar com fonte aninhada (→ recursiva), ids espúrios (→
filtro de namespace), gate vermelho sem evidência, `nota` fora do schema (lente A013). A honestidade imposta
pelo formato (`regraEvidenciaObrigatoria`) é a mesma cristalizada na etapa 2, reaplicada — não fundação nova.

## Consequências
**A tese de amortização se confirma, com nota honesta:** a etapa 6 é a 1ª a tocar o motor em 5 etapas — mas o
toque foi 3 linhas, estrutural (qualquer etapa futura de validação cruzada o usa de graça) e feito 1× para
servir o pipeline inteiro, exatamente como A014 previu. "Zero motor" virou "a fundação evoluiu 1× de forma
genérica e retrocompatível"; o custo marginal de etapa segue baixo (2 funções de domínio + dados). **Limite
epistêmico declarado por seção do CORE:** o porteiro lê o TEXTO da evidência, NÃO re-executa nem sabe se a
prova é real (Gate A/Done), NÃO julga pertinência da âncora (só existência), NÃO detecta unidade omitida em
silêncio (A4 → Gate A). **Dívidas registradas:** A016 (o `nao_verificavel` da rastreabilidade aprova em
silêncio — teórico após a varredura virar recursiva; deixar rastro fica para o Gate A). O `estado` é passado
às regras como cópia rasa congelada (`Object.freeze({...estado})`) — read-only por construção, sem permitir
que uma regra mute o estado real do motor.
