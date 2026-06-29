# Plano da Etapa 9 — Gate B (Verificação ao vivo)

> Destila e constrói a etapa 9 pela rotina validada (etapas 1-8). Tudo em `etapa-9-gate-b/`. Nasce com TODO o
> aprendizado embutido (3 checagens, paridade, encadeamento das 9, regrasExtras, limite epistêmico).
> **GÊNERO DIFERENTE do Gate A/8** — verifica EXECUÇÃO REAL, não declaração. Veredito QUATERNÁRIO.

## O que é a etapa 9 (do PIPELINE.md, ~l.380)
Executa os cenários preparados e confronta o COMPORTAMENTO REAL (dado real) com os critérios de aceitação do
design. Não é teste de código — é teste de VERDADE. Executor: `fiscal`. Usa o plano preparado em paralelo ao
Gate A (Prep Gate B). Briefing: plano de verificação + critérios do Three Amigos (etapa 4) + bordas do GAP +
riscos do pre-mortem + o que o Gate A sinalizou.

**Entregável:** veredito `verificado | diverge | inconclusivo | precisa-humano` + evidência de cada critério +
o que foi impossível verificar e por quê + cobertura declarada.
**Critério (oficial):** todos os critérios do design verificados ou com justificativa de impossibilidade ·
nenhum `inconclusivo` sem próximo passo · veredito ≠ `diverge` para avançar.

## A personalidade da etapa 9 (o que MUDA vs. as 8 anteriores)
- **GÊNERO DIFERENTE:** verifica VERDADE (chama a API ao vivo), não FORMA de declaração. Não herda o molde do
  catálogo+declaração do Gate A/8.
- **Veredito QUATERNÁRIO:** verificado/diverge/inconclusivo/precisa-humano. `inconclusivo` é honesto e legítimo
  (não consegui verificar ao vivo) — mas precisa de anti-fuga (não marco tudo inconclusivo e passo).
- **JUIZ DA AUTENTICIDADE:** re-verifica o que a etapa 6 declarou e a etapa 8 afirmou ter operado — fecha o ciclo
  "declaração→verdade" que os limites das etapas 6/8 empurraram para cá.
- **PARENTE da etapa 2 (Descoberta):** mesmo `fiscal`, mesma verificação ao vivo, mesma `regraEvidenciaObrigatoria`.
  REÚSO provável (evidência real obrigatória; inconclusivo com motivo via a fábrica de motivo-substantivo).

## TENSÕES (a decidir na Fase 1 — pesquisa é pré-requisito)
- D-1 anti-fuga do `inconclusivo`. D-2 tratamento "sem ambiente ao vivo". D-3 cobertura dos critérios do design.
  Ver _WIP-construcao.md.

## FASE DE PESQUISA (pré-requisito)
1 pesquisa (search-specialist): verificação E2E/smoke contra ambiente real vs mock; o veredito de incerteza
honesta (NUnit "Inconclusive", skipped vs failed); agentes que chamam APIs reais e provam a chamada; ground
truth/dado real; o porteiro que valida a verificação sem re-executar. → `research/01`.

## ROTINA (a mesma — 0→4, com tudo embutido + encadeamento das 9)
Fase 0 → Fase 1 (PESQUISA → decidir D-1/2/3 → 2 casos cegos CONSTRUÍDOS, um com DIVERGÊNCIA → destilar) → Fase 2
(CORE-GATEB + declarar etapa) → Fase 3 (testar: cego + 3 checagens + encadeamento das 9 + anti-viés saturado) →
Fase 4 (cristalizar, ADR 0030).

## ROADMAP
Hoje 8/13. Depois desta: **9/13**. A etapa 9 testa se o método aguenta uma etapa de GÊNERO diferente (verdade,
não forma) e um veredito QUATERNÁRIO com um estado de incerteza honesta (inconclusivo) sem virar buraco.
