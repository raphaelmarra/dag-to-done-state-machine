// schema-estrutural.test.mjs — Peças 4+5 do plano (corrige F3: schema dado único + validação estrutural).
// O critério de aceitação da etapa dag deve validar a ESTRUTURA do output (ex.: nos é array de
// objetos com os campos certos), não só a presença das chaves de topo. O schema é um DADO único
// (objeto), não prosa markdown parseada nem lista chapada.

import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, rmSync } from "node:fs";
import { main, outputPath, featureDir, carregarEstado } from "../dag.mjs";
import { etapaPorId } from "../pipeline.config.mjs";

const FEATURE = "schema-test";
function limpar() { rmSync(featureDir(FEATURE), { recursive: true, force: true }); }
function escrever(obj) { writeFileSync(outputPath(FEATURE, "dag"), JSON.stringify(obj), "utf8"); }

// Um output ESTRUTURALMENTE VÁLIDO da etapa dag (forma rica, como o CORE v4.0 pede).
function outputValido() {
  return {
    nos: [{ nome: "X", tipo: "função-API", path: "a.ts", confianca: "lido no código" }],
    arestas: [{ consumidor: "X", provedor: "Y", tipo: "consome", confianca: "lido no código" }],
    blast_radius: [{ no: "Y", consumido_por: ["X"], amplitude: "MÉDIA" }],
    fronteira: { nos_folha: ["Y"], saidas_1hop: ["Z"] },
    gaps: [{ id: "G1", prioridade: "P0", acao: "x" }],
    confianca: { lido: 1, inferido: 0, nao_encontrado: 0 },
  };
}

describe("Peças 4+5 — schema como dado único + validação estrutural", () => {
  after(() => limpar());

  it("a etapa dag declara um schema ESTRUTURAL (objeto), não só lista de campos", () => {
    const dag = etapaPorId("dag");
    assert.ok(dag.schemaEstrutural, "etapa deve ter schemaEstrutural (dado único)");
    assert.equal(typeof dag.schemaEstrutural, "object");
    // descreve nos como array de objetos
    assert.ok(dag.schemaEstrutural.nos, "schema descreve 'nos'");
  });

  it("APROVA um output estruturalmente válido", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "CRM", "--root", "/p"]), 0);
    escrever(outputValido());
    assert.equal(main(["advance", FEATURE]), 0, "output válido deve passar");
    assert.equal(carregarEstado(FEATURE).etapaAtual, "descoberta", "avançou");
  });

  it("REPROVA nos = array de strings (estrutura errada, não objetos) — o que o validador antigo deixava passar", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "CRM", "--root", "/p"]), 0);
    const ruim = outputValido();
    ruim.nos = ["só uma string", "outra"]; // estrutura inválida: deveria ser objetos
    escrever(ruim);
    assert.equal(main(["advance", FEATURE]), 1, "nos como strings deve REPROVAR");
    assert.equal(carregarEstado(FEATURE).etapaAtual, "dag", "não avançou (bloqueado)");
  });

  it("REPROVA nó sem o campo obrigatório 'confianca'", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "CRM", "--root", "/p"]), 0);
    const ruim = outputValido();
    ruim.nos = [{ nome: "X", tipo: "f", path: "a.ts" }]; // falta confianca
    escrever(ruim);
    assert.equal(main(["advance", FEATURE]), 1, "nó sem confianca deve REPROVAR");
  });

  it("REPROVA confianca com valor fora do enum do executor", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "CRM", "--root", "/p"]), 0);
    const ruim = outputValido();
    ruim.nos = [{ nome: "X", tipo: "f", path: "a.ts", confianca: "confirmado ao vivo" }]; // valor proibido p/ Explore
    escrever(ruim);
    assert.equal(main(["advance", FEATURE]), 1, "confianca fora do enum deve REPROVAR");
  });

  it("ainda REPROVA campo de topo ausente (não regride a checagem de presença)", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "CRM", "--root", "/p"]), 0);
    const ruim = outputValido();
    delete ruim.gaps;
    escrever(ruim);
    assert.equal(main(["advance", FEATURE]), 1, "campo de topo ausente ainda reprova");
  });
});
