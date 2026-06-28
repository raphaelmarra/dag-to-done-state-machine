// discovery.test.mjs — testes próprios da etapa 2 (Descoberta da API). Espelha schema-estrutural.test
// e core-dag.test da etapa 1. Cobre: a regra estrutural de evidência (o coração da etapa), o schema
// rico, a pré-condição dag_output, a promoção do output, e a sincronia do CORE. Exigidos pela revisão cega.

import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { main, outputPath, briefingPath, featureDir, carregarEstado, salvarEstado } from "../dag.mjs";
import { etapaPorId } from "../pipeline.config.mjs";

const FEATURE = "discovery-test";
function limpar() { rmSync(featureDir(FEATURE), { recursive: true, force: true }); }

// Output estruturalmente válido da etapa descoberta (forma rica).
function fichaValida() {
  return {
    endpoints_confirmados: [{
      endpoint: "POST /api/x/list",
      params: [{ nome: "limit", tipo: "string opcional (NÃO number)", obrigatorio: "não" }],
      shape_resposta: "{ data: {...} }",
      limites: "paginação string; teto não determinado",
      bordas: "items e commands duplicados",
      confianca: "confirmado ao vivo",
      evidencia_ao_vivo: { chamou: "{}", retornou: "total:1" },
    }],
    resumo_confianca: { confirmado_ao_vivo: "1", inferido: "0", nao_verificado: "0" },
  };
}

// Prepara o estado na etapa 'descoberta' com dag_output presente, e escreve o output dado.
function prepararEAvaliar(ficha) {
  limpar();
  assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
  const e = carregarEstado(FEATURE);
  e.etapaAtual = "descoberta";
  e.dag_output = "mapa do dag";
  salvarEstado(e);
  writeFileSync(outputPath(FEATURE, "descoberta"), JSON.stringify(ficha), "utf8");
  return main(["advance", FEATURE]);
}

describe("Etapa 2 — Descoberta da API", () => {
  after(() => limpar());

  it("a etapa declara executor (fiscal), enum próprio, precondicoes e schema", () => {
    const d = etapaPorId("descoberta");
    assert.equal(d.executor.nome, "fiscal");
    assert.ok(d.executor.confianca_enum.includes("confirmado ao vivo"));
    assert.ok(d.precondicoes.includes("dag_output"), "precondicao dag_output");
    assert.ok(d.schemaEstrutural.endpoints_confirmados, "schema da ficha");
  });

  it("APROVA uma ficha válida com evidência", () => {
    assert.equal(prepararEAvaliar(fichaValida()), 0);
    assert.equal(carregarEstado(FEATURE).etapaAtual, "gap", "avançou para gap");
  });

  // --- A regra-mestra: "confirmado ao vivo" exige evidência REAL (o coração da etapa) ---

  it("REPROVA 'confirmado ao vivo' SEM evidencia_ao_vivo", () => {
    const f = fichaValida();
    delete f.endpoints_confirmados[0].evidencia_ao_vivo;
    assert.equal(prepararEAvaliar(f), 1, "confirmado sem evidência deve REPROVAR");
  });

  it("REPROVA 'confirmado ao vivo' com evidência VAZIA ({}, [], '  ') — o bug da revisão cega", () => {
    for (const vazia of [{}, [], "   ", ""]) {
      const f = fichaValida();
      f.endpoints_confirmados[0].evidencia_ao_vivo = vazia;
      assert.equal(prepararEAvaliar(f), 1, `evidência vazia (${JSON.stringify(vazia)}) deve REPROVAR`);
    }
  });

  it("ACEITA 'inferido do código' SEM evidência (legítimo — não afirmou ter testado)", () => {
    const f = fichaValida();
    f.endpoints_confirmados[0].confianca = "inferido do código";
    delete f.endpoints_confirmados[0].evidencia_ao_vivo;
    assert.equal(prepararEAvaliar(f), 0, "inferido sem evidência deve PASSAR");
  });

  it("REPROVA confianca fora do enum da etapa 2 (ex.: 'executado')", () => {
    const f = fichaValida();
    f.endpoints_confirmados[0].confianca = "executado";
    assert.equal(prepararEAvaliar(f), 1);
  });

  it("REPROVA params que não é lista de objetos (schema rico, não objeto-vazio)", () => {
    const f = fichaValida();
    f.endpoints_confirmados[0].params = { qualquer: "lixo" }; // era aceito antes; agora deve reprovar
    assert.equal(prepararEAvaliar(f), 1, "params como objeto solto deve REPROVAR");
  });

  it("REPROVA endpoint sem limites/bordas (o porteiro exige o que o CORE promete)", () => {
    const f = fichaValida();
    delete f.endpoints_confirmados[0].limites;
    assert.equal(prepararEAvaliar(f), 1, "falta de 'limites' deve REPROVAR");
  });

  // --- Pré-condição e promoção do output (defeito de integração da revisão cega) ---

  it("next BLOQUEIA na descoberta quando falta dag_output", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
    const e = carregarEstado(FEATURE);
    e.etapaAtual = "descoberta"; // sem dag_output
    salvarEstado(e);
    assert.equal(main(["next", FEATURE]), 1, "sem dag_output, next bloqueia");
    assert.ok(!existsSync(briefingPath(FEATURE, "descoberta")), "briefing não gerado no bloqueio");
  });

  it("o motor PROMOVE o output da etapa aprovada para o estado (dag_output existe após advance do dag)", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
    // output válido mínimo da etapa dag
    const dagOut = {
      nos: [{ nome: "A", tipo: "f", path: "a", shape: "s", confianca: "lido no código" }],
      arestas: [{ consumidor: "A", provedor: "B", tipo: "consome", custo_reverso: "n/a", confianca: "lido no código" }],
      blast_radius: [{ no: "B", consumido_por: ["A"], amplitude: "BAIXA" }],
      fronteira: { nos_folha: ["B"], saidas_1hop: ["C"] },
      gaps: [{ id: "G", prioridade: "P0", acao: "x" }],
      confianca: { lido: 1, inferido: 0, nao_encontrado: 0 },
    };
    writeFileSync(outputPath(FEATURE, "dag"), JSON.stringify(dagOut), "utf8");
    assert.equal(main(["advance", FEATURE]), 0);
    const e = carregarEstado(FEATURE);
    assert.ok(e.dag_output, "dag_output promovido para o estado após aprovar a etapa dag");
  });

  // --- Sincronia do CORE (o cabeçalho afirma; agora é verdade) ---

  it("a cópia local cores/CORE-DISCOVERY.md está em sincronia com a fonte", () => {
    const local = readFileSync(new URL("../cores/CORE-DISCOVERY.md", import.meta.url), "utf8");
    const fonte = readFileSync(join(new URL("../", import.meta.url).pathname.replace(/^\//, ""), "..", "etapa-2-descoberta", "CORE-DISCOVERY.md"), "utf8");
    assert.equal(local, fonte, "cores/CORE-DISCOVERY.md divergiu da fonte etapa-2-descoberta/");
  });
});
