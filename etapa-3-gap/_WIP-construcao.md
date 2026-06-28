# _WIP — Construção da Etapa 3 (GAP)

> Rotina 0→4. Status: em execução (autônoma). Pesquisas em `research/01-04`. Caso real:
> `MVP/evidencia-teste-aba-clis/gap.output.json`.

## FASE 0 — Vereditos das mudanças candidatas

### Herdado (mecanismo do motor — só declarar o dado da etapa 3)
Substituição de placeholder, validação estrutural recursiva (com o flag `presente`), gerador de prosa,
bloqueio de pré-condição, estado curado, promoção de `<etapa>_output`. **Tudo reusável.**

### Próprio da etapa 3 (decisões de design, com veredito)

| # | Mudança | Veredito | Fonte |
|---|---------|----------|-------|
| G-A | **Executor = `error-detective`** (analista — confronta, não descobre) | ACEITA, mas VALIDAR (como Explore/fiscal) | PIPELINE; P1 |
| G-B | **Enum de confiança próprio** (a etapa não toca nada — herda evidência das anteriores): `confirmado na descoberta` / `inferido do código` / `a confirmar via spike` | ACEITA | P2; caso real |
| G-C | **Taxonomia de categorias** (P1): gaps (falta) · pronto_para_reuso (Fit) · no_gos (Won't) · incertezas (Spike) | ACEITA — é a taxonomia Fit/Partial/Gap/N-A da indústria | P1 |
| G-D | **Cada gap exige EVIDÊNCIA** (trio: afirmação + busca + sinal) — o porteiro REPROVA gap sem evidência | ACEITA (estrutural — achado P2) | P2; critério oficial |
| G-E | **"Impossível" exige ≥1 ângulo tentado** (`angulos_tentados`) | ACEITA (estrutural) | P2; critério oficial |
| G-F | **Complexidade COMPUTADA dos gaps** (drivers: nº P0/P1, integrações, incerteza), não opinada | ACEITA — mas PROVISÓRIO (pesos/limiares a validar) | P3; confronta ADR 0013 |
| G-G | **No-go com 3 campos** (o-quê / motivo / destino) — senão é omissão | ACEITA | P4; caso real |
| G-H | **Incerteza com Spike nomeado** (incerteza + spike executável) | ACEITA | P4; caso real |
| G-I | **Pré-condições: dag_output E descoberta_output** (confronta os dois) | ACEITA | PIPELINE; P1 (a etapa confronta o que as 2 anteriores entregaram) |

### ⚖️ DECISÃO A012 — `regrasExtras` declarativo (o 2º caso chegou)
A etapa 2 teve 1 regra custom (evidência). A etapa 3 terá VÁRIAS (G-D evidência por gap, G-E ângulos por
"impossível", G-F complexidade computada). Esse é o 2º+ caso → **implementar o `regrasExtras` agora** (M4:
2 casos guiam o design). Em vez de empilhar `.filter` no `aceita`, o motor passa a compor uma lista de
`regrasExtras: [(o)=>{ok,faltando}]` após `validarEstrutura`. Migrar a etapa 2 e os gates (`comCondicao`)
para o mesmo formato. **Decisão: SIM, fazer na Fase 2.** Unifica o padrão antes que os gates fragmentem.

**Portão 0:** vereditos com fonte. Os estruturais (G-D, G-E, G-F) são o coração — a honestidade do GAP
é imposta pelo porteiro, não confiada ao agente. Convergente com etapas 1-2.

---

## FASE 1 — Padrão-ouro (caso real + cego, fundidos)

### O que o CEGO destilou (princípios frescos)
1. **Separar quebras (P0) / alinhamentos (P1) / indefinições (P2)** — priorização por consequência.
2. **Evidência em DOIS planos:** descoberta ao vivo + código-fonte (arquivo:linha). Auditável.
3. **Citar artefatos, não interpretações** — "API retornou ValidationError X", não "parece que".
4. **Admitir fragilidade explicitamente** — se não confirmou, diz "inferido, não confirmado ao vivo".
5. **Prioridade = consequência** (P0 quebra / P1 regressão silenciosa / P2 decisão), não opinião.
6. **No-go = sentença de escopo com motivo** (arquitetural ou de contrato), não "não vamos fazer".
7. **Incerteza → Spike nomeado** (plano executável com entrada/saída), nunca suspensão vaga.
8. **Complexidade = equação aberta** (base existe + N contratos confirmados − M correções = banda).

> Frase do cego: *"prova cada afirmação com artefatos auditáveis, admite incertezas, traduz incerteza em
> spike concreto, e justifica escopo/prioridade/complexidade como equação — nenhum gap fica solto."*

### O que EU estruturo (o que o motor/porteiro exige) — fusão com o cego
- Confiança por item como **enum fechado** (G-B) — o porteiro valida.
- **Evidência obrigatória por gap** (G-D): o porteiro reprova gap sem `evidencia`. O cego viu a evidência
  existir; eu a torno *exigível* via `regrasExtras`.
- **Complexidade computada** (G-F): o cego viu a "equação aberta"; eu a torno *mecânica* (drivers→banda).
- **Schema estrutural** reusando o validador: gaps/pronto_para_reuso/no_gos/incertezas como listas tipadas.

### Padrão-ouro fundido (alvo do CORE-GAP) — cada endpoint do output:
- **gaps[]**: `id` · `descricao` · `prioridade` (P0|P1|P2) · `evidencia` (obrigatória) · `categoria`
  (quebra|alinhamento|indefinicao) · `angulos_tentados` (se descrito impossível)
- **pronto_para_reuso[]**: `item` · `por_que_serve` (o "não reconstruir" da Microsoft)
- **no_gos[]**: `o_que` · `motivo` · `destino` (desta-feature | de-propósito | de-outra-etapa)
- **incertezas[]**: `incerteza` · `spike` (plano executável)
- **complexidade**: banda (simples|média|alta) + `drivers` (contagens) + justificativa derivada
- **resumo**: contagens por categoria/prioridade

### Racional destilado (invariante vs variável — M3)
- **Invariante (regra do CORE):** evidência-por-gap; prioridade-por-consequência; no-go-com-motivo-e-destino;
  incerteza→spike; complexidade-computada-dos-drivers; admitir fragilidade. Estruturais, impostas pelo porteiro.
- **Variável (lido da demanda):** quais gaps, quais reusos, quais no-gos — vêm do confronto dag_output ×
  descoberta_output × o que a feature precisa. O CORE não fixa; o executor extrai.

> ✅ ETAPA 3 FINALIZADA em 2026-06-28 (ADR 0024, CORE-GAP v1.0, testada por cego, 75/75). Este arquivo
> é o REGISTRO HISTÓRICO — não editar.

## FASES 2-4 — concluídas
- **Fase 2:** `regrasExtras`/`avaliarEtapa` implementados no motor (A012 resolvida — `comCondicao`
  deletado, gates migrados, fábricas `regraEvidenciaObrigatoria`/`regraCampoIgual`). CORE-GAP escrito.
  Etapa 3 declarada (executor error-detective, schema rico, regras estruturais E1/E3/X2/resumo).
- **Fase 3 (teste de generalidade):** error-detective cego executou o briefing gerado → 4 gaps provados,
  complexidade computada → porteiro APROVOU, avançou para Design. Anti-viés saturado (3 verificadores)
  achou e CORRIGIU 4 itens: angulos_tentados (E3, bug F3 de paridade), resumo mentiroso, banda média cega,
  gates não-migrados. Tese de amortização confirmada (~16 linhas de mecanismo, 0 de motor).
- **Fase 4:** cristalizado — ADR 0024, CORE v1.0, ROADMAP 3/13, A012 resolvida, governança atualizada.
