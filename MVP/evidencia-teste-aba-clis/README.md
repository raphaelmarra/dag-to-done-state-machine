# Evidência — Teste real end-to-end da feature "aba CLIs"

Estes são os documentos **reais** gerados ao rodar a state machine (`MVP/dag.mjs`) conduzindo a
feature "aba CLIs" do ravi-console, em 2026-06-27. Cada `*.output.json` foi produzido por um
agente especializado, validado pelo porteiro do motor, e usado como insumo da etapa seguinte.

> Não são fixtures nem exemplos. São o output verdadeiro do pipeline, incluindo verificação ao
> vivo contra a API de produção do ravi-console.

## Como foi rodado

```
node dag.mjs init aba-clis --entry "aba CLIs" --desc "..." --root ".../ravi-console"
# para cada etapa: next → delega ao agente → o agente escreve o output → advance (valida)
```

O agente Claude Code operava o CLI; cada etapa foi delegada ao subagente apropriado
(Explore, error-detective, ui-ux-designer, Plan, fullstack-developer, code-reviewer).

## Os documentos (na ordem do pipeline)

| Arquivo | Etapa | O que contém |
|---------|-------|--------------|
| `dag.output.json` | DAG | 22 nós, 26 arestas (consumidor→provedor), 7 gaps direcionais. Mapa de correlações real da aba. |
| `descoberta.output.json` | Descoberta da API | 4 endpoints **confirmados ao vivo** via curl no proxy `/api/ravi`. Shapes reais. |
| `gap.output.json` | GAP | Bugs reais confrontando código × contrato da API, com arquivo:linha. |
| `design.output.json` | Design | 12 critérios Given/When/Then, 6 riscos pre-mortem, 9 estados, 4 ADRs. |
| `mapa_dependencias.output.json` | Mapa de dependências | 5 unidades de implementação, ordem, paralelismo seguro. |
| `implementacao.output.json` | Implementação | Plano de 8 mudanças ancoradas nos achados (não alterou o ravi). |
| `gate_a.output.json` | Gate A | Revisão adversarial — veredito **REPROVA** com issues acionáveis. |
| `state.json` | (motor) | Estado final da feature: parada no `gate_a`, 6 etapas concluídas, histórico completo. |

## Achados mais valiosos (que só a execução real revelou)

- **`commands/show` usa o param `name`**, não `command` (este é rejeitado pela API).
- **`commands/list` exige `limit`/`offset` como STRING** — passar number dá ValidationError.
- **`commands/run` NÃO executa nada** — apenas renderiza o prompt (`data.prompt` + sha256). O
  frontend tratava como execução; `args` deveria ser array posicional, não objeto.

Estes achados contradizem o que a leitura do código sozinha sugeria — é o valor da etapa de
verificação ao vivo.

## O desfecho: bloqueio honesto no Gate A

O Gate A (revisão adversarial) **reprovou** por buracos reais nas lentes de MUTACAO (delete sem
confirmação, concorrência) e LISTA (ordenação). O motor, ao validar, **bloqueou o avanço** —
porque o critério da etapa exige veredito `APROVA`. A feature parou corretamente, sem chegar a
um "done" falso. Esse bloqueio é a prova de que o porteiro tem integridade.

O ciclo correto seguinte seria: voltar ao Design/Implementação, cobrir o que o Gate A apontou,
e re-submeter — exatamente o loop que a máquina de estados existe para forçar.
