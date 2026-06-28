# SPEC — MVP da State Machine DAG-to-Done

> O QUE construir e por quê. O COMO está em `plan.md`.
> Tipo: Walking Skeleton (ADR 0010) — cano e2e completo, conteúdo hardcoded (dívida deliberada).
> Status: aprovado para implementação. Spike P0 validado.

---

## 1. Resumo executivo

Construir o **motor mínimo** da state machine DAG-to-Done: um CLI em Node.js puro que conduz
uma feature pelas 13 etapas do pipeline, gerando a instrução de cada etapa, recebendo o
resultado (do operador LLM ou de um subagente delegado), validando-o contra o critério de
aceitação, e bloqueando o avanço quando o critério não passa.

O objetivo NÃO é qualidade de conteúdo (os COREs das etapas 2-13 são placeholders). O objetivo
é **provar a arquitetura de ponta a ponta**: motor genérico + porteiro de fases + handoff
confiável com subagentes.

## 2. Problema e solução

**Problema:** o projeto é 100% design (docs, ADRs, 1 CORE). Nada roda. A aposta arquitetural
central (ADR 0001 — state machine em Node puro guiada por LLM) nunca foi exercitada. Refinar
COREs no abstrato caiu em "poço de polimento" (achados cada vez mais finos, sem feedback real).

**Solução:** um MVP e2e que transforma a aposta em sistema executável. Os furos abstratos viram
testes binários ("rodou ou não"). O esqueleto vira o molde onde os 13 COREs reais vão encaixar.

## 3. Usuários e JTBD

| Usuário | Papel | Necessidade |
|---------|-------|-------------|
| Operador humano (você) | Dispara o pipeline | "Quero dizer 'faça o dag-to-done da feature X' e ser conduzido pelo trilho." |
| Agente LLM (Claude Code) | Opera o pipeline | "Quero que o motor me diga o que fazer em cada etapa e valide meu resultado." |
| Subagente delegado | Executa uma etapa | "Quero entregar meu resultado num lugar que o motor leia e valide automaticamente." |

**JTBD central:** *Quando eu peço uma feature, quero que a máquina me force pelo trilho correto
das 13 etapas, validando cada entrega, para que nada seja pulado nem entregue incompleto.*

## 4. Requisitos funcionais

**RF-001 — `init`:** cria a instância de uma feature no estado inicial (etapa 1, DAG).
- Input: nome da feature, entry_point, description, project_root.
- Output: arquivo de estado `.dag/<feature>/state.json`.

**RF-002 — `next`:** prepara a instrução da etapa atual. Para respeitar o limite de stdout do
Bash do Claude Code (30.000 chars — confirmado na doc), o briefing completo (CORE + estado curado)
é ESCRITO num arquivo `.dag/<feature>/<etapa>.briefing.md`; o stdout só aponta para ele + o caminho
de saída.
- Output (stdout, curto): `briefing: .dag/<feature>/<etapa>.briefing.md` + `escreva o resultado em: .dag/<feature>/<etapa>.output.json`.

**RF-003 — `advance`:** lê o arquivo de output da etapa atual, valida contra o schema/critério,
e: se passa → marca etapa concluída e avança para a próxima; se falha → bloqueia e reporta o que faltou.
- Input: o arquivo de output (escrito pelo operador LLM ou por subagente).
- Output: avanço registrado no estado, ou mensagem de bloqueio.

**RF-004 — `status`:** mostra a etapa atual, etapas concluídas e o histórico.

**RF-005 — Handoff de subagente:** qualquer etapa pode ter seu output escrito por um subagente
delegado, no mesmo caminho de convenção. O motor valida igual — não distingue origem. (Validado por spike.)

**RF-006 — Porteiro de fases (o motor é o juiz intransigente):** o agente (Claude Code) DIRIGE
as transições rodando `advance`, mas a APROVAÇÃO é do motor. O motor NÃO permite avançar sem que
o output da etapa atual passe no critério de aceitação, e só conhece a próxima etapa na sequência
(não dá para pular). O agente não pode se auto-aprovar nem pular o trilho — o enforcement vive
100% dentro do `dag.mjs`, não no bom comportamento do agente nem em hooks. (ADR 0003.)
Modelo: *o agente recebe → pede validação (`advance`) → o motor valida/aprova → libera a próxima.*

**RF-007 — Teste e2e:** uma feature percorre as 13 etapas do `init` ao `done` automaticamente,
provando: avanço com output válido, bloqueio com output inválido, e o handoff.

## 5. Requisitos não-funcionais

| Métrica | Target |
|---------|--------|
| Dependências externas | **zero** (Node puro; ADR 0001). Sem SDK, sem framework. |
| Teste e2e | roda com `node --test`, determinístico, sem chamar API |
| Tempo do e2e | < 5s |
| Robustez de I/O | contrato por arquivo (não colar JSON no shell — frágil no Windows/PowerShell) |
| Código | "corretamente escrito": motor genérico separado do conteúdo; funções puras testáveis |

## 6. Arquitetura

```
Operador (você) → "faça o dag-to-done da feature X"
   ↓
Claude Code (eu) executo: node dag.mjs next <feature>
   ↓
dag.mjs (MOTOR, genérico) → lê estado + pipeline.config → IMPRIME instrução + caminho de saída
   ↓
EU (ou subagente delegado) escrevo o output no caminho de convenção (tool Write)
   ↓
node dag.mjs advance <feature> → MOTOR lê arquivo, valida, porteiro decide
   ↓
avança / bloqueia
```

- **Motor (`dag.mjs`):** genérico. Não conhece nenhuma etapa. Só lê `pipeline.config.mjs`,
  gere estado, valida outputs, aplica o porteiro. (ADR 0001, 0019.)
- **Conteúdo (`pipeline.config.mjs`):** as 13 etapas (CORE hardcoded, schema, critério). O "cartucho".
- **Estado (`.dag/<feature>/`):** `state.json` + `<etapa>.output.json` por etapa. (ADR 0018: output JSON validado.)
- **O LLM é externo ao motor** — sou eu, no loop, ou um subagente. O motor nunca chama API.

## 7. Integrações

| Integração | Como | Risco |
|------------|------|-------|
| Tool `Agent` (subagentes) | etapa delegada escreve no caminho de convenção; motor valida | **mitigado por spike** |
| Filesystem | estado e outputs em `.dag/` | baixo |
| Node runtime | `node --test`, ESM | baixo |

## 8. GAPS E QUESTÕES EM ABERTO

### P0 — resolvidos antes de implementar
| ID | Gap | Resolução |
|----|-----|-----------|
| GAP-01 | Contrato de I/O motor↔operador automático e robusto | Convenção de caminho de arquivo (não shell). |
| GAP-02 | Handoff a subagente "deve funcionar" | Subagente escreve no mesmo caminho; motor valida igual. **Validado por spike.** |
| GAP-03 | `dag.mjs` não existe | É a tarefa central do `plan.md` (subagente dedicado + revisão). |

### P1
| ID | Gap | Ação |
|----|-----|------|
| GAP-04 | Validação de schema é só "campos presentes" | Suficiente para o MVP; endurecer pós-MVP por etapa. |
| GAP-05 | e2e sem depender de LLM ao vivo | e2e usa outputs hardcoded (fixtures) escritos no caminho de convenção. |

### P2
| ID | Gap | Ação |
|----|-----|------|
| GAP-06 | Concorrência entre features | Fora do MVP. Estado por-feature já isola o básico. |

## 9. SPIKES DE VIABILIDADE

**Spike-01 — Handoff subagente→arquivo→validação (GAP-01, GAP-02): ✅ PASSOU.**
Despachado um subagente que escreveu um output JSON no caminho de convenção; o motor leu,
parseou e validou contra o critério de aceitação do DAG — aprovado. Prova que o handoff
funciona pelo mesmo mecanismo de validação de qualquer output.

## 10. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Motor acoplar-se a uma etapa específica | Motor só lê config; teste e2e roda as 13 sem código por-etapa. |
| Output de subagente inválido passar | Porteiro valida schema + critério; spike confirmou bloqueio de inválido. |
| Hardcode virar permanente | Marcado como dívida no config; ROADMAP rastreia a despromoção. |
| "Funcionar de primeira" falhar | Subagente implementa + subagente revisa + e2e obrigatório antes de declarar pronto. |

## 11. CHECKLIST PRÉ-DESENVOLVIMENTO

- [x] Spike-01 (handoff) passou
- [x] Contrato de I/O decidido (convenção de arquivo)
- [x] `pipeline.config.mjs` existe (13 etapas)
- [x] `package.json` existe (ESM, `node --test`)
- [x] ADRs consultados (0001 Node puro, 0003 critério binário, 0018 JSON validado, 0019 um CORE/etapa)
- [ ] `dag.mjs` implementado e revisado
- [ ] e2e das 13 etapas passa
