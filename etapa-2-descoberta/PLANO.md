# Plano da Etapa 2 — Descoberta da API

> Plano para destilar e construir a etapa 2 (Descoberta da API), seguindo a rotina validada na etapa 1
> (`docs/METODOLOGIA-CORE.md` + `docs/PLANO-DE-ETAPA.md`). **Aguardando aprovação do operador antes de
> executar.** Tudo da etapa 2 vive neste diretório `etapa-2-descoberta/`.

## O que é a etapa 2 (do PIPELINE.md)
Pega o mapa do DAG (etapa 1) e **confirma ao vivo** os endpoints que a feature vai usar: params exatos,
shapes reais de resposta, limites, comportamentos de borda. **Nunca supõe — verifica.** Executor: `fiscal`.

**Contraste com a etapa 1 (o que muda a personalidade da estação):**
- Etapa 1 (DAG): read-only POR CONSTRUÇÃO — NÃO toca a rede. Confiança: "lido/inferido/não-encontrado".
- Etapa 2 (Descoberta): o trabalho É tocar a rede (ao vivo). Confiança: "confirmado ao vivo/inferido/não-verificado".
- → O executor, o enum de confiança e o critério de aceitação são DIFERENTES. Não é cópia da etapa 1.

## O caso bottom-up que já temos (M2 — partir do real, não do abstrato)
`MVP/evidencia-teste-aba-clis/descoberta.output.json` — a descoberta REAL do E2E, rodada contra a API
de produção do ravi-console. Ela já revela o que torna uma boa descoberta:
- params exatos COM o tipo certo (ex.: `limit` é STRING, não number → senão ValidationError);
- shape de resposta REAL (não o do doc);
- bordas críticas (ex.: `commands/run` NÃO executa, só renderiza; `args` é array, não objeto);
- **o que foi tentado e falhou** (cada ValidationError observado);
- confiança por campo + a evidência ao vivo que a sustenta.
Este é o "briefing perfeito" de partida. Será o padrão-ouro contra o qual o CORE da etapa 2 é medido.

---

## FASE DE PESQUISA (operador pediu "pesquisar bem antes", como no DAG)
Pesquisas amplas, em paralelo, cada uma vira um doc em `etapa-2-descoberta/research/` com fontes. Calibradas
para CONFRONTAR, não confirmar. A pesquisa de FORMA (prompt/escrita — `docs/research/0006-0010`) NÃO se
repete; só a de CONTEÚDO da etapa 2:

| # | Pesquisa | Pergunta central |
|---|----------|------------------|
| P1 | **Descoberta/contrato de API ao vivo** | Como a indústria descobre e documenta o contrato REAL de uma API (vs o doc)? Contract testing, schema inference, exploração segura. |
| P2 | **Honestidade de verificação** | Como reportar com rigor "o que foi REALMENTE testado ao vivo" vs "suposto"? Níveis de confiança, evidência, provenance. (O coração da etapa.) |
| P3 | **Exploração read-only segura** | Como sondar uma API sem causar efeito colateral (distinguir GET seguro de mutação destrutiva)? Idempotência, métodos seguros, dry-run. |
| P4 | **Limites e bordas** | Como descobrir paginação, tetos, timeouts, rate-limits e comportamento de erro de forma sistemática? |

> Se alguma pesquisa se mostrar redundante com o caso real (que já é rico), ela é encurtada — não
> desperdiçar o canhão. Decisão por pesquisa durante a execução.

---

## ROTINA (a mesma da etapa 1, que se provou)
- **Fase 0** — vereditos das mudanças candidatas (o que a etapa 2 herda da 1 vs o que é próprio dela).
- **Fase 1** — padrão-ouro: o caso real acima + um agente cego mapeando, fundidos.
- **Fase 2** — escrever o CORE-DISCOVERY (em WIP neste diretório).
- **Fase 3** — testar: agente cego executa o briefing gerado; regressão; adversarial.
- **Fase 4** — cristalizar: CORE oficial + ADRs + plugar no `v1/` + governança.

**Portões e regras (idênticos à etapa 1):** M1 (dinâmico > hardcode), evidência obrigatória,
**anti-viés saturado** (múltiplos verificadores cegos por peça — auditor-v2 + code-reviewer + outros
conforme a natureza), Definition of Done por peça.

---

## AS PEÇAS DA ETAPA 2 (triagem — o que reusa, o que é novo)

Reaproveita a infra do motor (já pronta no `v1/`): substituição de placeholder, validação estrutural
recursiva, gerador de prosa do schema, bloqueio, estado curado. Então cada peça é "declarar o dado da
etapa 2", não "construir mecanismo".

| Peça | Reusa da etapa 1? | O que é próprio da etapa 2 |
|------|-------------------|----------------------------|
| **Executor** | mecanismo sim | `fiscal` (TOCA a rede — oposto do Explore). **Validar o executor** como fizemos com o Explore. |
| **Confiança do agente** | mecanismo sim | enum DIFERENTE: "confirmado ao vivo / inferido / não verificado". |
| **Padrão de entrega (schema)** | validador sim | forma própria: endpoints {método, params c/ tipo, shape_resposta, limites, bordas, confianca, evidencia_ao_vivo}. |
| **Critério de aceitação** | mecanismo sim | mais rígido: "zero campos não-verificado sem justificativa"; "evidência ao vivo obrigatória por endpoint confirmado". |
| **Pré-condição / bloqueio** | mecanismo sim | exige o output do DAG (etapa 1) como entrada — bloqueia se não houver. |
| **Estado curado** | mecanismo sim | recebe o mapa do DAG (quais endpoints importam) — não recomeça do zero. |
| **CORE / briefing** | método sim | CORE-DISCOVERY próprio (instrui o `fiscal` a verificar ao vivo com honestidade). |
| **Verificação independente** | conceito sim | candidata: a própria descoberta poderia ser checada por um 2º agente? (decidir com evidência). |

> Peças que NÃO se aplicam (provável): lentes, pre-mortem, arquétipo — são de Design/Gate. Confirmar
> peça a peça com o teste "a etapa 2 precisa disto para entregar à etapa 3?".

---

## ROADMAP — onde isto encaixa
- **Hoje:** 1 de 13 etapas completa (DAG), motor + método + infra prontos e validados.
- **Depois desta:** 2 de 13. E — mais importante que o número — a **2ª repetição prova que o método
  REPLICA** (a aposta do piloto: "fazer o DAG e depois replicar"). Se a etapa 2 sair mais barata e
  sólida reusando a infra, está confirmado que dá pra escalar até a 13.
- **Custo esperado:** menor que o DAG (a parte cara — motor, validador, método — já foi paga). O gasto
  é destilar o conteúdo específico + as 4 pesquisas focadas.

---

## RESULTADO ESPERADO (em uma frase)
Uma segunda estação completa e plugada no motor, que pega o mapa do código e o **confronta com a
realidade ao vivo**, entregando à etapa 3 um contrato de API confiável — com a marca de honestidade do
projeto (dizer exatamente o que foi conferido, nunca fingir certeza).

---

## ✅ FASE DE PESQUISA — CONCLUÍDA (2026-06-28)
4 pesquisas em `research/01-04`, com fontes. Achados que MOLDAM o design da etapa 2:

- **P1 (contrato):** a etapa 2 é "spec-to-reality discovery". Inverter a fonte de verdade (doc/código =
  HIPÓTESE, realidade ao vivo = verdade). A divergência doc↔realidade é **entregável de 1ª classe** (não
  nota de rodapé). Oráculos explícitos ("respondeu 200" não basta). Descoberta stateful (cadeia produtor→consumidor).
- **P2 (honestidade) — ACHADO QUE MUDA O DESIGN:** marcar "confirmado" é uma **auto-atestação** do
  agente — e SLSA/in-toto + a pesquisa de overconfidence de LLM dizem que auto-atestação NÃO basta.
  **Recomendação forte:** o PORTEIRO deve **rebaixar automaticamente** "confirmado ao vivo" → "inferido"
  quando NÃO houver evidência ao vivo anexada e reproduzível. Tira a honestidade das mãos do modelo e a
  põe num artefato verificável (estrutural, não achismo). Também: separar SEMPRE "a afirmação" da
  "confiança nela" (ICD-203, Admiralty/NATO); enum fechado com definição operacional única. Os 3 níveis
  sobrevivem; bidimensionalização (fonte × evidência, estilo Admiralty) fica em ABERTO até 2º caso (M4).
- **P3 (segurança) — DEFESA PRIMÁRIA É ESTRUTURAL:** o verbo HTTP é promessa, não garantia (POST pode
  só ler; GET pode mutar). O incidente PocketOS/Railway (agente apagou produção em 9s) prova que prompt
  não é guardrail. Trilho real: **token read-only escopado + ambiente isolado**. Protocolo: descobrir
  ANTES de chamar (OPTIONS/Allow, introspection); "ambíguo é mutação até prova de não-mutação"; dry-run
  quando inevitável. (Espelha a lição do executor da etapa 1: garantia por construção, não comportamental.)
- **P4 (limites):** Particionamento por Equivalência + Análise de Valor de Fronteira mapeiam o "envelope"
  com poucos requests. 6 dimensões com sinal observável (paginação/rate-limit/timeout/payload/erros/bordas).
  Protocolo de 9 sondas por endpoint, ordenadas de menor a maior risco. Os 3 achados reais do nosso caso
  casam 1:1 com 3 sondas (tipo / shape duplicada / ausência de param).

**Convergência das 4 com a etapa 1:** a honestidade tem de ser **estrutural** (porteiro + formato), nunca
confiar no modelo — exatamente como o executor read-only da etapa 1 foi garantia por construção. Isto vira
a espinha do CORE-DISCOVERY.

## ▶️ PRÓXIMO: Fase 0 (vereditos) → Fase 1 (padrão-ouro) → Fase 2 (CORE) → Fase 3 (testar) → Fase 4 (cristalizar)
Execução autônoma; checkpoint só ao cristalizar ADR.
