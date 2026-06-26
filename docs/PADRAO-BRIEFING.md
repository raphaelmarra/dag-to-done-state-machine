# Padrão de Briefing: CORE + Gerador (Meta-Prompt + Structured Handoff)

> Referência do padrão central do projeto. Movido do CLAUDE.md para mantê-lo fino.
> Reference/Explanation (Diátaxis). Ver também `CORE.md` (esqueleto de regras) e `CORE-DAG.md` (instância da etapa 1).

## O problema que o CORE resolve

Briefings fixos ficam nichados num projeto. Briefings livres ficam vagos. A solução validada em produção (Anthropic, 2025) é um **CORE de regras invariantes** que um LLM aplica para gerar briefings contextuais — o CORE é agnóstico ao projeto; o briefing gerado é específico à instância.

```
CORE (regras invariantes) → gerador LLM → BRIEFING (50 linhas focadas) → agente
```

Evidência: sistema multi-agente da Anthropic com CORE de delegação superou agente único em +90.2%. O fracasso anterior era "pesquise a escassez de chips" — vago, sem escopo, sem formato. O fix foi exatamente o CORE.

## Estrutura do CORE

O CORE não é um template. É um conjunto de regras que o LLM gerador segue para **construir** o briefing. Sempre tem três camadas:

**Camada 1 — Regras de estrutura (invariantes)**
Todo briefing gerado deve ter 4 partes obrigatórias, nessa ordem:
1. `OBJETIVO` — verbo imperativo + o que produzir. Uma frase. Nunca vago.
2. `ESCOPO` — o que está dentro E o que está explicitamente fora.
3. `FORMATO` — estrutura exata da resposta esperada. Verificável.
4. `FRONTEIRAS` — o que o agente NÃO deve fazer, assumir ou inferir.

Se faltar qualquer parte → briefing rejeitado antes de ser despachado.

**Camada 2 — Regras de conteúdo (como preencher)**
- R1: OBJETIVO começa com verbo imperativo. ❌ "Analise o sistema" ✅ "Mapeie todas as rotas"
- R2: ESCOPO inclui sempre um "NÃO inclua" explícito. Sem fronteira negativa, o agente expande.
- R3: FORMATO especifica a estrutura da resposta — sem formato, o verificador não sabe o que checar.
- R4: FRONTEIRAS inclui "ignore" explícito para ruído disponível no contexto.
- R5: Estado curado — injete só os campos necessários para essa etapa. Nunca o contrato inteiro.
- R6: Posição importa — objetivo no início, formato no final. (LLMs têm atenção U-shaped)
- R7: GAP EXPLÍCITO — antes de emitir, o gerador lista o que não sabe. "?" = gap nomeado, não omitido.
- R8: EARLY EXIT — se houver gap P0 (bloqueia o agente de concluir), declarar antes do objetivo.
- R9: PROFUNDIDADE CONDICIONAL — ≥2 integrações de sistema ou ≥3 gaps P0 → aumentar nível de detalhe.

**Camada 3 — Regras de escopo (etapa-específicas)**
Cada etapa define:
- Quais campos do estado da instância são relevantes (R5 — estado curado)
- O critério de aceitação binário que vai dentro do briefing
- O agente destinatário e nível de linguagem calibrado para ele

## Como usar ao criar briefings por etapa

1. **Identificar os protocolos fonte** — quais slash commands têm protocolos aplicáveis a essa etapa?
2. **Destilar os princípios operacionais** — extrair o *protocolo*, não o *corpo* (2.000 linhas = ruído)
3. **Codificar como regras do CORE** — transformar em regras R1-R9 + regras etapa-específicas
4. **Gerar o briefing de exemplo** — aplicar o CORE ao estado hipotético e produzir o briefing (~50 linhas)
5. **Validar as 4 partes** — objetivo claro? escopo negativo? formato verificável? fronteiras explícitas?

> Nota: o método de construção EVOLUIU para bottom-up (ver M2 no CLAUDE.md): briefing perfeito
> concreto primeiro → destilar o racional → o racional vira o CORE. Os 5 passos acima descrevem
> a codificação; o M2 descreve de onde vem o material destilado.

## Nomenclatura oficial deste padrão

| Nome | Fonte | O que descreve |
|------|-------|----------------|
| **Meta-prompting** | APE, arXiv 2211.01910 | LLM gerando prompt para outro LLM |
| **Structured Agent Handoff** | Microsoft Agent Framework / Anthropic (2025) | Transferência de contexto estruturado entre agentes num pipeline |
| **Prompt Scaffolding** | "From Prompts to Templates", arXiv 2504.02052 | Construção do prompt em camadas (CORE + estado + schema) |
| **Supervisor Pattern with Structured Handoff** | LangGraph / AutoGen | Agente supervisor gera briefings e valida retornos antes de avançar |

**Nome que usamos neste projeto:** Meta-Prompt + Structured Handoff.
- O CORE é o **meta-prompt** (instrução para gerar instruções)
- O output schema é o **contrato de retorno**
- Juntos implementam **structured agent delegation** — padrão validado em produção pela Anthropic com +90.2% vs. agente único

## Por que não injetar os slash commands inteiros

Os slash commands de origem têm ~400 linhas cada. Injetar o corpo inteiro num briefing é contraproducente: pesquisa (Liu et al., "Lost in the Middle") mostra queda de ~30% de precisão quando contexto relevante fica no meio de contexto extenso. Uma frase irrelevante no contexto derrubou precisão para <30% (ICML 2023). O que funciona é destilar o **protocolo** — a sequência de perguntas e gates — não o template de UI.

**Regra de ouro:** o CORE destila; o briefing é denso e curto; o agente executa com foco.
