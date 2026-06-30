# research/0017 — Padrão oficial Anthropic para Agent Skills (revisão da skill A022)

> **Origem:** pesquisa web (agente `search-specialist`, 2026-06-30) com fontes primárias da Anthropic. Disparada para
> revisar a skill `criar-state-machine` contra o padrão oficial, após avaliação do operador (skill "mais manual que
> geradora", não autocontida, menciona projeto-fonte). **Status:** insumo de revisão — funda a reescrita da skill.

---

## As regras oficiais (com fonte)

### Frontmatter
- `name`: ≤64 chars; minúsculas/números/hífens; **não pode conter "claude" nem "anthropic"**; deve casar com o nome do
  diretório.
- `description`: ≤1024 chars; **uma linha, TERCEIRA PESSOA**; contém o QUE faz + QUANDO usar ("Use when..."); levemente
  "pushy" (Claude tende a undertrigger). **TODO o "quando usar" vai na description, não no corpo.** NÃO multilinha `|`.
- Opcionais: `license`, `compatibility` (≤500 chars — declarar Node/deps/rede), `metadata`, `allowed-tools`.

### Estrutura de diretórios (os 3 tipos de recurso)
- **`scripts/`** — código executável que o agente RODA. *"Executable code for deterministic/repetitive tasks."* **O
  código do script NÃO entra no contexto** — só o output dele consome tokens. Caminho via `${CLAUDE_SKILL_DIR}/scripts/x`.
- **`references/`** — docs carregados no contexto SOB DEMANDA (um arquivo por domínio; índice no topo se >100 linhas).
- **`assets/`** — *"Files used in output (templates, icons, fonts)"* — **os templates/scaffolds que viram o artefato gerado.**

### Progressive disclosure (3 níveis)
1. Metadata (name+description) — sempre no system prompt (~100 tokens/skill).
2. SKILL.md — quando dispara (<500 linhas, <5k tokens).
3. Resources — sob demanda; scripts executam sem carregar conteúdo. Referências a **no máx. 1 nível** de profundidade.

### Autocontenção (a regra que a nossa skill viola)
- Repo oficial: *"Each skill is **self-contained** in its own folder."*
- Segurança: *"Skills that fetch data from external URLs pose particular risk... Even trustworthy Skills can be
  compromised if their external dependencies change over time."* → **dependência externa = risco e fragilidade.**
- Na **API, skills NÃO têm rede nem instalam pacotes** — apontar para recurso externo QUEBRA nesse surface.
- Veredito: tudo que a skill precisa deve VIAJAR DENTRO dela. Apontar para fora é aceitável mas sinalizado como risco.

### Skill geradora (que cria artefatos)
- Os exemplos oficiais SÃO geradores (docx/pptx/xlsx/pdf/mcp-builder). `assets/` é o lugar dos templates de output.
- Padrões: **Template pattern** (template no SKILL.md/assets), **plan-validate-execute** (output intermediário
  verificável validado por script antes de aplicar), **feedback loop** (validador → corrige → repete).
- Sinal empírico (skill-creator): *"se o agente reescreve repetidamente o mesmo script gerador, embuta-o em scripts/."*

### Skill vs MCP vs Plugin
- **Skill** = conhecimento procedural + instruções + (opcional) scripts/recursos. Pode trazer código utilitário.
- **MCP** = integração com ferramentas/sistemas externos. A Skill ensina COMO usar; o MCP FORNECE a ferramenta.
- **Plugin** = embalagem de distribuição (bundla skills + agents + hooks + MCP via `.claude-plugin/plugin.json`).

## A pergunta-chave: embutir o motor ou apontar para fora?

**A doc NÃO é categórica — dá um CRITÉRIO ("degrees of freedom"), e os dois geradores oficiais divergem de propósito:**
- **docx/pptx/xlsx (geram arquivos) → EMBUTEM o motor** (`scripts/office/`: pack/unpack/validate/schemas completo).
  Operação determinística/frágil → código embutido.
- **mcp-builder (gera servidor MCP) → NÃO embute** — instrui o Claude a escrever o código, com refs externas.
  Operação flexível/contextual → instruções + referências.

**Critério oficial:** embuta o script quando *"operações são frágeis, consistência é crítica, uma sequência específica
precisa ser seguida"*. Use instruções quando *"múltiplas abordagens são válidas, decisões dependem do contexto"*.

**Aplicação ao nosso caso:** o motor da state machine (`init/next/advance/status` + validação de schema + porteiro) é
determinístico e frágil — o tipo `docx`, não o tipo `mcp-builder`. **Portanto: EMBUTIR o motor em `scripts/` é o padrão
oficial correto.** Apontar para um repo externo (como a skill faz hoje) é o anti-padrão de "external dependencies".

## Implicações para a revisão da skill (o que corrigir)

1. **Embutir um motor mínimo genérico em `scripts/`** — reescrito limpo (sem a herança dev web do `dag.mjs` atual:
   dossiê/HITL hardcodam `design_output`/`gate_*_output`, F2/F9 do pré-mortem). Caminhos com `${CLAUDE_SKILL_DIR}` e
   forward slashes (anti-padrão: paths Windows).
2. **`assets/` para os templates** que viram output (esqueleto de etapa, template de CORE, template de teste e2e).
3. **`references/` para o conteúdo pesado** (o meta-método de 8 passos, o menu de anatomia) — um nível de profundidade.
4. **`description` em 1 linha, 3ª pessoa, ≤1024 chars, "Use when...", pushy** — corrige o `description: null`.
5. **ZERO menção a projeto específico** (dag-to-done, ravi, v1/, CORE-DAG) — skill é técnica reutilizável, não narrativa.
6. **Validador como SCRIPT EXECUTÁVEL** (plan-validate-execute), não só prosa — casa com o "porteiro fail-closed".
7. **`compatibility`** declarando Node; listar deps; não assumir instalação.

## Apêndice — Padrão de REPOSITÓRIO de skills (pesquisa 2026-06-30)

Pesquisa adicional (search-specialist) sobre como publicar uma skill num repo GitHub instalável, confirmada
contra o repo oficial `anthropics/skills`:
- **Layout:** o repo É o marketplace. `.claude-plugin/marketplace.json` na raiz + `skills/<nome>/SKILL.md`.
- **marketplace.json:** para 1 skill, `{name, owner:{name}, plugins:[{name, source:"./", strict:false,
  skills:["./skills/<nome>"]}]}`. Com `strict:false`, dispensa `plugin.json`.
- **Instalação:** `/plugin marketplace add <owner>/<repo>` + `/plugin install <skill>@<repo>`. Invocação
  namespaced: `/<plugin>:<skill>`. Nome do comando vem do DIRETÓRIO da skill, não do frontmatter.
- **Licença:** Apache-2.0 (o que a Anthropic usa em `anthropics/skills`).
- **Esse padrão virou a skill `publicar-skill-claude-code`** (`~/.claude/skills/`): templates de
  marketplace.json/README/.gitignore/LICENSE + um validador executável `validate-repo.mjs` (testado: detecta
  repo inválido, aprova válido). Skill geradora autocontida, padrão scripts/assets.
- **PUBLICADO (dogfooding):** a skill `publicar-skill-claude-code` foi usada para montar e publicar a skill
  `criar-state-machine` no repo público **https://github.com/raphaelmarra/state-machine-for-agents** — layout
  oficial (`.claude-plugin/marketplace.json` + `skills/criar-state-machine/`), Apache-2.0, validado e com smoke
  test 5/5. Instalável via `/plugin marketplace add raphaelmarra/state-machine-for-agents`. O dogfooding PROVOU a
  skill `publicar-skill-claude-code` (montou um repo real, válido, do zero).

## Fontes
- platform.claude.com/docs/en/agents-and-tools/agent-skills/overview — estrutura, frontmatter, 3 níveis, segurança, constraints da API.
- platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices — description 3ª pessoa, degrees of freedom, utility scripts, template/plan-validate-execute.
- code.claude.com/docs/en/skills — Claude Code: onde vivem, `${CLAUDE_SKILL_DIR}`, exemplo gerador, skill/plugin/MCP.
- anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills — arquitetura, progressive disclosure, Skill↔MCP.
- agentskills.io/specification — spec aberta (campos do frontmatter, scripts/references/assets).
- github.com/anthropics/skills (README + docx/pptx/mcp-builder) — exemplos canônicos; o contraste docx-embute × mcp-builder-referencia.
- (não acessível: resources.anthropic.com/.../The-Complete-Guide-to-Building-Skill.pdf — binário, não renderizou.)