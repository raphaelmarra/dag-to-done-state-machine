# Decisões de Design

> Cada decisão tomada durante o design do Agentic Pipeline.
> Formato: contexto → decisão → motivo → consequências.

---

## D001 — Abordagem B: state machine nativa em Node.js puro

**Data:** 2026-06-26
**Contexto:** Três abordagens avaliadas: XState embutido, state machine nativa em JS puro, modelo declarativo via YAML.
**Decisão:** Abordagem B — implementar o padrão LangGraph sem LangGraph, em JS puro dentro do `dag.mjs` existente.
**Motivo:** Respeita o `GUARD §9` do dag ("ZERO new abstraction, no framework"). Zero dependências novas. A essência do LangGraph cabe em ~150 linhas de JS puro para 13 fases lineares. XState adicionaria 40kb+ e conflita com a filosofia THIN do projeto.
**Consequências:** Sem tooling visual. Erros de lógica de guarda ficam invisíveis sem testes. O `tamper_hash` + verificação no CI são o backstop contra edição manual.

---

## D002 — Briefing gerado automaticamente pelo estado da instância

**Data:** 2026-06-26
**Contexto:** Hoje o loop monta o briefing manualmente para cada agente.
**Decisão:** Cada fase define um `briefingTemplate` populado com dados reais da instância no momento do `dag next <feature>`.
**Motivo:** Elimina dependência de memória do orquestrador. O agente recebe contexto filtrado e relevante, não o arquivo inteiro. Padrão reconhecido como prática emergente (Microsoft Agent Framework Handoff).
**Consequências:** O template de briefing precisa ser mantido por arquétipo. Se a instância tiver campos vazios, o briefing fica incompleto — o sistema alerta antes de imprimir.

---

## D003 — Critério de aceitação por etapa como checklist binário

**Data:** 2026-06-26
**Contexto:** Hoje "aprovado" é subjetivo — depende do julgamento de quem roda o gate.
**Decisão:** Cada etapa tem critério de aceitação como lista de perguntas com resposta sim/não. A etapa só fecha quando todas forem sim.
**Motivo:** Torna a qualidade verificável e auditável. Remove ambiguidade do handoff entre agentes. Inspirado no Definition of Done do Scrum.
**Consequências:** Os critérios precisam ser revisados conforme o processo amadurece. O escape-hatch existe para urgências genuínas.

---

## D004 — Lentes de revisão diferenciadas por arquétipo no Gate A

**Data:** 2026-06-26
**Contexto:** Hoje o Gate A usa as mesmas lentes para qualquer tipo de tela.
**Decisão:** O briefing do Gate A carrega lentes específicas por arquétipo (LISTA, MUTACAO, DRAWER, BOARD, DETALHE, DISCO).
**Motivo:** Uma tela de listagem tem riscos de performance e paginação. Uma tela de mutação tem riscos de segurança e reversibilidade. O mesmo checklist para ambas é superficial.
**Consequências:** Requer manutenção das lentes por arquétipo. As lentes precisam ser definidas antes da implementação do CLI.

---

## D005 — Indicador de confiança obrigatório nos entregáveis

**Data:** 2026-06-26
**Contexto:** Agentes hoje produzem entregáveis sem declarar o que foi verificado vs inferido.
**Decisão:** Etapas 2 (Descoberta), 6 (Implementação) e 9 (Gate B) exigem que o agente declare o nível de confiança por item: `confirmado ao vivo` | `inferido do código` | `não verificado`.
**Motivo:** Torna incertezas visíveis antes que se propaguem. Um "não verificado" na etapa 2 que chega silencioso à etapa 6 gera retrabalho caro.
**Consequências:** O critério de aceitação da etapa 2 bloqueia itens `não verificado` sem justificativa.

---

## D006 — Pre-mortem como parte obrigatória do Design

**Data:** 2026-06-26
**Contexto:** Riscos emergem na implementação ou nos gates — tarde demais.
**Decisão:** O design (etapa 4) inclui uma pergunta obrigatória: "o que poderia fazer essa feature falhar em produção?" com pelo menos 3 riscos levantados.
**Motivo:** O pre-mortem (Gary Klein, HBR 2007) usa "prospective hindsight" — imaginar que já falhou melhora a identificação de riscos em ~30%. O lugar mais barato para encontrar riscos é antes de escrever código.
**Consequências:** Os riscos levantados alimentam as lentes do Gate A e os cenários do Gate B.

---

## D007 — DAG como primeira etapa (antes da Descoberta da API)

**Data:** 2026-06-26
**Contexto:** No fluxo original a Descoberta da API vinha primeiro.
**Decisão:** DAG (mapa de correlações) vem antes. Descoberta da API vem depois.
**Motivo:** Sem o mapa de correlações, o agente da Descoberta não sabe quais endpoints importam para essa feature específica. O DAG delimita o território; a Descoberta explora esse território. Delimitar antes de explorar é mais eficiente.
**Consequências:** A Descoberta da API se torna mais precisa e menos ampla — foca no que o DAG sinalizou como relevante.

---

## D008 — Pesquisa de mercado paralela ao DAG

**Data:** 2026-06-26
**Contexto:** A pesquisa de mercado estava dentro do Design, aumentando o tempo dessa etapa.
**Decisão:** Pesquisa de mercado roda em paralelo ao DAG. O Design recebe ambos prontos.
**Motivo:** DAG e pesquisa de mercado não dependem um do outro. Rodar em paralelo reduz o tempo total sem nenhum risco.
**Consequências:** O Design fica mais rico desde o início — recebe contexto do sistema E contexto do mercado ao mesmo tempo.

---

## D009 — Prep Gate B paralela ao Gate A

**Data:** 2026-06-26
**Contexto:** Gate B começava do zero após Gate A aprovar — perda de tempo em setup.
**Decisão:** Enquanto Gate A revisa o código, o fiscal prepara os cenários de verificação ao vivo. Gate B executa imediatamente após Gate A aprovar.
**Motivo:** Prep Gate B não depende do resultado do Gate A — só da implementação pronta. Elimina tempo de setup sem nenhum risco.
**Consequências:** Se Gate A reprovar, a prep foi descartada. Custo baixo (prep é leve) vs ganho real em velocidade.

---

## D010 — Walking Skeleton como decisão do Mapa de dependências

**Data:** 2026-06-26
**Contexto:** Walking Skeleton estava como etapa separada após o Mapa de dependências.
**Decisão:** Walking Skeleton é uma decisão que o Mapa de dependências toma — entra no fluxo se e somente se o Plan decidir que a feature é de alto risco de integração.
**Motivo:** Clareza de responsabilidade. Quem decide se precisa de skeleton é quem conhece as dependências — o Plan. Não é uma etapa obrigatória, é uma ramificação condicional.
**Consequências:** O critério de "alto risco de integração" precisa ser definido antes da implementação do CLI (ver A006 em ABERTO.md).

---

## D011 — Acessibilidade entre Gate A e Gate B (só arquétipos de interação)

**Data:** 2026-06-26
**Contexto:** Acessibilidade era uma lente do Gate A — verificação estática no código.
**Decisão:** Etapa separada de acessibilidade entre Gate A e Gate B, executada com a tela funcionando, apenas para MUTACAO, DRAWER e BOARD.
**Motivo:** Problemas reais de acessibilidade (foco, navegação por teclado, leitura de tela) só aparecem com a tela em movimento — não lendo o código. LISTA e DETALHE têm menor risco de interação complexa.
**Consequências:** Adiciona uma etapa para 3 dos 6 arquétipos. Para LISTA, DETALHE e DISCO, acessibilidade continua como lente do Gate A.

---

## D012 — Smoke pós-deploy e Retrospectiva como etapas formais

**Data:** 2026-06-26
**Contexto:** O pipeline terminava no Done lógico. Deploy e aprendizado eram informais.
**Decisão:** Smoke pós-deploy (etapa 12) e Retrospectiva de cicatriz (etapa 13) entram como etapas formais do pipeline.
**Motivo:** Done lógico ≠ Done real. A feature só está entregue quando funciona em produção. E o pipeline só melhora se houver um momento formal de aprender com o que aconteceu.
**Consequências:** O ciclo total tem 13 etapas. A retrospectiva alimenta o GEPA (melhoria dos próprios gates) de forma sistemática — não esparsa como hoje.

---

## D013 — Estimativa de complexidade no GAP

**Data:** 2026-06-26
**Contexto:** O Mapa de dependências decidia sobre Walking Skeleton sem informação de complexidade formal.
**Decisão:** GAP inclui estimativa de complexidade: simples | média | alta, com justificativa.
**Motivo:** A decisão de Walking Skeleton precisa de insumo. A complexidade também influencia o nível de paralelismo que o Mapa de dependências vai propor.
**Consequências:** Mais um campo no entregável do GAP. A justificativa é obrigatória — não é um label subjetivo.

---

## D014 — Retrospectiva propõe melhorias, não só registra

**Data:** 2026-06-26
**Contexto:** O gate-ledger registra bugs mas ninguém propõe correção estrutural do pipeline.
**Decisão:** A Retrospectiva não só registra lições — o agente propõe explicitamente melhorias: critérios a mudar, lentes a adicionar, etapas a ajustar.
**Motivo:** Um registro sem proposta de ação é um arquivo. Uma proposta de melhoria é o mecanismo de evolução do pipeline. O pipeline precisa aprender com cada ciclo.
**Consequências:** As propostas precisam ser encaminhadas (não só registradas). Quem decide se aplica é o humano — o agente propõe, não decide.

---

## D015 — Padrão: Meta-Prompt + Structured Handoff

**Data:** 2026-06-26
**Contexto:** Precisávamos de nome e referências para o padrão que estamos construindo, para garantir que futuras decisões de design sejam coerentes com o que a literatura validou.
**Decisão:** O padrão tem nome oficial: **Meta-Prompt + Structured Handoff**. O CORE é o meta-prompt (instrução para gerar instruções); o output schema é o contrato de retorno; juntos implementam structured agent delegation.
**Motivo:** Padrão validado em produção pela Anthropic (+90.2% vs agente único). Nomenclatura estabelecida em APE (arXiv 2211.01910), Microsoft Agent Framework e "From Prompts to Templates" (arXiv 2504.02052). Nomear o padrão evita reinvenção e ancora futuras decisões em evidência.
**Consequências:** Toda documentação do projeto usa essa nomenclatura. Decisões que contradizerem o padrão precisam de justificativa explícita.

---

## D016 — Testar antes de registrar decisão de design

**Data:** 2026-06-26
**Contexto:** Tendência de registrar ideias de arquitetura como decisões antes de validá-las empiricamente — criando dívida difícil de desfazer.
**Decisão:** Nenhuma ideia nova de arquitetura ou abordagem é registrada como decisão antes de um teste isolado comparativo. O teste é a evidência; a decisão vem depois.
**Motivo:** Benchmark A vs B mostrou que a hipótese "schema primeiro" parecia correta na teoria mas produziu schema mais fraco na prática. Sem o teste, teríamos registrado a abordagem errada como padrão.
**Consequências:** Toda proposta nova de abordagem gera dois subagentes paralelos antes de qualquer atualização no CORE ou DECISOES.md. Adiciona tempo mas elimina decisões baseadas em intuição não testada.

---

## D017 — Output schema por família de etapa: pré-definido no CORE, não gerado dinamicamente

**Data:** 2026-06-26
**Contexto:** Benchmark comparativo testou duas abordagens: (A) gerador cria briefing primeiro, schema depois; (B) gerador cria schema primeiro, briefing derivado.
**Decisão:** O output schema não é gerado pelo mesmo agente que gera o briefing. O schema de cada família de etapa é pré-definido no CORE como template; o gerador apenas personaliza os campos variáveis com dados da instância.
**Motivo:** No teste, o Agente A produziu schema mecanicamente verificável mas derivado do briefing (não da necessidade da próxima etapa). O Agente B produziu briefing mais rico mas schema especulativo e não verificável. Nenhum dos dois gerou o schema correto dinamicamente porque o schema correto emerge da especificação da próxima etapa — que é fixa por arquétipo, não por instância.
**Consequências:** CORE v3 terá templates de output schema por família de etapa (DISCOVERY, DESIGN, IMPLEMENTAÇÃO, GATES, RETROSPECTIVA). O gerador preenche os campos variáveis; não inventa a estrutura. O dag verify valida o retorno do agente contra o template + campos preenchidos.

---

## D018 — Output schema em JSON via tool_use, renderizado como listas para o agente

**Data:** 2026-06-26
**Contexto:** Agentes produziam formato livre nas respostas; verificação mecânica era impossível. Formatos de tabela eram ilegíveis em terminal e interpretados de forma inconsistente.
**Decisão:** O dag next força saída JSON estruturada via tool_use do SDK. O JSON é validado mecanicamente antes de renderizar. A renderização para o agente executor usa sempre listas aninhadas, nunca tabelas.
**Motivo:** Pesquisa (arXiv 2504.02052): JSON + nomes de atributo + descrições → 4.90/5 de aderência de formato vs 3.09/5 sem eles. Instrução de exclusão explícita elevou conformidade de 40% para 100% em Llama3. Listas são mais legíveis em terminal e para o LLM do que tabelas.
**Consequências:** Implementação do dag next usa response_format ou tool_use para forçar JSON. CORE define schema; CLI valida; só então renderiza markdown com listas.

---

## D019 — State machine faseada: um CORE por etapa

**Data:** 2026-06-26
**Contexto:** O CORE atual era genérico — tentava servir todas as 13 etapas com um único documento, resultando em regras contraditórias e enum de confiança impossível para certos agentes (ex.: Explore não pode usar "confirmado ao vivo").
**Decisão:** A state machine é construída fase por fase. Cada etapa tem seu próprio CORE individual (ex.: CORE-DAG.md, CORE-DISCOVERY.md). O CORE genérico vira referência/esqueleto; nunca é despachado diretamente.
**Motivo:** Etapas diferentes usam agentes diferentes (Explore, fiscal, code-reviewer) com capacidades diferentes. Um CORE genérico força o gerador a produzir briefings com instruções impossíveis para o agente destinatário — como o enum "confirmado ao vivo" sendo usado pelo Explore, que não toca a rede.
**Consequências:** Começamos pelo CORE-DAG (etapa 1). As demais etapas serão especificadas individualmente. O investimento é maior por etapa, mas cada CORE é preciso, testável e sem ambiguidade de destinatário.
