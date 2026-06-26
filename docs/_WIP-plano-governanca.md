# [WIP] Plano de Governança do Projeto — proposta para aprovação

> Status: ACTIVE — APROVADO E EXECUTADO (2026-06-26). Todos os itens implementados:
> skill global, INDEX, SOURCES, ROADMAP, CHANGELOG, ADRs, CLAUDE.md enxugado.
> Mantido como registro histórico do plano. Fundamentado em pesquisa (REFERENCIAS-governanca abaixo).

---

## Diagnóstico (por que precisamos disso)

Perdemos ~1h rodando em círculos porque o conhecimento existia mas não estava
correlacionado: o `relations/` do ravi-console (DAG real já feito) só foi descoberto
após 40 min; os WIPs não estavam no índice; o CLAUDE.md não apontava para nada.

**Causa raiz (confirmada por pesquisa — estudo ETH):** arquivos de contexto de IA são
*compensação por documentação ausente*, não um booster. A solução NÃO é inchar o
CLAUDE.md (mapas de diretório custam tokens sem ganho), e sim:
1. CLAUDE.md fino (<150 linhas) que APONTA para docs.
2. Um índice navegável que diz ONDE está cada conhecimento.
3. Ponteiro explícito para o conhecimento no ravi-console (sem duplicar).

---

## Estrutura proposta (pacote completo + skill)

### Novos arquivos

| Arquivo | O que é | Padrão de mercado |
|---------|---------|-------------------|
| `docs/INDEX.md` | Índice navegável: 1 linha por documento (o que é + caminho). O agente carrega no início e sabe onde está tudo. | llms.txt / Log4brains |
| `docs/SOURCES.md` | Cross-reference do ravi-console: lista relations/, gap/, agentic-pipeline/ com link + "o que tem lá". Correlaciona sem duplicar. | Meta-repo pattern |
| `docs/adr/NNNN-*.md` | Cada decisão vira um ADR numerado, imutável, com status (accepted/superseded). Multi-fase = 1 ADR por fase. | MADR |
| `docs/ROADMAP.md` | As 13 etapas + o motor como marcos, com status e DoD por etapa. | Milestones + DoD |
| `CHANGELOG.md` | Mudanças notáveis por marco de fase. | Keep a Changelog |
| `.claude/skills/manter-governanca/SKILL.md` | A skill que ensina a manter tudo isso atualizado (o autossustentável). | — |

### Arquivos que mudam

| Arquivo | Mudança |
|---------|---------|
| `CLAUDE.md` | Enxugar para <150 linhas: papel + regras + ponteiro para INDEX. O bloco grande de CORE/Meta-Prompt sai (já vive em docs/CORE.md). Adicionar seção explícita "Como manter a governança" apontando para a skill. |
| `DECISOES.md` | Vira índice/decision-log que aponta para os ADRs em docs/adr/. |
| `_WIP-*.md` | Ciclo formal: Draft → Active (vira permanente/ADR) ou Retired (vai pro DESCARTADO). |

### Classificação Diátaxis (cada doc em 1 quadrante)
- **Reference:** PIPELINE.md, CORE.md, CORE-DAG.md, INDEX.md, SOURCES.md
- **Explanation:** REFERENCIAS.md, ADRs (o "porquê")
- **How-to:** a skill de manutenção
- **Decision log:** DECISOES.md + ABERTO.md + DESCARTADO.md (cronológico)

---

## A skill de manutenção (o que a torna autossustentável)

`manter-governanca` — dispara quando: criar/mover doc, tomar decisão, abrir/fechar
questão, concluir etapa, promover/descartar WIP. Ela checa:
- Documento novo? → adicionar linha no INDEX.md
- Decisão tomada? → criar ADR numerado + linha no decision log
- Etapa concluída? → atualizar ROADMAP + CHANGELOG + verificar DoD
- WIP resolvido? → promover (permanente/ADR) ou retirar (DESCARTADO), nunca deletar
- Conhecimento novo no ravi? → registrar em SOURCES.md
- CLAUDE.md passou de 150 linhas? → alerta para mover conteúdo p/ docs

---

## Princípio que fica explícito no CLAUDE.md (para nunca mais esquecer)

> Antes de pesquisar ou redescobrir qualquer coisa, consulte `docs/INDEX.md` e
> `docs/SOURCES.md`. O conhecimento provavelmente já existe. Só pesquise o que o
> índice não cobre.

---

## REFERENCIAS-governanca (fontes da pesquisa)

- ADR/MADR: adr.github.io/madr · AWS Prescriptive Guidance (imutabilidade, 1 ADR por fase)
- Contexto IA: agents.md · augmentcode.com (estudo ETH: <150 linhas, curadoria humana, context rot) · humanlayer.dev
- Docs-as-code: diataxis.fr (4 quadrantes) · Log4brains (índice gerado)
- Change mgmt: conventionalcommits.org · keepachangelog.com · Atlassian DoD
- Multi-repo: Meta-Repo Pattern (devnewsletter) · Nx synthetic monorepo
- WIP/RFC: kieranpotts.com/rfcs (ciclo Draft→Active→Retired)
