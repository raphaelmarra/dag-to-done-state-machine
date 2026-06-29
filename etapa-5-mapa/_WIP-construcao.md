# _WIP — Construção da Etapa 5 (Mapa de Dependências)

> Rotina 0→4. **Status: ✅ RETIRED — etapa cristalizada (ADR 0026) em 2026-06-28.** CORE-MAPA v1.0,
> suíte 113/113, encadeamento de 5 etapas verde. Anti-viés fechou 3 furos (ordem com id duplicado,
> unidade sem arquivos como "disjunta", enum misto); âncora↔fonte adiada (ABERTO A014). Mantido como
> registro histórico da construção. Pesquisas em `research/01-03` (grafo da etapa 1 reusado).
> Caso real: `MVP/evidencia-teste-aba-clis/mapa_dependencias.output.json`.

## FASE 0 — Vereditos das mudanças candidatas

### Herdado (mecanismo do motor — só declarar o dado)
Substituição de placeholder (serializa objeto), validação recursiva (flag `presente`), gerador de prosa,
bloqueio de pré-condição, estado curado, promoção de `<etapa>_output`, `regrasExtras`. Tudo reusável.

### Próprio da etapa 5 (decisões de design, com veredito)

| # | Mudança | Veredito | Fonte |
|---|---------|----------|-------|
| M-A | **Executor = `Plan`** (PLANEJADOR — organiza trabalho, não produz produto) | ACEITA, VALIDAR | PIPELINE |
| M-B | **Enum de confiança** (a unidade herda do que a ancora): `ancorado em gap/critério` / `decisão de plano` | ACEITA | caso real |
| M-C | **Unidade bem-formada:** id · nome(resultado) · objetivo(prescritivo) · arquivos(exatos) · ancora(≥1) · depende_de | ACEITA (estrutural) | P1; caso real |
| M-D | **Paralelo PROVADO por arquivos disjuntos** — o porteiro verifica MECANICAMENTE: pares paralelos têm interseção de arquivos = ∅ | ACEITA (estrutural — o coração) | P2; caso real |
| M-E | **Limite semântico do paralelismo (honesto):** arquivos disjuntos é NECESSÁRIO mas não suficiente — conflito semântico é aresta do DAG. O porteiro checa o textual; o semântico é herdado/avisado | ACEITA (declarar limite) | P2 |
| M-F | **Walking Skeleton ancorado em FATO:** "o caminho end-to-end já roda?" — justificativa não-vazia | ACEITA | P3; confronta A006 |
| M-G | **Ordem respeita depende_de** — o porteiro verifica que a ordem é topologicamente válida | ACEITA (estrutural) | caso real |
| M-H | **Ancoragem de no-gos:** nenhuma unidade viola um no-go (rastreamento negativo) | ACEITA | caso real |
| M-I | **Pré-condições: as 4 etapas anteriores** (dag+descoberta+gap+design_output) | ACEITA | PIPELINE; Definition of Ready |

### Limite epistêmico (honesto — registrar no CORE)
O porteiro verifica o que é MECÂNICO: arquivos disjuntos nos pares paralelos (interseção de conjuntos);
ordem topológica válida (depende_de respeitado); âncora não-vazia. NÃO verifica: se a decomposição é "a
melhor"; se um conflito SEMÂNTICO existe entre unidades de arquivos disjuntos (isso é aresta do DAG —
herdado/avisado); se a justificativa do WS é "verdadeira". Esses são semânticos → executor + anti-viés.

**Portão 0:** vereditos com fonte. As regras estruturais (M-D, M-G) são o coração — paralelismo e ordem
verificáveis mecanicamente. A honestidade aqui é "o plano é executável e auditável", com o limite declarado.

---

## FASE 1 — Padrão-ouro (caso real + cego, fundidos)

### O que o CEGO destilou (8 princípios frescos)
1. **Tese antes do detalhe** — o resumo diz estado da base + tipo de trabalho + núcleo P0.
2. **Cada unidade tem arquivos EXATOS** — `command-run-section.tsx`, não "o componente de run".
3. **Âncora obrigatória e bidirecional** — dado um gap, acho a unidade; dada a unidade, acho a justificativa.
4. **Paralelismo é PROVADO, não declarado** — interseção de arquivos vazia + sem dependência mútua, mostrado.
5. **Walking Skeleton ancorado em fatos** — cita o artefato anterior (gap.pronto_para_reuso), lista superfícies que já rodam.
6. **No-gos com rastreamento NEGATIVO** — prova que nenhuma unidade viola (positiva ou estrutural).
7. **Ordem separada do paralelismo** — a ordem é o fallback serial; o paralelo é a aceleração opcional.
8. **Objetivo PRESCRITIVO, não descritivo** — "ArgsForm passa a garantir a ordem", com linha citada, não "deveria ordenar".

> Insight do cego: *"o exemplo não apenas afirma o que pode paralelizar — PROVA que o resto não pode"*
> (notas_paralelismo). Paralelismo auditável.

### Fusão = padrão-ouro (alvo do CORE-MAPA) — o output:
- **resumo**: a tese (estado da base + tipo de trabalho + núcleo)
- **walking_skeleton**: `necessario` (bool) · `justificativa` (ancorada: o caminho já roda?)
- **unidades[]**: `id` · `nome` · `objetivo` (prescritivo) · `arquivos[]` (exatos) · `ancora[]` (≥1, a gaps/CA/ADR) · `depende_de[]`
- **ordem[]**: ids na sequência (topologicamente válida)
- **paralelizavel[]**: `grupo[]` (ids) · `justificativa` (arquivos disjuntos)
- **ancoragem_no_gos[]**: como cada no-go é respeitado (rastreamento negativo)

### Racional destilado (invariante vs variável — M3)
- **Invariante (regra do CORE):** unidade com arquivos exatos + âncora; paralelo provado por disjunção;
  ordem topológica; WS ancorado; no-gos rastreados. Estruturais, impostas pelo porteiro.
- **Variável (lido da demanda):** quais unidades, arquivos, dependências, paralelos — vêm do confronto
  design+gap × o que implementar. O CORE não fixa; o executor produz.

> ✅ Fases 0 e 1 concluídas. ▶️ Fase 2: escrever o CORE-MAPA + declarar a etapa (regrasExtras: paralelo
> disjunto, ordem topológica, âncora não-vazia). Depois Fase 3 (testar + encadeamento das 5) e Fase 4.
