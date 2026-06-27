# 0008 — Frameworks e guias de prompt/instrução como inspiração para o CORE

> Pesquisa de mercado: que frameworks e guias oficiais devemos imitar/referenciar ao construir
> nossos meta-prompts ("CORE"). Foco no padrão já adotado **Meta-Prompt + Structured Handoff**
> (output schema como contrato de retorno).

## Resumo executivo

Há duas grandes linhagens úteis para nós. A primeira trata o **prompt como programa**: DSPy
(Stanford) separa *o que* (signatures) do *como* (módulos/otimizadores), e APE mostra que uma
instrução pode ser **gerada e otimizada automaticamente** contra um score — exatamente o espírito
do nosso CORE, que destila critério e gera briefing por etapa. A segunda é o **prompt como
engenharia disciplinada**: os guias da Anthropic e da OpenAI, o PromptingGuide.ai e os templates do
LangChain dão a *anatomia* de um bom prompt (instrução, contexto, exemplos, estrutura XML,
indicador de output) e o mecanismo de **template + variáveis** que nosso gerador precisa. Para o
**contrato de retorno**, a referência forte é **Structured Outputs / function calling com JSON
Schema** (OpenAI e Microsoft Agent Framework): em vez de "por favor responda em JSON", o schema é
**enforced** nativamente — é o que valida o handoff entre etapas. Recomendação: imitar a *separação
signature↔módulo* do DSPy e o *JSON Schema strict* como contrato; referenciar a anatomia
Anthropic/PromptingGuide para escrever os COREs; manter otimização (APE) como meta de futuro, não
de agora.

## Tabela: framework × ideia central × o que reaproveitar × limitações

| Framework / Guia | Ideia central | O que reaproveitar para o CORE | Limitações |
|---|---|---|---|
| **DSPy** (Stanford NLP) | "Programar, não prompt-ar": **Signatures** (o quê: in→out), **Modules** (o como), **Optimizers/Teleprompters** (compilam prompts e few-shots automaticamente) | Separar declaração da etapa (signature = entrada/saída esperadas) do texto do prompt; nosso CORE = "module" que implementa a estratégia; ideia de pipeline composável casando com nossas 13 etapas | Acoplado a Python/runtime DSPy; otimização exige dataset + métrica; pesado demais p/ um motor Node puro |
| **APE** (Zhou et al., ICLR 2023) | Geração de instrução como **síntese de programa em linguagem natural**: LLM propõe candidatos, seleciona pelo melhor score (busca black-box) | Validar que "destilar o racional → virar CORE" (nossa M2) tem respaldo; usar LLM para *propor* variações de briefing e escolher a melhor contra um caso real | Precisa de função de avaliação automática; risco de overfit ao benchmark; não substitui design humano do critério |
| **Anthropic — Prompt Engineering** (docs.anthropic.com) | Anatomia de bom prompt p/ Claude: clareza, exemplos, **estrutura XML**, thinking, system prompts, **templates com `{{variáveis}}`** | Estrutura XML para delimitar seções do briefing; padrão system prompt = papel/identidade da etapa; `{{var}}` como sintaxe de placeholder do gerador; prompt improver como inspiração de auto-revisão | Específico de Claude (XML é hábito do modelo); guias são heurísticos, não formais |
| **OpenAI — Prompt Eng. + Structured Outputs / Function Calling** | "Show and tell", temperatura 0 p/ extração; **Structured Outputs** garante aderência a **JSON Schema** (`strict: true`); function calling vs response_format | **O contrato de retorno**: nosso output schema vira JSON Schema strict-validável; descrever propósito de cada campo; usar response_format p/ handoff, function calling p/ ações | Schema strict tem subset de JSON Schema; enforcement é do provider, não do nosso motor |
| **Microsoft Agent Framework** | Output estruturado nativo via JSON Schema (de classe/Pydantic), não "prompt frágil"; loop iterativo > one-shot | Confirma a tese do Structured Handoff: derivar schema de um tipo e validar; padrão "agent loop" iterativo p/ etapas que não fecham num passo | Stack .NET/Python; nem todo agente suporta; infra mais pesada que nosso alvo |
| **LangChain — Prompt Templates** | `ChatPromptTemplate` (system/user/assistant), **FewShot templates**, **partial variables** (ex.: timestamp/contexto injetado por função) | Modelo mental de template com partes fixas + variáveis; **partial variables via função** = nossa M1 (descobrir em runtime, não fixar); few-shot dinâmico por etapa | Abstração verbosa; acoplamento ao ecossistema LangChain; risco de over-engineering |
| **PromptingGuide.ai** | Catálogo neutro: **Elementos de um prompt** (instrução, contexto, input, indicador de output) + técnicas (zero/few-shot, CoT, **Meta Prompting**, prompt chaining) | Checklist dos 4 elementos como gabarito mínimo do briefing gerado; "prompt chaining" descreve nossa state machine; seção Meta Prompting valida o conceito de CORE | Material introdutório/curado; sem garantias formais nem ferramentas |

## Aplicação ao nosso CORE

1. **Adotar a separação DSPy (signature ↔ módulo) como modelo mental.** Cada etapa do pipeline tem
   uma *signature* implícita (entradas do contexto → entregável esperado). O CORE é o "módulo" que
   ensina *como* produzir o briefing; o output schema é a parte de saída da signature. Isso reforça
   a M3 (invariante = regra do CORE; variável = lido do contexto pelo gerador).

2. **Fixar JSON Schema `strict` como o contrato de Structured Handoff.** Em vez de instruir "responda
   em JSON", o output schema de cada etapa deve ser um JSON Schema validável (referência OpenAI
   Structured Outputs + Microsoft Agent Framework). O motor Node valida o handoff antes de avançar —
   é o "porteiro" entre etapas. Descrever o propósito de cada campo (prática OpenAI) dentro do schema.

3. **Escrever os COREs com a anatomia Anthropic + PromptingGuide.** Garantir os 4 elementos
   (instrução/critério, contexto, input, indicador de output) e usar estrutura XML/markdown para
   delimitar seções. O bloco de identidade da etapa = system prompt.

4. **Implementar variáveis dinâmicas no estilo LangChain partial variables.** Valores como
   timestamp, stack detectada e nome do projeto entram por função em runtime (nossa M1: dinâmico por
   padrão), nunca fixos no CORE.

5. **Deixar APE/DSPy optimizers como horizonte, não dependência.** Hoje destilamos o racional à mão
   (M2/M4). Quando houver casos reais suficientes + uma métrica de aceitação, podemos usar um LLM
   para *propor variações de briefing* e escolher a melhor contra esses casos — versão leve e
   manual do APE, sem acoplar runtime DSPy ao motor Node.

**Quem imitar vs. quem referenciar:** imitar o *contrato* (JSON Schema strict) e a *separação
signature↔módulo*. Referenciar (citar, não importar) a anatomia de prompt (Anthropic, OpenAI,
PromptingGuide) e o mecanismo de template+variáveis (LangChain). Tratar DSPy/APE/Microsoft Agent
Framework como inspiração conceitual — stacks pesadas demais para um motor Node puro.

## Fontes

- DSPy — site oficial: https://dspy.ai/
- DSPy — repositório: https://github.com/stanfordnlp/dspy
- DSPy — paper (OpenReview): https://openreview.net/pdf?id=PFS4ffN9Yx
- APE — "Large Language Models Are Human-Level Prompt Engineers" (ICLR 2023): https://arxiv.org/abs/2211.01910
- APE — PromptingGuide: https://www.promptingguide.ai/techniques/ape
- Anthropic — Prompt engineering overview: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview
- Anthropic — Prompt templates and variables: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prompt-templates-and-variables
- Anthropic — System prompts / best practices: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/system-prompts
- Anthropic — Prompt improver: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prompt-improver
- OpenAI — Prompt engineering: https://platform.openai.com/docs/guides/prompt-engineering
- OpenAI — Structured Outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- OpenAI — Function calling: https://developers.openai.com/api/docs/guides/function-calling
- OpenAI — Introducing Structured Outputs in the API: https://openai.com/index/introducing-structured-outputs-in-the-api/
- Microsoft Agent Framework — Producing Structured Output: https://learn.microsoft.com/en-us/agent-framework/agents/structured-outputs
- LangChain — ChatPromptTemplate (API ref): https://python.langchain.com/api_reference/core/prompts/langchain_core.prompts.chat.ChatPromptTemplate.html
- LangChain — FewShotChatMessagePromptTemplate: https://api.python.langchain.com/en/latest/prompts/langchain_core.prompts.few_shot.FewShotChatMessagePromptTemplate.html
- PromptingGuide.ai — Elements of a Prompt: https://www.promptingguide.ai/introduction/elements
- PromptingGuide.ai — Techniques: https://www.promptingguide.ai/techniques
