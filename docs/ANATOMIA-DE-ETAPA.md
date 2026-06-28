# Anatomia de uma etapa — catálogo de capacidades

> **Para que serve este documento:** quando você for desenhar (destilar o CORE de) uma etapa da
> state machine, consulte aqui **tudo o que se PODE definir numa etapa**. Não é como executar uma
> etapa específica — é o *menu de peças* disponíveis. Gerar o briefing é só UMA peça; este catálogo
> lista todas.
>
> **Como ler:** cada peça tem — *o que é · quando usar · exemplo no projeto · a decisão que você
> toma · status*. Status: 🟢 **em uso** (já validado no projeto) · 🔵 **disponível** (existe no
> projeto como conceito, ainda não plugado num CORE) · ⚪ **candidata** (faz sentido, nunca usada).
>
> Reference (Diátaxis). Aprofundamentos: `PADRAO-BRIEFING.md` e `CORE.md` (a peça "briefing");
> `CORE-DAG.md` (instância completa da etapa 1); `METODOLOGIA-CORE.md` (como destilar um CORE).

---

## Mapa rápido (as peças)

| # | Peça | Grupo | Status |
|---|------|-------|--------|
| 1 | Executor (quem roda) | Entrada | 🟢 |
| 2 | Grau de certeza (enum de confiança) | Entrada | 🟢 |
| 3 | Estado curado (o que a etapa recebe) | Entrada | 🟢 |
| 4 | Briefing (OBJETIVO/ESCOPO/FORMATO/FRONTEIRAS) | Instrução | 🟢 |
| 5 | Profundidade (fixa ou dinâmica) | Instrução | 🟢 |
| 6 | Padrão de entrega (output schema = contrato) | Saída | 🟢 |
| 7 | Critério de aceitação (o porteiro) | Saída | 🟢 |
| 8 | Gaps direcionais (o que falta p/ a próxima) | Saída | 🟢 |
| 9 | Handoff (o que passa adiante) | Saída | 🟢 |
| 10 | Bloqueio / early-exit (recusar começar) | Controle | 🟢 |
| 11 | Lentes de revisão (por arquétipo) | Qualidade | 🔵 |
| 12 | Pre-mortem (riscos antes de falhar) | Qualidade | 🔵 |
| 13 | Spike (resolver incerteza técnica) | Controle | 🔵 |
| 14 | Paralelismo (etapas/sub-tarefas concorrentes) | Controle | 🔵 |
| 15 | Arquétipo (calibra rigor por tipo de tela) | Calibração | 🔵 |
| 16 | Walking Skeleton (prova fim-a-fim cedo) | Controle | 🔵 |
| 17 | Verificação independente (executor cego) | Qualidade | 🔵 |
| 18 | Retry / loop de correção | Controle | ⚪ |

---

# GRUPO A — ENTRADA (o que a etapa sabe ao começar)

## 1. Executor — quem roda a etapa  🟢
**O que é:** o agente que executa a etapa (Explore, fiscal, code-reviewer, humano…). Define o que
a etapa **pode saber e fazer**.
**Quando usar:** sempre. Toda etapa tem um executor.
**Exemplo:** etapa 1 (DAG) → Explore, que lê código mas **não toca a rede**.
**Decisão que você toma:** qual agente? E — crucial — **isolar a escolha numa seção própria do CORE**
para que trocar o executor seja editar só ali (CORE-DAG §1).
**Por que importa:** a capacidade do executor restringe TODAS as outras peças — principalmente o grau
de certeza (peça 2).
**Status:** 🟢 em uso. Ref: CORE-DAG §1, ADR 0019.

## 2. Grau de certeza — o enum de confiança  🟢
**O que é:** o vocabulário de confiança que o executor usa por item (ex.: `lido no código` /
`inferido` / `não encontrado`). **É a peça que você citou:** "você pode definir o grau de certeza
de um agente."
**Quando usar:** sempre que a etapa produz afirmações sobre o sistema.
**Regra de ouro:** o enum **depende do executor** — não é fixo no projeto. Explore não pode dizer
"confirmado ao vivo" (não toca a rede); fiscal pode. Forçar um enum único para todas as etapas foi o
erro que o ADR 0019 corrigiu.
**Decisão que você toma:** quais valores de confiança esse executor *honestamente* pode usar? Proibir
os que ele não pode (mentira estrutural).
**Status:** 🟢 em uso. Ref: CORE-DAG §1 (enum espelha o executor), CORE.md F3, ADR 0019.

## 3. Estado curado — o que a etapa recebe da instância  🟢
**O que é:** apenas os campos do estado que ESTA etapa precisa — nunca o estado inteiro.
**Quando usar:** sempre. O motor injeta; o CORE declara o que é relevante.
**Exemplo:** DAG recebe `entry_point, description, next_stage, project_root`. A Descoberta recebe
*+ o output do DAG*.
**Decisão que você toma:** quais campos? Injeção a mais = ruído (derruba precisão — "lost in the
middle"); a menos = etapa cega.
**Status:** 🟢 em uso. Ref: CORE.md G1, CORE-DAG "Estado da instância".

---

# GRUPO B — INSTRUÇÃO (o que a etapa manda fazer)

## 4. Briefing — as 4 partes  🟢
**O que é:** a instrução gerada para o executor. Sempre 4 partes, nesta ordem:
`OBJETIVO` (verbo imperativo + entregável nomeado) · `ESCOPO` (dentro E fora) · `FORMATO` (estrutura
verificável + schema) · `FRONTEIRAS` (o que é de outra etapa).
**Quando usar:** sempre. É o coração da etapa.
**Regras de escrita validadas (pesquisas 0006–0010):** regra-mestra repetida no início E no fim
(sanduíche, combate "lost in the middle"); **polaridade positiva** ("faça X / o resto é da etapa Y",
não "NÃO faça"); **raciocínio antes do JSON** (evita o "Format Tax" de 10–30%); vocabulário
consistente e repetido.
**Decisão que você toma:** o conteúdo de cada parte — derivado bottom-up de um caso real (M2).
**Status:** 🟢 em uso. Ref: PADRAO-BRIEFING.md, CORE.md §1-2, CORE-DAG §4.

## 5. Profundidade — quão fundo a etapa vai  🟢
**O que é:** o alcance da etapa. Pode ser **fixa** ou **dinâmica** (decidida pelo contexto).
**Quando usar:** sempre que a etapa percorre um grafo/escopo que pode ser raso ou profundo.
**Exemplo (dinâmica):** o DAG mapeia 1 hop por padrão, mas **expande** quando o vizinho é um hub,
um pass-through fino, ou cruza fronteira de contrato (ADR 0020). O que fica além vira "a verificar",
não é omitido.
**Decisão que você toma:** profundidade fixa (mais simples) ou dinâmica com gatilhos (mais fiel)?
A preferência do projeto é dinâmica (M1).
**Status:** 🟢 em uso (na etapa 1). Ref: ADR 0020.

---

# GRUPO C — SAÍDA (o que a etapa entrega e como é julgada)

## 6. Padrão de entrega — output schema (contrato de retorno)  🟢
**O que é:** a estrutura exata que o executor deve retornar (campos, tipos, enums). **É a peça
"padrão de entrega" que você citou.** É o contrato do Structured Handoff.
**Quando usar:** sempre. Sem schema, o porteiro não tem o que verificar.
**Exemplo:** DAG v4.0 → `nos, arestas, blast_radius, fronteira, gaps, confianca`.
**Decisão que você toma:** quais campos a próxima etapa precisa receber? O schema é injetado no
FORMATO do briefing; o motor o valida mecanicamente.
**Forma:** listas aninhadas, nunca tabelas (ADR 0018); JSON via tool_use.
**Status:** 🟢 em uso. Ref: ADR 0017 (schema por família), ADR 0018 (JSON→listas), CORE.md §4.

## 7. Critério de aceitação — o porteiro  🟢
**O que é:** o teste binário que o motor aplica para deixar a etapa avançar. É o `aceita(output)`
do `pipeline.config.mjs`.
**Quando usar:** sempre. É o que torna a state machine um *trilho*, não uma sugestão.
**Exemplo:** Gate A só passa se `veredito === "APROVA"`; DAG passa se os campos do schema estão
presentes e não-vazios.
**Decisão que você toma:** presença de campos basta, ou exige valor exato (gate)? Hoje a validação
é de presença + valor exato nos gates; endurecer para validar *estrutura* é dívida (GAP-04).
**Status:** 🟢 em uso. Ref: dag.mjs `cmdAdvance`, pipeline.config.mjs `aceita()`.

## 8. Gaps direcionais — o que falta para a PRÓXIMA etapa  🟢
**O que é:** o que o executor não conseguiu determinar e que a próxima etapa precisa. **Direcional:**
não é "achei um problema", é "falta info para quem consome".
**Quando usar:** sempre que a etapa pode encontrar lacunas (quase todas).
**Regra (teste C1):** "a próxima etapa consegue completar sua tarefa sem isto?" NÃO → é gap; SIM →
descarte (é dívida/UX/perf, não gap). Esta é a peça que separa nosso output de um "relatório de
problemas".
**Decisão que você toma:** quem é a próxima etapa (calibra o teste) e como priorizar (P0/P1/P2).
**Status:** 🟢 em uso. Ref: CORE-DAG §5, CORE.md G2.

## 9. Handoff — o que passa adiante  🟢
**O que é:** como o output desta etapa alimenta a próxima. No motor: arquivo
`.dag/<feature>/<etapa>.output.json` lido pela etapa seguinte.
**Quando usar:** sempre. Cada etapa produz conhecimento estruturado que vira insumo da próxima.
**Decisão que você toma:** o schema (peça 6) já É o handoff — desenhe-o pensando em quem recebe.
**Nuance importante:** o agente principal **reescreve** o briefing ao delegar (não repassa literal) —
ver FLUXO-EXECUCAO.md e a tensão A009.
**Status:** 🟢 em uso. Ref: FLUXO-EXECUCAO.md, ADR 0015.

---

# GRUPO D — CONTROLE (quando a etapa para, ramifica ou se recusa)

## 10. Bloqueio / early-exit — recusar começar  🟢
**O que é:** a etapa se recusa a rodar se uma pré-condição falta (ex.: `entry_point` ausente).
**Quando usar:** quando há um gap P0 de pré-condição que impede até começar.
**Exemplo:** DAG emite `## ⚠️ BLOQUEIO` antes do briefing se faltar `entry_point`/`project_root`.
**Decisão que você toma:** quais pré-condições são bloqueантes (P0) vs. apenas degradam (P1/P2)?
**Status:** 🟢 em uso. Ref: CORE-DAG "Estado da instância", CORE.md G3.

## 13. Spike — resolver incerteza técnica antes de seguir  🔵
**O que é:** um desvio curto para responder uma dúvida técnica que bloqueia o design/implementação.
**Quando usar:** quando uma incerteza impede decidir (ex.: "esse endpoint existe? aceita esse
formato?").
**Em aberto:** o que acontece se o spike NÃO resolve? (ABERTO A004 — protocolo de spike inconclusivo
ainda não definido).
**Decisão que você toma:** a etapa permite um spike? Qual o gatilho e o limite de tempo?
**Status:** 🔵 disponível (conceito no projeto, não plugado num CORE). Ref: REFERENCIAS.md, ABERTO A004.

## 14. Paralelismo — etapas ou sub-tarefas concorrentes  🔵
**O que é:** rodar coisas que não dependem uma da outra ao mesmo tempo.
**Quando usar:** quando há independência real (sem estado compartilhado).
**Exemplo:** pesquisa de mercado roda em paralelo ao DAG (ADR 0008); na implementação, sub-tarefas
sequenciais vs. paralelas.
**Em aberto:** colisão entre features paralelas que tocam os mesmos arquivos (ABERTO A005).
**Decisão que você toma:** o que dentro/ao redor desta etapa é paralelizável com segurança?
**Status:** 🔵 disponível. Ref: ADR 0008, CORE.md (subtasks), ABERTO A005.

## 16. Walking Skeleton — prova fim-a-fim cedo  🔵
**O que é:** uma fatia mínima que atravessa todas as camadas, para provar o cano antes de encher.
**Quando usar:** features de risco alto, entre design e implementação.
**Em aberto:** o que define "risco alto" para acioná-lo (ABERTO A006).
**Status:** 🔵 disponível. Ref: REFERENCIAS.md, ABERTO A006. (Foi o método do próprio MVP.)

## 18. Retry / loop de correção  ⚪
**O que é:** quando o porteiro reprova, voltar a uma etapa anterior, corrigir e re-submeter.
**Quando usar:** sempre que um gate reprova (ex.: o Gate A reprovou no E2E da aba CLIs).
**Hoje:** o motor **bloqueia** (não avança), mas o *loop de volta* é conduzido pelo agente, não
formalizado no motor. Formalizar (a etapa sabe para onde voltar) é candidato.
**Decisão que você toma:** reprovou → volta para qual etapa? Automático ou conduzido pelo humano?
**Status:** ⚪ candidata. Ref: dag.mjs (bloqueio existe; loop não formalizado).

---

# GRUPO E — QUALIDADE (como a etapa garante que o que sai presta)

## 11. Lentes de revisão — por arquétipo  🔵
**O que é:** conjuntos de perguntas/perspectivas que um gate aplica conforme o tipo de tela
(LISTA, MUTACAO, DRAWER…). Cada arquétipo tem riscos distintos.
**Quando usar:** etapas de revisão/gate (Gate A, acessibilidade).
**Exemplo:** no E2E, o Gate A reprovou por buracos nas lentes MUTACAO (delete sem confirmação) e
LISTA (ordenação).
**Decisão que você toma:** quais lentes esta etapa aplica, e quais são obrigatórias por arquétipo?
**Status:** 🔵 disponível (usado no CORE da aba CLIs; não generalizado). Ref: gate_a, ABERTO A003.

## 12. Pre-mortem — riscos antes de falhar  🔵
**O que é:** imaginar a feature já fracassada em produção e listar o que a derrubou (prospective
hindsight melhora identificação de riscos ~30% — Klein).
**Quando usar:** no Design, antes de implementar.
**Decisão que você toma:** quantos riscos mínimos exigir, e se cada um precisa de mitigação nomeada.
**Status:** 🔵 disponível. Ref: REFERENCIAS.md, CORE.md (premortem_risks no schema de DESIGN).

## 15. Arquétipo — calibra o rigor por tipo de tela  🔵
**O que é:** classificar a feature (LISTA, MUTACAO, DRAWER, BOARD…) para calibrar profundidade e
lentes. Uma MUTACAO destrutiva exige mais que um DRAWER de leitura.
**Quando usar:** logo no início, para dimensionar o resto do pipeline.
**Em aberto:** pipelines diferentes por arquétipo? (ABERTO A003 — avaliar depois da v1).
**Decisão que você toma:** a etapa muda de rigor conforme o arquétipo? Como detecta o arquétipo?
**Status:** 🔵 disponível. Ref: ABERTO A003, CORE.md (regra de arquétipo LISTA → Census).

## 17. Verificação independente — executor cego  🔵
**O que é:** validar o output com um segundo agente SEM contexto, para medir se a instrução
*transmite* (não se o autor entende).
**Quando usar:** ao validar um CORE (metodologia) ou num gate de alta confiança.
**Exemplo:** na destilação do CORE-DAG v4.0, um Explore cego executou o briefing e provou
generalidade.
**Decisão que você toma:** esta etapa/gate merece um verificador independente, ou o porteiro basta?
**Status:** 🔵 disponível (usado na metodologia; não plugado como etapa). Ref: METODOLOGIA-CORE.md,
FLUXO-EXECUCAO.md.

---

## Como usar este catálogo ao desenhar uma etapa

1. **Comece pelo executor (1)** — ele restringe tudo, principalmente o grau de certeza (2).
2. **Defina a entrada** (estado curado, 3) e a **instrução** (briefing, 4; profundidade, 5).
3. **Desenhe a saída pensando em quem recebe** — schema (6) É o handoff (9); o critério (7) é o
   porteiro; gaps (8) apontam para a frente.
4. **Escolha as peças de controle e qualidade** que esta etapa precisa — não todas servem a toda
   etapa (um DAG não tem pre-mortem; um Gate sim).
5. **Destile bottom-up** (M2) e **valide antes de cristalizar** (M4) — ver METODOLOGIA-CORE.md.

> Regra geral: as peças 🟢 são obrigatórias ou quase (toda etapa tem executor, briefing, schema,
> critério). As 🔵/⚪ são **opcionais por etapa** — você as aciona quando o tipo de etapa pede.
