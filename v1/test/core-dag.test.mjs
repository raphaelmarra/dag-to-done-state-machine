// core-dag.test.mjs — prova que o CORE-DAG v4.0 está plugado e íntegro no v1.
// (1) o briefing gerado pela etapa dag carrega o CORE rico (não o fallback curto);
// (2) a cópia local cores/CORE-DAG.md está em sincronia com a fonte oficial docs/CORE-DAG.md.

import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { main, briefingPath, featureDir } from "../dag.mjs";
import { etapaPorId } from "../pipeline.config.mjs";

const RAIZ = dirname(fileURLToPath(import.meta.url)); // v1/test
const V1 = join(RAIZ, "..");                          // v1
const FEATURE = "core-dag-test";

function limpar() {
  rmSync(featureDir(FEATURE), { recursive: true, force: true });
}

describe("CORE-DAG v4.0 plugado no v1", () => {
  after(() => limpar());

  it("a etapa dag aponta para o CORE rico via corePath (não usa fallback inline)", () => {
    const dag = etapaPorId("dag");
    assert.equal(dag.corePath, "cores/CORE-DAG.md", "etapa dag deve ter corePath");
    // schema reflete o v4.0. 'gaps' saiu do array de presença de topo (zero gaps é válido) mas é
    // exigido via schemaEstrutural com `presente: true`.
    for (const campo of ["nos", "arestas", "blast_radius", "fronteira", "confianca"]) {
      assert.ok(dag.schema.includes(campo), `schema deve exigir '${campo}'`);
    }
    assert.ok(dag.schemaEstrutural.gaps?.presente, "gaps exigido via schemaEstrutural (presente, pode ser vazio)");
  });

  it("o briefing gerado contém o conteúdo do CORE-DAG v4.0 (não o fallback curto)", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "CRM", "--root", "/proj"]), 0, "init ok");
    assert.equal(main(["next", FEATURE]), 0, "next ok");

    const briefing = readFileSync(briefingPath(FEATURE, "dag"), "utf8");
    // Marcadores que SÓ existem no CORE v4.0 rico — provam que o arquivo foi carregado.
    assert.match(briefing, /Versão: 4\.0/, "briefing deve conter a versão 4.0 do CORE");
    assert.match(briefing, /dependências de consumo/, "deve conter a regra-mestra do v4.0");
    assert.match(briefing, /aciclicidade.*verific|verific.*caminho de volta/is, "deve conter A2 verificável");
    assert.match(briefing, /profundidade din[âa]mica|expans[ãa]o din[âa]mica|hub/i, "deve conter A4 profundidade dinâmica");
    // o fallback curto NÃO deve ser a única coisa presente
    assert.ok(briefing.length > 5000, "briefing rico deve ser substancial (>5KB), não o fallback curto");
  });

  it("a cópia local cores/CORE-DAG.md está em sincronia com a fonte docs/CORE-DAG.md", () => {
    const local = readFileSync(join(V1, "cores", "CORE-DAG.md"), "utf8");
    const fonte = readFileSync(join(V1, "..", "docs", "CORE-DAG.md"), "utf8");
    assert.equal(
      local,
      fonte,
      "cores/CORE-DAG.md divergiu de docs/CORE-DAG.md — recopie a fonte oficial para o v1"
    );
  });
});
