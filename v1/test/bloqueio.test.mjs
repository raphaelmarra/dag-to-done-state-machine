// bloqueio.test.mjs — Peça 6 do plano: bloqueio/early-exit de pré-condição no MOTOR.
// O CORE descreve "se entry_point ou project_root faltam, emita bloqueio antes do briefing". Hoje só
// o LLM detectaria; a peça 6 faz o MOTOR recusar `next` quando uma pré-condição da etapa falta.
// Dinâmico (M1): a etapa DECLARA suas pré-condições (precondicoes: [...]), o motor as verifica.

import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { main, briefingPath, featureDir } from "../dag.mjs";
import { etapaPorId } from "../pipeline.config.mjs";

const FEATURE = "bloqueio-test";
function limpar() { rmSync(featureDir(FEATURE), { recursive: true, force: true }); }

describe("Peça 6 — bloqueio de pré-condição no motor", () => {
  after(() => limpar());

  it("a etapa dag declara pré-condições (dado, não prosa)", () => {
    const dag = etapaPorId("dag");
    assert.ok(Array.isArray(dag.precondicoes), "etapa deve declarar precondicoes");
    assert.ok(dag.precondicoes.includes("entry_point"), "entry_point é pré-condição do DAG");
    assert.ok(dag.precondicoes.includes("project_root"), "project_root é pré-condição do DAG");
  });

  it("next BLOQUEIA (sem gerar briefing) quando falta project_root", () => {
    limpar();
    // init sem --root: project_root fica vazio
    assert.equal(main(["init", FEATURE, "--entry", "CRM"]), 0, "init ok");
    const rc = main(["next", FEATURE]);
    assert.equal(rc, 1, "next deve retornar erro (bloqueado) sem project_root");
    assert.ok(!existsSync(briefingPath(FEATURE, "dag")), "briefing NÃO deve ser gerado no bloqueio");
  });

  it("next PROSSEGUE quando todas as pré-condições estão presentes", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "CRM", "--root", "/proj"]), 0);
    assert.equal(main(["next", FEATURE]), 0, "next ok com pré-condições");
    assert.ok(existsSync(briefingPath(FEATURE, "dag")), "briefing gerado");
  });

  it("uma etapa SEM precondicoes nunca bloqueia (não regride as etapas placeholder)", () => {
    // 'implementacao (etapa 6) ainda é placeholder. (dag/descoberta/gap/design destiladas.)
    const g = etapaPorId("implementacao");
    assert.ok(!g.precondicoes, "implementacao não declara precondicoes");
    // o e2e percorre as 13 etapas com init mínimo e passa — confirma que ausência de precondicoes não bloqueia.
  });
});
