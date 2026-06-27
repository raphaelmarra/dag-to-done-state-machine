# PLAN — Implementação do MVP

> COMO construir o que o `spec.md` define. Estratégia: subagentes dedicados implementam e
> revisam; nada é declarado pronto sem o e2e passar (verificação antes de conclusão).
> Princípio: **funcionar de primeira** = implementar + revisar adversarialmente + testar e2e.

---

## Estado atual (já feito)

- ✅ `MVP/package.json` (ESM, `node --test`)
- ✅ `MVP/pipeline.config.mjs` (13 etapas, schema, critério `aceita()`)
- ✅ Spike-01: handoff subagente→arquivo→validação PASSOU
- ✅ Viabilidade validada contra a doc oficial da Anthropic (3 adaptações aplicadas)
- ⬜ `MVP/dag.mjs` (motor) — a construir
- ⬜ `MVP/test/e2e.test.mjs` — a construir

## Adaptações vindas da validação contra a doc Anthropic

1. **stdout ≤ 30KB:** `next` escreve o briefing em arquivo e o stdout só aponta (RF-002 ajustado).
2. **Delegação aninhada ≤ 5 níveis:** nosso pipeline delega em largura (loop→subagente = depth 1), respeitado.
3. **Hooks são reativos:** o porteiro NÃO é hook. Enforcement vive no `dag.mjs`. Modelo:
   o agente dirige (`advance`), o motor é o juiz que aprova/recusa. Hooks ficam como rede de
   segurança opcional pós-MVP.

---

## Contrato de I/O (a regra que o motor e os agentes seguem)

- Estado: `MVP/.dag/<feature>/state.json` — `{ feature, entry_point, description, project_root, etapaAtual, concluidas: [], historico: [] }`
- Output de etapa: `MVP/.dag/<feature>/<etapaId>.output.json` — escrito pelo operador OU subagente.
- `advance` lê o output da etapa atual nesse caminho. Sem flags de JSON inline.

## Verbos do CLI (RF-001..004)

| Comando | Faz |
|---------|-----|
| `node dag.mjs init <feature> --entry <x> --desc <y> --root <z>` | cria state.json na etapa 1 |
| `node dag.mjs next <feature>` | escreve o briefing em arquivo (.briefing.md) e imprime no stdout só os caminhos (briefing + saída). Evita o limite de 30KB do stdout. |
| `node dag.mjs advance <feature>` | lê output, valida, porteiro avança/bloqueia |
| `node dag.mjs status <feature>` | etapa atual + concluídas + histórico |

Saída de erro clara em todos (feature inexistente, output ausente, output inválido).

---

## Fases de implementação

### Fase A — Motor `dag.mjs` (subagente dedicado)
**Quem:** subagente `backend-architect` (especialista em Node/CLI).
**Entregável:** `MVP/dag.mjs` implementando os 4 verbos + porteiro, lendo `pipeline.config.mjs`,
persistindo estado, validando via `etapa.aceita(output)`. Node puro, ESM, zero deps.
**Critérios:**
- Motor 100% genérico (nenhum `if etapa === "dag"` — só lê a config).
- `advance` bloqueia se output ausente, JSON inválido, ou `aceita()` falhar — com mensagem do que faltou.
- `next` imprime o caminho exato de saída.
- Erros tratados (sem stack trace cru para o usuário).

### Fase B — Teste e2e (subagente dedicado)
**Quem:** subagente `code-reviewer` com foco em testes.
**Entregável:** `MVP/test/e2e.test.mjs` (`node --test`) que:
1. `init` de uma feature de teste.
2. Para cada uma das 13 etapas: escreve um output VÁLIDO (fixture) no caminho, roda `advance`, afirma que avançou.
3. Caso negativo: escreve um output INVÁLIDO, afirma que `advance` BLOQUEIA.
4. Afirma estado final = `done`, todas as 13 concluídas.
5. Limpa `.dag/` de teste no fim.
**Critério:** determinístico, sem rede, < 5s.

### Fase C — Revisão adversarial (subagente dedicado)
**Quem:** subagente `code-reviewer` (diferente do que escreveu).
**Entregável:** veredito APROVA/REPROVA do `dag.mjs` + e2e, com lentes: motor genérico mesmo?
porteiro à prova de output malicioso? caminhos Windows OK? race no estado? Se REPROVA → volta Fase A.

### Fase D — Prova do handoff REAL (não fixture)
**Objetivo:** cumprir o seu pedido "cada etapa que delega deve funcionar" com um agente de verdade.
**Como:** rodar 1 etapa do pipeline ponta-a-ponta com delegação real:
1. `node dag.mjs next <feature>` na etapa DAG.
2. Despachar um subagente (ex.: Explore/backend-architect) com o briefing impresso, instruído a escrever no caminho de convenção.
3. `node dag.mjs advance <feature>` → deve validar o output do subagente e avançar.
**Critério:** avança com output produzido por subagente real, não por fixture.

### Fase E — Verificação e fechamento
- Rodar `npm test` no MVP; e2e verde.
- Atualizar CHANGELOG (MVP funcional) e ROADMAP (M-1..M-4 → status real).
- Commit.

---

## Orquestração dos subagentes (regra anti-"não funciona de primeira")

1. **Implementador ≠ revisor.** Quem escreve o motor não é quem aprova.
2. **Verificação antes de conclusão.** Nenhuma fase é "completa" sem o comando rodando e a
   saída observada (não "deve funcionar" — funcionou, com output colado).
3. **e2e é o gate.** O MVP só é declarado pronto quando `npm test` passa, verificado por mim.
4. **Handoff real (Fase D)** é obrigatório — prova que a delegação funciona com agente de verdade,
   não só com fixture.

## Sequência

```
A (motor) ──► B (e2e) ──► C (revisão) ──► [REPROVA? volta A] ──► D (handoff real) ──► E (fechar)
```

## Definition of Done do MVP
- [ ] `dag.mjs` implementado, motor genérico, revisado e aprovado
- [ ] e2e das 13 etapas passa (avanço + bloqueio + estado final done)
- [ ] handoff real com subagente provado (Fase D)
- [ ] `npm test` verde, verificado com output real
- [ ] CHANGELOG + ROADMAP atualizados
- [ ] commitado
