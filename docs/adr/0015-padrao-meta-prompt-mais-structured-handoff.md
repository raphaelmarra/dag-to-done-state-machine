# 0015 — Padrão: Meta-Prompt + Structured Handoff

- Status: accepted
- Data: 2026-06-26
- Origem: migrado de DECISOES.md (D015)

## Contexto e Problema
Precisávamos de nome e referências para o padrão que estamos construindo, para garantir que futuras decisões de design sejam coerentes com o que a literatura validou.

## Decisão
O padrão tem nome oficial: **Meta-Prompt + Structured Handoff**. O CORE é o meta-prompt (instrução para gerar instruções); o output schema é o contrato de retorno; juntos implementam structured agent delegation.

## Motivo
Padrão validado em produção pela Anthropic (+90.2% vs agente único). Nomenclatura estabelecida em APE (arXiv 2211.01910), Microsoft Agent Framework e "From Prompts to Templates" (arXiv 2504.02052). Nomear o padrão evita reinvenção e ancora futuras decisões em evidência.

## Consequências
Toda documentação do projeto usa essa nomenclatura. Decisões que contradizerem o padrão precisam de justificativa explícita.
