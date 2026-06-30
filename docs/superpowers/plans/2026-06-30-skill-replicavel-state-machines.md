# Skill Replicável de State Machines — Plano de Implementação (A022)

> **Para workers agênticos:** este é um plano de **descoberta e destilação**, não de TDD. As fases 0–6 produzem
> CONHECIMENTO (artefatos versionados em `docs/`), não código de produção. Só as fases 7–8 produzem a skill; a 9
> valida; a 10 cristaliza. Cada fase é delegada a um agente dedicado, tem um portão de evidência e um artefato de
> saída. NÃO executar nenhuma fase antes da aprovação deste plano pelo operador.

**Goal:** produzir UMA skill autocontida que, dado qualquer domínio (vídeo, apps, etc.), guie a criação de uma state
machine no padrão deste projeto — incluindo *como destilar o CORE de descoberta de cada etapa* (estilo CORE-DAG).

**Architecture:** reprocessar nossa própria história (git + ADRs + retros) para extrair o método tácito → abstrair o
invariante (M3) → ancorá-lo no estado-da-arte → destilar o "CORE do CORE" (o meta-método de gerar COREs) → empacotar
numa skill → validar replicando num domínio não-software. É EMPACOTAMENTO de conhecimento que já existe espalhado
(`PLANO-DE-ETAPA.md`, `METODOLOGIA-CORE.md`, `ANATOMIA-DE-ETAPA.md`, o motor `v1/`), não invenção.

**Tech Stack:** documentação Markdown versionada; o formato de skills do ambiente (SKILL.md + recursos); o motor
Node.js puro (`v1/dag.mjs`) como artefato replicável; subagentes dedicados para cada fase.

## Global Constraints

Copiados verbatim da governança do projeto (`CLAUDE.md`, ADRs) — valem para TODAS as fases:

- **M1 — Dinâmico > fixo.** O que a skill gera deve descobrir-se do contexto do domínio, não fixar listas no método.
- **M2 — Bottom-up.** Toda abstração nasce de caso real destilado, não de hipótese. O CORE é evidência destilada.
- **M3 — Separar invariante de variável.** Cada elemento: mecânica (invariante → vai pra skill) ou leitura da
  demanda (varia → a skill ensina a destilar). Este é o eixo central deste plano.
- **M4 — Testar antes de cristalizar.** Nada vira ADR/oficial sem validação contra um caso real (idealmente um 2º
  diferente). Até lá vive em WIP/ABERTO.
- **Governança (skill `manter-governanca`):** decisão → ADR; incerto → ABERTO; descartado → DESCARTADO; rascunho →
  `_WIP-*`. O índice (`INDEX.md`), o `DECISOES.md`, o `ROADMAP.md` e o `CHANGELOG.md` nunca apodrecem.
- **Honestidade da maturidade:** a `METODOLOGIA-CORE.md` é **n=1, NÃO validada** (4 furos em `_RETRO-metodologia-
  core.md`). A skill HERDA essa imaturidade; empacotar não conserta os furos — declarar isto é obrigatório.
- **Nenhuma execução antes da reflexão.** Ordem inviolável: reprocessar → pesquisar → abstrair → revisar → só então
  escrever a skill. Pré-mortem (Fase 5) acontece ANTES de escrever (Fase 6).

---

## Mapa de artefatos (o que cada fase cria/modifica)

| Fase | Artefato de saída | Tipo |
|------|-------------------|------|
| 0 | `docs/research/0015-sintese-racional-do-projeto.md` + lista dos movimentos táticos não-nomeados | Create |
| 1 | `docs/_WIP-inventario-invariante-vs-dominio.md` | Create |
| 2 | `docs/research/0016-destilacao-de-conhecimento-metodos.md` | Create |
| 3 | `docs/_WIP-meta-metodo-core-do-core.md` (o "CORE do CORE") | Create |
| 4 | `docs/_WIP-arquitetura-skill-state-machine.md` | Create |
| 5 | `docs/_RETRO-premortem-skill.md` (achados adversariais) | Create |
| 6 | a skill: `~/.claude/skills/criar-state-machine/SKILL.md` + recursos | Create |
| 7 | `docs/research/0017-validacao-skill-dominio-cobaia.md` (relatório da replicação) | Create |
| 8 | `docs/adr/0033-*.md` + atualização de INDEX/DECISOES/ROADMAP/ABERTO(A022)/CHANGELOG | Create/Modify |

> Nomes de `research/` seguem a numeração atual (último é `0014`). O nome da skill (`criar-state-machine`) é
> provisório — a Fase 4 pode renomeá-lo; se o fizer, propagar ao mapa.

---

## Fase 0 — Reprocessar a história: reler o git e extrair o método TÁCITO

**O que é:** varrer todo o histórico do projeto (commits, 32 ADRs, `DECISOES.md`, os `_RETRO-*.md`, o relatório E2E,
os `_WIP-*` de destilação) e reconstruir o "filme" do raciocínio — não só *o que* decidimos, mas *por que* e *com qual
evidência*. **Objetivo reforçado (decisão do operador):** extrair os **movimentos táticos que usamos mas NUNCA
nomeamos** no `METODOLOGIA-CORE.md`. O 1º e principal é o **"batismo + expansão pelo nome canônico"**: destilar o
racional cru → dar-lhe o nome da literatura (ex.: "mapear o que a feature consome" = *change impact analysis / blast
radius / dependency DAG*) → pesquisar esse nome → descobrir que o conceito é MAIOR que a fatia que usamos → expandir o
cenário. Foi o que dobrou o CORE-DAG (v3 → v4.0). O método atual faz isto IMPLÍCITO na pré-fase de pesquisa, na ordem
inversa (pesquisa antes de destilar) e sem nomear o movimento — esta fase o formaliza a partir da nossa própria história.

**Objetivo:** ter a matéria-prima da abstração — a síntese "decisão → motivo → evidência" + a lista nomeada dos
movimentos táticos (candidatos a virar passos explícitos do meta-método na Fase 3).

**Como será feito:** o agente lê (read-only) `git log` completo + os 32 ADRs + `DECISOES.md` + `_RETRO-metodologia-
core.md` + `_RETRO-revisao-plano-etapa1.md` + `_RETRO-mvp-vs-v1.md` + `RELATORIO-E2E-PILOTO.md` + `_WIP-destilacao-
core-dag.md` + `METODOLOGIA-CORE.md`. Produz `research/0015` com: (a) a linha do tempo do racional; (b) a lista dos
movimentos táticos não-nomeados (começando pelo batismo+expansão), cada um com a EVIDÊNCIA na nossa história (qual
etapa o exibiu) e uma proposta de nome.

**Agente delegado:** `Explore` — read-only por construção, varredura ampla sem efeito colateral (o mesmo critério que
o projeto usa para mapeamento; ADR/A008).

**Portão 0:** existe a síntese cronológica E a lista de ≥1 movimento tático nomeado com evidência real na história.
O batismo+expansão DEVE estar na lista (é o achado-âncora). Sem isso, a fase não fecha.

---

## Fase 1 — Inventário: o que é INVARIANTE vs. específico do domínio (M3)

**O que é:** separar tudo que construímos em duas pilhas — **mecânica reutilizável** (o motor `dag.mjs`, o padrão
Meta-Prompt+Structured Handoff, o porteiro e suas regras genéricas, o sistema de governança, a anatomia de etapa) vs.
**conteúdo do domínio "dev de features web"** (os 10 COREs concretos, os enums, os catálogos WCAG/lentes).

**Objetivo:** definir com precisão **o que a skill COPIA** (invariante — o operador recebe pronto) vs. **o que a skill
ENSINA A DESTILAR do zero** (variável — específico do novo domínio). É o eixo M3 aplicado ao projeto inteiro.

**Como será feito:** o agente cruza `ANATOMIA-DE-ETAPA.md` (catálogo de capacidades), `PADRAO-BRIEFING.md`, `CORE.md`
(esqueleto genérico) e o código `v1/` CONTRA os COREs concretos (`v1/cores/CORE-*.md`). Para cada elemento, marca:
🟢 invariante (vai pra skill como template) / 🔵 variável (a skill ensina a destilar) / ⚪ fronteiriço (precisa de
decisão). Produz `_WIP-inventario-invariante-vs-dominio.md` (uma tabela rastreável).

**Agente delegado:** `task-decomposition-expert` — especialista declarado em separar invariante de variável e mapear
dependências (CLAUDE.md global o indica para decomposição).

**Portão 1:** cada elemento do projeto está classificado (sem ⚪ órfão sem justificativa); a fronteira "copia vs.
destila" está explícita e defensável.

---

## Fase 2 — Pesquisar o estado-da-arte de DESTILAÇÃO DE CONHECIMENTO

**O que é:** pesquisar como o mercado/academia destila conhecimento tácito em meta-prompts e frameworks reutilizáveis
— o coração metodológico da skill. Inclui pesquisar os NOMES canônicos dos movimentos táticos achados na Fase 0
(aplicando o próprio "batismo+expansão" ao nosso método).

**Objetivo:** não reinventar; ancorar o método da skill em práticas validadas e citadas — e descobrir o que falta no
nosso método (ex.: o batismo+expansão tem nome na literatura? há técnica melhor?).

**Como será feito:** disparar buscas (web) e sintetizar com fontes: knowledge distillation aplicada a prompts;
meta-prompting (APE, DSPy, maestro→experts); "golden path / paved road" de plataformas internas; scaffolding/generators
de processo; extração de conhecimento tácito (SECI/Nonaka, cognitive task analysis); como frameworks de agentes
empacotam "como fazer X". Produz `research/0016` com fontes citadas e um confronto explícito: "o que o nosso método já
faz / o que a literatura tem a mais / o que contradiz o nosso". Reusar `research/0006-0010` (forma de prompt) — NÃO
repesquisar.

**Agente delegado:** `search-specialist` — pesquisa web profunda com verificação multi-fonte (CLAUDE.md global o
indica para deep research).

**Portão 2:** `research/0016` existe, com fontes reais (não opinião), e contém o confronto "nosso método vs. literatura"
+ o nome canônico (ou a confirmação de que não há) do movimento batismo+expansão.

---

## Fase 3 — Destilar o "CORE do CORE": o meta-método de gerar um CORE de etapa

**O que é:** o pedido CENTRAL. Destilar — do `METODOLOGIA-CORE.md` (n=1) + Fases 0–2 — o **meta-método invariante** de
obter o CORE de descoberta de uma etapa, em QUALQUER domínio. É o "CORE do CORE": um meta-prompt que, dado o propósito
de uma etapa, guia a destilação do seu CORE (incluindo, AGORA EXPLÍCITO, o passo batismo+expansão se a Fase 2 o
ratificar).

**Objetivo:** produzir o gerador-de-COREs abstrato — o componente que a skill usa para que o operador destile o
CORE-DAG, o CORE-GAP, etc., do SEU domínio (ex.: o "CORE-ROTEIRO" de uma SM de vídeo).

**Como será feito:** brainstorming estruturado partindo do `METODOLOGIA-CORE.md`, incorporando: (a) os movimentos
táticos nomeados na Fase 0; (b) o que a Fase 2 trouxe a mais; (c) confronto OBRIGATÓRIO com os 4 furos do
`_RETRO-metodologia-core.md` (n=1, cego não-independente, adversarial fácil, juiz=autor) — o meta-método tem que dizer
como mitigá-los. Produz `_WIP-meta-metodo-core-do-core.md`. **Decisão a registrar aqui:** se o batismo+expansão vira
passo formal do meta-método (a decisão que ficou pendente — "objetivo explícito da Fase 0 + decisão no meta-método").

**Agente delegado:** `Plan` — arquiteta o método (raciocínio de design, sem escrever produção; read-only).

**Portão 3:** o meta-método existe em WIP; cada passo é rastreável a um caso real do nosso projeto OU a uma fonte da
Fase 2; os 4 furos têm mitigação declarada; a decisão sobre o batismo+expansão está registrada com motivo.

---

## Fase 4 — Arquitetura da skill (a forma do artefato final)

**O que é:** desenhar a estrutura da skill única — suas fases internas, entradas/saídas, onde o humano entra (HITL,
como nas etapas 0 e 10 do nosso pipeline), como ela invoca sub-agentes, e como separa "copiar o motor" de "destilar
os COREs".

**Objetivo:** o blueprint completo da skill ANTES de escrevê-la — para a Fase 6 ser execução, não design.

**Como será feito:** brainstorming de design consumindo Fases 1 (inventário) e 3 (meta-método); revisar skills
existentes do ambiente (`~/.claude/skills/`, ex.: `manter-governanca`, `desenvolver-feature`) como referência de
formato e de UX de uso. Decidir: 1 skill que conduz o fluxo inteiro vs. uma skill-maestra que chama sub-skills.
Produz `_WIP-arquitetura-skill-state-machine.md` (fluxo, contratos de cada passo, pontos HITL, agentes que a skill
delega internamente).

**Agente delegado:** `Plan` (arquitetura) + revisão de `ui-ux-designer` (a skill tem UX — o fluxo que o operador
percorre; o projeto trata "tela/fluxo" como trabalho de UX).

**Portão 4:** o blueprint existe; a forma (1 skill vs. conjunto) está decidida com motivo; cada passo interno tem
entrada/saída definida e um agente responsável; os pontos HITL estão marcados.

---

## Fase 5 — Pré-mortem e revisão cética (anti-viés, ANTES de escrever)

**O que é:** atacar o meta-método (Fase 3) e a arquitetura (Fase 4) ANTES de uma linha de skill ser escrita.
Pergunta-guia: **onde a generalização quebra?** Candidatos conhecidos: "toda etapa tem um diff?" (falso p/ vídeo);
"todo domínio tem ambiente vivo p/ sondar?" (falso); "todo domínio tem 13 etapas?" (provavelmente não); "o
batismo+expansão funciona p/ domínios sem literatura técnica?".

**Objetivo:** institucionalizar o portão anti-viés do projeto (o mesmo que se pagou no `_RETRO-revisao-plano-etapa1.md`
e nos 3 verificadores da etapa 2). Evitar cristalizar premissas falsas na skill.

**Como será feito:** revisão ADVERSARIAL independente (agente que NÃO escreveu as fases 3-4), com a lente "tente
refutar a generalidade". Produz `_RETRO-premortem-skill.md` com cada premissa frágil + veredito (sobrevive / precisa
ajuste / mata uma decisão). Os achados voltam à Fase 3/4 se forem graves (loop).

**Agente delegado:** `auditor-v2` (auditoria de specs/agentes, perspectiva independente) — alternativa/complemento:
`code-reviewer` com foco em premissas. Idealmente os DOIS (perspectivas diversas, como na etapa 2).

**Portão 5:** cada premissa de generalidade tem veredito; os achados graves foram reabsorvidos nas Fases 3-4; o que
sobrevive como limite conhecido está declarado (não escondido).

---

## Fase 6 — Escrever a SKILL (o artefato único)

**O que é:** redigir a skill completa (SKILL.md + recursos), implementando o meta-método (Fase 3) e a arquitetura
(Fase 4) já revisados pela Fase 5.

**Objetivo:** a entrega — uma skill autocontida e replicável que cria state machines em qualquer domínio.

**Como será feito:** seguir a estrutura de skills do ambiente (frontmatter `name`/`description` com trigger; corpo com
o fluxo; recursos auxiliares). Embutir: o template do motor (o que se copia), o meta-método de destilar COREs (o que se
ensina), os pontos HITL, e a declaração honesta de maturidade (n=1). NÃO inventar conteúdo novo — só materializar o
que as fases anteriores destilaram (regra "no placeholders").

**Agente delegado:** `builder` — meta-agente do ambiente especializado em criar artefatos de agente/skill com
qualidade garantida (arquitetura modular, v1.6).

**Portão 6:** a skill existe, é autocontida (não depende de conhecimento fora dela), declara sua maturidade, e cada
seção rastreia a um artefato das Fases 1-5. Zero placeholder.

---

## Fase 7 — Validar por REPLICAÇÃO num domínio-cobaia (o teste real, M4)

**O que é:** usar a skill recém-escrita para esboçar uma state machine de um domínio DIFERENTE do original. **Domínio:
parâmetro (decidir na execução)** — candidatos: criação de vídeo (distante — teste forte de generalidade) ou
desenvolvimento de apps (próximo — teste mais fácil). A escolha fica para o operador no momento de rodar a Fase 7.

**Objetivo:** provar generalidade — o "2º caso" que tira a skill de proposta (M4). Se a skill quebrar (não souber
gerar as etapas do domínio, ou só funcionar pra software), o achado volta à Fase 3.

**Como será feito:** rodar a skill contra o domínio escolhido, do zero, registrando o que generalizou e o que NÃO.
Produz `research/0017` (relatório da replicação: as etapas geradas, quais COREs destilou, onde travou). Se o domínio
for vídeo, o especialista-cobaia é `video-editor`; se apps, `fullstack-developer`.

**Agente delegado:** `general-purpose` conduzindo a skill (simula um operador sem contexto) + o especialista do
domínio escolhido como cobaia.

**Portão 7:** a skill produziu uma SM coerente do domínio-cobaia OU os pontos de quebra estão documentados e
reabsorvidos. "Pareceu funcionar" ≠ "funcionou" — o relatório precisa mostrar o ARTEFATO gerado, não só a afirmação.

---

## Fase 8 — Cristalizar: ADR + governança

**O que é:** registrar a decisão final, atualizar toda a governança, fechar (ou atualizar) a A022.

**Objetivo:** a casa em ordem — a skill nasce documentada e rastreável, com sua maturidade honesta.

**Como será feito:** criar `docs/adr/0033-skill-replicavel-state-machines.md` (MADR; status `accepted` se a Fase 7
validou, `proposed` se só esboçou); atualizar `DECISOES.md` (índice), `INDEX.md` (a skill nova + os research/WIP novos),
`ROADMAP.md` (frente A022: de futura → entregue/parcial), `ABERTO.md` (A022: o que ficou pendente, ex.: 2º domínio),
`CHANGELOG.md`. Seguir a skill `manter-governanca` (checklist de não-apodrecimento).

**Agente delegado:** `documentador` (memória organizacional do ambiente) + a skill `manter-governanca` para o checklist.

**Portão 8:** ADR existe e está indexado; INDEX/ROADMAP/ABERTO/CHANGELOG refletem a skill; a A022 foi atualizada com o
estado real; nada órfão.

---

## Sequenciamento e delegação (resumo)

```
Fase 0 (Explore) ─ reprocessar + extrair método tácito
   │
   ▼
Fase 1 (task-decomposition-expert) ─ invariante vs domínio     Fase 2 (search-specialist) ─ estado-da-arte
   │                                                              │  (1 e 2 podem rodar EM PARALELO — independentes)
   └──────────────────────────┬───────────────────────────────────┘
                              ▼
                     Fase 3 (Plan) ─ "CORE do CORE" (meta-método)
                              ▼
                     Fase 4 (Plan + ui-ux-designer) ─ arquitetura da skill
                              ▼
                     Fase 5 (auditor-v2 + code-reviewer) ─ pré-mortem ANTES de escrever
                              ▼  (loop p/ 3-4 se achado grave)
                     Fase 6 (builder) ─ escrever a skill
                              ▼
                     Fase 7 (general-purpose + especialista do domínio) ─ validar por replicação
                              ▼  (loop p/ 3 se quebrar)
                     Fase 8 (documentador + manter-governanca) ─ cristalizar
```

**Paralelismo:** Fases 1 e 2 são independentes (uma olha pra dentro, outra pra fora) — podem ser despachadas juntas.
Todo o resto é sequencial (cada fase consome a anterior). Os loops (5→3/4, 7→3) são o portão anti-viés/M4 em ação.

---

## Self-review (cobertura do pedido do operador)

- ✅ "reprocessar o que fizemos, reler o git, entender o racional" → Fase 0.
- ✅ "abstrair o core para criar uma state machine" → Fases 1 (invariante) + 3 (meta-método) + 4 (arquitetura).
- ✅ "pensar como injetar o core que usamos para descobrir cada etapa (core-dag)" → Fase 3 (o "CORE do CORE").
- ✅ "processo profundo de reflexão, brainstorming" → Fases 3 e 4 (brainstorming estruturado).
- ✅ "busca na internet por metodologia para destilação de conhecimento" → Fase 2.
- ✅ "revisão dos arquivos locais" → Fases 0 e 1.
- ✅ "delegação das tarefas para agentes dedicados + qual agente" → cada fase nomeia o agente.
- ✅ "uma única skill completa" → Fase 6 (artefato único) + Fase 7 (validada).
- ✅ "nenhuma execução antes do plano aprovado" → este documento; nada executado.
- ✅ movimento "destilar → nomear → pesquisar o nome → expandir" → objetivo explícito da Fase 0 + decisão na Fase 3.

## Limites declarados deste plano

1. **A skill herda a imaturidade da METODOLOGIA-CORE (n=1).** A Fase 7 é a 1ª validação real de generalidade; até
   ela, a skill é proposta. Um 2º domínio (Fase 7 com os dois candidatos, ou um 3º caso futuro) é o que dá robustez.
2. **Premissas do domínio original podem estar escondidas** (diff, ambiente vivo, 13 etapas). A Fase 5 caça-as; a
   Fase 7 prova. Se passarem, viram dívida em ABERTO.
3. **O nome da skill e a forma (1 vs. conjunto) são provisórios** até a Fase 4 decidir.
