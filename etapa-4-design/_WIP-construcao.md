# _WIP — Construção da Etapa 4 (Design)

> Rotina 0→4. Status: em execução (autônoma). Pesquisas em `research/01-04`. Caso real:
> `MVP/evidencia-teste-aba-clis/design.output.json`.

## FASE 0 — Vereditos das mudanças candidatas

### Herdado (mecanismo do motor — só declarar o dado)
Substituição de placeholder (com serialização de objeto), validação estrutural recursiva (flag `presente`),
gerador de prosa, bloqueio de pré-condição, estado curado, promoção de `<etapa>_output`, `regrasExtras`. Tudo reusável.

### Próprio da etapa 4 (decisões de design, com veredito)

| # | Mudança | Veredito | Fonte |
|---|---------|----------|-------|
| D-A | **Executor = `ui-ux-designer`** (DESIGNER — produz decisões, não analisa) | ACEITA, VALIDAR | PIPELINE |
| D-B | **Enum de confiança próprio** (origem da decisão): `ancorado em descoberta` / `decisão de produto` / `a confirmar via spike` | ACEITA | caso real |
| D-C | **Three Amigos: 3 lentes por comportamento** (por_que · como · como_saber→critérios) | ACEITA (estrutural) | P2; caso real |
| D-D | **Critério testável: Given/When/Then com `then` observável** — o porteiro REJEITA critério sem then | ACEITA (estrutural) | P1; confronta ADR 0003 |
| D-E | **Pre-mortem: ≥3 riscos com causa→consequência + `o_que_revisar`** (lente do Gate A) | ACEITA (estrutural) | P3; confronta ADR 0006 |
| D-F | **Matriz estado×ação completa**: catálogo de estados × ações, sem célula em branco; vazio/erro/loading presentes | ACEITA (estrutural) | P4; caso real |
| D-G | **ADR por decisão** (decisao + motivo) + no-go embutido | ACEITA | caso real |
| D-H | **CIRCUITO rastreável**: todo comportamento→critério; todo risco→critério; toda decisão→risco/critério | ACEITA — o insight do cego | caso real |
| D-I | **Pré-condições: dag+descoberta+gap** (as 3 anteriores) | ACEITA | PIPELINE; encadeamento |

### Limite epistêmico (honesto — registrar no CORE)
A etapa é CRIATIVA: o porteiro NÃO julga se o design é "bom". Valida o que é MECÂNICO: o ritual foi
feito (3 amigos completos, ≥3 riscos), a forma é certa (Given/When/Then tem `then`; risco tem
`o_que_revisar`; matriz sem buraco), e o circuito fecha (referências cruzadas existem). "Este `then` é
MESMO observável?" e "o design é bom?" são semânticos → cabem ao executor e ao anti-viés, não ao regex.

**Portão 0:** vereditos com fonte. As regras estruturais (D-D, D-E, D-F, D-H) são o coração — a
honestidade aqui é "ritual cumprido + forma testável + circuito fechado".

---

## FASE 1 — Padrão-ouro (caso real + cego, fundidos)

### O que o CEGO destilou (8 princípios frescos)
1. **Decida, não descreva** — o resumo abre com as decisões que invertem o entendimento ingênuo.
2. **Toda intenção aponta para sua prova** — `como_saber` = lista de IDs de critério (não prosa).
3. **Critério é caso de teste** — Given com valores literais (`arguments=['a','b','c']`), Then observável.
4. **Afirme o certo e nomeie o errado** — todo Then "faz X, NUNCA Y" (impede recriar o bug).
5. **Pre-mortem aciona** — causa concreta (cita arquivo) → mitigação → critério que pega.
6. **Cubra os estados difíceis e separe os parecidos** — loading-carga ≠ loading-ação; erro-carga ≠ erro-render; vazio ≠ erro.
7. **Decisão carrega motivo FACTUAL + no-go** — ADR ancorado em "confirmado ao vivo", com a alternativa rejeitada.
8. **Honesto sobre o que ficou em aberto** — spikes pendentes + gaps resolvidos rastreados.

> Insight do cego (a tese): *"tudo se fecha em CIRCUITO rastreável — comportamento→critério, risco→
> critério, decisão→risco. Não há afirmação órfã: cada intenção tem prova, cada medo tem teste."*

### Fusão = padrão-ouro (alvo do CORE-DESIGN) — o output:
- **resumo**: a tese (decisões que dominam o design)
- **three_amigos[]**: `comportamento` · `por_que` (propósito) · `como` (mecânica concreta) · `criterios` (IDs)
- **criterios_aceitacao[]**: `id` · `given` (com valor concreto) · `when` · `then` (observável, afirma-certo-nega-errado)
- **riscos_premortem[]**: `id` · `risco` (causa→consequência) · `mitigacao` · `o_que_revisar` (lente do Gate A)
- **estados[]**: `estado` · `descricao` · `usuario_pode` (ações) — catálogo coberto, vazio/erro/loading presentes
- **adrs[]**: `id` · `decisao` · `motivo` (factual + no-go)
- **resumo_design**: contagens (nº comportamentos, critérios, riscos, estados, adrs)

### Racional destilado (invariante vs variável — M3)
- **Invariante (regra do CORE):** 3 amigos por comportamento; critério Given/When/Then-observável;
  ≥3 riscos causa→consequência+o_que_revisar; matriz sem buraco; ADR com motivo+no-go; circuito fechado.
  Estruturais, impostas pelo porteiro.
- **Variável (lido da demanda):** quais comportamentos, critérios, riscos, estados — vêm do confronto
  dag+descoberta+gap × o que a feature precisa. O CORE não fixa; o executor produz.

> ✅ ETAPA 4 FINALIZADA em 2026-06-28 (ADR 0025, CORE-DESIGN v1.0, testada por cego, 95/95). Registro
> histórico — não editar.

## FASES 2-4 — concluídas
- **Fase 2:** CORE-DESIGN escrito; etapa declarada (executor ui-ux-designer, schema rico, 3 regrasExtras:
  catálogo de estados, circuito, resumo coerente). Catálogo de estados como DADO (M1).
- **Fase 3 (teste de generalidade + encadeamento):** ui-ux-designer cego executou o briefing → 4
  comportamentos, 18 critérios, 5 riscos, 12 estados, 6 ADRs, circuito fechado → porteiro APROVOU.
  Encadeamento estendido para 4 etapas. Anti-viés saturado (3 verificadores) achou e CORRIGIU 6 itens
  (render/carga falso-positivo; cross-contamination; catálogo hardcoded; órfão; adrs sem mínimo; resumo).
- **Fase 4:** cristalizado — ADR 0025, CORE v1.0, ROADMAP 4/13, governança atualizada.
