# Design — Migrar o motor DAG-to-Done para o ravi-console (SSoT única)

> Status: aprovado (2026-06-30). Objetivo: o agente do ravi-console usa o motor que desenvolvemos neste projeto;
> toda a tecnologia de PROCESSO antiga do ravi-console é arquivada; o nosso motor vira a SSoT de todas as execuções.
> Decisão do operador: "arquiva tudo que for de tecnologia de processo lá, clona o nosso motor, ele vira SSoT".

## Princípio

O ravi-console tem hoje um DAG-to-Done próprio (enforcer `scripts/dag.mjs` + `CONTRATO-DAG-TO-DONE.md` +
`PIPELINE.md` + `docs/agentic-pipeline/` + ADRs 0011-0017 + ledger/census). **Tudo isso é arquivado** (movido,
não deletado — git preserva). O nosso motor (`v1/`) é **clonado** para lá e passa a reger. O PRODUTO do
ravi-console (SDK, `src/`, infra, deploy, evidências de código) fica **100% intacto** — só o PROCESSO muda.

## As ações (ordem de execução)

### 1. Clonar o motor para `ravi-console/dag/`
Copiar de `dag-to-done-state-machine/v1/` para `ravi-console/dag/`:
- `dag.mjs` (motor: init/next/advance/status)
- `pipeline.config.mjs` (as 13 etapas + porteiros)
- `cores/` (9 COREs: DAG, DISCOVERY, GAP, DESIGN, MAPA, IMPL, GATEA, GATEB, A11Y)
- `test/` (suíte — confirma que o motor roda lá: `cd dag && node --test`)
- `package.json`, `.gitignore`, `spec.md`, `plan.md`

Roda com `node dag/dag.mjs <verbo>`. Isolado de `src/` (não toca o produto).

### 2. Arquivar a tecnologia de processo antiga (sem deletar)
Mover para `ravi-console/docs/_superseded-dag/` com um README explicando "substituído pelo motor em `dag/` — ver
git para histórico":
- `scripts/dag.mjs` (o enforcer antigo)
- `docs/gap/CONTRATO-DAG-TO-DONE.md`, `docs/gap/SPEC-PHASE-GATE-ENFORCER.md`
- `docs/agentic-pipeline/` (PIPELINE.md, CORE-DAG.md deles, etc.)
- ADRs 0011, 0016, 0017 (e relacionados ao DAG-to-Done): marcados `superseded by [novo motor]` no topo, sem
  remover o conteúdo (princípio: ADR imutável, supersede não deleta).
- `docs/domains/_TEMPLATE-instancia-contrato.yaml` e o ledger/census, se forem do processo.

### 3. Tratar os hooks/CI quebrados pelo arquivamento
O Husky pre-commit + CI chamam o enforcer antigo (confirmado ao vivo: o commit bloqueou no E2E). Ao arquivá-lo,
esses hooks quebram. Ação: apontá-los para o nosso motor OU simplificá-los para rodar tsc/vitest direto — o que
for necessário para os commits não travarem. (O motor nosso pode absorver os checks na etapa Done numa 2ª fase;
o imediato é não quebrar o repo.)

### 4. O gatilho duplo (o agente "sabe o que fazer")
- **CLAUDE.md** do ravi-console: substituir as menções ao DAG antigo por uma seção "Ferramenta disponível —
  DAG-to-Done": o motor em `dag/dag.mjs` (init/next/advance/status), quando acionar. Toda referência ao processo
  passa a apontar para o nosso motor (decisão: "todas as menções devem se referir ao nosso").
- **Skill `/dag`** (`.claude/skills/dag/SKILL.md`): wrapper fino sobre os verbos — o agente roda o ciclo
  next→executar→advance, parando na etapa 10 (aprovação humana). Aponta para a mesma fonte (`dag/`), sem duplicar.

## O que NÃO se toca (preservado)
SDK (`@ravi-os/sdk` como SSoT do produto), `src/`, infra de deploy, evidências de código/produto, o repo e seu
histórico git. Só a camada de PROCESSO (como conduzir uma feature) é trocada.

## Verificação (Definition of Done desta migração)
- `cd ravi-console/dag && node --test` → a suíte do motor passa (227/227) no novo lar.
- `node dag/dag.mjs status <feature>` roda sem erro.
- Um `git commit` no ravi-console NÃO trava (hooks tratados).
- CLAUDE.md e `/dag` apontam para `dag/`; zero menção viva ao processo antigo (só no `_superseded-dag/`).
- Nada do produto (src/SDK/infra) foi modificado.
