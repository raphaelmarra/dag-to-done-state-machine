// peças-dinamicas.test.mjs — Peça 8 do plano: confirmar que profundidade (A4), gaps direcionais (C1)
// e handoff já estão no briefing e são dinâmicos. Não implementa nada — TRAVA o comportamento para
// que não regrida. Profundidade/gaps são instruções no CORE (executadas pelo agente); handoff é o
// caminho de output por convenção (já exercido pelo e2e).

import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync } from "node:fs";
import { main, briefingPath, outputPath, featureDir } from "../dag.mjs";

const FEATURE = "dinamicas-test";
function limpar() { rmSync(featureDir(FEATURE), { recursive: true, force: true }); }

describe("Peça 8 — confirmar profundidade, gaps e handoff", () => {
  after(() => limpar());

  it("o briefing carrega a regra de profundidade dinâmica (A4: 1 hop + gatilhos de expansão)", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "CRM", "--root", "/proj"]), 0);
    assert.equal(main(["next", FEATURE]), 0);
    const b = readFileSync(briefingPath(FEATURE, "dag"), "utf8");
    assert.match(b, /1 hop/i, "deve instruir a fronteira de 1 hop");
    assert.match(b, /hub|pass-through|contrato/i, "deve trazer os gatilhos de expansão dinâmica");
    assert.match(b, /a verificar/i, "deve mandar reportar transitivos como 'a verificar', não omitir");
  });

  it("o briefing carrega o teste de gap direcional (C1)", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "CRM", "--root", "/proj"]), 0);
    assert.equal(main(["next", FEATURE]), 0);
    const b = readFileSync(briefingPath(FEATURE, "dag"), "utf8");
    assert.match(b, /próxima etapa/i, "C1 é direcional (aponta para a próxima etapa)");
    assert.match(b, /dívida técnica|duplica|UX|performance/i, "deve listar o que NÃO é gap");
  });

  it("handoff: o caminho de output segue a convenção <etapa>.output.json", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "CRM", "--root", "/proj"]), 0);
    const oPath = outputPath(FEATURE, "dag");
    assert.match(oPath, /dag\.output\.json$/, "output por convenção de nome (handoff para a próxima etapa)");
  });
});
