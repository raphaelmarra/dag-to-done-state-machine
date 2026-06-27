# 0006 — Técnicas de Prompt Engineering com Validação Científica/Empírica

> Pesquisa para embasar o desenho do CORE (meta-prompt). Foco: efeito **medido**, condição de uso, e quando **não** funciona. Distingue "tem estudo" de "senso comum repetido".
> Data: 2026-06-27.

## Resumo executivo

- **O que tem evidência forte e direcional:** chain-of-thought (em modelos não-reasoning), decomposição em subpassos (least-to-most), posição da instrução (recency/primacy — evite o meio), delimitadores/tags estruturais, e re-leitura (RE2). Todas com ganho medido em benchmarks.
- **O que é frágil ou contra-intuitivo:** **role/persona prompting não melhora acurácia factual** (estudos controlados de 2.410 questões e o Wharton Report 4); **formato estruturado (JSON/XML como saída) cobra "imposto"** de 10-30% em raciocínio ("Format Tax", "Let Me Speak Freely?"). Ou seja, dois itens de "folclore" são desmentidos.
- **CoT não é universal:** em modelos de raciocínio (o3, Gemini 2.5) o ganho é marginal ou negativo, e custa 20-80% mais latência (Wharton Report 2). CoT é para modelos que não pensam passo-a-passo por padrão.
- **Brittleness é o pano de fundo:** mudanças não-semânticas de formato causam até **76 pontos** de variação de acurácia (FormatSpread). Isso justifica padronizar formato no CORE — não por "ficar bonito", mas por reduzir variância.
- **Doses têm ótimo:** few-shot melhora até um joelho e depois degrada (ótimo ~3 a ~30 exemplos, dependente da tarefa); re-leitura ótima em 2x; mais que isso piora. "Mais" raramente é "melhor".

## Tabela: técnica × evidência × quando usar

| Técnica | Efeito medido | Quando funciona | Quando NÃO funciona | Fonte |
|---|---|---|---|---|
| **Chain-of-Thought ("pense passo a passo")** | GSM8K: SOTA com 8 exemplares CoT em modelo 540B, superando GPT-3 fine-tuned+verifier | Tarefas de raciocínio (aritmético, simbólico, multi-passo) em modelos **não-reasoning** | Modelos de raciocínio (o3/o4/Gemini 2.5): ganho marginal ou queda + 20-80% mais latência. Aumenta variância em tarefas que o modelo já acertaria | Wei 2022; Wharton Report 2 |
| **Least-to-most / decomposição em subpassos** | Generalização perfeita em SCAN/CFQ; generaliza para problemas mais difíceis que os do prompt | Problemas compostos que se quebram em subproblemas sequenciais | Tarefas atômicas (overhead sem ganho) | Zhou 2022 (2205.10625) |
| **Posição da instrução (recency/primacy)** | Acurácia alta no início/fim, cai no meio ("lost in the middle"); instrução crítica no meio é silenciosamente ignorada | Prompts longos: ancore instruções-chave no início E reforce no fim | Prompts curtos (efeito desprezível) | Liu 2023 ("Lost in the Middle") |
| **Delimitadores / tags estruturais (XML, seções)** | Teste interno Anthropic: 20-40% mais consistência de saída; separar instrução/dado/exemplo elimina a maioria dos erros | Sempre que houver múltiplas seções (contexto, tarefa, restrição, dados) | É estrutura de *entrada* — não confundir com forçar *saída* estruturada (ver Format Tax) | Anthropic docs |
| **Re-leitura (RE2): repetir a pergunta/instrução-chave** | +3.81% aritmética, +2.51% commonsense, +1.85% simbólico (text-davinci-003); compõe com CoT | Reforçar a instrução central; ótimo em **2x** | ≥3 repetições degrada (sai da distribuição de pré-treino) | Xu 2023 (2309.06275) |
| **Few-shot (nº de exemplos)** | Melhora até um joelho e depois cai; ótimos típicos 3 (SQL), 20-30 (extração), ~125 (math) | Quando há exemplos representativos e próximos do caso de teste | Excesso de exemplos afasta do caso-alvo e desestabiliza; em raciocínio complexo o efeito é inconsistente | Vários (vide Fontes) |
| **Ordem dos exemplos few-shot** | Variação grande de acurácia só por reordenar; persiste mesmo com mais shots/instruction-tuning | Vale ordenar deliberadamente (métricas de entropia) | — (é um risco a mitigar, não uma alavanca de ganho) | Lu 2022; Zhao 2021 (Calibrate Before Use) |
| **Role / persona ("você é um especialista")** | **Sem ganho de acurácia factual** em 2.410 questões / 4 famílias de modelo; personas "expert" detalhadas chegam a **reduzir** acurácia factual | Tarefas abertas/criativas (tom, clareza) | Tarefas factuais e de conhecimento — não usar para precisão | Zheng 2023 (EMNLP findings); Wharton Report 4 |
| **Saída em formato restrito (JSON/XML mode)** | "Format Tax": degradação de raciocínio de 10-30%; só pedir o formato já causa a maior parte da perda | Quando precisa de saída parseável **e** decoupla raciocínio do formato (free-form → reformatar; ou thinking) | Forçar JSON-mode antes do raciocínio terminar prejudica reasoning | "Let Me Speak Freely?" (2408.02442); "The Format Tax" |
| **Brittleness de formato (pano de fundo)** | "Spread" de até **76 pontos** em SuperNatural-Instructions só por mudança de formato não-semântica; até 1 caractere altera evals | — | — (motiva padronizar e medir, não otimizar à mão) | Sclar 2023 (FormatSpread, 2310.11324) |

### Checklists / numeração sequencial de passos

Não há um paper isolado "checklists melhoram aderência" com benchmark limpo — é majoritariamente **senso comum + extrapolação** do least-to-most e da estrutura por delimitadores. O que tem evidência é o *mecanismo subjacente*: decompor explicitamente em subpassos numerados (least-to-most) e dar estrutura clara (tags/seções) melhora aderência. Trate "checklist/numeração" como aplicação dessas técnicas validadas, não como técnica auto-validada. Honestidade epistêmica: **é senso comum bem-fundamentado, não um resultado medido próprio.**

## Aplicação ao nosso CORE

O CORE é um **meta-prompt**: o agente principal lê o CORE e gera um **briefing** para um subagente. Há dois leitores → duas camadas de aplicação.

**No CORE (lido pelo agente principal que gera o briefing):**
- **Decomponha o ato de gerar o briefing em passos numerados** (least-to-most aplicado ao próprio meta-prompt): extrair contexto → identificar invariante vs. variável → montar seções → verificar. Isso é o que tem lastro empírico, não o "seja cuidadoso".
- **Estruture o CORE com delimitadores/seções explícitas** (regras R1-Rn, output schema, exemplos) — ganho de consistência medido e redução de brittleness.
- **Ancore as regras invariantes mais críticas no início E repita o critério-chave no fim** (recency+primacy). Se o CORE crescer, o meio é zona morta — nada essencial ali.
- **Evite persona genérica** ("você é um arquiteto sênior") como alavanca de qualidade factual — sem evidência; use papel só quando o registro/tom importar.

**No briefing gerado (contrato para o subagente):**
- **Embuta CoT condicional:** instrua o subagente a raciocinar passo-a-passo **se** for tarefa de raciocínio e o executor for um modelo não-reasoning. Não imponha CoT cego — em modelo de raciocínio só adiciona latência/variância (Wharton Report 2).
- **Separe raciocínio de formato de saída (anti Format Tax):** o output schema é o contrato, mas o subagente deve **raciocinar livre primeiro e formatar depois** (ou usar thinking), nunca ser forçado a preencher campos JSON antes de concluir o raciocínio. Isso preserva 10-30% de acurácia.
- **Reforce a instrução verificável no fim do briefing** (o "o que será verificado antes de avançar") — recency. Considere repetir o critério de aceitação 2x no máximo (RE2), nunca mais.
- **Few-shot com parcimônia:** se incluir exemplos no briefing, poucos (≈1-3) e representativos do caso; mais exemplos não compram aderência e introduzem viés de ordem/recência.
- **Padronize o formato de briefing** entre etapas — a brittleness (spread de 76 pts) é argumento direto a favor de um template fixo e testado, não de improviso por etapa.

**Resumo do mapeamento M1-M4 do projeto:** as técnicas validadas (decomposição, estrutura, recency, CoT condicional, format-decoupling) são *invariantes* → entram no esqueleto do CORE (M3). As doses (nº de exemplos, quando ligar CoT) dependem da etapa/executor → descobertas em runtime do contexto (M1). Persona e JSON-forçado-cedo vão para o que **não** cristalizar.

## Fontes

- Chain-of-Thought (Wei et al. 2022) — https://arxiv.org/abs/2201.11903
- Wharton Prompting Science Report 2 — The Decreasing Value of CoT — https://arxiv.org/abs/2506.07142 · https://gail.wharton.upenn.edu/research-and-insights/tech-report-chain-of-thought/
- Least-to-Most Prompting (Zhou et al. 2022) — https://arxiv.org/abs/2205.10625
- Lost in the Middle (Liu et al. 2023) — https://teapot123.github.io/files/CSE_5610_Fall25/Lecture_12_Long_Context.pdf · contexto: https://arxiv.org/pdf/2403.04797
- Re-Reading Improves Reasoning / RE2 (Xu et al. 2023) — https://arxiv.org/abs/2309.06275
- Personas Do Not Improve Performance (Zheng et al., EMNLP Findings 2024) — https://aclanthology.org/2024.findings-emnlp.888/ · https://arxiv.org/html/2311.10054v3
- Wharton Prompting Science Report 4 — Expert Personas Don't Improve Factual Accuracy — https://arxiv.org/pdf/2512.05858
- Let Me Speak Freely? (Format Restrictions, 2024) — https://arxiv.org/html/2408.02442v1
- The Format Tax — https://arxiv.org/html/2604.03616v1
- FormatSpread / Sensitivity to Spurious Features (Sclar et al. 2023) — https://arxiv.org/html/2310.11324v2
- Single Character can Make or Break Your LLM Evals — https://arxiv.org/pdf/2510.05152
- Calibrate Before Use (Zhao et al. 2021, viés de ordem/recência) — https://arxiv.org/pdf/2102.09690
- Order/recency bias em few-shot (Lu et al. 2022) — referência via survey https://lilianweng.github.io/posts/2023-03-15-prompt-engineering/
- Many-Shot In-Context Learning (NeurIPS 2024) — https://proceedings.neurips.cc/paper_files/paper/2024/file/8cb564df771e9eacbfe9d72bd46a24a9-Paper-Conference.pdf
- Anthropic — Use XML tags / Prompting best practices — https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags
