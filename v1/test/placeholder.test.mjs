// placeholder.test.mjs — Peça 1 do plano da etapa 1 (corrige bug F1 da revisão cega).
// O CORE usa {next_stage} como variável de template; o motor deve SUBSTITUÍ-LA pelo valor da
// instância, não entregar o placeholder literal ao executor. E next_stage deve existir no estado,
// derivado dinamicamente da próxima etapa do pipeline (M1 — não hardcoded).

import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { main, briefingPath, featureDir, carregarEstado, outputPath } from "../dag.mjs";

const FEATURE = "placeholder-test";
function limpar() { rmSync(featureDir(FEATURE), { recursive: true, force: true }); }

describe("Peça 1 — substituição de placeholders no briefing (F1)", () => {
  after(() => limpar());

  it("cmdInit popula next_stage derivado da próxima etapa (dinâmico, não hardcoded)", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "CRM", "--root", "/proj"]), 0);
    const estado = carregarEstado(FEATURE);
    // A primeira etapa é 'dag'; a próxima no pipeline é 'descoberta'. next_stage deve refletir isso.
    assert.ok(estado.next_stage, "estado deve ter next_stage");
    assert.match(estado.next_stage, /descoberta|Descoberta/, "next_stage = a próxima etapa real do pipeline");
  });

  it("o briefing substitui {next_stage} na linha de FRONTEIRA específica (não só a palavra solta)", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "CRM", "--root", "/proj"]), 0);
    assert.equal(main(["next", FEATURE]), 0);
    const briefing = readFileSync(briefingPath(FEATURE, "dag"), "utf8");

    // Em bloco fenced (template), {next_stage} dentro da prosa DEVE ser substituído.
    assert.doesNotMatch(briefing, /quem verifica endpoints ao vivo é \{next_stage\}/, "FRONTEIRA não pode ter o placeholder cru");
    assert.match(briefing, /quem verifica endpoints ao vivo é Descoberta/i, "FRONTEIRA deve ter o valor substituído");
  });

  it("menção-literal entre `crases` ao placeholder NÃO é substituída (inline code protegido)", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "CRM", "--root", "/proj"]), 0);
    assert.equal(main(["next", FEATURE]), 0);
    const briefing = readFileSync(briefingPath(FEATURE, "dag"), "utf8");
    // O CORE tem `> O gerador substitui `{next_stage}` pelo valor...` — essa crase deve preservar o token.
    assert.match(briefing, /`\{next_stage\}`/, "a menção literal entre crases deve ficar intacta");
  });

  it("placeholders sem valor no estado não viram 'undefined' no briefing", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "CRM", "--root", "/proj"]), 0);
    assert.equal(main(["next", FEATURE]), 0);
    const briefing = readFileSync(briefingPath(FEATURE, "dag"), "utf8");
    assert.doesNotMatch(briefing, /undefined/, "nenhum campo deve virar a string 'undefined'");
  });

  it("cmdAdvance recalcula next_stage para o consumidor da nova etapa atual", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "CRM", "--root", "/proj"]), 0);
    // Estado inicial: etapa dag, next_stage = descoberta. Após avançar (com output válido), a nova
    // etapa atual é 'descoberta' e next_stage deve apontar para a etapa seguinte a ela ('gap').
    const out = {
      nos: [{ nome: "X", tipo: "f", path: "a.ts", shape: "s", confianca: "lido no código" }],
      arestas: [{ consumidor: "X", provedor: "Y", tipo: "consome", custo_reverso: "n/a", confianca: "lido no código" }],
      blast_radius: [{ no: "Y", consumido_por: ["X"], amplitude: "MÉDIA" }],
      fronteira: { nos_folha: ["Y"], saidas_1hop: ["Z"] },
      gaps: [{ id: "G1", prioridade: "P0", acao: "a" }],
      confianca: { lido: 1, inferido: 0, nao_encontrado: 0 },
    };
    writeFileSync(outputPath(FEATURE, "dag"), JSON.stringify(out), "utf8");
    assert.equal(main(["advance", FEATURE]), 0, "advance da dag deve aprovar");
    const estado = carregarEstado(FEATURE);
    assert.equal(estado.etapaAtual, "descoberta", "avançou para descoberta");
    assert.match(estado.next_stage, /gap|GAP/, "next_stage agora aponta para a etapa após descoberta");
  });
});
