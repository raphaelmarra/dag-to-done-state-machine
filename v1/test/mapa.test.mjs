// mapa.test.mjs — testes próprios da etapa 5 (Mapa de dependências). Foco nas regras estruturais:
// paralelo PROVADO por arquivos disjuntos (o coração), ordem topológica, unidade com âncora+arquivos,
// e pré-condições (as 4 etapas anteriores). Espelha os testes das etapas anteriores.

import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { main, outputPath, briefingPath, featureDir, carregarEstado, salvarEstado } from "../dag.mjs";
import { etapaPorId } from "../pipeline.config.mjs";

const FEATURE = "mapa-test";
function limpar() { rmSync(featureDir(FEATURE), { recursive: true, force: true }); }

function mapaValido() {
  return {
    unidades: [
      { id: "U1", nome: "args array", objetivo: "converter", arquivos: ["a.tsx", "b.tsx"], ancora: ["GAP-1"], depende_de: [] },
      { id: "U2", nome: "paginação", objetivo: "string", arquivos: ["c.tsx"], ancora: ["GAP-4"], depende_de: [] },
      { id: "U3", nome: "render", objetivo: "exibir", arquivos: ["a.tsx"], ancora: ["GAP-2"], depende_de: ["U1"] },
    ],
    ordem: ["U1", "U2", "U3"],
    paralelizavel: [{ grupo: ["U1", "U2"], justificativa: "U1 a/b.tsx; U2 c.tsx — disjuntos" }],
    walking_skeleton: { necessario: "não", justificativa: "a aba já roda end-to-end (DAG confirma)" },
    ancoragem_no_gos: ["nenhuma unidade executa o agente"],
  };
}

function prepararEAvaliar(m) {
  limpar();
  assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
  const e = carregarEstado(FEATURE);
  e.etapaAtual = "mapa_dependencias";
  e.dag_output = "mapa"; e.descoberta_output = "contrato"; e.gap_output = "gaps"; e.design_output = "design";
  salvarEstado(e);
  writeFileSync(outputPath(FEATURE, "mapa_dependencias"), JSON.stringify(m), "utf8");
  return main(["advance", FEATURE]);
}

describe("Etapa 5 — Mapa de dependências", () => {
  after(() => limpar());

  it("declara executor (Plan), enum, precondicoes (4 etapas) e schema", () => {
    const d = etapaPorId("mapa_dependencias");
    assert.equal(d.executor.nome, "Plan");
    assert.ok(d.precondicoes.includes("design_output"), "precondicao design_output");
    assert.ok(d.schemaEstrutural.unidades && d.schemaEstrutural.paralelizavel);
  });

  it("APROVA um mapa válido", () => {
    assert.equal(prepararEAvaliar(mapaValido()), 0);
    assert.equal(carregarEstado(FEATURE).etapaAtual, "implementacao", "avançou");
  });

  // --- Unidade bem-formada: arquivos + âncora ---

  it("REPROVA unidade sem 'ancora' (trabalho órfão = inventado)", () => {
    const m = mapaValido();
    delete m.unidades[0].ancora;
    assert.equal(prepararEAvaliar(m), 1, "unidade sem âncora deve REPROVAR");
  });

  it("REPROVA unidade sem 'arquivos' (sem isso não há prova de paralelismo)", () => {
    const m = mapaValido();
    delete m.unidades[1].arquivos;
    assert.equal(prepararEAvaliar(m), 1);
  });

  // --- Paralelismo PROVADO por arquivos disjuntos (o coração — P1) ---

  it("REPROVA paralelo de unidades que COMPARTILHAM arquivo (não disjuntos)", () => {
    const m = mapaValido();
    // U1 (a.tsx,b.tsx) e U3 (a.tsx) compartilham a.tsx → não podem paralelizar
    m.paralelizavel = [{ grupo: ["U1", "U3"], justificativa: "errado: ambos tocam a.tsx" }];
    assert.equal(prepararEAvaliar(m), 1, "paralelo com arquivo compartilhado deve REPROVAR");
  });

  it("REPROVA paralelo com dependência MÚTUA no grupo (U3 depende de U1)", () => {
    const m = mapaValido();
    m.unidades[2].arquivos = ["d.tsx"]; // tira o conflito de arquivo p/ isolar a dependência
    m.paralelizavel = [{ grupo: ["U1", "U3"], justificativa: "arquivos ok mas U3 depende de U1" }];
    assert.equal(prepararEAvaliar(m), 1, "paralelo com dependência no grupo deve REPROVAR");
  });

  it("REPROVA paralelo que aponta unidade inexistente", () => {
    const m = mapaValido();
    m.paralelizavel = [{ grupo: ["U1", "U9"], justificativa: "U9 não existe" }];
    assert.equal(prepararEAvaliar(m), 1);
  });

  // --- Ordem topológica (O1) ---

  it("REPROVA ordem NÃO-topológica (dependente antes da dependência)", () => {
    const m = mapaValido();
    m.ordem = ["U3", "U1", "U2"]; // U3 depende de U1 mas vem antes
    assert.equal(prepararEAvaliar(m), 1, "ordem não-topológica deve REPROVAR");
  });

  it("REPROVA ordem que NÃO cobre todas as unidades", () => {
    const m = mapaValido();
    m.ordem = ["U1", "U2"]; // falta U3
    assert.equal(prepararEAvaliar(m), 1, "unidade ausente da ordem deve REPROVAR");
  });

  it("REPROVA unidade que depende de unidade INEXISTENTE", () => {
    const m = mapaValido();
    m.unidades[2].depende_de = ["U9"];
    assert.equal(prepararEAvaliar(m), 1);
  });

  // --- Ciclos (O3) — o caso mais perigoso de um grafo. Confirmam que a checagem topológica os PEGA
  //     (um ciclo torna QUALQUER ordem linear não-topológica) e que NÃO há loop infinito (a regra não
  //     faz travessia recursiva: só compara posições, O(V·E), sempre termina). Achado: anti-viés etapa 5.

  it("REPROVA CICLO de dependências (U1↔U2) sem travar", () => {
    const m = mapaValido();
    m.unidades = [
      { id: "U1", nome: "a", objetivo: "o", arquivos: ["x.tsx"], ancora: ["GAP-1"], depende_de: ["U2"] },
      { id: "U2", nome: "b", objetivo: "o", arquivos: ["y.tsx"], ancora: ["GAP-2"], depende_de: ["U1"] },
    ];
    m.ordem = ["U1", "U2"]; m.paralelizavel = [];
    assert.equal(prepararEAvaliar(m), 1, "ciclo deve REPROVAR (nenhuma ordem é topológica)");
  });

  it("REPROVA auto-dependência (U1 depende de si próprio — ciclo degenerado)", () => {
    const m = mapaValido();
    m.unidades[0].depende_de = ["U1"];
    assert.equal(prepararEAvaliar(m), 1, "self-loop deve REPROVAR");
  });

  // --- Robustez da ordem topológica (achados do anti-viés) ---

  it("REPROVA ordem com id REPETIDO (mascara violação: Map.get pegaria a última posição)", () => {
    const m = mapaValido();
    m.ordem = ["U1", "U3", "U2", "U3"]; // U3 duplicado — sem a checagem, a 2ª posição esconderia furo
    assert.equal(prepararEAvaliar(m), 1, "ordem com id repetido deve REPROVAR");
  });

  it("REPROVA ordem que inclui unidade INEXISTENTE", () => {
    const m = mapaValido();
    m.ordem = ["U1", "U2", "U3", "U9"]; // U9 não é unidade
    assert.equal(prepararEAvaliar(m), 1, "ordem com unidade fantasma deve REPROVAR");
  });

  // --- Robustez do paralelo (achados do anti-viés) ---

  it("detecta colisão em grupo de 3+ onde só DUAS unidades compartilham arquivo", () => {
    const m = mapaValido();
    m.unidades[1].depende_de = []; // isola: só o conflito de arquivo deve reprovar
    // grupo {U1,U2,U3}: U1(a,b) e U3(a) colidem em a.tsx; U2(c) é disjunto — a regra deve pegar U1×U3
    m.unidades[2].depende_de = []; m.ordem = ["U1", "U2", "U3"];
    m.paralelizavel = [{ grupo: ["U1", "U2", "U3"], justificativa: "errado: U1 e U3 tocam a.tsx" }];
    assert.equal(prepararEAvaliar(m), 1, "colisão entre 2 de 3 deve REPROVAR (vistos é por-grupo)");
  });

  // --- Walking Skeleton: enum binário padronizado (sim/não), como o resto do arquivo (anti-viés) ---

  it("REPROVA walking_skeleton.necessario fora do enum sim/não (ex.: boolean true)", () => {
    const m = mapaValido();
    m.walking_skeleton = { necessario: true, justificativa: "x" }; // boolean não é mais aceito
    assert.equal(prepararEAvaliar(m), 1, "necessario deve ser 'sim'/'não', não boolean");
  });

  // --- Pré-condição (encanamento): precisa das 4 etapas anteriores ---

  it("next BLOQUEIA quando falta design_output (mesmo com dag+descoberta+gap)", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
    const e = carregarEstado(FEATURE);
    e.etapaAtual = "mapa_dependencias";
    e.dag_output = "m"; e.descoberta_output = "c"; e.gap_output = "g"; // sem design_output
    salvarEstado(e);
    assert.equal(main(["next", FEATURE]), 1, "sem design_output, next bloqueia");
    assert.ok(!existsSync(briefingPath(FEATURE, "mapa_dependencias")), "briefing não gerado");
  });

  // --- Sincronia do CORE ---

  it("a cópia local cores/CORE-MAPA.md está em sincronia com a fonte", () => {
    const local = readFileSync(new URL("../cores/CORE-MAPA.md", import.meta.url), "utf8");
    const fonte = readFileSync(join(new URL("../", import.meta.url).pathname.replace(/^\//, ""), "..", "etapa-5-mapa", "CORE-MAPA.md"), "utf8");
    assert.equal(local, fonte, "cores/CORE-MAPA.md divergiu da fonte etapa-5-mapa/");
  });
});
