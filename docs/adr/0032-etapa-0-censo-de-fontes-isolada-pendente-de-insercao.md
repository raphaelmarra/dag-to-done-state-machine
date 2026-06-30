# 0032 — Etapa 0 (Censo de Fontes): construída ISOLADA, pendente de inserção no fluxo

- Status: proposed
- Data: 2026-06-30
- Relacionado: resolve parcialmente a dívida A020 (cegueira de fonte, achado-ouro do E2E piloto); espelha o
  gênero HITL da etapa 10 (ADR 0031), invertido (interrogação no início, não aprovação no fim); reusa
  `regraEvidenciaObrigatoria` (ADR 0027), `regraCampoIgual` fail-closed (ADR 0024/0030/0031) e o validador
  estrutural (ADR 0018). Fiel a "testar antes de cristalizar" (ADR 0016 / M4): NÃO é `accepted` porque a etapa
  ainda não roda no fluxo nem foi validada contra um 2º caso real.

## Contexto e Problema
O E2E piloto (2026-06-30) revelou a **cegueira de fonte** (A020): o DAG (etapa 1) mapeia A FUNDO a fonte que
recebe mas NUNCA pergunta "é a única?". Todo o rigor a jusante (Descoberta → Gate B ao vivo) confirma com perfeição
uma premissa que pode nascer parcial. O mesmo erro de classe mordeu 2× no piloto. A correção desenhada é uma
**Etapa 0 — Censo de Fontes**, ANTES do DAG, que estabelece o território a mapear. Mas inseri-la em `PIPELINE[0]`
quebra ~3 testes que assumem `dag` como 1ª etapa (placeholder, encadeamento, e2e) e a torna a nova `PRIMEIRA_ETAPA`
— uma mudança de FUNDAÇÃO do início do pipeline. Surge a tensão: entregar a etapa validada AGORA vs. não desestabilizar
a suíte 227/227 antes de a etapa estar provada.

## Decisão
**Construir a Etapa 0 completa e testada, mas ISOLADA do fluxo — e registrar a inserção como pendência explícita.**
Concretamente:

1. **Etapa definida fora do array `PIPELINE`.** `ETAPA_CENSO_FONTES` é exportada de `pipeline.config.mjs` como
   constante própria, NÃO inserida em `PIPELINE[0]`. Os 227 testes existentes ficam intactos; a etapa é exercitada
   por teste direto contra o porteiro real (`avaliarEtapa`). Suíte **235/235** (227 + 8 novos).

2. **Fluxo de 4 movimentos (HITL híbrida).** (1) o HUMANO declara a intenção e as fontes que conhece; (2) o AGENTE
   confronta com busca independente DUPLA e marcada — estática (read-only por construção, como o Explore) + viva
   (sonda o ambiente read-only, como o fiscal), cada fonte com `proveniencia` ∈ {declarada-pelo-humano, lida-no-codigo,
   sondada-ao-vivo}; (3) o DIFF declarado-vs-encontrado fica explícito; (4) o HUMANO julga a completude (fail-closed).

3. **Porteiro = confronto provado + veredito humano fail-closed (ZERO motor novo).** Três regras compostas:
   `regraEvidenciaObrigatoria` (fonte sondada ao vivo exige `evidencia` colada — anti-fuga, classe A017/A018) +
   `regraCensoConfrontado` (nova; nenhuma fonte encontrada fica `a_decidir`, descarte exige motivo substantivo —
   fecha o diff antes do veredito) + `regraCampoIgual("veredito_humano","censo_completo")` (só `censo_completo`
   avança; `faltam_fontes` BLOQUEIA). O `tipo` de fonte é CAMPO ABERTO (sem enum) — MVP em origens de dados, cresce
   para consumidores/sistemas-afetados sem reescrever a etapa (M1).

## Motivo
A decisão do operador foi não tocar os 227 testes antes de o que é "mais importante" — então a etapa nasce isolada,
provada em laboratório, e a integração vira um passo deliberado. Isso é coerente com **M4/ADR 0016**: a Etapa 0 é uma
mudança de fundação (muda `PRIMEIRA_ETAPA`); cristalizá-la como `accepted` exigiria (a) rodá-la no fluxo e (b)
validá-la contra um 2º caso real — idealmente o E2E #3 com a intenção corrigida. Até lá, registrar a decisão como
`proposed` preserva o trabalho (o design e o porteiro estão certos e testados) SEM declarar uma generalidade ainda
não provada por execução. O porteiro reusa só mecanismos já validados em 5+ etapas (tese de amortização): a única
peça nova é `regraCensoConfrontado`, e ela é o análogo direto de `regraDescobertaViraIssue`/`regraViolacaoViraIssue`.

## Consequências
**Pendência ABERTA (o que falta para virar `accepted` e fechar a A020):**
1. **Inserir `ETAPA_CENSO_FONTES` em `PIPELINE[0]`** — vira a nova `PRIMEIRA_ETAPA`; o DAG passa a consumir o
   `censo_output` (no `estadoCurado`); adaptar os ~3 testes que hardcodam `dag` como 1ª etapa (trocar contagens fixas
   por `PIPELINE.length` — dinâmico, M1; fazer o placeholder.test avançar pela Etapa 0 antes de chegar ao DAG).
2. **Validar contra um 2º caso real** (M4) — o E2E #3 com a intenção corrigida ("agregar TODAS as fontes do
   ambiente, não só a do código legado") é o teste natural: prova que a Etapa 0 teria pego a cegueira que mordeu.
3. **Secundário da A020 (independente):** o CORE-DISCOVERY deve exigir leitura do contrato tipado (SDK/OpenAPI/spec)
   ANTES de sondar ao vivo — segue pendente.

**Limite epistêmico declarado (herdado de A018/A019):** o motor verifica que o agente COLOU evidência e que o diff
FECHOU — não que a evidência é AUTÊNTICA nem que o território é REALMENTE completo. Completude é juízo humano
(fail-closed); autenticidade última é do humano que vê o ambiente. A correção estrutural (captura independente da
sondagem, fora do alcance do agente) sai do "Node puro, zero deps" (ADR 0001) e fica adiada (M4), como em A018/A019.

**Estado:** A020 atualizada em `ABERTO.md` com as 4 decisões de fundação e a pendência. Quando (1)+(2) fecharem,
este ADR passa a `accepted` (ou um ADR sucessor o cristaliza) e a A020 sai de ABERTO.
