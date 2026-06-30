# Relatório — E2E piloto do pipeline DAG-to-Done

> Primeira condução completa de uma feature real pelas 13 etapas da state machine, com subagentes reais,
> verificação contra ambiente vivo e deploy. O objetivo NÃO foi a feature em si — foi **testar o pipeline**:
> ele bloqueia o que deve? pega bugs reais? o ciclo de correção fecha? E o que o teste revela sobre o próprio
> sistema, para a próxima versão. (Sanitizado: sem infraestrutura, credenciais ou dados de negócio.)

## Veredito em uma linha

**O pipeline passou.** Completou 13/13 etapas conduzindo uma feature real de ponta a ponta. Os porteiros
bloquearam bugs reais (não foi teatro), o ciclo REPROVA→corrige→re-revisa funcionou todas as vezes, e o teste
ainda expôs uma fraqueza estrutural própria — o achado mais valioso.

## A feature-cobaia (genérica)

Conduzimos uma feature de UI real num console web administrativo: **uma aba que lista os "comandos/ferramentas"
disponíveis no sistema**, com busca, filtro, detalhe e uma ação de "testar" protegida por risco. A feature serviu
de cobaia; o que estava sob teste era a state machine.

## O que cada porteiro pegou (a prova de que não é teatro)

| Etapa | O que o porteiro fez | Por quê importa |
|-------|----------------------|-----------------|
| **GAP** | Bloqueou 2×: enums fora do contrato; **complexidade incoerente** com os drivers (declarou "média" com 3 itens críticos → forçou "alta") | Pega incoerência semântica, não só campo ausente |
| **Implementação** | Cruzou todas as âncoras (decisões↔gaps↔critérios) com os outputs anteriores: zero âncora-fantasma | Rastreabilidade verificável, não declarada |
| **Gate A (revisão adversarial)** | **REPROVOU com bugs REAIS** que iriam a produção: (1) um contrato de parâmetro errado; (2) a API era "magra" num ponto — uma coluna e uma busca ficariam permanentemente vazias | O design não previu; a revisão adversarial pegou |
| **Acessibilidade** | **REPROVOU**: mensagens de status (erro/progresso) sem anúncio para leitor de tela | Bug de acessibilidade real, corrigido antes do merge |
| **Gate B (ao vivo)** | Veredito **fail-closed honesto**: confirmou a camada de dados com requests reais, marcou a UI como "precisa-humano" — sem falso-verde | Verifica a verdade, não a aparência |

Cada REPROVA virou um ciclo **corrige → re-revisa → aprova**. Nenhum bug avançou sem ser tratado.

## O achado-ouro: uma cegueira de fonte no próprio pipeline

O teste rodou **duas vezes** (a intenção da feature foi se refinando). E o mesmo tipo de erro apareceu nas duas:

- **1ª execução:** a tela mostrou **1 item** — o pipeline ancorou na fonte que o código legado já usava, sem
  questionar se era a fonte certa.
- **2ª execução:** corrigida a fonte, a tela mostrou **centenas de itens** — mas ainda faltava um **universo
  inteiro** de comandos que vinha de um sistema paralelo que a fonte escolhida nem conhecia.

**Causa-raiz (estrutural):** o DAG (etapa 1) mapeia A FUNDO a fonte que recebe, mas **nunca pergunta "esta é a
única fonte?"**. Todo o rigor de verificação a jusante (Descoberta → Gate B ao vivo) opera sobre a premissa que
o DAG fixou — e a confirma com perfeição. Se a premissa nasce parcial, o rigor só prova que "a parte funciona".

> O pipeline garante **"a feature faz CERTO o que faz"** — mas não **"a feature olha para a coisa COMPLETA"**.

**Proposta de melhoria (para a próxima versão):** uma **Etapa 0 — Censo de Fontes / Gate de Intenção**, antes do
DAG. Dada a intenção declarada ("listar os comandos do sistema"), ela varre o ambiente atrás de **todas** as
fontes que a satisfazem — em vez de parar na primeira que o código já usa. Secundário: a etapa de Descoberta
deve ler o **contrato tipado** (SDK/spec) antes de sondar ao vivo — numa das execuções, sondar por tentativa-e-
erro a partir de um único exemplo fez a descoberta perder parâmetros e métodos que o contrato documentava.

## Lições registradas (da Retrospectiva da própria máquina)

1. **Cegueira de fonte** (acima) — a lição que mais vale para a v2.
2. **A revisão adversarial (Gate A) se paga** — pegou 2 bugs que o design não viu, em 2 dimensões diferentes
   (lógica e acessibilidade).
3. **Ler o contrato antes de sondar** — descoberta por exemplo único é parcial por construção.
4. **Fail-closed funciona** — o Gate B forçou a passagem para a aprovação a ser um ato humano deliberado, não
   automático; nenhum falso-verde.

## Conclusão

O pipeline DAG-to-Done fez o que promete: serviu de trilho, gerou briefing por etapa, validou cada entrega,
**bloqueou o que estava fora do critério**, e sustentou o ciclo de correção. Como subproduto, revelou uma
fraqueza própria (a cegueira de fonte) que se torna a principal entrada de melhoria. Um teste de pipeline que
encontra um defeito no próprio pipeline é o melhor tipo de teste.
