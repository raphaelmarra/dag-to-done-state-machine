# [WIP] Briefing DAG Perfeito — artefato-âncora para destilar o CORE-DAG

> Status: RASCUNHO PARA CRÍTICA (v2). Não é decisão. Não vai para DECISOES.md ainda.
> Método (bottom-up): este briefing perfeito → destilar o racional → o racional vira o CORE-DAG.
> Caso concreto: domínio **CRM** do ravi-console.
> Quem escreveu o draft: copiloto. Quem critica: você.

---

## FUNDAÇÃO (decidida — sai da essência do DAG + prática de mercado)

Antes do briefing, as regras que sustentam tudo abaixo. Estas já foram cortadas com você.

1. **É um DAG de verdade — acíclico por construção.** Conseguido pela escolha do que é nó:
   - **Nó** = superfície/função que a feature consome (NÃO entidade de dados solta — entidade
     gera ciclos como contact↔opportunity).
   - **Aresta** = "depende de para funcionar", sempre **consumidor → provedor**, direção única.
   - Direção única ⇒ sem ciclos. (A base antiga tinha ciclos porque modelava por entidade.)

2. **Backward é calculado, não armazenado.** "Quem mais me consome" (blast radius) é o
   **grafo reverso**, obtido por travessia — não uma aresta de volta (que recriaria ciclo).
   Padrão de mercado: transitive reduction + travessia sob demanda (Madge `.depends()`).

3. **Fronteira: 1 hop armazenado, transitiva sob demanda.** Confirmado pela base (0001) e
   pela teoria (transitive reduction). O DAG dá o território; o Design decide o que percorrer.

4. **Custo de aresta (🟢🟡🔴) = HÍBRIDO pela fronteira estática/runtime** (= o que o mercado faz):
   - Custo que o código REVELA (tem param de filtro? é list sem filtro?) → Explore infere,
     marca `inferido`. Isto é o que dependency-cruiser faz (anota a aresta por análise estática).
   - Custo que depende de RUNTIME (a API honra o filtro? é eficiente?) → vira `a confirmar
     pela Descoberta` = gap para a etapa 2. Isto é contract-testing, não leitura de código.

5. **Executor = Explore (lê código, não toca rede) — D019 preservada.** O DAG é estrutura,
   e estrutura é legível no código. O que é runtime vira gap nomeado para a etapa 2.

---

## Por que ESTE caso

CRM é o subsistema mais denso do ravi (contact, opportunity, pipeline, stage, account, tag,
fact) e o que mais se conecta para fora (agent, session, thread). Se o briefing leva o
agente a mapear o CRM bem, leva a mapear qualquer coisa.

O `docs/relations/` do ravi já mapeou isso uma vez — mas tem gaps autodeclarados
("~90% confiança, snapshot"). Usamos como **referência de formato**, não como gabarito.

---

## O contexto que o gerador recebe (entrada da instância)

```
entry_point: "CRM"          ← NÃO é uma feature pontual; é um domínio/região do sistema
description: "Operador humano precisa ver tags do cliente, abrir o card da
              oportunidade e ver tudo (anotações, justificativa/fatos), e
              preencher dados manualmente. CRM como ferramenta de operação."
project_root: C:\Users\gouve\Desktop\ravi-console
```

---

## O BRIEFING (o que o gerador deveria produzir e despachar ao Explore)

```
## OBJETIVO
Construa o DAG de dependências do domínio CRM do ravi-console — nós (superfícies/funções
que o CRM consome), arestas direcionadas (consumidor → provedor) e gaps — produzindo o
dossiê de correlações que o Design vai usar como lente para decidir o que a feature percorre.

## ESCOPO
Inclui:
- Superfícies/funções do CRM: o que o operador toca (card da oportunidade, tags do contato,
  fatos/justificativa, notas, edição de campo) e o que cada uma consome no código.
- Arestas "depende de" DENTRO do CRM, direção consumidor→provedor
  (ex.: card-da-oportunidade → crm/opportunity/show → entidade opportunity → pipeline+contact).
- Arestas de SAÍDA do CRM até 1 hop (ex.: contato → agent dono, contato → sessions).

NÃO inclui:
- Expandir o que está fora do CRM além de 1 hop (NÃO mapear o grafo interno de agent,
  session ou tag — só a aresta que os liga ao CRM; o resto é outro DAG).
- Domínios não-CRM: orquestração (cron, route, task), permissões, skills, tools.
- Decidir SE a feature deve percorrer cada aresta (decisão do Design, etapa 4).
- Medir custo de runtime das arestas (a Descoberta da API, etapa 2, confirma ao vivo).

## FORMATO
Execute em dois passes.

Passe 1 — Grafo: leia o código e liste todos os nós (superfícies/funções) e as arestas
          "depende de" na direção consumidor→provedor. Não invente aresta de volta:
          o backward (quem consome o quê) sai por travessia, não por aresta nova.
Passe 2 — Custo e gap:
          (a) Para cada provedor (nó de API), olhe COMO ele é chamado no código. Se o código
              revela o custo de consultá-lo de volta (tem param de filtro pela FK? é list sem
              filtro?), marque o custo com confiança "inferido". Se NÃO revela, marque
              "custo: a confirmar pela Descoberta" → vira gap.
          (b) Para cada coisa que o código não mostra e o Design precisa, pergunte: "o Design
              fica sem saber algo que muda a decisão da feature?" Se sim → gap. Se não → descarta.

Schema a preencher (listas aninhadas, nunca tabelas):

## Nós
- [nome da superfície/função]
  - tipo: superfície-UI | função-API | disco | estado-browser
  - path: [arquivo ou endpoint identificado no código]
  - shape: [campos/props principais visíveis no fonte]
  - confiança: lido no código | não encontrado

## Arestas (consumidor → provedor, sempre nessa direção)
- [consumidor] --[o que estabelece: import / chamada / FK]--> [provedor]
  - tipo: consome | depende
  - custo-reverso: 🟢 cheap (provedor filtra pela FK) | 🟡 indireto (só via junção) |
                   🔴 scan (sem filtro) | a-confirmar (código não revela)
  - confiança do custo: inferido do código | a confirmar pela Descoberta
  - confiança da aresta: lido no código | não encontrado

## Blast radius (grafo reverso — calculado, não armazenado como aresta)
- direto (1 hop reverso): [quem consome diretamente cada nó central]
- transitivo (sob demanda): [só se houver função cross-cutting; senão "não calculado"]

## Fronteira do grafo
- nós-folha (onde parei de expandir): [lista]
- arestas de saída do CRM (1 hop): [lista]

## Gaps
- [ID]: [o que o código não revela e o Design/Descoberta precisa]
  - prioridade: P0 (bloqueia decisão) | P1 (decisão com lacuna) | P2 (edge)
  - ação: [quem resolve e onde]

## Resumo de confiança
- lido no código: N
- não encontrado: N → [ids dos gaps]
- custo a confirmar pela Descoberta: N → [ids dos gaps]

## FRONTEIRAS
- NÃO execute endpoints ao vivo — a Descoberta da API (etapa 2) faz isso
- NÃO meça custo de runtime — só infira o que o código revela; o resto é gap p/ etapa 2
- NÃO crie aresta na direção provedor→consumidor — o grafo é acíclico; backward é travessia
- NÃO crie arquivos ou código — a Implementação (etapa 6) faz isso
- NÃO proponha telas, fluxos ou arquitetura — o Design (etapa 4) faz isso
- NÃO expanda fora do CRM além de 1 hop — outro DAG cobre aquele domínio
- NÃO liste como gap problemas de implementação, UX ou performance — não são gaps do DAG
```

---

## O que MUDOU da v1 para a v2 (e o que ainda quero que você ataque)

**Mudou (com base na essência do DAG + pesquisa de mercado + nossa base):**
- Nó deixou de ser "entidade" e virou "superfície/função" → grafo acíclico por construção.
- Aresta tem direção única (consumidor→provedor). Backward virou "Blast radius" calculado.
- Custo virou híbrido: `inferido` quando o código revela, `a-confirmar` (gap p/ etapa 2) quando não.
- Saiu a seção "Implicações para o Design" (ver ponto 1 abaixo — decisão sua).

**Pontos abertos — VEREDITO: a largura se decide pela DEMANDA REAL, não no CORE.**

> Princípio fixado: o CORE-DAG ensina a MECÂNICA do grafo (nó=superfície, aresta
> consumidor→provedor, acíclico, backward calculado, custo híbrido, 1-hop). A LARGURA
> do escopo (intent estreito vs. domínio amplo) vem do `entry_point` da instância — o
> gerador lê da demanda, não inventa no CORE. Os 3 pontos abaixo são todos resolvidos
> por esse princípio: são adaptáveis ao entry_point, não constantes do CORE.

1. **"Implicações para o Design": fora do entregável-base, mas o sinal 🔴 vem marcado.**
   O DAG entrega grafo cru (separação de responsabilidade com o Design). PORÉM o custo
   da aresta já carrega o sinal: 🔴 na aresta É o dado bruto de que "isso é sinal de
   design" — sem o DAG *concluir* o design. O Design lê o 🔴 e tira a implicação. Resolve
   a tensão sem o DAG invadir o Design.

2. **Blast radius transitivo: "não calculado" por padrão, sob demanda quando o entry_point
   for cross-cutting.** Coerente com 1-hop. Demanda ampla ("CRM inteiro") pode pedir
   transitiva; demanda estreita ("card da opp") não precisa. O entry_point decide.

3. **Nó = superfície/função, com largura ditada pelo entry_point:**
   - entry_point = INTENT ("card da oportunidade") → nós = superfícies dessa intent (estreito).
   - entry_point = DOMÍNIO ("CRM") → nós = superfícies do domínio (amplo).
   A mecânica é a mesma; só a largura muda. O CORE não escolhe — lê o entry_point.
