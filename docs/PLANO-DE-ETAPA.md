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
4. **Portão anti-viés MÁXIMO (sempre)** — nenhuma peça fecha sem um **verificador independente cego**
   (subagente sem contexto da decisão) ratificar. Réu nunca é juiz. (Peça 17 do catálogo aplicada ao
   próprio processo.)
5. **Evidência obrigatória** — toda decisão lastreada em pesquisa citada, teste que roda, ou caso
   real. Sem fonte verificável → a peça não fecha. "Parece bom" não é evidência.

> Tensão resolvida: (3) autonomia total + (4) verificador sempre = sigo sem consultar o humano, mas
> **não fecho sozinho** — um agente cego ratifica cada peça. Velocidade com anti-viés.

---

## Definição de PRONTO de uma peça (Definition of Done)

Uma peça só passa de 🟡 para ✅ quando TODAS as caixas abaixo estão marcadas:

```
[ ] DINÂMICA   — descobre do contexto onde possível; hardcode restante justificado (M1)
[ ] EVIDÊNCIA  — a decisão cita pesquisa / teste / caso real (não opinião)
[ ] TESTE      — há um teste automatizado que falha se a peça regredir (quando aplicável a código)
[ ] ANTI-VIÉS  — um verificador independente cego ratificou (e seu veredito está registrado)
[ ] GOVERNANÇA — registrada: ADR se virou lei; ABERTO se provisória; CHANGELOG/INDEX atualizados
```

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

> Estado-base (auditoria 2026-06-28, subagente): 9 peças obrigatórias presentes, mas 3 com hardcode
> que viola M1 e 1 incompleta. As peças 🔵/⚪ do catálogo **não se aplicam** ao DAG (lentes,
> pre-mortem, arquétipo, walking skeleton são de Design/Gate) — exceto verificação independente e
> retry, que são candidatas transversais (decisão registrada abaixo).

## Tracker da etapa 1

| Ordem | Peça | Estado base | Esforço | Status | Depende de |
|-------|------|-------------|---------|--------|------------|
| 1 | **Grau de certeza (2)** — enum derivado do executor, não fixo no .md | parcial/hardcoded | M | ⬜ a fazer | — |
| 2 | **Padrão de entrega / schema (6)** — derivar do CORE-DAG, estrutura aninhada | hardcoded | F | ⬜ a fazer | peça 1 (enum entra no schema) |
| 3 | **Critério de aceitação (7)** — validar estrutura, não só presença; derivado do schema | hardcoded/presença | F | ⬜ a fazer | peça 2 (valida o schema) |
| 4 | **Bloqueio / early-exit (10)** — motor implementa pré-condição (entry_point/project_root) | parcial (só no CORE) | M | ⬜ a fazer | — |
| 5 | **Estado curado (3)** — seleção de campos derivada, não inline fixa | hardcoded inline | M | ⬜ a fazer | — |
| 6 | **Briefing (4)** — já v4.0; revisar só o template inline do motor | ok (parcial) | T | ⬜ a fazer | peças 1,5 |
| 7 | **Executor (1)** — tornar a capacidade um dado consultável (não texto) | ok/hardcoded | M | ⬜ a fazer | habilita peça 1 |
| 8 | **Profundidade (5)**, **Gaps (8)**, **Handoff (9)** — já dinâmicos no CORE; confirmar | ok | T | ⬜ a fazer | — |
| — | **Verificação independente (17)** como peça da etapa? | não | — | 🤔 decidir | — |
| — | **Retry (18)** — loop de volta ao reprovar | não formalizado | — | 🤔 decidir | motor |

> Ordem racional: peça 1 (enum) destrava 2 (schema usa o enum) que destrava 3 (critério valida o
> schema). 4, 5, 7 são independentes. As peças "ok" (6, 8) só precisam de confirmação por verificador.

## Decisões de escopo da etapa 1 (registradas)

- **Peças que NÃO se aplicam ao DAG:** lentes, pre-mortem, spike, arquétipo, walking skeleton — são
  de etapas de Design/Gate. Não entram na etapa 1. (Evidência: ANATOMIA-DE-ETAPA.md grupos D/E.)
- **Paralelismo (14):** a pesquisa de mercado roda em paralelo ao DAG (ADR 0008), mas isso é
  orquestração *entre* etapas, não uma peça *da* etapa 1. Fora do escopo desta etapa.
- **Verificação independente (17) e Retry (18):** transversais. Decisão na execução — provavelmente
  pertencem ao motor/pipeline, não ao CORE-DAG. Marcadas 🤔 para resolver com evidência.

## Marco de "etapa 1 PRONTA"
Quando as peças 1–8 estiverem ✅ pela Definition of Done, a etapa 1 deixa de depender de hardcode
que viola M1, tem o porteiro validando estrutura real, e cada decisão tem evidência + ratificação
cega. Aí o sistema está provado e replicamos para a etapa 2.

---

## Progresso (log de execução — atualizado a cada peça)

> Cada entrada: peça, o que foi feito, evidência, veredito do verificador cego, commit.

_(vazio — execução começa após este plano ser commitado)_
