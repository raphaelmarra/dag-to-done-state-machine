// executor.test.mjs — Peças 2 e 3 do plano da etapa 1.
// Peça 2: a capacidade do executor é um DADO consultável na config (não prosa solta no CORE).
// Peça 3: o enum de confiança DERIVA dessa propriedade do executor (não é fixo no .md).
// Princípio M1: trocar de executor = mudar o dado; o briefing reflete sozinho.

import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync } from "node:fs";
import { main, briefingPath, featureDir, contextoDeSubstituicao } from "../dag.mjs";
import { etapaPorId } from "../pipeline.config.mjs";

const FEATURE = "executor-test";
function limpar() { rmSync(featureDir(FEATURE), { recursive: true, force: true }); }

describe("Peças 2 e 3 — executor como dado + enum derivado", () => {
  after(() => limpar());

  it("a etapa dag declara um executor estruturado (peça 2)", () => {
    const dag = etapaPorId("dag");
    assert.ok(dag.executor, "etapa deve ter um objeto 'executor'");
    assert.ok(dag.executor.nome, "executor tem nome");
    assert.ok(Array.isArray(dag.executor.confianca_enum), "executor tem confianca_enum (lista)");
    assert.ok(dag.executor.confianca_enum.length >= 2, "enum tem ao menos 2 valores");
    // O Explore não toca a rede → não pode ter 'confirmado ao vivo' no enum.
    assert.ok(
      !dag.executor.confianca_enum.some((v) => /ao vivo|verificado|executado/i.test(v)),
      "Explore (não toca rede) não pode ter valor de confiança de runtime"
    );
  });

  it("o enum de confiança no briefing DERIVA do executor (peça 3) — não é texto fixo", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "CRM", "--root", "/proj"]), 0);
    assert.equal(main(["next", FEATURE]), 0);
    const briefing = readFileSync(briefingPath(FEATURE, "dag"), "utf8");
    const dag = etapaPorId("dag");
    // Cada valor do enum declarado na config deve aparecer no briefing (injetado via placeholder).
    for (const valor of dag.executor.confianca_enum) {
      assert.ok(briefing.includes(valor), `o enum '${valor}' deve aparecer no briefing`);
    }
  });

  it("o enum NÃO está mais hardcoded na Seção 4 do CORE — fonte única (auditoria)", () => {
    const dag = etapaPorId("dag");
    const core = readFileSync(new URL("../cores/CORE-DAG.md", import.meta.url), "utf8");
    // A Seção 4 deve usar os placeholders, não os valores literais do enum em linha de schema.
    assert.match(core, /\{confianca_enum\}/, "Seção 4 (Nós) deve usar o placeholder do enum");
    assert.match(core, /\{confianca_enum_arestas\}/, "Seção 4 (Arestas) deve usar o placeholder do subconjunto");
  });

  it("etapa SEM executor não injeta placeholders de executor (não regride — code-reviewer)", () => {
    const ctx = contextoDeSubstituicao({ feature: "f" }, etapaPorId("gap")); // gap não tem executor
    assert.ok(!("executor_nome" in ctx), "sem executor → sem executor_nome");
    assert.ok(!("confianca_enum" in ctx), "sem executor → sem confianca_enum");
  });

  it("enum vazio na config NÃO degrada para string vazia (code-reviewer)", () => {
    const fake = { executor: { nome: "X", capacidade: "y", confianca_enum: [] } };
    const ctx = contextoDeSubstituicao({ feature: "f" }, fake);
    assert.ok(!("confianca_enum" in ctx), "enum vazio → chave ausente (placeholder fica cru, lacuna visível)");
  });

  it("o briefing injeta nome e capacidade do executor (code-reviewer)", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "CRM", "--root", "/proj"]), 0);
    assert.equal(main(["next", FEATURE]), 0);
    const briefing = readFileSync(briefingPath(FEATURE, "dag"), "utf8");
    const dag = etapaPorId("dag");
    assert.ok(briefing.includes(dag.executor.nome), "nome do executor no briefing");
    assert.ok(briefing.includes(dag.executor.capacidade), "capacidade do executor no briefing");
  });
});
