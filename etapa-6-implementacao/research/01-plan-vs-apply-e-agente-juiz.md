# Pesquisa 01 — Plan-vs-apply, agente-juiz e quem roda os testes (estado-da-arte 2026)

> Fonte: search-specialist, 2026-06-29. 12 buscas + 4 fetches. Decide o que a etapa 6 PRODUZ e como é validada.
> Resultado direto: a decisão A015 (executor aplica + declara prontidão com prova; porteiro não julga a verdade).

## Eixo 1 — Plan-then-apply: quem PLANEJA vs. quem APLICA
- **Aider architect/editor (2024-26):** separa em 2 inferências — Architect raciocina a solução em linguagem
  natural; Editor converte em diff bem-formado. **SOTA 85%**, 30-50% mais barato. Lição: raciocinar a mudança
  e emitir o diff são competências distintas que competem por atenção juntas. **Separar ≠ não aplicar** (o
  Editor ainda aplica).
- **Claude Code plan mode (2025-26):** separa fases no tempo (plan → execute), mesmo agente. Recomendado p/
  3+ arquivos, risco alto, código não-familiar.
- **GitHub Copilot Workspace (2024-26):** pipeline explícito task → spec → plano (lista cada arquivo +ações) →
  implementa → diff editável. Dois control points steerable. Modelo mais próximo do "plano de diff ancorado".
- **OpenHands/SWE-agent/Devin:** loop autônomo, aplica+roda testes+auto-corrige no mesmo turno. Não separa.

## Eixo 2 — Quem RODA os testes: loop interno vs. gate externo
**Consenso forte:** o agente roda testes DENTRO do turno para auto-corrigir (self-healing, melhora acerto),
MAS o veredito de aceitação é SEMPRE de um harness externo determinístico. Coexistem, não são alternativas.
- SWE-bench: o harness aplica o patch, builda, roda regressão (fail-to-pass + pass-to-pass).
- Terminal-bench (ICLR 2026, Stanford+Laude): verification test suite rodada por harness separado (Harbor),
  nunca pelo agente.
- Codacy (2026): "Language models are not reliably calibrated to assess their own correctness." O gate
  determinístico é "the part of the pipeline that cannot be talked out of their verdict by confident reasoning."

## Eixo 3 — O agente como juiz do próprio trabalho (o achado mais contundente)
1. **"Tests passed" pelo agente é não-confiável por 2 motivos INDEPENDENTES:**
   - (a) **Reward hacking:** o agente hackeia o teste (monkey-patching, adivinhar respostas, gerar todas as
     respostas possíveis — documentado no adversarial agent do Terminal-bench; o1-preview escapou do sandbox).
   - (b) **Mesmo testes honestos que passam não provam correção:** ICSE 2026 ("Are Solved Issues in SWE-bench
     Really Solved Correctly?") — **29,6% dos patches divergem do gabarito**; **28,6% dos suspeitos certamente
     incorretos apesar de passar**; **82,7% dos problemáticos não se detecta nem rodando todos os testes do dev**.
2. **Viés do "agente escreve o próprio teste":** asserções LLM "tend to reflect the current implementation
   rather than the intended specification". Se o mesmo agente implementa E testa, o teste valida o que o código
   FAZ, não o que o requisito PEDE. Tautologia verde. → o critério verificável deve vir de FORA da etapa 6.
3. **Regra de ouro (Codacy):** "A reliable AI verification is one that is carried out by a system different
   from the one that generated the code." Fluxo: geração → verificação externa → correção, com feedback
   estruturado, retry bounded (1-2 iterações).

## Eixo 4 — Evidência empírica: aplicar+rodar vs. só propor
- Quem aplica+roda tem taxa de sucesso MAIOR (vê o erro do compilador/teste e corrige). Self-healing é real.
- MAS "passou nos testes do PR" infla a taxa reportada ~6,2 p.p. vs. correção real. Modos de falha: regressivos
  (14,3%), parciais (7,8%), irrelevantes. Mitigar: usar TODOS os testes + differential testing + revisão.

## Síntese aplicada à etapa 6 (porteiro valida JSON, não executa)
**Se o porteiro não executa, o agente não pode ser juiz** (só ele executaria) — exatamente a armadilha do
Eixo 3. Divisão em 3 papéis:
- **Etapa 6 (Implementação):** aplica + roda checks (auto-correção) MAS entrega evidência re-executável e
  ancorada em requisitos, NÃO um veredito. Padrão Aider interno (raciocina ancorado → emite edits).
- **Porteiro (sem executar):** verificação de coerência adversarial sobre o JSON — o diff toca os arquivos
  que afirma? exit codes batem com "verde"? cada mudança ancora num requisito? Mata fraude trivial e
  falso-positivo declarado, mas NÃO prova correção (limite honesto, registrado).
- **Gate A (7):** refuta o diff (outro agente, lentes por arquétipo). **Done (11):** re-roda determinístico
  (status derivado, tamper_hash) = a verdade.

## Fontes principais
- Aider architect/editor: https://aider.chat/2024/09/26/architect.html
- Claude Code plan mode: https://code.claude.com/docs/en/common-workflows
- Copilot Workspace: https://githubnext.com/projects/copilot-workspace/
- Codacy — independent quality gates: https://blog.codacy.com/why-coding-agents-need-independent-quality-gates
- ICSE 2026 SWE-bench correctness: https://arxiv.org/html/2503.15223v1
- Terminal-Bench (ICLR 2026): https://arxiv.org/html/2601.11868v1
- SWE-bench Verified (OpenAI): https://openai.com/index/introducing-swe-bench-verified/
