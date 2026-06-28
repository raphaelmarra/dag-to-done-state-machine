// gap.test.mjs — testes próprios da etapa 3 (GAP). Cobre: as regras estruturais (todo gap exige
// evidência; complexidade coerente com drivers), o schema, as pré-condições (dag+descoberta), e o
// regrasExtras genérico (A012). Espelha gap.test/discovery.test das etapas anteriores.

import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { main, outputPath, briefingPath, featureDir, carregarEstado, salvarEstado } from "../dag.mjs";
import { etapaPorId, avaliarEtapa } from "../pipeline.config.mjs";

const FEATURE = "gap-test";
function limpar() { rmSync(featureDir(FEATURE), { recursive: true, force: true }); }

function analiseValida() {
  return {
    gaps: [{ id: "G1", descricao: "args objeto→array", prioridade: "P0", categoria: "quebra",
             evidencia: "Descoberta commands/run + x.tsx:31", confianca: "confirmado na descoberta" }],
    pronto_para_reuso: [{ item: "ravi()", por_que_serve: "transporte confirmado" }],
    no_gos: [{ o_que: "executar agente", motivo: "run só renderiza", destino: "de-proposito" }],
    incertezas: [{ incerteza: "fonte de args", spike: "rastrear cadeia" }],
    complexidade: { banda: "média", drivers: { p0: 1, p1: 0, integracoes: 1, incertezas: 1, exige_infra_nova: "não" }, justificativa: "1 P0 sobre base existente" },
    resumo: { total_gaps: 1, p0: 1 },
  };
}

function prepararEAvaliar(analise) {
  limpar();
  assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
  const e = carregarEstado(FEATURE);
  e.etapaAtual = "gap";
  e.dag_output = "mapa"; e.descoberta_output = "contrato";
  salvarEstado(e);
  writeFileSync(outputPath(FEATURE, "gap"), JSON.stringify(analise), "utf8");
  return main(["advance", FEATURE]);
}

describe("Etapa 3 — GAP", () => {
  after(() => limpar());

  it("declara executor (error-detective), enum próprio, precondicoes (dag+descoberta) e schema", () => {
    const g = etapaPorId("gap");
    assert.equal(g.executor.nome, "error-detective");
    assert.ok(g.executor.confianca_enum.includes("confirmado na descoberta"));
    assert.ok(g.precondicoes.includes("dag_output") && g.precondicoes.includes("descoberta_output"));
    assert.ok(g.schemaEstrutural.gaps && g.schemaEstrutural.complexidade);
  });

  it("APROVA uma análise válida", () => {
    assert.equal(prepararEAvaliar(analiseValida()), 0);
    assert.equal(carregarEstado(FEATURE).etapaAtual, "design", "avançou para design");
  });

  // --- A regra-mestra: todo gap exige EVIDÊNCIA (E1) ---

  it("REPROVA gap SEM evidencia (sem prova = suposição, não gap)", () => {
    const a = analiseValida();
    delete a.gaps[0].evidencia;
    assert.equal(prepararEAvaliar(a), 1, "gap sem evidência deve REPROVAR");
  });

  it("REPROVA gap com evidencia VAZIA ('  ', {}, [])", () => {
    for (const vazia of ["   ", {}, []]) {
      const a = analiseValida();
      a.gaps[0].evidencia = vazia;
      assert.equal(prepararEAvaliar(a), 1, `evidência vazia ${JSON.stringify(vazia)} deve REPROVAR`);
    }
  });

  it("ACEITA zero gaps (gaps: []) — tudo pronto é resultado válido (C1 é filtro)", () => {
    const a = analiseValida();
    a.gaps = [];
    a.resumo = { total_gaps: 0, p0: 0 };
    assert.equal(prepararEAvaliar(a), 0, "zero gaps deve PASSAR");
  });

  // --- Categorização estrutural ---

  it("REPROVA gap com categoria fora do enum (quebra|alinhamento|indefinicao)", () => {
    const a = analiseValida();
    a.gaps[0].categoria = "bug";
    assert.equal(prepararEAvaliar(a), 1);
  });

  it("REPROVA no_go sem os 3 campos (o_que/motivo/destino) ou destino inválido", () => {
    const a = analiseValida();
    delete a.no_gos[0].motivo;
    assert.equal(prepararEAvaliar(a), 1, "no_go sem motivo deve REPROVAR");
    const b = analiseValida();
    b.no_gos[0].destino = "porque sim";
    assert.equal(prepararEAvaliar(b), 1, "destino fora do enum deve REPROVAR");
  });

  it("REPROVA incerteza sem spike (incerteza solta não é permitida)", () => {
    const a = analiseValida();
    delete a.incertezas[0].spike;
    assert.equal(prepararEAvaliar(a), 1);
  });

  // --- Complexidade COMPUTADA, não opinada (X2) ---

  it("REPROVA complexidade 'simples' com P0 > 0 (drivers contradizem a banda)", () => {
    const a = analiseValida();
    a.complexidade.banda = "simples"; // mas drivers.p0 = 1
    assert.equal(prepararEAvaliar(a), 1, "simples com P0>0 é incoerente");
  });

  it("REPROVA complexidade 'alta' sem nenhum driver de peso", () => {
    const a = analiseValida();
    a.complexidade.banda = "alta";
    a.complexidade.drivers = { p0: 0, p1: 0, integracoes: 0, incertezas: 0, exige_infra_nova: "não" };
    assert.equal(prepararEAvaliar(a), 1, "alta sem drivers é incoerente");
  });

  // --- Pré-condição (encanamento de entrada — precisa das DUAS etapas anteriores) ---

  it("next BLOQUEIA quando falta descoberta_output (mesmo com dag_output)", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
    const e = carregarEstado(FEATURE);
    e.etapaAtual = "gap";
    e.dag_output = "mapa"; // mas sem descoberta_output
    salvarEstado(e);
    assert.equal(main(["next", FEATURE]), 1, "sem descoberta_output, next bloqueia");
    assert.ok(!existsSync(briefingPath(FEATURE, "gap")), "briefing não gerado");
  });

  // --- A012: o avaliador genérico compõe schema + estrutura + regrasExtras ---

  it("avaliarEtapa compõe presença + estrutura + regrasExtras (porteiro genérico)", () => {
    const g = etapaPorId("gap");
    assert.equal(avaliarEtapa(g, analiseValida()).ok, true, "análise válida passa");
    const ruim = analiseValida(); delete ruim.gaps[0].evidencia;
    assert.equal(avaliarEtapa(g, ruim).ok, false, "regra extra (evidência) reprova");
  });

  // --- Correções da revisão cega: resumo, ângulos (E3), banda média ---

  it("REPROVA resumo que MENTE sobre a lista (total_gaps ≠ nº real)", () => {
    const a = analiseValida();
    a.resumo = { total_gaps: 99, p0: 1 }; // mente: há só 1 gap
    assert.equal(prepararEAvaliar(a), 1, "resumo mentiroso deve REPROVAR");
  });

  it("REPROVA gap descrito como 'impossível' SEM angulos_tentados (E3)", () => {
    const a = analiseValida();
    a.gaps[0].descricao = "isto é impossível de fazer com a API atual";
    // sem angulos_tentados
    assert.equal(prepararEAvaliar(a), 1, "impossível sem ângulos deve REPROVAR");
  });

  it("ACEITA gap 'impossível' COM angulos_tentados", () => {
    const a = analiseValida();
    a.gaps[0].descricao = "impossível pela rota X";
    a.gaps[0].angulos_tentados = "tentei rota Y (404) e rota Z (sem permissão)";
    assert.equal(prepararEAvaliar(a), 0, "impossível com ângulos deve PASSAR");
  });

  it("REPROVA banda 'média' com perfil de alta (3 P0) — o meio não é mais cego", () => {
    const a = analiseValida();
    a.complexidade.banda = "média";
    a.complexidade.drivers = { p0: 3, p1: 0, integracoes: 0, incertezas: 0, exige_infra_nova: "não" };
    a.gaps = [
      { id: "G1", descricao: "a", prioridade: "P0", categoria: "quebra", evidencia: "e", confianca: "inferido do código" },
      { id: "G2", descricao: "b", prioridade: "P0", categoria: "quebra", evidencia: "e", confianca: "inferido do código" },
      { id: "G3", descricao: "c", prioridade: "P0", categoria: "quebra", evidencia: "e", confianca: "inferido do código" },
    ];
    a.resumo = { total_gaps: 3, p0: 3 };
    assert.equal(prepararEAvaliar(a), 1, "média com 3 P0 é perfil de alta — REPROVA");
  });

  it("REPROVA banda 'média' com zero drivers (deveria ser simples)", () => {
    const a = analiseValida();
    a.gaps = [];
    a.complexidade.banda = "média";
    a.complexidade.drivers = { p0: 0, p1: 0, integracoes: 0, incertezas: 0, exige_infra_nova: "não" };
    a.resumo = { total_gaps: 0, p0: 0 };
    assert.equal(prepararEAvaliar(a), 1, "média com tudo zero é incoerente");
  });

  // --- Migração dos gates para regrasExtras (A012 — comCondicao deletado) ---

  it("os gates usam regrasExtras (não mais comCondicao)", () => {
    for (const id of ["gate_a", "gate_b", "done", "smoke"]) {
      const g = etapaPorId(id);
      assert.ok(Array.isArray(g.regrasExtras), `${id} deve usar regrasExtras`);
      assert.ok(!g.aceita, `${id} não deve ter aceita custom`);
    }
  });

  // --- Sincronia do CORE ---

  it("a cópia local cores/CORE-GAP.md está em sincronia com a fonte", () => {
    const local = readFileSync(new URL("../cores/CORE-GAP.md", import.meta.url), "utf8");
    const fonte = readFileSync(join(new URL("../", import.meta.url).pathname.replace(/^\//, ""), "..", "etapa-3-gap", "CORE-GAP.md"), "utf8");
    assert.equal(local, fonte, "cores/CORE-GAP.md divergiu da fonte etapa-3-gap/");
  });
});
