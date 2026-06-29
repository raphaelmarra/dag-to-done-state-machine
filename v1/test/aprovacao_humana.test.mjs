// aprovacao_humana.test.mjs — testes próprios da etapa 10 (Aprovação humana — HITL). Foco da PEÇA 1:
// schema mínimo (aprovado_por + decisao) + porteiro FAIL-CLOSED binário (só "aprovado" avança; "rejeitado"
// é output válido mas BLOQUEIA → volta à etapa 6). A etapa 10 é de gênero NÃO-CORE: o executor é o humano.
// A garantia é PROCESSUAL (o agente espera a fala humana), não criptográfica — o porteiro valida forma/coerência.

import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, rmSync } from "node:fs";
import { main, outputPath, featureDir, carregarEstado, salvarEstado } from "../dag.mjs";
import { etapaPorId } from "../pipeline.config.mjs";

const FEATURE = "aprovacao-test";
function limpar() { rmSync(featureDir(FEATURE), { recursive: true, force: true }); }

// Output de aprovação válido: o humano aprovou explicitamente.
function aprovado() {
  return { aprovado_por: "Raphael (Diretor)", decisao: "aprovado", observacao: "usei a tela, fluxo ok" };
}

// Coloca a feature na etapa 10 com as 9 etapas anteriores promovidas no estado, escreve o output e avança.
function prepararEAvaliar(out) {
  limpar();
  assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
  const e = carregarEstado(FEATURE);
  e.etapaAtual = "aprovacao_humana";
  // as 9 pré-condições promovidas (o motor exigiria; aqui injetamos para isolar a peça 1)
  e.dag_output = "m"; e.descoberta_output = "c"; e.gap_output = "g"; e.design_output = "d";
  e.mapa_dependencias_output = "ma"; e.implementacao_output = "im"; e.gate_a_output = "ga";
  e.acessibilidade_output = "a11y"; e.gate_b_output = "gb";
  salvarEstado(e);
  writeFileSync(outputPath(FEATURE, "aprovacao_humana"), JSON.stringify(out), "utf8");
  return main(["advance", FEATURE]);
}

describe("Etapa 10 — Aprovação humana (HITL) — peça 1: schema + fail-closed", () => {
  after(() => limpar());

  it("declara executor humano, schema mínimo (aprovado_por, decisao) e enum binário da decisão", () => {
    const d = etapaPorId("aprovacao_humana");
    assert.equal(d.agente, "humano");
    assert.ok(d.schemaEstrutural?.aprovado_por, "schemaEstrutural.aprovado_por");
    assert.deepEqual(d.schemaEstrutural.decisao.enum, ["aprovado", "rejeitado"]);
  });

  it("APROVA (avança para done) quando decisao='aprovado' e aprovado_por preenchido", () => {
    assert.equal(prepararEAvaliar(aprovado()), 0);
    assert.equal(carregarEstado(FEATURE).etapaAtual, "done", "avançou para done");
  });

  it("BLOQUEIA decisao='rejeitado' (fail-closed: volta à etapa 6, não avança)", () => {
    const o = aprovado(); o.decisao = "rejeitado"; o.observacao = "o filtro não funciona, refazer";
    assert.equal(prepararEAvaliar(o), 1, "rejeitado deve BLOQUEAR o avanço");
    assert.equal(carregarEstado(FEATURE).etapaAtual, "aprovacao_humana", "permanece (não avança)");
  });

  it("REPROVA decisao fora do enum binário", () => {
    const o = aprovado(); o.decisao = "talvez";
    assert.equal(prepararEAvaliar(o), 1);
  });

  it("REPROVA aprovado_por ausente ou vazio", () => {
    for (const v of ["", "   "]) {
      const o = aprovado(); o.aprovado_por = v;
      assert.equal(prepararEAvaliar(o), 1, `aprovado_por "${v}" deve REPROVAR`);
    }
  });

  it("REPROVA aprovado_por que é um OBJETO (deve ser texto — nome do humano)", () => {
    const o = aprovado(); o.aprovado_por = { nome: "x" };
    assert.equal(prepararEAvaliar(o), 1, "aprovado_por objeto deve REPROVAR");
  });
});
