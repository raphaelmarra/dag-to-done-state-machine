# ESTADO ATUAL — leia isto primeiro

> Handoff para a próxima sessão. Se você é um agente sem contexto, **comece por aqui**, depois
> leia `docs/INDEX.md`. Última atualização: 2026-06-27.

---

## O que é este projeto (1 parágrafo)

Uma **state machine em Node.js puro**, acionada por CLI, que serve de trilho para um agente LLM
(Claude Code) conduzir uma feature de software por **13 etapas** (DAG → Descoberta → GAP →
Design → Mapa de dependências → Implementação → Gate A → Acessibilidade → Gate B → Aprovação
humana → Done → Smoke → Retrospectiva). O agente **dirige** (roda os comandos); o motor em Node
é o **juiz** que valida cada entrega e bloqueia o avanço fora do critério. Cada etapa tem um
**CORE** (meta-prompt) que gera o briefing daquela etapa. Visão completa: `README.md`.

## Onde EXATAMENTE paramos

1. **O MVP funciona.** `MVP/dag.mjs` é o motor; `MVP/pipeline.config.mjs` são as 13 etapas.
   Teste e2e: `cd MVP && node --test` → **5/5 verde**.
2. **Rodamos um teste REAL** conduzindo a feature "aba CLIs" do ravi-console por 7 das 13 etapas,
   com delegação a subagentes reais e **verificação ao vivo** contra a API de produção. Parou
   honestamente no **Gate A** (REPROVA — o porteiro bloqueou, sem "done" falso). Os 7 documentos
   reais gerados estão em `MVP/evidencia-teste-aba-clis/`.
3. **Tudo está commitado localmente** (último commit no histórico). A árvore git está limpa.

## ✅ Repo publicado (bloqueio resolvido)

O repositório está no GitHub: **`raphaelmarra/dag-to-done-state-machine`** (privado).
`origin` configurado, `main` em sincronia com `origin/main`. Verificado em 2026-06-27.

> Nota histórica: a publicação chegou a ser bloqueada pelo classificador de segurança do Claude
> Code quando tentada pelo agente; o usuário publicou pelo terminal dele. O nome final do repo
> ficou `dag-to-done-state-machine` (não `state-machine-in-nodejs`, como se cogitou antes).

- **Pendência:** compartilhar com `filipexyz` ainda **não foi feito** — só `raphaelmarra` consta
  como colaborador. Para adicionar (o usuário roda no terminal dele):
  ```
  gh api repos/raphaelmarra/dag-to-done-state-machine/collaborators/filipexyz -X PUT -f permission=push
  ```
- `git push` futuro é normal (sem bloqueio).

## O que fazer a seguir (próximos passos, em ordem)

1. **(Usuário) Compartilhar o repo com `filipexyz`** — ver pendência acima. Repo já publicado.
2. **Generalizar os COREs** — hoje os COREs das etapas são ESPECÍFICOS da feature de teste (aba
   CLIs), em `MVP/cores-aba-clis/`. O próximo trabalho de design é destilar um CORE **genérico e
   reutilizável** por etapa (método bottom-up, ver `docs/PADRAO-BRIEFING.md` e M2 no CLAUDE.md).
   Só a etapa 1 (DAG) já tem um CORE genérico maduro: `docs/CORE-DAG.md` v3.0.
3. **Fundação do DAG a cristalizar** — `docs/ABERTO.md` A008 + achados das validações (#6 desempate
   intent/domínio, #7 provedor não-rede, #8 shape de comando). Vira ADR quando estável.
4. **Plugar o CORE-DAG real no motor** — hoje o `pipeline.config.mjs` da etapa `dag` referencia o
   CORE via texto curto; o CORE-DAG v3.0 rico (`docs/CORE-DAG.md`) ainda não está plugado no MVP.

## Mapa rápido (onde está cada coisa)

- `README.md` — visão geral + resultado do teste real.
- `docs/INDEX.md` — a bússola completa (consulte ANTES de pesquisar qualquer coisa).
- `docs/ROADMAP.md` — marcos: motor (✅ MVP) + 13 etapas (status real).
- `docs/SOURCES.md` — conhecimento no ravi-console (relations/, gap/, research/).
- `docs/adr/` — 19 decisões de arquitetura (MADR).
- `MVP/` — o código funcional + COREs da aba CLIs + evidência do teste.
- `CLAUDE.md` — papel do copiloto + metodologias M1-M4.
- Skill global `manter-governanca` — como manter tudo isso atualizado.

## Como retomar em 30 segundos

```
cd C:\Users\gouve\Desktop\dag-to-done-state-machine\MVP
node --test                    # confirma que o motor funciona (5/5)
cat ../ESTADO-ATUAL.md         # este arquivo
cat ../docs/ROADMAP.md         # o que falta
```
