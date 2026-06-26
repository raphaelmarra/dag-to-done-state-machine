# [WIP] Destilação do CORE-DAG (passos 2-3) — etapa intermediária

> Status: ETAPA INTERMEDIÁRIA. Racional destilado do briefing perfeito concreto (CRM)
> via ultra-think. Insumo direto para escrever o CORE-DAG (passo 4).
> Não é decisão. Vira DECISOES.md só após validação contra 2ª demanda (D016).

Fontes: `_WIP-briefing-dag-perfeito.md` (briefing v2) + `_WIP-dag-crm-concreto.md` (DAG real).

---

## Princípio organizador

Para cada elemento do briefing: é **mecânica** (invariante → regra do CORE) ou é
**leitura da demanda** (varia → o gerador extrai do entry_point)?

Analogia de compilador: o CORE é a GRAMÁTICA (estável); o entry_point é o PROGRAMA
(varia). Não se muda a gramática por programa.

---

## As 4 camadas destiladas

### Camada A — REGRAS DE GRAFO (a mecânica que produz um DAG válido)

| # | Regra | O que garante | Por que existe |
|---|---|---|---|
| A1 | **Nó-é-superfície** | Aciclicidade estrutural | Entidades geram ciclos; superfícies/funções têm consumo direcional |
| A2 | **Aresta-consumidor→provedor** | Direção única, sem ciclos | Outra metade da aciclicidade; proíbe aresta de volta |
| A3 | **Backward-é-vista** | Impact analysis sem quebrar o DAG | "Quem me consome" é derivado por travessia, não dado novo |
| A4 | **Fronteira-1-hop** | DAG finito e focado | Dá território ao Design sem mapear o sistema inteiro |

### Camada B — REGRAS DE METADADO (o que cada aresta/nó carrega e com que confiança)

| # | Regra | O que garante | Por que existe |
|---|---|---|---|
| B1 | **Custo-híbrido** | Custo honesto, na etapa certa | Estrutura → infere do código; runtime → gap p/ etapa 2 |
| B2 | **Custo-n/a-para-puras** | Não inventar custo onde não há | Função pura não tem API reversa para custear (achado da validação #5) |
| B3 | **Confiança-reflete-executor** | Zero mentira epistêmica | Enum espelha o que o agente PODE saber (Explore: lido/não-encontrado) |

### Camada C — REGRA DE GAP (o filtro consumer-driven — onde o G7 morre)

| # | Regra | O que garante | Por que existe |
|---|---|---|---|
| C1 | **Gap-é-direcional** | Filtra dívida técnica, UX, perf, refatoração | Gap = "falta info para a PRÓXIMA etapa", não "vi um problema" |

**Teste de gap (C1):** um gap só é gap se responder SIM a:
*"A próxima etapa (Descoberta/Design) NÃO consegue completar sua tarefa sem esta informação?"*
Dívida técnica, duplicação, refatoração, UX, performance → NÃO são gaps do DAG.

**Análise da falha G7 (inversão):** o Explore listou "duplicação de ReadTags / refatoração C1"
como gap. Erro: confundiu *"coisa imperfeita que vi"* (olhar para o lado) com *"info que falta
para a próxima etapa"* (olhar para frente). C1 não censura o fato — obriga a reformulá-lo na
direção do consumidor. Se a duplicação esconde divergência de comportamento que o Design
precisa, o gap vira "função X e Y divergem em Z" (passa no teste). "Tem duplicação" (não passa).

### Camada D — LEITURA DA DEMANDA (o gerador extrai do entry_point — NÃO é constante)

| # | Nome | O que o gerador faz | Por que varia |
|---|---|---|---|
| D1 | **Largura-do-escopo** | Lê entry_point: intent estreito vs domínio amplo → quais nós entram | A demanda decide; o CORE não fixa |
| D2 | **Vizinhos-de-saída** | Identifica domínios que o entry_point toca (CRM→Session/Agent/Tag) | Depende do domínio mapeado |
| D3 | **Quem-é-a-próxima-etapa** | Sabe se o consumidor do gap é Descoberta (ao vivo) ou Design | Calibra o teste de gap C1 |

---

## Estrutura recomendada do CORE-DAG (5 seções, atenção U-shaped)

```
1. CAPACIDADE DO EXECUTOR   ← isola B3; troca de executor = edita só aqui
2. O QUE É O DAG (essência) ← A1–A4 como princípios, não como schema
3. COMO LER A DEMANDA       ← D1–D3; o gerador extrai largura/vizinhos/próxima-etapa
4. AS 4 PARTES DO BRIEFING  ← OBJETIVO/ESCOPO/FORMATO/FRONTEIRAS, com B1–B2 no FORMATO
5. O TESTE DE GAP (C1)      ← no fim, com peso; é o filtro que mais erra
```

**Diferença-chave do CORE-DAG v2.0 atual:** o v2.0 lidera com o SCHEMA (7 seções a preencher).
O novo lidera com ESSÊNCIA e JULGAMENTO (por que nó é superfície, qual o teste de gap). O schema
vira consequência das regras, não o ponto de partida. É o que faz o agente JULGAR em vez de só
PREENCHER.

---

## Confiança (meta-análise)

- **Alta:** A1–A4 (grafo saiu acíclico na prática), C1 (a falha G7 prova a necessidade), D1 (cravado pelo operador).
- **Média:** B1 (híbrido funcionou, mas só 1 caso "a-confirmar" observado).
- **Incerto:** ordem das 5 seções (hipótese U-shaped) — só valida contra 2ª demanda.

## Riscos conhecidos (devil's advocate)

1. B3 acopla CORE ao executor → mitigado isolando numa seção própria (troca = edita só ali).
2. C1 pode parecer cego → na verdade obriga reformular o fato na direção do consumidor (feature).
3. D1 pode gerar DAG gigante em domínio amplo → A4 (1-hop) limita profundidade. Largura ≠ profundidade.
