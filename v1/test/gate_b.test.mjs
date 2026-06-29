// gate_b.test.mjs — testes próprios da etapa 9 (Gate B — Verificação ao vivo). Foco: o veredito QUATERNÁRIO
// (verificado/diverge/inconclusivo/precisa-humano) + FAIL-CLOSED (só verificado avança), evidência substantiva
// por critério, inconclusivo com motivo enumerado, coerência global↔por-critério, e cobertura dos critérios do
// design (cruza o estado). A etapa 9 é de gênero diferente do Gate A/8 — verifica VERDADE, não forma.

import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { main, outputPath, briefingPath, featureDir, carregarEstado, salvarEstado } from "../dag.mjs";
import { etapaPorId } from "../pipeline.config.mjs";

const FEATURE = "gateb-test";
function limpar() { rmSync(featureDir(FEATURE), { recursive: true, force: true }); }

// design_output com ids de critério (a regra de cobertura cruza isto). O Gate B deve endereçar CA-01 e CA-02.
const DESIGN_OUT = { criterios_aceitacao: [{ id: "CA-01" }, { id: "CA-02" }] };

// Verificação "verificado" válida: os 2 critérios do design endereçados, ambos confere com evidência real.
function gbVerificado() {
  return {
    veredito: "verificado",
    resumo: "Confrontei os 2 critérios com a API ao vivo; ambos conferem.",
    criterios: [
      { criterio: "CA-01: a lista carrega", situacao: "confere",
        evidencia: "Request real: POST commands/list {agent:'main'} → 200, data.items com 1 item. Asserção: a lista carrega ao vivo.", motivo: null },
      { criterio: "CA-02: cada item tem id/nome", situacao: "confere",
        evidencia: "Request real: idem; items[0]={id:'arch',nome:'#arch'}. Asserção: os campos exigidos estão presentes.", motivo: null },
    ],
    fica_para_humano: ["confirmar a janela de acesso ao ambiente"],
  };
}

// Verificação "diverge": CA-02 diverge (real ≠ esperado), com a divergência apontada. Global = diverge (fail-closed).
function gbDiverge() {
  return {
    veredito: "diverge",
    resumo: "CA-02 diverge: o real contradiz o design.",
    criterios: [
      { criterio: "CA-01: a lista carrega", situacao: "confere",
        evidencia: "Request real: list → 200 com items. Asserção: carrega.", motivo: null },
      { criterio: "CA-02: cada item tem id/nome", situacao: "diverge",
        evidencia: "Request real: list → items[0]={id:'arch'} SEM 'nome'. ESPERADO: id e nome; REAL: só id. Diverge.", motivo: null },
    ],
    fica_para_humano: ["severidade da divergência de CA-02"],
  };
}

// Verificação "inconclusivo": CA-02 inconclusivo (não deu p/ checar) com motivo enumerado. Global = inconclusivo.
function gbInconclusivo() {
  return {
    veredito: "inconclusivo",
    resumo: "CA-02 não pôde ser verificado ao vivo.",
    criterios: [
      { criterio: "CA-01: a lista carrega", situacao: "confere",
        evidencia: "Request real: list → 200 com items. Asserção: carrega.", motivo: null },
      { criterio: "CA-02: paginação >50", situacao: "inconclusivo",
        evidencia: "Tentei list {limit:'1'} → hasMore:false porque só há 1 item; não foi possível forçar página cheia.",
        motivo: "pre-condicao-de-dado-ausente" },
    ],
    fica_para_humano: ["seed de >50 itens para testar a paginação"],
  };
}

function prepararEAvaliar(gb, designOut = DESIGN_OUT) {
  limpar();
  assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
  const e = carregarEstado(FEATURE);
  e.etapaAtual = "gate_b";
  // as 8 pré-condições; design_output com ids reais (a regra de cobertura cruza)
  e.dag_output = "m"; e.descoberta_output = "c"; e.gap_output = "g"; e.design_output = designOut;
  e.mapa_dependencias_output = "ma"; e.implementacao_output = "im"; e.gate_a_output = "ga"; e.acessibilidade_output = "a11y";
  salvarEstado(e);
  writeFileSync(outputPath(FEATURE, "gate_b"), JSON.stringify(gb), "utf8");
  return main(["advance", FEATURE]);
}

describe("Etapa 9 — Gate B (Verificação ao vivo)", () => {
  after(() => limpar());

  it("declara executor (fiscal), enum, precondicoes (8 etapas) e schema quaternário", () => {
    const d = etapaPorId("gate_b");
    assert.equal(d.executor.nome, "fiscal");
    assert.ok(d.precondicoes.includes("acessibilidade_output"), "precondicao acessibilidade_output");
    assert.deepEqual(d.schemaEstrutural.veredito.enum, ["verificado", "diverge", "inconclusivo", "precisa-humano"]);
  });

  // --- FAIL-CLOSED: só "verificado" avança ---

  it("APROVA (avança) quando veredito='verificado' e todos os critérios conferem", () => {
    assert.equal(prepararEAvaliar(gbVerificado()), 0);
    assert.equal(carregarEstado(FEATURE).etapaAtual, "aprovacao_humana", "avançou");
  });

  it("BLOQUEIA veredito='diverge' (fail-closed: a feature não está pronta, volta à etapa 6)", () => {
    assert.equal(prepararEAvaliar(gbDiverge()), 1, "diverge deve BLOQUEAR o avanço");
    assert.equal(carregarEstado(FEATURE).etapaAtual, "gate_b", "permanece (não avança)");
  });

  it("BLOQUEIA veredito='inconclusivo' (fail-closed: não pôde confirmar ao vivo)", () => {
    assert.equal(prepararEAvaliar(gbInconclusivo()), 1, "inconclusivo deve BLOQUEAR (fail-closed)");
  });

  it("BLOQUEIA veredito='precisa-humano' (fail-closed: exige julgamento humano)", () => {
    const gb = gbVerificado();
    gb.veredito = "precisa-humano";
    gb.criterios[1].situacao = "precisa-humano";
    assert.equal(prepararEAvaliar(gb), 1, "precisa-humano deve BLOQUEAR");
  });

  it("REPROVA veredito fora do enum quaternário", () => {
    const gb = gbVerificado(); gb.veredito = "ok";
    assert.equal(prepararEAvaliar(gb), 1);
  });

  // --- Coerência global↔por-critério (fail-closed) ---

  it("REPROVA veredito global mais OTIMISTA que as situações (verificado com 1 critério que diverge)", () => {
    // Coração do fail-closed: a divergência de qualquer critério rebaixa o todo. "verificado" com um diverge é incoerente.
    const gb = gbVerificado();
    gb.criterios[1].situacao = "diverge";
    gb.criterios[1].evidencia = "ESPERADO x; REAL y. Diverge.";
    // veredito segue "verificado" (mentira otimista) — deve REPROVAR por incoerência
    assert.equal(prepararEAvaliar(gb), 1, "verificado com um diverge é incoerente — REPROVA");
  });

  it("o veredito global DERIVA: diverge tem prioridade sobre inconclusivo (coerente, mas fail-closed BLOQUEIA)", () => {
    // Mistura inconclusivo + diverge. A derivação correta é o pior caso: diverge > inconclusivo.
    // Com veredito="diverge" o output é COERENTE (passa regraVeredictoGlobalCoerente), mas o fail-closed
    // ainda BLOQUEIA o avanço — só "verificado" passa pela regraCampoIgual. Logo advance retorna 1.
    const gb = gbVerificado();
    gb.criterios[0].situacao = "inconclusivo"; gb.criterios[0].motivo = "timeout";
    gb.criterios[0].evidencia = "Tentei list → timeout após 30s.";
    gb.criterios[1].situacao = "diverge";
    gb.criterios[1].evidencia = "ESPERADO x; REAL y.";
    gb.veredito = "diverge"; // derivação correta: diverge > inconclusivo
    assert.equal(prepararEAvaliar(gb), 1, "veredito coerente, mas diverge não avança (fail-closed)");
    assert.equal(carregarEstado(FEATURE).etapaAtual, "gate_b", "permanece em gate_b (fail-closed)");
  });

  it("REPROVA derivação OTIMISTA: veredito='inconclusivo' enquanto um critério DIVERGE (diverge > inconclusivo)", () => {
    // Mesma mistura, mas o agente declara o veredito MENOS grave (inconclusivo) ignorando o diverge.
    // regraVeredictoGlobalCoerente deriva "diverge" e rejeita o "inconclusivo" otimista — REPROVA por forma.
    const gb = gbVerificado();
    gb.criterios[0].situacao = "inconclusivo"; gb.criterios[0].motivo = "timeout";
    gb.criterios[0].evidencia = "Tentei list → timeout após 30s.";
    gb.criterios[1].situacao = "diverge";
    gb.criterios[1].evidencia = "ESPERADO x; REAL y.";
    gb.veredito = "inconclusivo"; // otimista: ignora o diverge
    assert.equal(prepararEAvaliar(gb), 1, "inconclusivo enquanto algo diverge é incoerente — REPROVA");
  });

  // --- Evidência substantiva (a fábrica da etapa 8 com valorNA=null) ---

  it("REPROVA critério com evidência OCA ('ok', 'verificado')", () => {
    for (const oco of ["ok", "verificado", "-", "n/a"]) {
      const gb = gbVerificado(); gb.criterios[0].evidencia = oco;
      assert.equal(prepararEAvaliar(gb), 1, `evidência oca "${oco}" deve REPROVAR`);
    }
  });

  it("REPROVA critério sem evidência (vazia)", () => {
    const gb = gbVerificado(); gb.criterios[0].evidencia = "";
    assert.equal(prepararEAvaliar(gb), 1);
  });

  it("REPROVA nota-lixo contornada por SUFIXO de pontuação/emoji ('ok.', 'feito ✓', '??')", () => {
    // Furo 2 da 2ª revisão cega: a âncora ^...$ deixava 'ok.' escapar (um ponto anula a defesa C1).
    // Normalizar pontuação/sinais de borda ANTES do teste fecha a fuga trivial.
    // Só casos resolvíveis MECANICAMENTE (token oco + pontuação de borda). "sim, confere" tem vírgula no MEIO
    // e estrutura de frase — distingui-lo de prova real exige semântica, fora do alcance do porteiro (limite
    // epistêmico declarado). O Gate A/humano pega o assentimento semântico; aqui barramos só a fuga mecânica.
    for (const oco of ["ok.", "ok!", "feito ✓", "??", "OK!", "-", "verificado.", "n/a!"]) {
      const gb = gbVerificado(); gb.criterios[0].evidencia = oco;
      assert.equal(prepararEAvaliar(gb), 1, `nota-lixo "${oco}" deve REPROVAR`);
    }
  });

  it("REPROVA placeholders de 'ainda não fiz' e abreviações de assentimento ('tbd', 'nd', 'S', '?')", () => {
    // Furo 2: irmãos de 'n/a' não cobertos. São afirmações sem prova — mesma classe que C1 quis matar.
    for (const oco of ["tbd", "TODO", "wip", "pendente", "nd", "N/D", "S", "Y", "?"]) {
      const gb = gbVerificado(); gb.criterios[0].evidencia = oco;
      assert.equal(prepararEAvaliar(gb), 1, `placeholder/assentimento "${oco}" deve REPROVAR`);
    }
  });

  it("REPROVA evidência que é só um NÚMERO em qualquer formato ('12.5', '-1', '200')", () => {
    // Furo 3: a regex só pegava \d+ ('200'/'0'), deixando '12.5'/'-1'/'1e3' passar. Número solto não é prova.
    for (const oco of ["200", "0", "12.5", "-1", "1e3"]) {
      const gb = gbVerificado(); gb.criterios[0].evidencia = oco;
      assert.equal(prepararEAvaliar(gb), 1, `número solto "${oco}" deve REPROVAR`);
    }
  });

  it("REPROVA evidência que é um OBJETO (não-vazio) em vez de prova textual ({x:1})", () => {
    // Furo 1 (crítico): {x:1} virava "[object Object]", não casava NOTA_OCA, e evidenciaVazia só pega {}.
    // Evidência ao vivo é prova textual (request+response+asserção); um objeto qualquer não é substantivo.
    for (const oco of [{ x: 1 }, { z: "" }, [1, 2]]) {
      const gb = gbVerificado(); gb.criterios[0].evidencia = oco;
      assert.equal(prepararEAvaliar(gb), 1, `objeto como evidência (${JSON.stringify(oco)}) deve REPROVAR`);
    }
  });

  it("ACEITA evidência textual legítima curta mas real (não over-blocking)", () => {
    // Guarda contra falso-positivo: prova real curta deve PASSAR. A defesa anti-teatro não pode comer evidência boa.
    for (const real of ["GET /x → 200, 1 item. Confere.", "200 OK; items[0].id='a'. Asserção: carrega.", "verificado: 200, 1 item"]) {
      const gb = gbVerificado(); gb.criterios[0].evidencia = real;
      assert.equal(prepararEAvaliar(gb), 0, `evidência real "${real}" deve PASSAR`);
    }
  });

  // --- Inconclusivo com motivo enumerado ---

  it("REPROVA inconclusivo SEM motivo do enum", () => {
    const gb = gbInconclusivo(); delete gb.criterios[1].motivo;
    assert.equal(prepararEAvaliar(gb), 1, "inconclusivo sem motivo deve REPROVAR");
  });

  it("REPROVA inconclusivo com motivo FORA do enum", () => {
    const gb = gbInconclusivo(); gb.criterios[1].motivo = "preguiça";
    assert.equal(prepararEAvaliar(gb), 1, "motivo fora do enum deve REPROVAR");
  });

  it("ACEITA (como output válido) inconclusivo com motivo do enum — mas BLOQUEIA o avanço (fail-closed)", () => {
    // o output é bem-formado (passa as regras de forma), mas o veredito inconclusivo não avança
    assert.equal(prepararEAvaliar(gbInconclusivo()), 1, "inconclusivo bem-formado ainda bloqueia o avanço");
  });

  // --- Situação fora do enum ---

  it("REPROVA situação de critério fora do enum", () => {
    const gb = gbVerificado(); gb.criterios[0].situacao = "talvez";
    assert.equal(prepararEAvaliar(gb), 1);
  });

  // --- Cobertura dos critérios do design (cruza o estado) ---

  it("REPROVA quando um critério do design (CA-02) NÃO é endereçado na verificação", () => {
    const gb = gbVerificado();
    gb.criterios = [gb.criterios[0]]; // remove CA-02 — mas o design exige CA-01 E CA-02
    assert.equal(prepararEAvaliar(gb), 1, "critério do design não endereçado deve REPROVAR");
  });

  it("REPROVA quando o id que sumiu é SUBSTRING de um id endereçado (CA-1 ⊂ CA-12)", () => {
    // Furo C1 da revisão cega da etapa 9 (mesma classe da etapa 8): com `includes`, "ca-12" CONTÉM "ca-1",
    // então o CA-1 do design (que NÃO foi endereçado) era dado como coberto pelo CA-12. A cobertura deve
    // ancorar no id INTEIRO, não em substring. Design exige CA-1 e CA-12; o Gate B só endereça CA-12 → REPROVA.
    const design = { criterios_aceitacao: [{ id: "CA-1" }, { id: "CA-12" }] };
    const gb = gbVerificado();
    gb.criterios = [
      { criterio: "CA-12: paginação acima de 50", situacao: "confere",
        evidencia: "Request real: list {limit:'51'} → 200, 51 itens. Asserção: a página enche.", motivo: null },
    ];
    assert.equal(prepararEAvaliar(gb, design), 1, "CA-1 não endereçado (só CA-12) deve REPROVAR — substring não conta");
    assert.equal(carregarEstado(FEATURE).etapaAtual, "gate_b", "permanece em gate_b");
  });

  it("SEM ids no design_output, a cobertura NÃO reprova (limite honesto)", () => {
    const gb = gbVerificado();
    // design_output sem criterios_aceitacao indexáveis → não dá para cobrar cobertura
    assert.equal(prepararEAvaliar(gb, "design-sem-ids"), 0, "sem fonte de ids, aprova (cobertura não verificável)");
  });

  // --- Pré-condição (encanamento): precisa das 8 etapas anteriores ---

  it("next BLOQUEIA quando falta acessibilidade_output (mesmo com as outras 7)", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
    const e = carregarEstado(FEATURE);
    e.etapaAtual = "gate_b";
    e.dag_output = "m"; e.descoberta_output = "c"; e.gap_output = "g"; e.design_output = DESIGN_OUT;
    e.mapa_dependencias_output = "ma"; e.implementacao_output = "im"; e.gate_a_output = "ga"; // sem acessibilidade
    salvarEstado(e);
    assert.equal(main(["next", FEATURE]), 1, "sem acessibilidade_output, next bloqueia");
    assert.ok(!existsSync(briefingPath(FEATURE, "gate_b")), "briefing não gerado");
  });

  // --- Sincronia do CORE ---

  it("a cópia local cores/CORE-GATEB.md está em sincronia com a fonte", () => {
    const local = readFileSync(new URL("../cores/CORE-GATEB.md", import.meta.url), "utf8");
    const fonte = readFileSync(join(new URL("../", import.meta.url).pathname.replace(/^\//, ""), "..", "etapa-9-gate-b", "CORE-GATEB.md"), "utf8");
    assert.equal(local, fonte, "cores/CORE-GATEB.md divergiu da fonte etapa-9-gate-b/");
  });
});
