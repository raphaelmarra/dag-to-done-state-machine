// estado-curado.test.mjs — Peça 7 do plano: estado curado POR ETAPA (não fixo no motor).
// Hoje montarBriefing injeta os mesmos campos para as 13 etapas. A peça torna isso dinâmico: a etapa
// declara `estadoCurado: [...]` (quais campos do estado entram no briefing dela). Default = os
// essenciais (não regride as etapas que não declaram). Risco: muda o motor → cobrir as 13 com e2e.

import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync } from "node:fs";
import { main, briefingPath, featureDir } from "../dag.mjs";
import { etapaPorId } from "../pipeline.config.mjs";

const FEATURE = "curado-test";
function limpar() { rmSync(featureDir(FEATURE), { recursive: true, force: true }); }

describe("Peça 7 — estado curado por etapa", () => {
  after(() => limpar());

  it("a etapa dag declara seu estado curado (dado consultável)", () => {
    const dag = etapaPorId("dag");
    assert.ok(Array.isArray(dag.estadoCurado), "etapa deve declarar estadoCurado");
    assert.ok(dag.estadoCurado.includes("entry_point"), "DAG cura entry_point");
  });

  it("o briefing injeta exatamente os campos declarados no estadoCurado da etapa", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "CRM", "--desc", "desc-X", "--root", "/proj"]), 0);
    assert.equal(main(["next", FEATURE]), 0);
    const briefing = readFileSync(briefingPath(FEATURE, "dag"), "utf8");
    const dag = etapaPorId("dag");
    // cada campo declarado aparece rotulado na seção de estado curado
    for (const campo of dag.estadoCurado) {
      assert.match(briefing, new RegExp(`- ${campo}:`), `estado curado deve listar '${campo}'`);
    }
  });

  it("uma etapa SEM estadoCurado declarado usa o default (não regride)", () => {
    // 'design' (etapa 4) ainda é placeholder → o motor usa o conjunto default. (dag/descoberta/gap destiladas.)
    const g = etapaPorId("design");
    assert.ok(!g.estadoCurado, "design não declara estadoCurado (usa default)");
    // o e2e (13 etapas) já cobre que o pipeline inteiro continua passando com o default.
  });

  it("estadoCurado DIVERGENTE do default: injeta só os campos declarados (o recurso da peça 7)", async () => {
    // Testa o caminho que importa: uma etapa que cura DIFERENTE do default. Como só 'dag' declara
    // estadoCurado (=default), exercitamos montarBriefing diretamente com uma etapa-fixture.
    const { montarBriefing } = await import("../dag.mjs");
    const estado = { feature: "f", entry_point: "CRM", description: "D", project_root: "/p", next_stage: "X", concluidas: [] };
    const etapaFix = { nome: "Fix", agente: "Z", schema: ["a"], estadoCurado: ["entry_point"] };
    const b = montarBriefing(estado, etapaFix);
    assert.match(b, /- entry_point: CRM/, "campo declarado aparece");
    assert.doesNotMatch(b, /- description:/, "campo NÃO declarado não aparece");
    assert.doesNotMatch(b, /- project_root:/, "campo NÃO declarado não aparece");
  });
});
