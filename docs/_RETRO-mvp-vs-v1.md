# Avaliação comparativa — MVP (baseline) vs v1 (etapa 1 completa)

> Conclusão da revisão de 2026-06-28: o trabalho da etapa 1 gerou **ganho de qualidade real, saldo
> positivo e zero regressão**. Avaliação feita por um verificador cego independente que **rodou os
> dois códigos** e provou cada alegação com execução (não aceitou a palavra do autor). Cruzada com a
> análise do autor.

## Veredito em uma linha
**Mais qualidade onde importa (o porteiro), nada quebrado, e mais barato daqui pra frente.** Saldo
positivo, confirmado por verificação independente.

## Métricas
| | MVP (baseline) | v1 (etapa 1) |
|---|---|---|
| Motor `dag.mjs` | 335 linhas | 418 (+83, infra genérica reutilizável) |
| `pipeline.config.mjs` | 162 linhas | 366 (+204; ~110 = engine de schema) |
| Testes | 5 (1 arquivo) | 40 (8 arquivos) |
| Validação da etapa dag | presença de 3 campos de topo | estrutural recursiva profundidade-3 (tipos + enums) |

## Ganho REAL (provado por execução do mesmo input nas duas versões)

**1. Porteiro mais rigoroso** — o ganho central. Mesmo input, vereditos opostos:
- `{nos: ["string","string"], arestas:[...], gaps:[...]}` → MVP **aceita** (lixo bem-formado) / v1 **rejeita** (faltam blast_radius, fronteira, confianca).
- `nos[0].confianca = "confirmado ao vivo"` (valor proibido ao Explore) → MVP **aceita** / v1 **rejeita** (fora do enum do executor).
- O MVP deixava passar JSON bem-formado mas semanticamente lixo para a próxima etapa. Não é teatro.

**2. Fonte única** — a melhoria mais limpa. No MVP, o schema (validação) e a Seção 4 do CORE (descrição)
eram dois lugares que **já tinham divergido**. No v1, o schema **gera** a descrição (`{schema_prosa}`):
uma fonte, dois usos. O avaliador rodou `diff` e confirmou que o teste de sincronia é real.

**3. Hardcode → dinâmico (parcial e honesto)** — enum de confiança e `next_stage` viraram derivados
(do executor e do pipeline). Trocar o executor = editar um objeto; enum, capacidade e critério mudam juntos.

## Zero regressão (provado)
- e2e das **13 etapas** verde no v1; os **5 testes originais** do MVP preservados e passando.
- Guardas anti-regressão testadas: etapa sem `precondicoes` não bloqueia; sem `estadoCurado` usa default;
  sem `executor` não injeta placeholders. As 12 outras etapas funcionam idênticas ao MVP.

## A ressalva honesta (não muda o saldo)
**Over-engineering localizado:** o validador recursivo genérico serve hoje **1 de 13 etapas**.
Construiu-se "a fábrica antes do segundo produto". Não é complexidade sem retorno *hoje* (paga-se em
rigor real na etapa 1), mas o *grau* de generalidade só se justifica quando a etapa 2 reusar o
validador/gerador. Se a etapa 1 fosse o fim da linha, ~110 linhas de engine seriam superdimensionadas.
→ O saldo é positivo agora e fica **mais** positivo a cada etapa que reusar a infra.

## Leitura honesta dos números (para não inflar)
- Config 162→366 **não** significa "2,2× melhor": metade é engine reutilizável ainda subutilizada.
- "Dinâmico" é parcial: enum e next_stage derivam do contexto; a *forma* do schema é hardcode
  bem-organizado (e deve ser — é o contrato da etapa).

## Conclusão
Trabalho sólido e honesto, com a melhoria certa no lugar certo, provada por execução independente. O
ROI completo depende de **continuar** (a generalidade é uma aposta no roadmap que se valida na etapa 2).
