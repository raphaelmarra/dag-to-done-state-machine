// design.test.mjs — testes próprios da etapa 4 (Design). Cobre as regras estruturais: critério com
// `then`, ≥3 riscos com o_que_revisar, estados difíceis presentes, circuito comportamento→critério,
// e as pré-condições (3 etapas anteriores). Espelha os testes das etapas 2-3.

import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { main, outputPath, briefingPath, featureDir, carregarEstado, salvarEstado } from "../dag.mjs";
import { etapaPorId } from "../pipeline.config.mjs";

const FEATURE = "design-test";
function limpar() { rmSync(featureDir(FEATURE), { recursive: true, force: true }); }

function dossieValido() {
  return {
    three_amigos: [{ comportamento: "listar", por_que: "ver comandos", como: "commands/list", criterios: ["CA-01"] }],
    criterios_aceitacao: [{ id: "CA-01", given: "agente válido", when: "abre a aba", then: "exibe a lista, NUNCA spinner infinito" }],
    riscos_premortem: [
      { id: "R1", risco: "SE args objeto ENTÃO quebra", mitigacao: "array", o_que_revisar: "payload é array?" },
      { id: "R2", risco: "SE label Executar ENTÃO promessa falsa", mitigacao: "renomear", o_que_revisar: "copy" },
      { id: "R3", risco: "SE vazio=erro ENTÃO esconde causa", mitigacao: "3 estados", o_que_revisar: "vazio≠erro?" },
    ],
    estados: [
      { estado: "loading", descricao: "carregando", usuario_pode: "aguardar" },
      { estado: "erro_de_carga", descricao: "erro na carga", usuario_pode: "retry" },
      { estado: "lista_vazia", descricao: "vazio: nenhum comando", usuario_pode: "criar" },
    ],
    adrs: [{ id: "ADR-1", decisao: "run renderiza", motivo: "ao vivo; executar é no-go" }],
    resumo_design: { comportamentos: 1, criterios: 1, riscos: 3 },
  };
}

function prepararEAvaliar(d) {
  limpar();
  assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
  const e = carregarEstado(FEATURE);
  e.etapaAtual = "design";
  e.dag_output = "mapa"; e.descoberta_output = "contrato"; e.gap_output = "gaps";
  salvarEstado(e);
  writeFileSync(outputPath(FEATURE, "design"), JSON.stringify(d), "utf8");
  return main(["advance", FEATURE]);
}

describe("Etapa 4 — Design", () => {
  after(() => limpar());

  it("declara executor (ui-ux-designer), enum próprio, precondicoes (3 etapas) e schema", () => {
    const d = etapaPorId("design");
    assert.equal(d.executor.nome, "ui-ux-designer");
    assert.ok(d.executor.confianca_enum.includes("decisão de produto"));
    assert.ok(d.precondicoes.includes("gap_output"), "precondicao gap_output");
    assert.ok(d.schemaEstrutural.three_amigos && d.schemaEstrutural.criterios_aceitacao);
  });

  it("APROVA um dossiê válido", () => {
    assert.equal(prepararEAvaliar(dossieValido()), 0);
    assert.equal(carregarEstado(FEATURE).etapaAtual, "mapa_dependencias", "avançou");
  });

  // --- Critério testável (C1): o porteiro exige `then` ---

  it("REPROVA critério sem 'then' (resultado observável)", () => {
    const d = dossieValido();
    delete d.criterios_aceitacao[0].then;
    assert.equal(prepararEAvaliar(d), 1, "critério sem then deve REPROVAR");
  });

  // --- Three Amigos (A2): toda comportamento tem por_que/como/criterios ---

  it("REPROVA comportamento sem 'por_que' (Three Amigos incompleto)", () => {
    const d = dossieValido();
    delete d.three_amigos[0].por_que;
    assert.equal(prepararEAvaliar(d), 1);
  });

  // --- Pre-mortem: ≥3 riscos, cada um com o_que_revisar ---

  it("REPROVA pre-mortem com menos de 3 riscos", () => {
    const d = dossieValido();
    d.riscos_premortem = d.riscos_premortem.slice(0, 2);
    assert.equal(prepararEAvaliar(d), 1, "menos de 3 riscos deve REPROVAR");
  });

  it("REPROVA risco sem 'o_que_revisar' (a lente do Gate A)", () => {
    const d = dossieValido();
    delete d.riscos_premortem[0].o_que_revisar;
    assert.equal(prepararEAvaliar(d), 1);
  });

  // --- Estados difíceis (E1): vazio/erro/loading presentes ---

  it("REPROVA matriz de estados sem o estado de ERRO", () => {
    const d = dossieValido();
    d.estados = d.estados.filter((e) => !/erro/i.test(e.estado + e.descricao));
    assert.equal(prepararEAvaliar(d), 1, "faltar estado de erro deve REPROVAR");
  });

  it("REPROVA matriz sem o estado VAZIO", () => {
    const d = dossieValido();
    d.estados = d.estados.filter((e) => !/vazi/i.test(e.estado + e.descricao));
    assert.equal(prepararEAvaliar(d), 1, "faltar estado vazio deve REPROVAR");
  });

  // --- Circuito (D-H): comportamento aponta critério que existe ---

  it("REPROVA comportamento que aponta critério INEXISTENTE (circuito quebrado)", () => {
    const d = dossieValido();
    d.three_amigos[0].criterios = ["CA-99"]; // não existe
    assert.equal(prepararEAvaliar(d), 1, "critério inexistente deve REPROVAR");
  });

  it("REPROVA comportamento que não aponta NENHUM critério (intenção órfã)", () => {
    const d = dossieValido();
    d.three_amigos[0].criterios = [];
    assert.equal(prepararEAvaliar(d), 1);
  });

  it("REPROVA matriz sem o estado de CARREGANDO (e 'render' NÃO conta como loading — falso-positivo)", () => {
    const d = dossieValido();
    // troca o loading por um estado que MENCIONA 'render' (era o falso-positivo: passava como loading)
    d.estados = [
      { estado: "prompt_renderizado", descricao: "renderização do prompt pronta", usuario_pode: "copiar" },
      { estado: "erro_de_carga", descricao: "erro na carga", usuario_pode: "retry" },
      { estado: "lista_vazia", descricao: "vazio: nenhum comando", usuario_pode: "criar" },
    ];
    assert.equal(prepararEAvaliar(d), 1, "sem carregando real (só 'renderizado') deve REPROVAR");
  });

  it("REPROVA cross-contamination: um único estado citando vazio+erro+loading na descrição", () => {
    const d = dossieValido();
    d.estados = [{ estado: "tudo", descricao: "aguardando; se vazio mostra nada; em erro avisa", usuario_pode: "x" }];
    assert.equal(prepararEAvaliar(d), 1, "um estado cobrindo os 3 (não distintos) deve REPROVAR");
  });

  it("REPROVA critério ÓRFÃO: criterio que nenhum comportamento aponta (circuito nos 2 sentidos)", () => {
    const d = dossieValido();
    d.criterios_aceitacao.push({ id: "CA-99", given: "g", when: "w", then: "t observável" }); // ninguém aponta
    assert.equal(prepararEAvaliar(d), 1, "critério órfão deve REPROVAR");
  });

  it("REPROVA dossiê SEM nenhum ADR (toda etapa de design decide algo — minItens:1)", () => {
    const d = dossieValido();
    d.adrs = [];
    assert.equal(prepararEAvaliar(d), 1, "adrs vazio deve REPROVAR");
  });

  it("REPROVA resumo_design que MENTE sobre as listas (riscos: 9 mas há 3)", () => {
    const d = dossieValido();
    d.resumo_design = { comportamentos: 1, criterios: 1, riscos: 9 };
    assert.equal(prepararEAvaliar(d), 1, "resumo mentiroso deve REPROVAR");
  });

  // --- Pré-condição (encanamento): precisa das 3 etapas anteriores ---

  it("next BLOQUEIA quando falta gap_output (mesmo com dag+descoberta)", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
    const e = carregarEstado(FEATURE);
    e.etapaAtual = "design";
    e.dag_output = "mapa"; e.descoberta_output = "contrato"; // sem gap_output
    salvarEstado(e);
    assert.equal(main(["next", FEATURE]), 1, "sem gap_output, next bloqueia");
    assert.ok(!existsSync(briefingPath(FEATURE, "design")), "briefing não gerado");
  });

  // --- Sincronia do CORE ---

  it("a cópia local cores/CORE-DESIGN.md está em sincronia com a fonte", () => {
    const local = readFileSync(new URL("../cores/CORE-DESIGN.md", import.meta.url), "utf8");
    const fonte = readFileSync(join(new URL("../", import.meta.url).pathname.replace(/^\//, ""), "..", "etapa-4-design", "CORE-DESIGN.md"), "utf8");
    assert.equal(local, fonte, "cores/CORE-DESIGN.md divergiu da fonte etapa-4-design/");
  });
});
