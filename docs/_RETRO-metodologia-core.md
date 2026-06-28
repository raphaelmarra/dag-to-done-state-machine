# Retrospectiva cética — a metodologia que produziu o CORE-DAG v4.0

> Registro honesto dos limites da rodada de 2026-06-28. Existe para que o próximo agente NÃO herde
> otimismo: a metodologia (`METODOLOGIA-CORE.md`) foi **exercitada com sucesso uma vez**, não validada.
> Quem aplicar deve conhecer estes 4 furos.

---

## Distinção que rege tudo

- **CORE-DAG v4.0:** validado **num eixo** (intent estreita ↔ domínio amplo, mesma stack TS/Next.js),
  honestamente rotulado. Não é "validado para qualquer cenário" — não testamos outra stack/linguagem.
- **A metodologia 0→4:** **exercitada 1x, pelo próprio autor, com testes que o autor escolheu.**
  É hipótese promissora com uma evidência favorável e enviesada. Não está validada.

---

## Os 4 furos (por que a metodologia ainda não está validada)

### Furo 1 — n=1, e o réu é o juiz
Quem desenhou a rotina também a executou e também julgou se passou. "A rotina produziu um CORE que
eu considero bom" é circular: o CORE foi otimizado para passar nos testes que o próprio autor
escolheu. Um método não se valida pelo seu inventor numa única corrida.

### Furo 2 — os testes "cegos" não eram independentes
O agente cego era um subagente do mesmo autor, mesmo modelo, lendo o mesmo tipo de código. "Cego de
contexto" ≠ "independente". Um viés sistemático de como o autor lê dependências provavelmente é
compartilhado pelo cego — a concordância entre os dois pode ser dois espelhos, não duas testemunhas.

### Furo 3 — o teste adversarial foi fácil demais
O caso de ciclo plantado (order.js ↔ pricing.js) era didático: import circular óbvio de 2 nós, com
a resposta conhecida de antemão. Um adversário honesto plantaria um ciclo de 4+ nós atrás de
indireção, ou um **falso-positivo** (parece ciclo, não é) para ver se o CORE erra. Testamos se ele
acerta o fácil, não se resiste ao difícil.

### Furo 4 — "passou" foi julgamento, não critério mecânico
Não havia gabarito objetivo. O output foi comparado a um padrão-ouro que o próprio autor ajudou a
escrever, e o autor decidiu que bateu. Nenhum critério externo disse passou/falhou. É exatamente a
fraqueza que o projeto critica no motor: a validação dependeu do julgamento do agente, não de uma
máquina.

---

## O que, mesmo assim, ficou em pé (para não ser injusto)

- A **estrutura** do método é sólida em princípio: bottom-up de caso real, confrontar a premissa
  antes de confirmar, executor independente no teste, marcar o não-testado como provisório.
- O método **não se auto-enganou onde podia**: a regra de condensação (A5) ficou PROVISÓRIA e virou
  A010 em vez de ser vendida como validada. Isso foi honestidade real, não cosmética.
- "Tem boa estrutura e não trapaceou nesta rodada" — verdadeiro. Mas é diferente de "validado".

---

## O que tornaria a metodologia "validada" (critério de promoção)

A rotina vira "validada" quando, somados:
1. rodar num caso que o autor **não** escolheu (idealmente trazido por outra pessoa/agente);
2. com um juiz que **não** é o autor (critério externo ou revisor independente);
3. produzir um CORE que sobreviva a um **adversário que quer quebrá-lo** (caso difícil/falso-positivo);
4. repetir em **≥2 etapas diferentes** (DAG + ao menos uma das 2–13) sem o método precisar ser
   remendado a cada vez.

Até lá: cada etapa que a metodologia destilar é um datapoint — favorável ou não — sobre ela mesma.

---

## Lacuna paralela do CORE-DAG (separada, mas relacionada)
Os 2 casos do CORE-DAG são o mesmo projeto/stack (ravi-console, Next.js/TS). A generalidade
cross-stack (Python, Go, backend puro, lib) é **projetada mas não testada**. Um 3º caso de stack
diferente fecharia essa lacuna específica — e de quebra atacaria os Furos 1 e 2 (caso não escolhido
pelo viés atual).
