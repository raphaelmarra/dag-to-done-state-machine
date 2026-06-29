# Pipeline — Agentic DAG-to-Done

> Status: RASCUNHO APROVADO — pronto para detalhamento individual por etapa.
> Última atualização: 2026-06-26
> Próximo passo: detalhar cada etapa individualmente (agentes, ferramentas, entregável, critério de aceitação).

---

## Visão geral

O pipeline transforma uma intenção ("quero construir a tela X com arquétipo Y") em uma feature verificada e entregue em produção, seguindo uma sequência não-pulável de etapas. Cada etapa tem um agente responsável, um entregável com formato conhecido, e um critério de aceitação binário que deve ser verdadeiro para avançar.

A máquina de estados não controla só a ordem. Ela controla a **qualidade do que circula** entre as etapas — briefing automático gerado do estado atual, critérios verificáveis, entregáveis com estrutura conhecida.

---

## Fluxo completo

```
INTENÇÃO DA FEATURE
"quero construir a tela X com arquétipo Y"
        │
        ├─────────────────────────┐
        │ PARALELO                │ PARALELO
        ▼                         ▼
[1. DAG]                    [PESQUISA DE MERCADO]
Explore                     search-specialist
        │                         │
        └──────────┬──────────────┘
                   │ ambos prontos
                   ▼
[2. DESCOBERTA DA API]
fiscal
                   │
                   ▼
[3. GAP]
error-detective
  ├── incerteza técnica? → [SPIKE] → decisão tomada
  └── não
                   │
                   ▼
[4. DESIGN]
ui-ux-designer
  ├── Three Amigos (obrigatório)
  └── Pre-mortem (obrigatório)
                   │
                   ▼
[5. MAPA DE DEPENDÊNCIAS]
Plan
  ├── Definition of Ready (etapas 1-4 aprovadas?)
  └── skeleton = sim? → [WALKING SKELETON] → fullstack
                   │
                   ▼
[6. IMPLEMENTAÇÃO]
frontend-developer / typescript-pro / fullstack
  (conforme mapa de dependências — paralelo onde arquivos são disjuntos)
        │
        ├─────────────────────────┐
        │ Gate A                  │ Prep Gate B (paralelo)
        ▼                         ▼
[7. GATE A]                 [PREP GATE B]
code-reviewer               fiscal
Lentes por arquétipo        Prepara cenários, não executa ainda
        │ REPROVA → volta etapa 6
        │ APROVA
        └──────────┬──────────────┘
                   │ Gate A aprovado + Gate B preparado
                   ▼
[8. ACESSIBILIDADE]
web-accessibility-checker
(só MUTACAO, DRAWER, BOARD)
                   │
                   ▼
[9. GATE B — VERIFICAÇÃO AO VIVO]
fiscal
  ├── diverge / inconclusivo → volta etapa 6 ou escala humano
  └── verificado
                   │
                   ▼
[10. APROVAÇÃO HUMANA]
humano (Diretor/Approver)
                   │
                   ▼
[11. DONE]
dag done
dag verify + dag check --gate ci
INDEX + ADRs commitadas
                   │
                   ▼
[12. SMOKE PÓS-DEPLOY]
devops-engineer
Verificação ao vivo em produção
  ├── alerta / rollback → escala humano
  └── verde
                   │
                   ▼
[13. RETROSPECTIVA DE CICATRIZ]
documentador
Registra lições + propõe melhorias no pipeline
Alimenta: gate-ledger · lentes do Gate A · critérios futuros
```

---

## Etapas em detalhe

---

### PARALELO INICIAL

> Rodam ao mesmo tempo. O Design (etapa 4) só começa quando ambos estiverem prontos.

---

### Etapa 1 — DAG — Mapa de correlações

**Quem entra:** `Explore`
**Posição:** primeira — delimita o território antes de qualquer exploração

**O que faz:** Identifica como essa feature se conecta com o resto do sistema. Quais telas, dados, componentes e fluxos são tocados. Onde estão as dependências ocultas e os riscos de quebrar algo já funcionando. Sem isso, nenhuma outra etapa sabe onde olhar.

**Entregável:**
- Componentes tocados direta e indiretamente (com evidência no código)
- Telas que compartilham dados ou comportamento com essa feature
- Riscos de regressão identificados
- Perguntas que emergiram e precisam de resposta antes do design

**Critério de aceitação:**
- [ ] Dependências de primeiro nível mapeadas com evidência (não inferidas)
- [ ] Riscos de regressão listados explicitamente
- [ ] Nenhuma correlação sem evidência no código

---

### Pesquisa de mercado (paralela ao DAG)

**Quem entra:** `search-specialist`
**Posição:** paralela à etapa 1 — alimenta o Design

**O que faz:** Pesquisa como o mercado resolve o mesmo problema. Referências, padrões, benchmarks. O resultado entra direto no Design para que o agente não parta do zero.

**Entregável:**
- Referências organizadas por padrão (não lista aleatória)
- O que é aplicável a este contexto e por quê
- O que foi descartado e por quê

**Critério de aceitação:**
- [ ] Pelo menos 3 referências verificadas
- [ ] Cada referência com nota de aplicabilidade ao contexto

---

### Etapa 2 — Descoberta da API

**Quem entra:** `fiscal`
**Posição:** após o DAG — agora sabe exatamente quais endpoints importam

**O que faz:** Confirma ao vivo os endpoints que a feature vai usar. Params exatos, shapes reais de resposta, limites, comportamentos de borda. Nunca supõe — verifica com curl/proxy read-only.

**Entregável:** Ficha de API com:
- Endpoints confirmados (nome, método, params exatos verificados ao vivo)
- Shapes de resposta reais (não do doc)
- Limites encontrados (paginação, teto de registros, timeouts)
- O que foi tentado e não funcionou
- Nível de confiança por campo: `confirmado ao vivo` | `inferido do código` | `não verificado`

**Critério de aceitação:**
- [ ] Zero campos `não verificado` sem justificativa explícita
- [ ] Todos os endpoints que a feature vai usar testados ao vivo
- [ ] Limites e comportamentos de borda documentados
- [ ] Nenhuma suposição não verificada no entregável

---

### Etapa 3 — GAP

**Quem entra:** `error-detective`
**Posição:** após Descoberta — compara o que existe com o que precisa

**O que faz:** Confronta o que foi descoberto (DAG + API) com o que a feature precisa. Lista o que falta, o que é incerto, e o que já está pronto para usar. Declara explicitamente os no-gos — o que está fora de escopo de propósito. Inclui estimativa de complexidade.

**Entregável:**
- O que a API não oferece (com evidência)
- O que o sistema ainda não tem
- O que está pronto e pode ser reusado
- Incertezas que precisam de Spike antes do design
- No-gos declarados explicitamente
- Complexidade estimada: simples | média | alta (com justificativa)

**Critério de aceitação:**
- [ ] Cada gap tem evidência (não é suposição)
- [ ] Nenhum gap declarado "impossível" sem ter tentado outros ângulos
- [ ] No-gos declarados explicitamente
- [ ] Incertezas técnicas identificadas com proposta de Spike se necessário
- [ ] Complexidade estimada com justificativa

#### Ramificação: Spike

**Quando:** GAP identifica incerteza técnica que bloquearia o Design
**Quem entra:** `Plan`
**O que faz:** Pesquisa ou protótipo descartável com tempo limitado. O produto é uma decisão — não código de produção.
**Critério para sair:** decisão tomada e documentada (sim ou não, com motivo)
**Se o Spike não resolver:** escala para humano com o que foi aprendido — nunca bloqueia em silêncio

---

### Etapa 4 — Design

**Quem entra:** `ui-ux-designer`
**Recebe:** mapa do DAG + pesquisa de mercado + ficha de API + gaps + no-gos

**O que faz:** Define o comportamento esperado, os estados da tela, como o usuário interage. Integra o que o mercado faz com o que a API permite e o que os gaps revelaram.

**Three Amigos (obrigatório dentro do Design):**
Três perguntas antes de fechar qualquer comportamento:
- Por quê isso existe? (propósito)
- Como funciona? (comportamento)
- Como saberemos que está certo? (critério de aceitação testável)

O resultado das três perguntas vira os critérios de aceitação que o Gate B vai verificar ao vivo.

**Pre-mortem (obrigatório dentro do Design):**
Antes de fechar o design, imaginar que a feature já falhou em produção e listar o que deu errado. Mínimo 3 riscos. Os riscos alimentam as lentes do Gate A.

**Entregável:** Dossiê de design com:
- Matriz de estados × ações (o que o usuário pode fazer em cada estado)
- Comportamento esperado por caso (incluindo erros, bordas, estados vazios)
- Critérios de aceitação testáveis (sim/não) — produzidos pelo Three Amigos
- Riscos levantados no pre-mortem
- ADR para cada decisão arquitetural relevante
- Referências de mercado aplicadas

**Critério de aceitação:**
- [ ] Todos os estados da tela cobertos na matriz
- [ ] Casos de erro e borda documentados
- [ ] Three Amigos feito — critérios de aceitação escritos de forma testável
- [ ] Pre-mortem feito — mínimo 3 riscos levantados
- [ ] Cada decisão arquitetural com ADR

---

### Etapa 5 — Mapa de dependências

**Quem entra:** `Plan`
**Posição:** último ato antes de implementar

**O que faz:** Organiza as unidades de implementação. Define o que precisa esperar o quê e o que pode rodar em paralelo (só onde arquivos são disjuntos). Decide se a feature precisa de Walking Skeleton.

**Definition of Ready (gate interno):**
Antes de produzir o mapa, confirma que etapas 1-4 estão completas e aprovadas. Se não estiverem, volta — não avança.

**Entregável:**
- Unidades de implementação com escopo claro
- Dependências entre unidades (o que bloqueia o quê)
- O que pode rodar em paralelo (com quais arquivos cada unidade toca)
- Ordem de execução
- Decisão: Walking Skeleton sim ou não, com justificativa

**Critério de aceitação:**
- [ ] Definition of Ready completa (etapas 1-4 aprovadas)
- [ ] Paralelo só onde arquivos são disjuntos (confirmado)
- [ ] Cada unidade com escopo e done-criteria claros
- [ ] Decisão de Walking Skeleton documentada com justificativa

#### Ramificação: Walking Skeleton

**Quando:** feature de alto risco de integração (mapa de dependências decide)
**Quem entra:** `fullstack-developer`
**O que faz:** Versão mínima end-to-end ligando todas as peças reais. Valida o mapa de correlações na prática antes de construir tudo.
**Se quebrar algo:** volta para etapa 5 com o que aprendeu — não para etapa 6

---

### Etapa 6 — Implementação

**Quem entra:** `frontend-developer` | `typescript-pro` | `fullstack-developer`
(conforme mapa de dependências — paralelo onde arquivos são disjuntos)

**Briefing automático gerado pelo `dag next` inclui:**
- Endpoints confirmados com params exatos (etapa 2)
- O que não pode quebrar — componentes correlacionados (etapa 1)
- No-gos declarados (etapa 3)
- ADRs e critérios de aceitação (etapa 4)
- Escopo exato desta unidade e arquivos que pode tocar (etapa 5)

**Entregável:** Código implementado com declaração de:
- Cada endpoint usado na implementação (confirmado ou inferido)
- Nenhum no-go violado (declarado explicitamente)
- Nível de confiança por parte incerta: `confirmado` | `inferido`

**Critério de aceitação:**
- [ ] `tsc --noEmit` verde
- [ ] `check:contracts` verde
- [ ] `vitest run` verde
- [ ] `integrity-check` verde
- [ ] Zero placeholder ou TODO sem justificativa
- [ ] Zero dado hardcoded

---

### PARALELO PÓS-IMPLEMENTAÇÃO

> Gate A e Prep Gate B rodam ao mesmo tempo. Gate B só executa após Gate A aprovar.

---

### Etapa 7 — Gate A — Revisão do código

**Quem entra:** `code-reviewer`
**Posição:** paralelo à Prep Gate B

**O que faz:** Revisão adversarial do diff. Tenta encontrar problemas — não é validação, é tentativa de refutação. Usa lentes específicas por arquétipo.

**Briefing automático inclui:**
- Diff da implementação
- ADRs tomadas no design (para verificar conformidade)
- Riscos do pre-mortem (para cobrir especificamente)
- O **catálogo COMPLETO de lentes** (todas, de todos os arquétipos — decisão ADR 0028: catálogo plano, sem
  classificar arquétipo). O revisor declara, por lente, se ela está coberta / descoberta / não se aplica:
  - **LISTA** → estado vazio, estado de erro, paginação/volume, ordenação
  - **MUTACAO** → validação de input, confirmação de ação destrutiva, reversibilidade, edge de escrita, concorrência, autorização
  - **DRAWER** → foco ao abrir, escape/fechar por teclado, fechamento acidental
  - **BOARD** → drag-drop e persistência de ordem, optimistic update e rollback
  - **DETALHE** → registro inexistente (404), campos opcionais ausentes
  - **DISCO/UPLOAD** → validação de arquivo (tipo/tamanho), path traversal e segurança de upload
  - **transversais** → estado de loading, dados obsoletos/stale
  > Por que TODAS e não só as do arquétipo: features reais são multi-arquétipo (a aba CLIs é LISTA+MUTACAO);
  > injetar tudo e declarar cada uma elimina o gargalo "de onde vem o arquétipo" e impede o revisor de escolher
  > um escopo conveniente. `nao_aplicavel` exige motivo (decisão consciente, não esquecimento). Fonte canônica
  > das lentes: USWDS (a11y por componente) + OWASP ASVS (por operação).

**Entregável:** Veredicto `APROVA` ou `REPROVA` com:
- Lista de problemas (issues) encontrados — cada um específico e acionável (localização + ação)
- A situação de CADA lente do catálogo declarada (coberta/descoberta/nao_aplicavel, com nota)
- O que ficou fora de cobertura (honestidade sobre limites)

**Critério de aceitação:**
- [ ] TODAS as lentes do catálogo declaradas (coberta/descoberta/nao_aplicavel — nenhuma em silêncio)
- [ ] Cobertura declarada (não implícita); `nao_aplicavel` com motivo
- [ ] Veredicto claro: APROVA ou REPROVA (sem "depende") — REPROVA é resultado válido
- [ ] Se REPROVA: ≥1 exigência antes de mergear, com issues localizadas e acionáveis
- [ ] Coerência: APROVA ⟺ sem exigências e P0 coberto; toda lente descoberta vira issue

---

### Prep Gate B (paralela ao Gate A)

**Quem entra:** `fiscal`
**Posição:** paralela ao Gate A — não executa, só prepara

**O que faz:** Prepara os cenários de verificação ao vivo. Quais critérios testar, qual dado real usar, quais bordas checar. Quando Gate A aprovar, começa imediatamente sem tempo de setup.

**Entregável:** Plano de verificação com:
- Critérios de aceitação do design mapeados para cenários concretos
- Dados reais que serão usados em cada cenário
- Casos de borda identificados no GAP que serão testados

**Não executa nada ao vivo ainda.**

---

### Etapa 8 — Acessibilidade

**Quem entra:** `web-accessibility-checker`
**Posição:** entre Gate A e Gate B
**Arquétipos:** apenas MUTACAO, DRAWER e BOARD (interação real)

**O que faz:** Verifica com a tela funcionando — não lendo o código. Foco ao entrar, navegação por teclado, leitura de tela, contraste com dado real. O que o Gate A lê estaticamente, esse gate vê em movimento.

**Entregável:** `aprovado` | lista de itens a corrigir com severidade

**Critério de aceitação:**
- [ ] Critérios WCAG operacionais cobertos (não só análise estática)
- [ ] Navegação por teclado testada
- [ ] Foco e escape testados
- [ ] Se itens a corrigir: cada um com severidade e ação clara

---

### Etapa 9 — Gate B — Verificação ao vivo

**Quem entra:** `fiscal`
**Usa:** plano preparado em paralelo ao Gate A

**O que faz:** Executa os cenários preparados. O comportamento real bate com o dado real? Não é teste de código — é teste de verdade.

**Briefing automático inclui:**
- Plano de verificação preparado (Prep Gate B)
- Critérios de aceitação do Three Amigos (etapa 4)
- Casos de borda do GAP (etapa 3)
- Riscos do pre-mortem (etapa 4)
- O que o Gate A sinalizou como ponto de atenção

**Entregável:** Veredicto `verificado` | `diverge` | `inconclusivo` | `precisa-humano` com:
- Evidência de cada critério verificado
- O que foi impossível verificar e por quê
- Cobertura declarada

**Critério de aceitação:**
- [ ] Todos os critérios de aceitação do design verificados ou com justificativa de impossibilidade
- [ ] Nenhum `inconclusivo` sem proposta de próximo passo
- [ ] Veredicto diferente de `diverge` para avançar

---

### Etapa 10 — Aprovação humana

**Quem entra:** humano (Diretor/Approver)

**O que faz:** Usa a tela. Valida o visual, o fluxo, a sensação. O olho humano vê o que nenhum agente vê.

**Recebe:**
- Resumo do que foi construído
- O que o Gate A revisou e o que ficou fora
- O que o Gate B verificou ao vivo e o que ficou fora
- Riscos residuais conhecidos (honestidade sobre limites)

**Critério de aceitação:**
- [ ] Humano usou a tela (não só leu o relatório)
- [ ] Aprovação explícita via `dag advance <feature> --to done --approve --by <nome>`

---

### Etapa 11 — Done

**Quem entra:** sistema (`dag done`)

**O que faz:**
- `dag verify <feature>` roda de verdade (não editado à mão)
- `dag check --gate ci` verde
- Todos os gates com status derivado (não digitado manualmente)
- Histórico completo de aprovações registrado na instância
- INDEX atualizado
- ADRs commitadas

**Critério de aceitação:**
- [ ] `dag verify` exit 0
- [ ] `dag check --gate ci` exit 0
- [ ] Nenhum `status: pass` editado à mão (tamper_hash válido)
- [ ] Histórico de aprovações completo
- [ ] INDEX e ADRs commitados

---

### Etapa 12 — Smoke pós-deploy

**Quem entra:** `devops-engineer`
**Posição:** após o deploy em produção — não no ambiente de dev

**O que faz:** Verifica a feature em produção real. Os mesmos cenários do Gate B, agora no ambiente real com dado real de produção. Fecha o ciclo de verdade — não só o lógico.

**Entregável:** `verde` | `alerta` | `rollback necessário`

**Critério de aceitação:**
- [ ] Cenários principais do Gate B replicados em produção
- [ ] Endpoints da feature respondendo com dado real
- [ ] Se alerta ou rollback: escala humano imediatamente

---

### Etapa 13 — Retrospectiva de cicatriz

**Quem entra:** `documentador`
**Posição:** após smoke verde — encerra o ciclo

**O que faz:** Registra o que esse ciclo ensinou. Algum bug escapou de um gate que deveria ter pegado? Alguma decisão de design precisou ser revertida? Algum critério de aceitação estava errado ou faltando? E propõe melhorias concretas no pipeline.

**Entregável:**
- Lições registradas no `gate-ledger`
- Propostas de melhoria: critérios a mudar, lentes a adicionar, etapas a ajustar
- Pelo menos uma lição por ciclo (mesmo que seja "nada escapou — pipeline funcionou")

**Critério de aceitação:**
- [ ] Pelo menos uma lição registrada
- [ ] Se algo escapou: proposta de onde o pipeline deveria ter pegado
- [ ] Propostas de melhoria encaminhadas (não apenas registradas)

---

## Dependências obrigatórias

| Etapa | Depende obrigatoriamente de |
|-------|----------------------------|
| Descoberta da API (2) | DAG (1) — sabe onde olhar |
| GAP (3) | DAG (1) + Descoberta (2) — compara o que existe |
| Design (4) | GAP (3) + Pesquisa de mercado — sabe o que é possível |
| Mapa de dependências (5) | Design (4) completo — sabe o que é o trabalho |
| Implementação (6) | Mapa de dependências (5) — sabe como dividir |
| Gate B (9) | Gate A (7) aprovado — não verifica código com bugs |
| Aprovação humana (10) | Gate B (9) verificado |
| Done (11) | Aprovação humana (10) |
| Smoke (12) | Done (11) + deploy executado |
| Retrospectiva (13) | Smoke (12) verde |

---

## Paralelismos sancionados

| O que roda junto | Condição |
|-----------------|----------|
| DAG + Pesquisa de mercado | sempre — não dependem uma da outra |
| Unidades de implementação | só onde arquivos são disjuntos (mapa de dependências decide) |
| Gate A + Prep Gate B | sempre — Gate B só executa, não prepara |

---

## Práticas incorporadas

| Prática | Origem | Onde entra |
|---------|--------|------------|
| Spike | Extreme Programming | Entre GAP e Design, quando há incerteza técnica |
| Three Amigos | BDD / George Dinwiddie | Dentro do Design — produz critérios testáveis |
| Pre-mortem | Gary Klein / HBR 2007 | Dentro do Design — levanta riscos antes do código |
| Walking Skeleton | Alistair Cockburn | Opcional — Mapa de dependências decide |
| Definition of Ready | Scrum | Gate interno do Mapa de dependências |
| ADR | Michael Nygard 2011 | Produzido no Design, revisado no Gate A |
| Lentes por arquétipo | Interno | Gate A — bateria específica por tipo de tela |
| Indicador de confiança | Interno | Etapas 2, 6 e 9 — declara verificado vs inferido |
| Estimativa de complexidade | Interno | GAP — alimenta decisão de Walking Skeleton |
| Proposta de melhoria | GEPA / Interno | Retrospectiva — evolui o próprio pipeline |
