# 0025 — Etapa 4 (Design): como validar uma etapa CRIATIVA

- Status: accepted
- Data: 2026-06-28
- Relacionado: CORE-DESIGN (etapa 4); reusa infra (ADR 0020-0024); complementa ADR 0003 (critério binário), 0006 (pre-mortem)

## Contexto e Problema
A etapa 4 (Design) é a primeira etapa **criativa** do pipeline: as 3 anteriores ANALISAM/DESCOBREM (mapeiam,
confirmam, confrontam o que existe); o Design **produz decisões** (comportamento, critérios, riscos, estados).
Um porteiro automático não pode julgar se um design é "bom" (subjetivo, não-determinístico). Como gatear
criatividade de forma determinística?

## Decisão
**Validar RITUAL + FORMA + CIRCUITO, não qualidade.** O porteiro verifica o que é objetivo; o "é bom?" fica
para o executor e o anti-viés (Gate A). Concretamente:
1. **Ritual cumprido:** Three Amigos por comportamento (por_que/como/criterios); pre-mortem com ≥3 riscos; ≥1 ADR.
2. **Forma testável:** todo critério é Given/When/Then com `then` (rejeita sem then); todo risco tem
   `o_que_revisar` (a lente do Gate A); o catálogo de estados difíceis (vazio/erro/carregando) está coberto
   em estados DISTINTOS; o resumo não mente sobre as listas.
3. **Circuito fechado (nos 2 sentidos):** todo comportamento aponta critério que existe; todo critério é
   apontado por algum comportamento (sem órfão). Rastreabilidade que o Gate B usará.
4. **Executor `ui-ux-designer`** (designer, não analista); confiança = origem da DECISÃO ("ancorado em
   descoberta" / "decisão de produto" / "a confirmar via spike").

## Motivo
Validado por teste de generalidade (um ui-ux-designer cego executou o briefing gerado: 4 comportamentos, 18
critérios testáveis, 5 riscos, 12 estados, 6 ADRs, circuito fechado — ancorado no código real) + anti-viés
saturado (3 verificadores acharam e corrigiram: falso-positivo do "render" como loading, cross-contamination,
catálogo hardcoded → vira dado/M1, critério órfão não checado, adrs sem mínimo, resumo sem coerência). O CORE
declara EXPLICITAMENTE o limite epistêmico por seção (o que o porteiro NÃO consegue validar — "este then é
mesmo observável?"). A etapa 4 — a mais atípica — custou ZERO mecanismo novo no motor: confirma a tese de
amortização da infra (ADR 0024) até na etapa mais diferente.

## Consequências
O catálogo de estados é um DADO (`CATALOGO_ESTADOS_UI`) consumido por uma fábrica genérica
(`regraCatalogoCoberto`) — reusável e editável sem tocar o mecanismo. Honestidade sobre o limite: o porteiro
garante que o design é REVISÁVEL (forma julgável), não que é bom — o juízo de qualidade é empurrado para o
Gate A com os artefatos em forma julgável. Complementa (não substitui) ADR 0003 e 0006: "binário" e "≥3 riscos"
eram necessários mas insuficientes — agora exige-se também a FORMA (then observável; risco acionável).
