# 0009 — Clareza de instrução para LLMs (o que comprovadamente move resultado)

> Pesquisa de evidência empírica sobre o que afeta a **compreensão de um modelo** ao receber
> instruções — não estética de redação humana. Objetivo: extrair regras de escrita para embutir
> no CORE, de modo que o briefing gerado seja máximo em clareza para o subagente LLM.

---

## Resumo executivo

A clareza para um LLM **não é** a mesma coisa que clareza para um humano. O que move resultado é,
em grande parte, **mecânico e mensurável**: posição da informação no prompt, polaridade da
instrução (positiva vs. negativa), formato/delimitadores, grau de especificação e ausência de
contradições. As perturbações que parecem cosméticas para nós produzem variações de **dezenas de
pontos percentuais** em acurácia. Os principais achados:

- **Posição importa muito.** Modelos têm viés de **primazia e recência** (curva em U, "lost in the
  middle"): instrução no meio de um prompt longo é a mais ignorada. Coloque o crítico no início e
  repita/feche no fim.
- **Negação falha sistematicamente.** "Não faça X" tem alta taxa de violação e pode até *destacar* o
  conceito proibido (efeito "urso branco"/rebote irônico). Prefira instrução positiva: diga o que
  fazer, com o valor permitido.
- **Formato muda acurácia em até 40% (GPT-3.5) e 200-300% em casos extremos.** Não existe formato
  universal; delimitadores e estrutura explícita reduzem ambiguidade.
- **Subespecificação custa em média 22,6% de acurácia (até 93,1%).** Mas **sobre-especificar também
  degrada** — especificar 19 requisitos juntos caiu de ~98,7% para 85%. Há um ponto ótimo.
- **Instruções contraditórias quebram o modelo** — ele não as detecta de forma confiável e segue uma
  arbitrariamente. Contradição é o pior defeito de um prompt.

---

## Princípios de clareza (com evidência e efeito medido)

### P1 — Posicione o crítico no início e/ou no fim (primazia + recência)
LLMs alocam mais atenção ao começo e ao fim da sequência e **"se perdem no meio"**: a performance
em recuperar informação relevante segue uma curva em U, com queda acentuada quando o item está no
meio de um contexto longo (Liu et al., *Lost in the Middle*, TACL 2024). Há também **viés de
recência** consistente: modelos favorecem desproporcionalmente a última opção/instrução apresentada
(ProSA; *The Order Effect*, arXiv 2502.04134). A raiz é arquitetural (decaimento do RoPE, attention
sink nos tokens iniciais).
**Efeito:** degradação significativa de acurácia conforme a posição muda; ordem de opções altera
predições.
**Regra:** instrução mais importante = primeira linha; reforço/critério de aceitação = última linha.
Nunca enterre o que não pode ser ignorado no meio de um bloco longo.

### P2 — Instrução positiva > instrução negativa
Modelos comprendem negação mal e a **violam sistematicamente**. Um modelo aberto, ao receber "They
should NOT rob the store", *discorda* 80% das vezes — endossando o oposto do pedido (*Syntactic
Framing Fragility*, arXiv 2601.09724). A negação pode **ativar e destacar** o conceito proibido
(rebote irônico, "não pense num urso branco" — arXiv 2511.12381; *Semantic Gravity Wells: Why
Negative Constraints Backfire*, arXiv 2601.08070). CoT não resolve: virar uma só palavra para negativa
derruba a performance (arXiv 2310.15941; arXiv 2306.08189 "Language models are not naysayers").
**Efeito:** até 80% de violação em instruções negativas explícitas; queda forte só por inverter polaridade.
**Regra:** em vez de "não use jargão", escreva "use linguagem direta e literal". Quando precisar
proibir, **emparelhe com a alternativa positiva** ("em vez de A, faça B").

### P3 — Escolha formato e delimitadores explícitos (e saiba que o formato muda o resultado)
O mesmo conteúdo em texto puro, Markdown, JSON ou YAML produz performance diferente: GPT-3.5-turbo
varia **até 40%** numa tarefa de tradução de código; em casos extremos houve **+200%** (Markdown→texto
puro no FIND) e **+300%** (JSON→texto puro no HumanEval). Os p-values de t-tests pareados ficam
majoritariamente <0,01 — diferença estatisticamente significativa. Modelos têm **preferências
distintas** (Markdown tende a favorecer GPT-4; JSON, GPT-3.5) e modelos maiores são mais estáveis
(*Does Prompt Formatting Have Any Impact on LLM Performance?*, arXiv 2411.10541).
**Efeito:** variação de 40% a 300% só por mudar o template.
**Regra:** padronize um formato e delimitadores claros (cabeçalhos, blocos rotulados) para separar
instrução, contexto e dados. Estrutura explícita reduz ambiguidade de fronteira; só não assuma que
há um formato universalmente ótimo — fixe um e seja consistente.

### P4 — Especifique o suficiente, mas não em excesso (há um ponto ótimo)
Subespecificar custa caro: **−22,6% de acurácia em média, até −93,1%**, e requisitos não
especificados são ~2x mais vulneráveis a regressão entre versões de modelo. Mas **sobre-especificar
também degrada**: empilhar 19 requisitos num só prompt caiu de ~98,7% (isolados) para 85%
(*What Prompts Don't Say: Understanding and Managing Underspecification in LLM Prompts*, arXiv 2505.13360).
**Efeito:** −22,6% (subespecificado) vs. −13,7 pts (sobrecarga de 19 requisitos juntos).
**Regra:** especifique explicitamente os requisitos que importam para o resultado verificável;
não despeje todo requisito possível. Seletividade > exaustividade.

### P5 — Elimine contradições — é o defeito mais grave
LLMs **não detectam contradições de forma confiável** e seguem uma das instruções arbitrariamente.
Benchmarks dedicados (SCI, arXiv 2408.01091, com 20k conflitos; OCTOBENCH-CONFLICT; RefuteBench,
arXiv 2402.13463) mostram falha sistemática em reconhecer comandos auto-contraditórios. "Distrações
instrucionais" (DIM-Bench, arXiv 2502.04362) confundem o modelo facilmente. Em descrições de tarefa
de código, pós-condições ou exemplos conflitantes derrubam a robustez (arXiv 2507.20439).
**Efeito:** comportamento não-determinístico/arbitrário; o modelo escolhe um lado sem sinalizar.
**Regra:** garanta que regra, exemplo e critério de aceitação **não se contradigam**. Se houver
prioridade, declare a hierarquia explicitamente ("instruction privilege"). Um exemplo que contradiz
a regra é pior que nenhum exemplo.

### P6 — Desambiguação por especificidade > vagueza
Prompts reais são quase sempre subespecificados; o modelo "preenche lacunas" por inferência —
acerta ~41% das vezes, mas o resto vira variação silenciosa (arXiv 2505.13360). Referências
ambíguas e incerteza lógica leve degradam mesmo com a resposta-verdade preservada.
**Efeito:** ~59% das lacunas viram comportamento não controlado.
**Regra:** substitua termos vagos por valores concretos e verificáveis (não "responda bem", mas
"responda em ≤5 linhas, sem listas"). Onde a demanda for genuinamente ambígua, é melhor o CORE
mandar o agente **pedir clarificação** do que adivinhar.

### P7 — Robustez geral: prefira o explícito ao implícito
Mesmo paráfrases, reordenações e pequenas perturbações irrelevantes mudam predições (POSIX,
arXiv 2410.02185; ProSA, arXiv 2410.12405). Prompt engineering sozinho **não** elimina essa
sensibilidade — e instruções defensivas mal colocadas podem *aumentá-la*. Modelos maiores são mais
robustos, mas nenhum é imune.
**Efeito:** shift de predição por variações semanticamente neutras.
**Regra:** não dependa de o modelo "entender o subtexto". Tudo que precisa ser feito deve estar
dito explicitamente, na posição certa, no formato certo, sem contradição.

---

## Aplicação ao nosso CORE

Regras de escrita que o gerador de briefing deve obedecer (e que o CORE deve ensinar como critério):

1. **Estrutura sanduíche obrigatória (P1).** Objetivo da etapa = primeira linha do briefing.
   Critério de aceitação / output schema = última seção. Nada crítico no miolo de blocos longos.
2. **Polaridade positiva por padrão (P2).** Toda regra do briefing é redigida como "faça X". Proibições
   só com a alternativa positiva emparelhada. Banir "não" solto sempre que houver forma afirmativa.
3. **Um formato canônico + delimitadores (P3).** Padronizar a estrutura do briefing (cabeçalhos
   rotulados separando *Objetivo / Contexto / Regras / Output Schema*). Dados do contexto sempre em
   bloco delimitado e distinto das instruções.
4. **Especificação seletiva (P4 + P6).** O gerador injeta apenas os requisitos verificáveis daquela
   etapa — extraídos do contexto (M1/M3) — em vez de despejar todo o CORE. Valores concretos, não
   adjetivos ("≤N linhas", "formato JSON com chaves X,Y") substituem vagueza.
5. **Verificação de não-contradição (P5).** Antes de emitir o briefing, garantir que regra, exemplo e
   critério de aceitação são consistentes. Se a demanda trouxer requisitos conflitantes, declarar
   hierarquia ou devolver para clarificação — nunca emitir contradição silenciosa.
6. **Clarificar quando ambíguo (P6).** O CORE prefere instruir o subagente a **perguntar** diante de
   ambiguidade genuína a deixá-lo adivinhar (alinha com M1: descobrir do contexto > fixar/chutar).
7. **Explícito sempre (P7).** Nenhuma expectativa fica em subtexto. O que será verificado tem que
   estar escrito no briefing. (Reforça o "Padrão técnico central": output schema é o contrato.)

Conexão com metodologias: P4/P6 reforçam **M1** (dinâmico > fixo — extrair requisito do contexto em vez
de listar tudo) e **M3** (separar invariante/regra do variável/dado, inclusive *posicionalmente* no
briefing). P5 reforça a disciplina de governança (decisão única e consistente, sem ruído).

---

## Fontes

- Liu et al., *Lost in the Middle: How Language Models Use Long Contexts*, TACL 2024 — https://aclanthology.org/2024.tacl-1.9/
- *The Order Effect: Investigating Prompt Sensitivity to Input Order in LLMs*, arXiv 2502.04134 — https://arxiv.org/pdf/2502.04134
- *ProSA: Assessing and Understanding the Prompt Sensitivity of LLMs*, arXiv 2410.12405 — https://arxiv.org/pdf/2410.12405
- *POSIX: A Prompt Sensitivity Index For Large Language Models*, arXiv 2410.02185 — https://arxiv.org/pdf/2410.02185
- *Syntactic Framing Fragility: An Audit of Robustness in LLM Ethical Decisions*, arXiv 2601.09724 — https://arxiv.org/pdf/2601.09724
- *Semantic Gravity Wells: Why Negative Constraints Backfire*, arXiv 2601.08070 — https://arxiv.org/pdf/2601.08070
- *Don't Think of the White Bear: Ironic Negation in Transformer Models Under Cognitive Load*, arXiv 2511.12381 — https://arxiv.org/pdf/2511.12381
- *This is not a Dataset: A Large Negation Benchmark to Challenge LLMs*, arXiv 2310.15941 — https://arxiv.org/pdf/2310.15941
- *Language models are not naysayers: An analysis of LMs on negation benchmarks*, arXiv 2306.08189 — https://arxiv.org/pdf/2306.08189
- *Does Prompt Formatting Have Any Impact on LLM Performance?*, arXiv 2411.10541 — https://arxiv.org/abs/2411.10541
- *What Prompts Don't Say: Understanding and Managing Underspecification in LLM Prompts*, arXiv 2505.13360 — https://arxiv.org/pdf/2505.13360
- *Dissecting Dissonance: Benchmarking LMMs Against Self-Contradictory Instructions (SCI)*, arXiv 2408.01091 — https://arxiv.org/pdf/2408.01091
- *RefuteBench: Evaluating Refuting Instruction-Following for LLMs*, arXiv 2402.13463 — https://arxiv.org/html/2402.13463
- *LLMs can be easily Confused by Instructional Distractions (DIM-Bench)*, arXiv 2502.04362 — https://arxiv.org/html/2502.04362v1
- *When Prompts Go Wrong: Evaluating Code Model Robustness to Ambiguous, Contradictory, and Incomplete Task Descriptions*, arXiv 2507.20439 — https://arxiv.org/html/2507.20439
- MIT News, *Study shows vision-language models can't handle queries with negation words*, 2025 — https://news.mit.edu/2025/study-shows-vision-language-models-cant-handle-negation-words-queries-0514
