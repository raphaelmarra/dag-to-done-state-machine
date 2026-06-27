# Como a execução funciona — quem tem o prompt, quem consome, quem delega

> Registro do entendimento travado em 2026-06-27, a partir da leitura do código do MVP
> (`MVP/dag.mjs`, `MVP/pipeline.config.mjs`) e da evidência do E2E real (`MVP/evidencia-teste-aba-clis/`).
> Se você esquecer "como isso roda na prática", **comece por aqui**.

---

## O fluxo, em uma frase

**A state machine (Node) é a DONA dos prompts; o agente principal (Claude Code) CONSOME o
prompt e o TRADUZ num prompt de delegação próprio; o subagente EXECUTA.**

A máquina é a **fonte** da instrução. O agente principal é o **mensageiro que reescreve o
recado** ao adaptá-lo ao projeto. O subagente é o **executor**.

---

## A ordem real, passo a passo (por etapa)

1. **A máquina tem o prompt.** Cada etapa guarda seu CORE/briefing em
   `MVP/pipeline.config.mjs` (campo `core`) ou em arquivos `MVP/cores-aba-clis/*.md`
   (campo `corePath`). A máquina é a única dona dessa instrução.

2. **O agente principal roda `node dag.mjs next <feature>`.** O CLI monta o briefing num
   arquivo em disco (`.dag/<feature>/<etapa>.briefing.md`) e imprime no stdout **só os
   caminhos** — porque o stdout do Bash do Claude Code tem limite de ~30KB.
   (Função `cmdNext` + `montarBriefing` em `dag.mjs`.)

3. **O agente principal LÊ o arquivo de briefing.** É aqui que ele *consome* o prompt da
   máquina. O CLI não entrega nada a ninguém — deixa um bilhete em disco e aponta o caminho.

4. **O agente principal DELEGA ao subagente** (`Explore`, `error-detective`, etc.) com um
   prompt **de sua própria autoria**, baseado no que leu. Ver a ressalva crítica abaixo.

5. **O subagente devolve.** O agente principal escreve o resultado em
   `.dag/<feature>/<etapa>.output.json` e roda `node dag.mjs advance <feature>`.

6. **A máquina age como JUIZ** (`cmdAdvance`): o arquivo existe? é JSON? os campos do schema
   estão presentes? (nos gates, `veredito === "APROVA"`?). Se passa, avança; senão, bloqueia.

---

## ⚠️ A ressalva crítica: o briefing NÃO é repassado palavra por palavra

Nada no código força o agente principal a repassar o briefing verbatim. Ele **interpreta** o
briefing e **redige um prompt novo** para o subagente. Então, sendo rigoroso:

> máquina **tem** o prompt → agente principal **consome** → agente principal **traduz** num
> prompt de delegação → subagente **executa**.

A máquina é a fonte; a formulação final que o subagente recebe passa pela cabeça do agente
principal.

---

## Por que isso é uma FEATURE, não um bug (a ligação com o CORE do DAG)

Este acoplamento solto é **intencional e desejável** — é a metodologia M1 ("dinâmico é a
preferência") em ação. O CORE não é, e não deve ser, o prompt do DAG de um projeto específico.

**O DAG do CLI é diferente do DAG do CRM.** Mesmo arquétipo, contextos diferentes. Se o CORE
fosse o prompt literal do DAG do CLI, ele falharia no CRM. Por isso:

- O CORE ensina o **critério** de como construir um DAG (invariante).
- O agente principal lê o critério e **gera o melhor prompt para o projeto real** (variável).
- Quem consome o CORE precisa conseguir criar um briefing **melhor e específico** para o
  contexto — exatamente o que o agente principal faz no passo 4.

Em resumo: a reescrita pelo agente principal é o que permite **um CORE genérico** servir a
qualquer projeto. Tirar essa folga (forçar prompt literal) mataria a generalidade.

---

## A tensão que isso abre

A mesma folga que dá generalidade também tira **controle e reprodutibilidade**: a máquina não
verifica o que foi delegado, nem se o subagente certo foi usado, nem o *conteúdo* do prompt —
só o resultado final. A fidelidade "briefing → delegação" depende 100% do julgamento do agente
principal.

Isso está registrado como questão em aberto — ver `ABERTO.md` **A009** (controle de fidelidade
da delegação). Direções possíveis: (a) briefing vira prompt literal — mata generalidade;
(b) a máquina registra/valida o que foi delegado — preserva generalidade e adiciona controle.

---

## Referências

- Código: `MVP/dag.mjs` (motor/juiz), `MVP/pipeline.config.mjs` (os prompts/COREs).
- Evidência do fluxo real: `MVP/evidencia-teste-aba-clis/`.
- Padrão nomeado: ADR 0015 (Meta-Prompt + Structured Handoff).
- Metodologias M1–M3 e princípio central: `CLAUDE.md`.
