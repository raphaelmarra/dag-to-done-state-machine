# Questões em Aberto

> O que ainda não foi decidido, o que é incerto, e o que precisa de mais pesquisa.
> Cada item tem um dono e um status.

---

## A001 — Formato exato do entregável de cada etapa

**Status:** em aberto
**Questão:** Os entregáveis foram descritos em prosa. Precisamos definir se são: campos YAML na instância, documentos markdown com seções fixas, ou respostas estruturadas do agente em formato JSON.
**Impacto:** Alto — o formato determina como o sistema verifica o critério de aceitação automaticamente.
**Próximo passo:** Decidir um formato antes de desenhar a verificação automática.

---

## A002 — Como o agente "responde" ao sistema (loop de feedback)

**Status:** em aberto
**Questão:** Hoje o agente produz texto livre. Para o sistema verificar o critério de aceitação, o agente precisa produzir uma saída estruturada. Como isso funciona na prática dentro do Claude Code?
**Impacto:** Alto — é o coração da verificação automática.
**Próximo passo:** Pesquisar como o Claude Code captura saída estruturada de agentes para uso pelo CLI.

---

## A003 — Fases diferenciadas por arquétipo (LISTA vs MUTACAO)

**Status:** em aberto, baixa prioridade
**Questão:** Na versão inicial o pipeline tem as mesmas 10 fases para qualquer feature. Mas uma tela MUTACAO é mais complexa que um DRAWER simples. Faz sentido ter pipelines diferentes por arquétipo?
**Impacto:** Médio — afeta a rigidez vs flexibilidade do sistema.
**Próximo passo:** Avaliar após a primeira versão funcionar. Não adicionar antes.

---

## A004 — O que acontece quando o Spike não resolve a incerteza

**Status:** em aberto
**Questão:** O Spike está previsto entre etapas 3 e 4 para resolver incerteza técnica. Mas se o Spike terminar sem resposta (a incerteza persiste), o pipeline para? Escala para o humano? Descarta a feature?
**Impacto:** Médio — precisa de um caminho definido para não travar o processo.
**Próximo passo:** Definir o protocolo de "Spike inconclusivo" antes de implementar.

---

## A005 — Paralelismo entre features diferentes simultaneamente

**Status:** em aberto
**Questão:** O sistema cuida de cada feature separadamente. Mas e quando duas features estão em etapas diferentes ao mesmo tempo e compartilham arquivos? O mapa de colisão atual é suficiente ou precisa ser integrado ao pipeline?
**Impacto:** Médio — pode gerar conflitos silenciosos em implementações paralelas.
**Próximo passo:** Verificar se o mapa de colisão do CONTRATO atual cobre esse caso ou precisa ser extendido.

---

## A006 — Critério para ativar Walking Skeleton

**Status:** em aberto
**Questão:** Walking Skeleton foi incluído como "opcional entre etapas 5 e 6, para features de risco alto". Mas o que define "risco alto"? Quem decide e como?
**Impacto:** Baixo — é opcional, mas sem critério claro vira ou obrigatório (burocracia) ou ignorado.
**Próximo passo:** Definir 2-3 critérios objetivos para acionar o Walking Skeleton.

---

## A007 — Integração com o CLI dag existente: extend vs rewrite

**Status:** em aberto
**Questão:** A SPEC-PHASE-GATE-ENFORCER propõe adicionar 4 verbos ao dag.mjs existente. Mas o pipeline agora é mais rico (10 etapas, briefings, critérios de aceitação). O dag.mjs ainda é o lugar certo, ou precisa de um arquivo separado?
**Impacto:** Alto — afeta toda a arquitetura da implementação.
**Próximo passo:** Decidir antes de começar a implementação.
