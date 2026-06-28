# Metodologia para obter um CORE — da pesquisa ao refinamento

> Como destilamos o CORE-DAG v4.0 (etapa 1). Este é o **pipeline reutilizável** para destilar o
> CORE de qualquer etapa do pipeline (etapas 2–13). Derivado do que de fato fizemos em 2026-06-28,
> não de uma versão idealizada. Status da própria metodologia: **exercitada 1x com sucesso — NÃO
> validada** (ver `_RETRO-metodologia-core.md`, os 4 furos conhecidos). Use com os olhos abertos.

Ancora-se nas metodologias do projeto: M1 (dinâmico), M2 (bottom-up), M3 (invariante vs variável),
M4 (testar antes de cristalizar) — ver `CLAUDE.md`. E na governança da skill `manter-governanca`.

---

## Visão em uma frase

**Pesquisar o que move o resultado → destilar de casos reais (não de hipótese) → confrontar a
teoria contra o próprio viés → testar com executor independente → cristalizar só o que sobreviveu,
marcar o resto como provisório.**

---

## As 5 fases (pipeline)

```
PESQUISA → FASE 0 (vereditos) → FASE 1 (padrão-ouro) → FASE 2 (escrever)
         → FASE 3 (testar) → FASE 4 (cristalizar)
```

### PESQUISA (pré-fase) — fundar em evidência, não em opinião
- Disparar pesquisas **em paralelo** (subagentes), cada uma vira um doc em `docs/research/` com
  fontes citadas. Duas famílias:
  1. **Sobre a forma** (vale para todo CORE): como escrever prompt/meta-prompt que move LLM
     (já feito: `research/0006–0010` — técnicas com evidência, meta-prompting, clareza-para-LLM,
     redação humana e onde diverge). **Reutilizar nas próximas etapas, não repesquisar.**
  2. **Sobre o conteúdo da etapa** (específico): a teoria do domínio daquela etapa
     (ex.: para o DAG → `research/0011–0014`: acíclico vs cíclico, análise de impacto, modelagem,
     ferramentas reais).
- **Regra anti-viés:** calibrar a pesquisa para **confrontar** a premissa, não confirmá-la. Antes
  de pesquisar, **revisar os ADRs existentes** e listar os vieses que podem estar nos enviesando;
  a pesquisa tem que poder *derrubar* esses vieses. (No DAG, a premissa "é DAG acíclico" foi posta
  em xeque — e sobreviveu, mas por razão diferente da que assumíamos.)

### FASE 0 — Vereditos das mudanças candidatas
- Das pesquisas saem mudanças candidatas ao CORE. Para cada uma: **aceita / rejeita / a-testar**,
  com a fonte. Separar o que é estrutural (muda regras) do que é forma (muda redação).
- **Portão 0:** cada mudança tem veredito e justificativa (fonte real), não "achei melhor".

### FASE 1 — Padrão-ouro (bottom-up, M2)
- Escolher um caso real **pelo critério de teste, não por conveniência** — o caso deve *estressar*
  o que é frágil (no DAG: domínio amplo vs a intent estreita anterior; terreno provável de ciclo).
- Produzir o **"briefing perfeito" do caso** — o que um executor ideal deveria receber. **Quem escreve:**
  um **agente cego** (sem contexto do CORE/pesquisas, para não copiar o viés) **+ o agente principal**,
  depois **fundir** extraindo o melhor de cada. A comparação revela onde o viés do principal cegou
  (o que o cego viu e ele não) e onde a estrutura do principal é superior (o que o cego não filtrou).
- **Destilar o racional (M3):** o que é invariante (vira regra do CORE) vs variável (lido da demanda).
- **Portão 1:** padrão-ouro fundido existe; racional separado em invariante/variável.

### FASE 2 — Escrever o CORE (vNova, em WIP)
- Partir do CORE anterior; aplicar as mudanças da Fase 0 + as **regras de escrita** da pesquisa de
  forma (sanduíche/regra-mestra repetida no fim, polaridade positiva, exclusões como transferência
  de responsabilidade, raciocínio-antes-do-formato, vocabulário repetido).
- Mudança **não validável neste caso** entra marcada **"⚠️ PROVISÓRIO"**, nunca como regra firme.
- **Portão 2:** rascunho existe; cada regra rastreável a um caso real OU a uma pesquisa.

### FASE 3 — Testar (o portão de verdade, M4)
Três testes:
1. **Generalidade (cego):** um executor independente recebe **só o briefing gerado pelo CORE**
   (não o CORE) e produz o output. Comparar com o padrão-ouro da Fase 1. Divergência = o CORE não
   transmitiu o racional.
2. **Regressão:** rodar contra o caso anterior; confirmar que não piorou o que já funcionava.
3. **Adversarial dirigido:** alimentar o caso que estressa a regra mais arriscada (no DAG: ciclo).
   Se a regra não disparar, ela é fraca.
- **Portão 3 (cristalização):** passou nos três, sem regressão, e os achados adversariais
  apareceram. Só aqui sai de WIP.

### FASE 4 — Cristalizar (governança)
- WIP → oficial; versão anterior arquivada (não deletada).
- Cada decisão estrutural validada → **um ADR** (motivo ancorado em pesquisa + caso).
- Mudança provisória → **questão em ABERTO** com o critério exato de promoção.
- Atualizar ROADMAP (status da etapa), CHANGELOG, INDEX, DECISOES.

---

## O que tornou esta rotina diferente de "só escrever um prompt bom"

1. **Bottom-up de caso real** — o CORE é evidência destilada, não hipótese (M2/ADR 0016).
2. **Cego + principal fundidos** — combate o viés de quem conhece demais o próprio sistema.
3. **Executor independente no teste** — mede se o CORE *transmite*, não se o autor *entende*.
4. **Provisório explícito** — o que não foi testado é marcado, não vendido como validado (A5/A010).
5. **Confrontar a premissa** — a pesquisa pôde derrubar a base; ela sobreviveu por razão revisada.

---

## Custo observado (1 execução, etapa DAG)
- ~9 pesquisas em paralelo (5 de forma reutilizáveis + 4 de conteúdo do DAG).
- 2 casos reais (CRM + regressão aba CLIs) + 1 sintético (ciclo).
- 2 subagentes cegos (1 padrão-ouro, 1 generalidade) + 1 adversarial.
- 3 ADRs + 1 questão aberta + arquivamento da versão anterior.

> Para etapas 2–13: a pesquisa de **forma** (0006–0010) **não se repete**. Repete-se só a pesquisa
> de **conteúdo** da etapa + as Fases 0→4. Tende a ficar mais barato a cada etapa.

---

## Limites conhecidos da própria metodologia
Ver `_RETRO-metodologia-core.md`. Em resumo: foi exercitada **uma vez, pelo próprio autor, com
testes que o autor escolheu**. Não é uma metodologia validada — é uma hipótese com uma evidência
favorável e enviesada. Aplicar com ceticismo; cada nova etapa que ela destilar com sucesso (ou
falha) é um datapoint sobre a própria metodologia.
