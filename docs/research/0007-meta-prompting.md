# 0007 — Meta-Prompting: prompts que geram prompts

> Pesquisa de fundamentação para o padrão CORE → briefing do projeto.
> Foco: como a literatura de meta-prompting orienta a escrever um CORE que gera
> briefings *específicos* (não genéricos) por etapa do pipeline.

## Resumo executivo

**Meta-prompting** é a família de técnicas em que um prompt instrui um LLM a *gerar*
outro prompt/instrução, em vez de resolver a tarefa diretamente. A literatura mostra que
isto funciona e, em vários casos, supera prompts escritos por humanos:

- **APE** (arXiv 2211.01910) trata a instrução como um "programa" a ser otimizado: o LLM
  propõe candidatos a partir de exemplos entrada→saída, e um score seleciona o melhor.
  Bateu baselines em **24/24** tarefas de instruction induction e **17/21** do BIG-Bench,
  alcançando nível humano. Descobriu automaticamente o famoso "Let's work this out in a
  step by step way to be sure we have the right answer", melhor que o CoT humano.
- **Meta-Prompting** (arXiv 2401.12954) usa um LLM "maestro" (*conductor*) que decompõe a
  tarefa e gera instruções sob medida para "experts" (instâncias do mesmo LLM). Ganho médio
  de **~17%** sobre prompting padrão, com natureza *task-agnostic* (zero-shot).
- **From Prompts to Templates** (arXiv 2504.02052) destila, de 2.163 templates reais de
  produção (Uber, Microsoft), os **7 componentes** e a **ordem** que tornam um template eficaz.
- **Prompt-MII** (arXiv 2510.16932) meta-aprende um *gerador de instruções* que, dado um
  conjunto de exemplos, produz uma instrução compacta — desempenho de 100-shot ICL com **13×
  menos tokens**.

A lição central para o nosso CORE: **um bom meta-prompt ensina o critério e o formato de
saída, e força o gerador a extrair os dados do contexto** — é exatamente a separação
invariante/variável (M3) e o "dinâmico por padrão" (M1) das nossas metodologias.

---

## Panorama das abordagens (com evidência)

### 1. APE — Automatic Prompt Engineer (arXiv 2211.01910)
**Como funciona.** Síntese de programa aplicada a linguagem: a "instrução" é o programa.
- *Geração (forward).* Mostra ao LLM pares entrada→saída e pede: "A instrução foi ___".
  O LLM completa propondo a regra latente que mapeia entradas em saídas.
- *Geração (reverse/infilling).* Usa modelos de preenchimento para inserir a instrução no meio.
- *Seleção.* Avalia cada candidato por *execution accuracy* (zero-shot de outro LLM seguindo
  a instrução) ou log-prob; mantém os melhores.
- *Resampling iterativo (Monte Carlo).* Pede variações semânticas dos melhores candidatos
  ("gere uma paráfrase desta instrução") e re-seleciona — refino tipo busca local.

**Evidência.** Supera baselines em **24/24** tarefas de instruction induction; **17/21** no
BIG-Bench; iguala/supera humanos. Resultado emblemático: o melhor prefixo zero-shot CoT
descoberto pelo APE supera o "Let's think step by step" humano.
**Padrão de escrita que funciona:** dar **exemplos concretos entrada→saída** e pedir a *regra*
que os explica (indução), não a resposta.

### 2. Meta-Prompting / task-agnostic scaffolding (arXiv 2401.12954)
**Como funciona.** Um único LLM atua como **maestro**: recebe instruções de alto nível
(o meta-prompt), **decompõe** a tarefa em subtarefas e **gera instruções específicas** para
"experts" (instâncias do mesmo LLM), depois **integra e verifica** os resultados.
**Evidência.** Média **+17,1%** vs. standard, **+17,3%** vs. expert prompting, **+15,2%** vs.
multipersona (Game of 24, Checkmate-in-One, Python Puzzles), com intérprete Python.
**Padrão que funciona:** o meta-prompt fixa o **processo** (decompor → instruir expert →
verificar → integrar), não o conteúdo. O conteúdo específico nasce em runtime.

### 3. From Prompts to Templates (arXiv 2504.02052)
**Como funciona.** Análise empírica de 2.163 templates reais; identifica a anatomia de um
template eficaz e os anti-padrões.
**Componentes (com frequência):** Directive (86,7%) · Context (56,2%) · Output Format (39,7%) ·
Constraints (35,7%) · Profile/Role (28,4%) · Workflow (27,5%) · Examples (19,9%).
**Ordem ótima:** Role → Directive → Context/Workflow → Output Format/Constraints → Examples.
**Achados acionáveis:**
- Especificar JSON com **nomes de atributos + descrições detalhadas** sobe o score de formato
  de ~4,66 para ~4,96.
- Combinar instruções "do" + "don't" (restrições de exclusão) leva adesão de formato de
  ~40% a ~100% em alguns modelos.
- **Anti-padrões:** placeholders vagos ("text", "input"); JSON subspecificado; instrução antes
  de input longo (decaimento de informação); excesso de confiança em few-shot (só ~20% usam).

### 4. Prompt-MII & instruction induction (arXiv 2510.16932)
**Como funciona.** RL meta-aprende um *Instruction Generator* que, dado exemplos de uma tarefa
nova, emite uma instrução compacta e reutilizável que guia um *follower* black-box.
**Evidência.** Desempenho de 100-shot ICL com **13× menos tokens**; treinado em >3.000 datasets.
**Lição:** instruções **geradas a partir dos dados** podem comprimir e superar exemplos brutos.

### 5. Otimização automática de prompts (OPRO, ProTeGi/TextGrad, DSPy)
- **OPRO** (Google): o LLM é o otimizador — recebe a trajetória de (prompt, score) e propõe
  prompts melhores iterativamente.
- **ProTeGi / TextGrad:** "gradientes textuais" — crítica em linguagem natural que aponta o erro,
  usada para editar o prompt; beam search + bandits.
- **DSPy:** compila *programas* de LLM, otimizando instruções e demonstrações automaticamente.
**Ressalva (evidência mista):** LLMs pequenos (LLaMA-2, Mistral 7B) otimizam mal — OPRO perde
eficácia. A técnica brilha com modelos capazes como otimizadores.

---

## Aplicação ao nosso CORE

Nosso CORE **é** um meta-prompt: o agente principal lê o CORE e **gera** o briefing concreto do
projeto (DAG do CLI ≠ DAG do CRM) para um subagente executar. A literatura converge em uma
receita clara para que o briefing gerado saia **específico, não genérico**:

### O que o CORE deve conter

1. **Critério, não dados (M1/M3).** Como APE e Meta-Prompting: o CORE fixa o *processo* e o
   *critério de qualidade* ("o que torna um DAG bom"), nunca a lista de nós. O agente extrai
   nós/arestas do contexto real do projeto em runtime. Teste: trocar de projeto não deve exigir
   editar o CORE.

2. **Anatomia explícita do briefing a gerar (2504.02052).** Instrua o agente a produzir, nesta
   ordem: Papel do subagente → Diretiva (a tarefa concreta) → Contexto extraído do projeto →
   Workflow → **Output schema** → Restrições. Essa ordem é a que mais funciona em produção.

3. **Exemplos entrada→saída como gatilho de indução (APE).** Incluir 1–2 pares "contexto →
   briefing destilado" ensina o agente a *induzir a regra* de como ler a demanda — alinhado ao
   nosso M2 (bottom-up: briefing perfeito → racional destilado → CORE).

4. **Output schema como contrato (Structured Handoff).** Especifique o schema de retorno com
   **nomes de campo + descrição de cada campo** (sobe adesão de ~4,66 para ~4,96). É o contrato
   que a próxima etapa verifica.

5. **Restrições "do" + "don't" (2504.02052).** Adicione exclusões explícitas que *travam a
   genericidade*: ex. "NÃO produza nós abstratos; cada nó deve citar um arquivo/comando real do
   projeto", "NÃO repita o texto do CORE no briefing". Isto sozinho move adesão de ~40% a ~100%.

6. **Etapa de verificação/auto-crítica (2401.12954).** O maestro do Meta-Prompting verifica antes
   de integrar. O CORE deve mandar o agente checar o briefing contra o critério ("todo nó é
   verificável? todo dado veio do contexto, não do CORE?") antes de entregar ao subagente.

### Como garantir que o briefing seja específico (não genérico)

- **Force ancoragem no contexto:** exija que cada afirmação do briefing cite uma evidência do
  projeto (arquivo, comando, decisão). Genérico = sem âncora → reprovado na auto-crítica.
- **Placeholders semânticos, nunca vagos:** "stack_detectada", "entrypoint_do_CLI" em vez de
  "input/text" — placeholders ricos induzem preenchimento específico (anti-padrão #1 do 2504.02052).
- **Compressão tipo Prompt-MII:** o briefing deve destilar o contexto numa instrução compacta e
  reutilizável, não copiar dump de arquivos. Menos tokens, mais sinal.
- **Critério verificável ≠ descrição:** alinhe com nosso M4 — o CORE só vira ADR depois de o
  briefing gerado ser validado contra ≥2 casos reais diferentes (ex.: CLI e CRM).

### Síntese para o CORE
> Um CORE eficaz = **processo fixo + critério de qualidade + schema de saída descrito +
> restrições de exclusão + 1-2 exemplos de indução + passo de auto-verificação.** Tudo o que é
> *dado do domínio* fica fora do CORE, extraído do contexto. Isso operacionaliza M1, M3 e o
> padrão Meta-Prompt + Structured Handoff com respaldo direto da literatura.

---

## Fontes

- APE — *Large Language Models Are Human-Level Prompt Engineers* (ICLR 2023): https://arxiv.org/abs/2211.01910 · PDF: https://arxiv.org/pdf/2211.01910
- *Meta-Prompting: Enhancing Language Models with Task-Agnostic Scaffolding* (Suzgun & Kalai, 2024): https://arxiv.org/abs/2401.12954 · código: https://github.com/suzgunmirac/meta-prompting
- *From Prompts to Templates: A Systematic Prompt Template Analysis for Real-world LLMapps* (FSE 2025): https://arxiv.org/abs/2504.02052 · HTML: https://arxiv.org/html/2504.02052 · ACM: https://dl.acm.org/doi/10.1145/3696630.3728533
- *Prompt-MII: Meta-Learning Instruction Induction for LLMs* (2025): https://arxiv.org/abs/2510.16932 · código: https://github.com/millix19/promptmii
- *The Prompt Report: A Systematic Survey of Prompt Engineering Techniques*: https://arxiv.org/pdf/2406.06608
- *A Systematic Survey of Automatic Prompt Optimization* (EMNLP 2025): https://aclanthology.org/2025.emnlp-main.1681.pdf
- OPRO / *Revisiting OPRO: Limitations of Small-Scale LLMs as Optimizers*: https://arxiv.org/html/2405.10276v1
- *TextGrad: Automatic "Differentiation" via Text*: https://arxiv.org/pdf/2406.07496
- IBM — *What is Meta Prompting?*: https://www.ibm.com/think/topics/meta-prompting
