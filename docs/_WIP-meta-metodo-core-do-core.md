# _WIP — O "CORE do CORE": meta-método de destilar o CORE de uma etapa (Fase 3 da A022)

> **Status:** ⚠️ WIP / n=1 herdado. Produzido na Fase 3 da A022 (agente `Plan`, read-only, 2026-06-30). Destila o
> META-MÉTODO invariante de obter o CORE de UMA etapa em QUALQUER domínio. Cada passo rastreável a um caso real do
> projeto OU a uma fonte da Fase 2 (`research/0016`). Insumo direto da skill (Fase 6). **Não cristaliza nada** — só a
> Fase 7 (2º domínio) valida. Sucede/atualiza `METODOLOGIA-CORE.md` (a base de 5 fases que este refina).

---

## O "CORE do CORE" em uma frase

**Destile o racional CRU de um caso real concreto (sem jargão) → bata um nome canônico da literatura nesse racional →
pesquise o nome e verifique se o termo realmente cabe (não force) → se couber e o conceito for MAIOR que a fatia que
você usou, expanda o cenário → escreva o CORE impondo honestidade pela forma (todo "atalho de saída" exige ônus de
prova mecânico) e declarando o limite epistêmico do porteiro → teste com executor independente contra um padrão-ouro
que você não escreveu sozinho, incluindo um adversário que QUER quebrar a regra → cristalize só o que sobreviveu;
marque o resto "⚠️ PROVISÓRIO" com critério exato de promoção.**

Em vocabulário canônico: é **Externalização → Combinação** (SECI) feita bottom-up, **ancorada num nó canônico da
ontologia** (terminology grounding) mas **com verificação de ajuste** (sensitizing concepts da Grounded Theory são
ponto de partida, não molde), e **validada por elicitação assistida por probes** (Critical Decision Method) em vez de
pura introspecção.

---

## Os passos do meta-método

Forma CORRIGIDA do `METODOLOGIA-CORE.md`. Correção central: **destilar o racional cru vem ANTES de pesquisar o nome**
(ver Decisão 1). A pré-fase PESQUISA é cindida: pesquisa **de forma** (reutilizável, roda uma vez no projeto) vira
pré-requisito; pesquisa **de conteúdo** (da etapa) é deslocada para depois do batismo (passo 3).

### Passo 0 — PRÉ-REQUISITO: pesquisa de forma (uma vez por projeto, não por etapa)
Garante a base "como escrever um meta-prompt que move um LLM" (sanduíche/regra-mestra repetida, polaridade positiva,
exclusões como transferência de responsabilidade, raciocínio-antes-do-formato, vocabulário fixo). Vale para TODO CORE.
**Saída:** pacote de regras de escrita reutilizável. **Âncora:** `METODOLOGIA-CORE.md` (PESQUISA família 1;
`research/0006–0010`); `research/0015` Marco 5 ("a pesquisa de forma não se repete"). **INVARIANTE** — a skill copia pronto.

### Passo 1 — DESTILAR O RACIONAL CRU de um caso real (bottom-up, sem jargão)
Escolhe-se um caso real **pelo critério de teste, não por conveniência** (deve estressar o frágil) e produz-se o
"briefing perfeito" — o que um executor ideal deveria receber — em prosa, com vocabulário PRÓPRIO, **deliberadamente
SEM nomes da literatura**. Destila-se o invariante (vira regra) do variável (lido da demanda). **Por que sem jargão:**
nomear cedo ancora o pensamento no que o termo carrega antes de ter pensamento próprio.
**Âncora (caso):** `_WIP-briefing-dag-perfeito.md`, `_WIP-destilacao-core-dag.md` ("nó-é-superfície",
"consumidor→provedor", "fronteira-1-hop" — termos locais; os canônicos só em `research/0011–0014`). M-T1 (`research/0015`).
**Âncora (fonte):** Externalização do SECI (`research/0016` §3); M2 do `CLAUDE.md`.
**⚠️ Reforço de elicitação (Decisão 4):** use **probes do Critical Decision Method** em vez de pura introspecção —
"que pista um novato não veria?", "o que te fez decidir X?", "o que daria errado se...?". Extrai os *cues* e heurísticas
de decisão que viram regras, e distingue *o que você acha que faz* de *o que de fato faz* (`research/0016` §3).

### Passo 2 — BATIZAR o racional já destilado com o nome canônico
Agora — e só agora — dá-se ao racional cru o NOME da literatura. "Mapear o que a feature consome" vira *change impact
analysis / blast radius / dependency DAG*. **Por que (não é cosmética):** o nome vira **boundary object** comunicável e
dispara o **labeling effect** — destrava reuso e conecta o achado à rede (pattern language).
**Âncora (caso):** `adr/0015` (padrão-mãe), DAG na fronteira (`research/0012`) e aciclicidade (`research/0011`). 1ª
metade de M-T1. **Âncora (fonte):** boundary objects (Star & Griesemer 1989); labeling effect (PMC8770803); sensitizing
concepts (Bowen 2006) — `research/0016` §5.

### Passo 3 — PESQUISAR o nome (pesquisa de conteúdo, dirigida pelo termo)
Com o nome canônico em mãos, dispara a pesquisa de CONTEÚDO da etapa — a teoria do domínio daquele conceito. **É a
pré-fase PESQUISA do método antigo, deslocada para depois do batismo** (Decisão 1). **Anti-viés herdado:** antes de
pesquisar, listar os vieses dos ADRs e calibrar a pesquisa para DERRUBAR a premissa.
**Âncora (caso):** `research/0011–0014` foram disparadas DEPOIS de o racional cru estar destilado (`research/0015`
Marco 4, sequência 1→2→3). **Âncora (fonte):** ontology/terminology grounding (Jakulin & Mladenić 2005).

### Passo 4 — ⭐ VERIFICAÇÃO DE AJUSTE (o termo cabe, ou estou forçando?) — PASSO NOVO
Antes de expandir, pergunta-se EXPLICITAMENTE: **"o termo canônico realmente descreve nosso caso, ou estamos espremendo
o achado no molde do termo?"** Se o termo só cobre parte, ou distorce, REJEITA-SE ou ADAPTA-SE — não se herda a bagagem
cegamente. **Por que existe:** a Grounded Theory adverte que *sensitizing concepts são ponto de partida, deve-se ir
ALÉM deles*; adotar tudo é **viés de confirmação com aparência de rigor**. Achado mais acionável da Fase 2.
**Saída:** veredito por conceito — {termo cabe inteiro / cabe parte X não Y / não cabe, descartar}.
**Âncora (fonte):** Bowen 2006; Veredito de `research/0016`. **Âncora (caso que prova a necessidade):** no CRM o cego
marcou duplicação de `tagNamespace` como "acoplamento" — PARECE ciclo mas é cicatriz; precisou distinguir "duplicação
(dívida)" de "dependência mútua (ciclo real)" — o termo *ciclo* não cabia, não force (`_WIP-core-dag-v4.md`, "Anti-pattern ≠ ciclo").

### Passo 5 — EXPANDIR o cenário (só o que passou no ajuste)
Dos conceitos cujo termo CABE e cujo canônico é MAIOR que a fatia usada, expande-se — herda-se a riqueza da vizinhança.
**Saída:** mudanças candidatas de expansão (cada uma com veredito aceita/rejeita/a-testar e fonte).
**Âncora (caso):** "1 hop" → profundidade dinâmica (`adr/0020`); blast radius → amplitude graduada (`adr/0021`);
aciclicidade-axioma → meta verificável + condensação SCC (`adr/0022`). 2ª metade de M-T1. Passos 1→5 são a forma
corrigida e completa de M-T1 (no método antigo, invertida e sem o passo 4).

### Passo 6 — ESCREVER o CORE (vNova, em WIP) — com 2 invariantes de produto embutidas
Parte do CORE anterior; aplica as expansões (passo 5) + regras de escrita (passo 0). Embute DUAS invariantes:
- **6a — Honestidade imposta pela forma (anti-fuga / ex-M-T5):** toda saída-fuga ("confirmado", "N/A", "inconclusivo",
  "skip", "aprovado") exige ÔNUS DE PROVA colado e MECÂNICO (evidência não-oca, motivo de enum fechado, prova-da-
  ausência). Defesa mecânica (token/objeto/número), não semântica. **Âncora:** `regraEvidenciaObrigatoria` (`adr/0023`),
  `regraNaoAplicavelComMotivo` (`adr/0028`), `inconclusivo` enum fechado (`adr/0030`), `regraCensoConfrontado` (`adr/0032`).
- **6b — Limite epistêmico declarado (ex-M-T4):** o CORE declara em texto o que o porteiro CONSEGUE checar (forma,
  evidência colada, coerência) e o que NÃO (autenticidade, pertinência, completude). Vira texto + dívida em ABERTO com
  direção. **Âncora:** `adr/0027` (A016), `adr/0028`, `adr/0030`+A018, A017, A019.
- Mudança não validável neste caso entra **"⚠️ PROVISÓRIO"**, nunca como regra firme.
**Âncora (fonte):** regras de escrita = `research/0006–0010`; descartar role/persona elaborada.

### Passo 7 — TESTAR (o portão de verdade, M4) — com adversário reforçado
Quatro testes:
1. **Generalidade (executor independente):** recebe SÓ o briefing gerado (não o CORE), produz o output, compara ao
   padrão-ouro. É o **"teste do novato"** do Golden Path: se o novato não executa só com o briefing, o CORE não transmitiu.
2. **Regressão:** roda contra o caso anterior; confirma que não piorou.
3. **Adversarial DIRIGIDO E DIFÍCIL:** estressa a regra mais arriscada — e o adversário tenta QUEBRAR (4+ nós atrás de
   indireção, ou falso-positivo "parece X mas não é"), não o didático óbvio (mitigação Furo 3).
4. **Encadeamento real:** roda o fluxo real (`next`→escrever→`advance`) encadeando com as anteriores, sem injetar
   pré-condições à mão, com prova negativa.
**Regra:** "passou no ao-vivo ≠ pronto"; o anti-viés saturado roda DEPOIS e verifica as 3 checagens (paridade
CORE↔porteiro / encanamento de entrada / dialeto de validação). **Âncora:** `_WIP-core-dag-v4.md` Fase 3; lição da
etapa 2 (`METODOLOGIA-CORE.md` 75–98); "teste do novato" (`research/0016` §4); Furos 3 e 4.

### Passo 8 — CRISTALIZAR (governança)
WIP → oficial; versão anterior arquivada. Decisão estrutural validada → ADR (motivo ancorado). Provisório → ABERTO com
critério EXATO. Atualiza ROADMAP/CHANGELOG/INDEX/DECISOES. O CORE recebe uma **descrição canônica indexável**
(preparação para reuso futuro — ver provisório). **Âncora:** `METODOLOGIA-CORE.md` Fase 4; A5/condensação como
PROVISÓRIA (A010); skill `manter-governanca`; descrição indexável = Voyager/ExpeL em modo manual (`research/0016` §6).

### Heurísticas do meta-método (NÃO são passos — lentes; ver Decisão 3)
- **H1 — Transporte de disciplina (ex-M-T6):** pergunte se o RACIOCÍNIO de uma etapa já fechada se aplica (DAG de
  código → grafo de tarefas; "réu nunca é juiz" vira mecânica). Reuso conceitual, não só de infra.
- **H2 — Retro-aplicação de lente (ex-M-T7):** toda lente nova é re-aplicada às etapas JÁ fechadas (A013).
- **H3 — Extensão fundacional amortizável (ex-M-T3, CONDICIONAL):** se o domínio-alvo separa motor de conteúdo e uma
  etapa precisa de mecanismo que o motor não tem, NÃO hardcode — espere o 2º caso (M4), estenda o motor 1× genérico e
  retrocompatível. **A skill deve CHECAR se o domínio-alvo tem essa separação** antes de aplicar.

---

## Decisões desta fase

**Decisão 1 — Ordem do M-T1: ADOTAR a ordem corrigida.** O meta-método adota destilar cru (1) → batizar (2) →
pesquisar (3) → expandir (5); a pré-fase PESQUISA é cindida (forma = passo 0 pré-requisito; conteúdo = passo 3, pós-
batismo). **Motivo:** a Fase 0 documentou a ordem INVERTIDA no método atual; o caso-âncora mostrou o racional cru
destilado ANTES dos nomes canônicos (`research/0015` Marco 4, sequência 1→2→3). Destilar primeiro evita ancorar no
jargão; a pesquisa de forma fica antes por ser agnóstica à etapa.

**Decisão 2 — Verificação de ajuste: ADICIONAR como passo 4, ENTRE pesquisa e expansão.** Pergunta obrigatória "o termo
cabe ou estamos forçando?". **Motivo:** achado anti-viés mais acionável da Fase 2 (`research/0016` Veredito: "a
literatura nos CONTRADIZ aqui... sem isso vira viés de confirmação com aparência de rigor"). A posição é forçada pela
lógica: só se julga o ajuste depois de conhecer a vizinhança (3), e a expansão (5) é o ato que o viés contamina. Caso
real `tagNamespace` prova que o termo pode não caber.

**Decisão 3 — Destino dos 7 movimentos:**

| Movimento | Destino | Motivo |
|---|---|---|
| M-T1 (batismo+expansão) | **PASSOS 1–5** | Achado-âncora; único cuja ausência custou riqueza demonstravelmente. |
| M-T5 (anti-fuga) | **PASSO 6a** | Invariante de produto mais consistente (5+ etapas); domínio-agnóstico. |
| M-T4 (limite epistêmico) | **PASSO 6b** | Impede o pipeline de mentir sobre o que garante; generaliza. |
| M-T2 (fusão cego↔autor) | **PASSO 1 + 7** | Já no método, raso; enriquecido SEM vender o cego como neutralizador de viés. |
| M-T3 (extensão amortizável) | **HEURÍSTICA H3** | Específico de SMs com motor separado; não universal. |
| M-T6 (transporte de disciplina) | **HEURÍSTICA H1** | Difícil de mecanizar sem virar burocracia. |
| M-T7 (retro-aplicação de lente) | **HEURÍSTICA H2** | Idem M-T6. |

Respeita M4: nenhum movimento de baixa convicção vira passo; M-T3 fica condicional (premissa "motor separado" não é garantida cross-domínio).

**Decisão 4 — Importar só processo (não infra).** Importados: **SECI** (vocabulário, passos 1–2); **probes do CDM**
(reforço do passo 1); **"teste do novato"** do Golden Path (passo 7.1); **5 propriedades COLLEAGUE.SKILL** como DoD da
SKILL (Fase 4/6). NÃO importar agora (provisório): compilador-de-CORE (DSPy/APE), coleta automática de trajetórias
(ExpeL/Voyager). **Motivo:** ADR 0001 ("zero deps, no framework") + M4 (regime 1-2 casos). Processo entra sem custo;
maquinário fica provisório com critério.

---

## Mitigação dos 4 furos

| Furo (`_RETRO`) | Como o meta-método ataca | Onde |
|---|---|---|
| **Furo 1 — n=1, réu é juiz** | Passo 7 exige executor independente; passo 8 só promove o que sobreviveu aos 4 testes, resto PROVISÓRIO. O ataque real só fecha na **Fase 7 (2º domínio, idealmente outro operador)**. O método DECLARA o n=1. | Passo 8 + Limites |
| **Furo 2 — cego não-independente** | M-T2 promovido COM ressalva: o cego dá frescor, não independência sistemática ("dois espelhos, não duas testemunhas"). Mitigação: ≥3 verificadores de perspectivas diversas no passo 7. O método ADMITE que não zera o viés. | Passo 1, 7 |
| **Furo 3 — adversarial fácil** | Passo 7.3: o adversário tenta QUEBRAR (4+ nós atrás de indireção, falso-positivo "parece X não é"), não o didático óbvio. | Passo 7.3 |
| **Furo 4 — juiz=autor** | (a) "teste do novato" (7.1) é o critério mais objetivo disponível; (b) padrão-ouro fundido (cego+autor). Honestidade: não há gabarito mecânico ainda — fica no PROVISÓRIO (DSPy). Mitigado, não fechado. | Passo 7.1 + Provisório |

---

## O que fica PROVISÓRIO / futuro

1. **⚠️ Compilador-de-CORE com métrica (DSPy/APE).** Fechar o loop com "função de score do CORE" e re-compilar.
   **Fora:** exige compilador + N de casos; viola ADR 0001 + regime 1-2 casos. **Critério:** métrica objetiva de etapa
   + domínio com massa de casos.
2. **⚠️ Coleta automática de trajetórias + biblioteca indexável (ExpeL/Voyager).** **Fora:** vector DB + muitas
   trajetórias. **Critério:** índice semântico + ≥N COREs. **Já preparado:** passo 8 dá descrição canônica indexável (custo zero).
3. **⚠️ 4ª fase do SECI (Internalização).** Método virar fluente pela prática. **Fora:** é resultado de uso, não passo.
   **Critério:** após ≥2 domínios, registrar o que virou tácito-fluente.
4. **⚠️ Loop de verificação DENTRO da geração** (conductor de Suzgun & Kalai). **Fora:** muda a arquitetura (ADR 0001).
   **Critério:** caso onde a verificação entre-etapas falha onde a intra-geração pegaria.
5. **⚠️ Verificação de fidelidade da destilação (COLLEAGUE).** Checar se destilamos o que o expert FAZ, não o que ACHA.
   **Parcial:** os probes do CDM (passo 1) já atacam isso. **Critério:** caso onde a introspecção divergiu do real.

---

## Limites declarados

1. **Herda o n=1.** Destilado da `METODOLOGIA-CORE.md` ("exercitada com sucesso 1×, NÃO validada"; 4 furos). Empacotar
   num documento limpo NÃO conserta os furos — só os declara.
2. **A correção da ordem (D1) e o passo de ajuste (D2) são hipóteses fundadas, não validadas.** A ordem descreve o que
   funcionou no caso-âncora (n=1). O passo 4 é adição NOVA da literatura (Bowen 2006), nunca exercitada no projeto — é a
   aposta mais arriscada deste documento.
3. **M-T4/M-T5 têm 5+ datapoints DO MESMO projeto/stack.** Fortes dentro de software web; generalidade cross-domínio é
   projetada, não testada.
4. **Só a Fase 7 valida.** Replicar a skill num 2º domínio é o único teste que tira este meta-método de "proposta
   promissora". Até lá, cada CORE que ele ajudar a destilar é um datapoint — favorável OU não — sobre ele mesmo.