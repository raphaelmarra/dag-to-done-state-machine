# Plano de Etapa — molde + tracker (com portão de evidência)

> **O que é:** o sistema para *completar uma etapa inteira* da state machine, peça por peça. Nasce da
> percepção de que o CORE/briefing é só **1 das ~18 peças** (ver `ANATOMIA-DE-ETAPA.md`), e que a
> metodologia 0→4 (`METODOLOGIA-CORE.md`) é um motor reutilizável para refinar **qualquer** peça —
> não só o CORE. Cada peça é um *critério*; o pipeline é a *forma de executar*.
>
> **Como usar:** para cada etapa, copie a seção "PLANO CONCRETO" como template, liste as peças
> aplicáveis (do catálogo), classifique esforço, ordene por dependência, e execute de cima para
> baixo. O tracker dá visibilidade do que falta.

---

## Contrato de execução deste plano (as regras do piloto)

Decididas pelo operador em 2026-06-28. Valem para todo o piloto e a réplica futura.

1. **M1 — dinâmico > hardcode.** Toda peça: antes de fixar um valor, perguntar "isto pode ser
   descoberto do contexto?". Hardcode é último recurso, justificado.
2. **Delegação a subagentes** — usar para pesquisa, varredura e verificação independente.
3. **Autonomia total na execução** — escrever, testar, mudar config/motor, registrar e cristalizar
   ADR sem checkpoint humano. O operador revê pelo tracker e pelos commits, e manda desfazer se
   discordar.
4. **Portão anti-viés (sempre) — COM limite reconhecido (F4).** Nenhuma peça fecha sem um
   **verificador independente cego** (subagente sem o contexto da decisão) ratificar. MAS: o
   verificador é o **mesmo modelo, mesmo repo** — ele reduz **erro de transmissão e omissão local**;
   NÃO neutraliza vieses *sistemáticos* do modelo (ex.: o próprio "dinâmico é melhor", sycophancy),
   que são **compartilhados** entre réu e juiz. Por isso, para peças de esforço **F** (que viram
   lei), a evidência PRIMÁRIA é **mecânica/externa** (um teste que roda, um contraexemplo, um caso
   real) — o verificador cego é complemento, não substituto.
5. **Evidência obrigatória E PERTINENTE (F5).** Não basta *citar* uma fonte — a decisão precisa
   **seguir** dela. Citação irrelevante não conta (seria o mesmo `camposPresentes` que combatemos: 
   presença ≠ conteúdo). Se a evidência é um teste, o teste roda e está no commit; se é caso real, o
   caso está linkado.

> Tensão resolvida: (3) autonomia total + (4) verificador sempre = sigo sem consultar o humano, mas
> **não fecho sozinho**. Ressalva honesta: o verificador cego não é bala de prata anti-viés (F4) —
> é uma segunda leitura correlacionada. A defesa real contra viés sistemático é o **teste mecânico**.

---

## Definição de PRONTO de uma peça (Definition of Done)

Uma peça só passa de 🟡 para ✅ quando TODAS as caixas abaixo estão marcadas. **As caixas foram
endurecidas (F5) para serem verificáveis, não subjetivas** — cada uma tem um critério objetivo:

```
[ ] DINÂMICA   — descobre do contexto OU o hardcode é invariante POR DEFINIÇÃO DO DOMÍNIO (não por
                 conveniência). Critério: nomear QUAL invariante. "É mais fácil" não justifica.
[ ] EVIDÊNCIA  — a decisão SEGUE de uma fonte acionável: teste que roda (no commit) / caso real
                 (linkado) / pesquisa cujo achado X sustenta a decisão. Citar ≠ sustentar.
[ ] TESTE      — há um teste automatizado que falha se a peça regredir. "Não aplicável" SÓ se a peça
                 é pura redação do CORE (sem efeito em código) — e isso é declarado explicitamente.
[ ] ANTI-VIÉS  — verificador cego ratificou (veredito registrado). Para esforço F: + evidência
                 mecânica primária (o verificador sozinho NÃO basta — ver regra 4).
[ ] GOVERNANÇA — registrada: ADR se virou lei; ABERTO se provisória; CHANGELOG/INDEX atualizados.
```

> Por que endurecer: uma DoD cuja função é ser o portão objetivo de "pronto" não pode ter caixas que
> dependem de julgamento não-especificado — isso devolveria a decisão ao mesmo agente, reabrindo o
> viés que a DoD existe para fechar.

## Triagem de esforço (qual método aplicar a cada peça)

Nem toda peça merece o canhão 0→4. Classifique antes de executar:

| Esforço | Quando | Método |
|---------|--------|--------|
| **T — Trivial** | decisão óbvia, sem alternativas reais | decide, implementa, testa, verificador cego confirma. Sem pesquisa. |
| **M — Média** | 1 decisão de design, sem território novo | 1 caso real + teste + verificador cego. Sem fan-out de pesquisa. |
| **F — Funda** | território novo, alternativas com trade-off | pipeline 0→4 completo (pesquisa → padrão-ouro → testar → cristalizar). |

> Regra: a pesquisa de *forma* (research/0006–0010) **já existe** — não se repete. Só peças que
> tocam teoria de domínio nova justificam fan-out de pesquisa.

---

# PLANO CONCRETO — ETAPA 1 (DAG)

> **⚠️ Este plano foi REVISADO por um crítico cego independente (2026-06-28) que achou 10 findings,
> 3 graves.** A versão original tinha um viés-raiz: a auditoria-base checou *presença de campos*, não
> *consistência CORE↔motor↔teste* — o mesmo erro (`camposPresentes`) que o plano quer corrigir no
> código, cometido no próprio processo. Correções incorporadas abaixo. Crítica completa: ver
> `_RETRO-revisao-plano-etapa1.md`.

## Achado que reordena tudo: o motor NÃO substitui placeholders (bug F1)

A auditoria original disse "9 peças obrigatórias presentes". **Falso para 2 delas.** O CORE-DAG usa
`{next_stage}` como variável de template em 2 pontos (cores/CORE-DAG.md:221-222), e a tabela da
instância declara `next_stage` como campo. **Mas:** `resolverCore` (dag.mjs:148-155) devolve o
markdown CRU, sem substituir nada; e `cmdInit` nunca popula `next_stage`. Resultado: o briefing
gerado contém a string literal `{next_stage}` — o executor recebe um placeholder quebrado. As peças
Briefing(4)/Handoff(9) estão **presentes mas inertes**, não "ok". Confirmado lendo o código.

**Consequência metodológica:** a auditoria-base de QUALQUER etapa deve verificar **consistência
CORE↔motor↔teste**, não só presença de campos no schema. (Corrige o viés-raiz.)

## Tracker da etapa 1 (REORDENADO por dependência real, verificada no código)

| Ordem | Peça | Estado base (verificado) | Esforço | Status | Depende de |
|-------|------|--------------------------|---------|--------|------------|
| 1 | **Substituição de placeholders no motor (F1)** — `cmdInit`/`cmdAdvance` populam `next_stage` derivado do pipeline; `montarBriefing` substitui `{chave}` do estado, protegendo inline code | ✅ **PRONTA** | M | ✅ | — (motor) |
| 2 | **Executor como dado consultável (1)** — capacidade vira propriedade da etapa, não texto solto | hardcoded no .md | M | ⬜ | — |
| 3 | **Grau de certeza (2)** — enum derivado da propriedade do executor (peça 2) | hardcoded no .md | M | ⬜ | peça 2 |
| 4 | **Schema como DADO ÚNICO (6)** — objeto/JSON fonte-de-verdade, injetado no briefing E no validador. **NÃO parsear markdown** (F3) | hardcoded, duplicado | F | ⬜ | peças 2,3 (enum entra na estrutura) |
| 5 | **Critério de aceitação estrutural (7)** — valida a estrutura aninhada do schema (peça 4), não só presença | só presença | F | ⬜ | peça 4 (fundida — ver nota) |
| 6 | **Bloqueio / early-exit no motor (10)** — pré-condição (entry_point/project_root) implementada no motor | só no CORE | M | ⬜ | — |
| 7 | **Estado curado por etapa (3)** — `montarBriefing(estado, etapa)` usa `etapa.estadoCurado`. **Mudança de MOTOR, blast radius nas 13 etapas** (F7) | hardcoded no motor | M-alto | ⬜ | peça 1 |
| 8 | **Confirmar peças dinâmicas (5,8,9)** — profundidade/gaps/handoff já no CORE; verificar que o motor não as quebra | ok no CORE | T | ⬜ | peça 1 |

**Notas de dependência (verificadas, não racionalizadas — corrige F2):**
- **2→3:** o enum (3) *espelha* o executor; logo o executor-como-dado (2) vem antes. (Era o inverso no plano original.)
- **4 e 5 são quase inseparáveis:** o "critério" (5) valida a "estrutura" (4). Trata-se como uma
  unidade entregue junto, não duas peças em cadeia. O enum (3) é um valor *dentro* da estrutura.
- **1 vem primeiro de tudo:** sem substituição de placeholder, qualquer edição do CORE (peças 2,3,4,6)
  gera briefing quebrado. É pré-requisito infra.
- **7 é a mais arriscada:** muda a assinatura de `montarBriefing` → afeta as 13 etapas e o e2e. Não é
  "M isolado". Cobrir com teste antes.

## Restrição operacional da execução autônoma (F8)

O CORE-DAG vive em DOIS lugares: `docs/CORE-DAG.md` (fonte) e `v1/cores/CORE-DAG.md` (cópia que o
motor lê via corePath), com um teste de **igualdade byte-a-byte** (core-dag.test.mjs:48-56). **Toda
edição do CORE:** editar `docs/CORE-DAG.md` E recopiar para `v1/cores/`. O teste de sincronia é o
guarda — se eu editar só um, ele falha (de propósito).

## Decisões de escopo — REVISADAS com teste por peça (corrige F6)

A exclusão original ("são do grupo D/E") era auto-referente (petição de princípio). Agora cada peça
🔵/⚪ passa pelo teste: **"o DAG precisa disto para entregar o território à etapa 2?"**

| Peça | Aplica ao DAG? | Motivo (testado, não assumido) |
|------|----------------|-------------------------------|
| Lentes (11) | Não | O DAG mapeia, não revisa qualidade. Quem usa lentes é o Gate A. |
| Pre-mortem (12) | Não | Riscos de *implementação* são do Design; o DAG não decide implementação. |
| **Spike (13)** | **Talvez — reavaliar** | Está no grupo C (Controle), não D/E (erro do plano original). A regra A5 (ciclo) é PROVISÓRIA: um ciclo real ambíguo durante o DAG É "incerteza técnica que bloqueia". Decidir com evidência ao executar. |
| Arquétipo (15) | Não | Calibra rigor de Design/Gate; o DAG mapeia igual para qualquer arquétipo. |
| Walking Skeleton (16) | Não | Prova fim-a-fim entre Design e Implementação; não é fase de mapeamento. |
| Paralelismo (14) | Não (à etapa) | Pesquisa ‖ DAG é orquestração *entre* etapas (ADR 0008), não peça *da* etapa 1. |
| **Verif. independente (17)** | Como processo, sim | É o portão anti-viés do próprio método (já em uso). Como *peça de pipeline*, é do motor — fora do CORE-DAG. |
| **Retry (18)** | Parcial — **evidência no código** | Bloqueio JÁ implementado (dag.mjs:251-262 + teste e2e:87). Falta só o *destino de regressão*. Não é "decidir do zero" (corrige F9). Decisão: para onde voltar, automático vs. humano — do motor. |

> Spike e Retry saem de "🤔 decidir do zero" para "decidir com a evidência que já existe".

## Marco de "etapa 1 PRONTA"
Quando as peças 1–8 estiverem ✅ pela Definition of Done, a etapa 1 deixa de depender de hardcode
que viola M1, tem o porteiro validando estrutura real, e cada decisão tem evidência + ratificação
cega. Aí o sistema está provado e replicamos para a etapa 2.

---

## Progresso (log de execução — atualizado a cada peça)

> Cada entrada: peça, o que foi feito, evidência, veredito do verificador cego, commit.

### ✅ Peça 1 — Substituição de placeholders no motor (2026-06-28)
- **O que foi feito:** `cmdInit` e `cmdAdvance` populam `estado.next_stage` derivado de
  `proximaEtapa()` (dinâmico, não hardcoded); `montarBriefing` aplica `substituirPlaceholders()` que
  troca qualquer `{chave}` por `estado[chave]`, protegendo código inline (crases) e deixando
  placeholders sem valor como lacuna visível (não "undefined").
- **DoD:**
  - ✅ DINÂMICA — substituição genérica (qualquer `{chave}`); valor vem do pipeline. Zero constante no motor.
  - ✅ EVIDÊNCIA — TDD: teste falhou antes (RED), passou depois (GREEN). Bug confirmado lendo o código.
  - ✅ TESTE — `test/placeholder.test.mjs` (6 casos: init, FRONTEIRA substituída, inline protegido, anti-undefined, advance recalcula). Suíte 13/13.
  - ✅ ANTI-VIÉS — verificador cego (code-reviewer) ratificou COM ressalvas; **todas as 3 ressalvas
    aplicadas** (skip de inline code, asserção robusta na FRONTEIRA, testes de advance/inline). Evidência primária = teste mecânico.
  - ✅ GOVERNANÇA — sem ADR (correção de bug, não decisão de lei); CHANGELOG atualizado.
- **Nuance de design registrada:** blocos ```` ``` ```` do CORE-DAG são TEMPLATES (preenchidos), não
  código literal — por isso a substituição ocorre dentro deles; só código inline (crase) é protegido.
- **Commit:** (ver próximo commit desta sessão).
