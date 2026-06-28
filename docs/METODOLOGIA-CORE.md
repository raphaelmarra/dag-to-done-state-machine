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

> **⚠️ LIÇÃO DA ETAPA 2 — "passou no teste real" ≠ "está pronto".** O teste de campo (mesmo AO VIVO
> contra produção) valida o **caminho feliz**, NÃO a robustez do porteiro. Na etapa 2 o teste ao vivo
> passou e o porteiro *aprovou* — mas o anti-viés saturado depois achou que a regra-central era
> **burlável** (evidência vazia `{}` passava). Teste-de-campo e anti-viés pegam coisas DIFERENTES;
> ambos são obrigatórios antes de cristalizar. Nunca cristalize só porque o ao-vivo passou.

> **As 3 checagens da auditoria-base (a partir da etapa 3 — nascidas dos achados da etapa 2):**
> Antes de declarar uma etapa pronta, o anti-viés saturado DEVE verificar, além de bugs:
> 1. **Paridade CORE↔porteiro:** todo campo/regra que o CORE PROMETE ao executor é de fato EXIGIDO
>    pelo porteiro (schema/aceita)? (Na etapa 2, o porteiro não exigia `limites`/`bordas`/`divergencias`
>    que o CORE prometia — a divergência schema↔prosa F3 que a etapa 1 matou, reintroduzida por subuso da infra.)
> 2. **Encanamento de entrada:** a pré-condição que esta etapa exige é REALMENTE produzida e entregue
>    pela etapa anterior, no fluxo real? (Na etapa 2, `dag_output` era pré-condição mas o motor não o
>    promovia — `next` sempre bloquearia; o e2e mascarava por usar `advance` direto.)
> 3. **Dialeto de validação:** esta etapa precisou de regra custom no `aceita`? Então cheque se já é
>    hora de padronizar em `regrasExtras` declarativo (A012) — antes que os gates fragmentem o padrão.

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

## Custo observado (2 execuções — a tese de amortização CONFIRMADA)
**Etapa 1 (DAG) — construiu o motor:**
- ~9 pesquisas (5 de forma reutilizáveis + 4 de conteúdo) · 2 casos reais + 1 sintético · 2 cegos + 1 adversarial.
- **~155 linhas de infra genérica** (validador recursivo, gerador de prosa, placeholders, bloqueio) + 3 ADRs.

**Etapa 2 (Descoberta) — só reusou:**
- 4 pesquisas de conteúdo · 1 caso real + teste AO VIVO contra produção · 1 cego + 3 verificadores saturados.
- **~50 linhas de config + 0 de motor** + 1 ADR. O único "código" novo: a regra custom no `aceita` (~12 linhas).

> **Tese amortização — PROVADA por número (não por fé):** o custo marginal de uma etapa nova caiu de
> "construir o motor" (~155 linhas) para "declarar um objeto" (~50). A infra da etapa 1 era investimento
> que se paga. ⇒ Nas etapas 3–13, **seja agressivo na reutilização**: não re-prove o motor, só declare
> dados. A pesquisa de **forma** (0006–0010) **não se repete** — só a de **conteúdo** + as Fases 0→4.

> **Ressalva (etapa 2):** parte da "economia" foi por SUBUSO da infra (schema raso). Fechar o que faltou
> custou +~25 linhas — ainda declarativo. Ou seja: até o trabalho que falta é "declarar dados", o que
> REFORÇA a tese. Mas o subuso é uma armadilha (ver as 3 checagens da Fase 3 — paridade CORE↔porteiro).

---

## Limites conhecidos da própria metodologia
Ver `_RETRO-metodologia-core.md` (4 furos da 1ª execução). **Avanço na etapa 2** (2º datapoint): dois
dos furos foram ATACADOS — (a) o teste deixou de ser só "escolhido pelo autor": foi **ao vivo contra
produção real**, fora do controle do autor; (b) o anti-viés deixou de ser um cego único e virou
**3 verificadores de perspectivas diversas** (code-reviewer + auditor-v2 + backend-architect), que
acharam bugs que um só não acharia. Ainda compartilham o mesmo modelo — não zera o viés sistemático —
mas é mais forte que a etapa 1.

**Datapoint da etapa 2:** a metodologia produziu uma etapa que PARECIA pronta (teste ao vivo passou) e
os verificadores acharam 4 problemas reais. Conclusão: a rotina **funciona como rede de segurança** —
mas só porque o anti-viés saturado foi aplicado DEPOIS do teste de campo. A lição virou regra (Fase 3:
as 3 checagens + "ao-vivo passou ≠ pronto"). Continua não-validada no sentido forte (2 execuções, mesmo
autor/modelo), mas cada etapa a fortalece e já tem mecanismos contra os próprios furos.
