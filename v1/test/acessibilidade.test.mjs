// acessibilidade.test.mjs — testes próprios da etapa 8 (Acessibilidade — o "Gate A do runtime"). Foco nas
// regras: cobertura TOTAL do catálogo WCAG, N/A com motivo SUBSTANTIVO (a fábrica generalizada), veredito
// coerente (aprovado→0 alta; reprovado→≥1 issue), issue acionável, violação vira issue (circuito). Mais: os 2
// INVARIANTES do catálogo (casa o próprio nome + anti-colisão — lições da etapa 7) e a injeção no briefing.
// Espelha gate_a.test.mjs. A etapa 8 NÃO usa o estado nas regras (catálogo injetado inteiro).

import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { main, outputPath, briefingPath, featureDir, carregarEstado, salvarEstado } from "../dag.mjs";
import { etapaPorId, CATALOGO_WCAG } from "../pipeline.config.mjs";

const FEATURE = "a11y-test";
function limpar() { rmSync(featureDir(FEATURE), { recursive: true, force: true }); }

// Gera os critérios cobrindo TODO o catálogo: por padrão N/A com motivo substantivo (a maioria numa feature
// simples), com overrides por índice. Cada nome casa o próprio regex (invariante testado).
function criteriosCompletos(situacaoPorIndice = {}) {
  return CATALOGO_WCAG.map((W, i) => ({
    criterio: W.nome,
    situacao: situacaoPorIndice[i] ?? "nao_aplicavel",
    evidencia_operacional: situacaoPorIndice[i] === "coberto"
      ? "Tab → activeElement=elemento esperado; getComputedStyle verificado"
      : "esta feature não tem este padrão de interação; critério não se aplica a esta tela",
  }));
}

// Verificação aprovada válida: catálogo completo, ao menos 1 coberto, sem issues.
function a11yAprovado() {
  return {
    veredito: "aprovado",
    resumo: "Operei a tela: foco/teclado sadios; demais dimensões não se aplicam.",
    criterios: criteriosCompletos({ 0: "coberto", 2: "coberto" }),
    issues: [],
    fica_para_humano: ["confirmar com leitor de tela real na etapa 10"],
  };
}

// Verificação reprovada válida: 1 critério violado + issue que o cita + severidade alta.
function a11yReprovado() {
  const criterios = criteriosCompletos({ 0: "coberto", 5: "violado" }); // CATALOGO_WCAG[5] = 3.3.1 Error Identification
  criterios[5].evidencia_operacional = "operei: o erro só aparece em cor, sem texto";
  const codigo = `${CATALOGO_WCAG[5].nome}`.split(/\s+/)[0]; // "3.3.1"
  return {
    veredito: "reprovado",
    resumo: "Erro identificado só por cor — bloqueia.",
    criterios,
    issues: [{ id: "A11Y-01", severidade: "alta", criterio: CATALOGO_WCAG[5].nome,
               localizacao: "div#error (sem texto, só cor)", descricao: "erro só por cor viola " + codigo,
               acao: "adicionar texto de erro além da cor" }],
    fica_para_humano: ["se o texto de erro soa claro para NVDA real"],
  };
}

function prepararEAvaliar(v) {
  limpar();
  assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
  const e = carregarEstado(FEATURE);
  e.etapaAtual = "acessibilidade";
  // as 7 pré-condições (a etapa 8 não cruza nada, mas o motor exige os outputs presentes)
  e.dag_output = "m"; e.descoberta_output = "c"; e.gap_output = "g"; e.design_output = "d";
  e.mapa_dependencias_output = "ma"; e.implementacao_output = "im"; e.gate_a_output = "ga";
  salvarEstado(e);
  writeFileSync(outputPath(FEATURE, "acessibilidade"), JSON.stringify(v), "utf8");
  return main(["advance", FEATURE]);
}

describe("Etapa 8 — Acessibilidade (o Gate A do runtime)", () => {
  after(() => limpar());

  it("declara executor (web-accessibility-checker), enum, precondicoes (7 etapas) e schema", () => {
    const d = etapaPorId("acessibilidade");
    assert.equal(d.executor.nome, "web-accessibility-checker");
    assert.ok(d.precondicoes.includes("gate_a_output"), "precondicao gate_a_output");
    assert.ok(d.schemaEstrutural.criterios && d.schemaEstrutural.veredito);
  });

  it("REPROVA quando evidencia_operacional é um OBJETO em vez de texto (prova é textual)", () => {
    // Furo residual da 2ª revisão cega (espelho do gate_a): objeto vira "[object Object]" e escaparia da
    // defesa anti-oco. Fechado na ORIGEM: evidencia_operacional é tipo "string".
    const v = a11yAprovado();
    v.criterios[0].evidencia_operacional = { a: 1 };
    assert.equal(prepararEAvaliar(v), 1, "evidencia_operacional objeto deve REPROVAR (deveria ser texto)");
  });

  // --- INVARIANTES de consistência do catálogo (lições da etapa 7) ---

  it("INVARIANTE: todo critério WCAG casa o próprio nome", () => {
    for (const W of CATALOGO_WCAG) {
      assert.ok(W.re.test(W.nome.toLowerCase()), `critério "${W.nome}" não casa o próprio regex ${W.re}`);
    }
  });

  it("INVARIANTE: nenhum regex de critério casa o NOME de outro (anti-colisão)", () => {
    for (const W of CATALOGO_WCAG) {
      const casados = CATALOGO_WCAG.filter((O) => W.re.test(O.nome.toLowerCase()));
      assert.equal(casados.length, 1, `regex de "${W.nome}" casa ${casados.length}: ${casados.map((c) => c.nome).join(", ")}`);
    }
  });

  // --- Veredito + cobertura ---

  it("APROVA uma verificação válida (catálogo completo, sem issues)", () => {
    assert.equal(prepararEAvaliar(a11yAprovado()), 0);
    assert.equal(carregarEstado(FEATURE).etapaAtual, "gate_b", "avançou");
  });

  it("APROVA uma verificação que REPROVA a tela (reprovado é sucesso da etapa, passa o porteiro)", () => {
    assert.equal(prepararEAvaliar(a11yReprovado()), 0, "verificação reprovado bem-feita deve PASSAR no porteiro");
    assert.equal(carregarEstado(FEATURE).etapaAtual, "gate_b", "avançou (o veredito reprovado é o conteúdo, não o gate)");
  });

  it("REPROVA (porteiro) veredito fora do enum (ex.: 'parcial')", () => {
    const v = a11yAprovado(); v.veredito = "parcial";
    assert.equal(prepararEAvaliar(v), 1);
  });

  it("REPROVA (porteiro) veredito reprovado SEM nenhuma issue (reprovar em silêncio)", () => {
    const v = a11yReprovado(); v.issues = []; v.criterios[5].situacao = "coberto"; // tira a violação órfã também
    v.criterios[5].evidencia_operacional = "operei: erro tem texto";
    assert.equal(prepararEAvaliar(v), 1, "reprovado sem issue deve REPROVAR no porteiro");
  });

  it("REPROVA (porteiro) veredito aprovado COM issue de severidade 'alta'", () => {
    const v = a11yAprovado();
    v.issues = [{ id: "X", severidade: "alta", criterio: "1.4.3 Contrast", localizacao: "a", descricao: "b", acao: "c" }];
    assert.equal(prepararEAvaliar(v), 1, "aprovado com issue alta deve REPROVAR no porteiro");
  });

  it("REPROVA quando UM critério do catálogo não foi considerado (cobertura incompleta)", () => {
    const v = a11yAprovado();
    v.criterios = v.criterios.filter((c) => c.criterio !== CATALOGO_WCAG[8].nome); // remove 1
    assert.equal(prepararEAvaliar(v), 1, "critério WCAG em silêncio deve REPROVAR");
  });

  it("REPROVA situação de critério fora do enum", () => {
    const v = a11yAprovado(); v.criterios[1].situacao = "talvez";
    assert.equal(prepararEAvaliar(v), 1);
  });

  // --- N/A com motivo SUBSTANTIVO (a fábrica generalizada da etapa 7) ---

  it("REPROVA nao_aplicavel com motivo OCO ('n/a', '-', 'não') — a defesa anti-fuga", () => {
    for (const oco of ["n/a", "N/A", "-", "na", "não", "x"]) {
      const v = a11yAprovado(); v.criterios[1].evidencia_operacional = oco;
      assert.equal(prepararEAvaliar(v), 1, `nao_aplicavel com motivo oco "${oco}" deve REPROVAR`);
    }
  });

  it("REPROVA tudo-N/A com motivo oco (o cenário-teatro)", () => {
    const v = {
      veredito: "aprovado", resumo: "ok",
      criterios: CATALOGO_WCAG.map((W) => ({ criterio: W.nome, situacao: "nao_aplicavel", evidencia_operacional: "n/a" })),
      issues: [], fica_para_humano: ["x"],
    };
    assert.equal(prepararEAvaliar(v), 1, "tudo-N/A com 'n/a' deve REPROVAR");
  });

  it("ACEITA nao_aplicavel com motivo REAL (frase que explica por que não se aplica)", () => {
    const v = a11yAprovado();
    v.criterios[1].evidencia_operacional = "querySelector('[role=dialog]') vazio: não há modal nesta tela";
    assert.equal(prepararEAvaliar(v), 0);
  });

  // --- coberto exige evidência (schema obrigatorio) + issue acionável ---

  it("REPROVA critério coberto SEM evidência operacional", () => {
    const v = a11yAprovado(); v.criterios[0].evidencia_operacional = "";
    assert.equal(prepararEAvaliar(v), 1, "coberto sem evidência operacional deve REPROVAR");
  });

  it("REPROVA critério COBERTO com evidência OCA ('ok', 'sim') — anti-teatro vale p/ TODA situação (D1)", () => {
    // Achado da revisão cega: a defesa anti-teatro do nao_aplicavel deve valer p/ coberto também. Marcar tudo
    // coberto com "ok" e aprovar é teatro — a evidência operacional precisa de substância em qualquer situação.
    for (const oco of ["ok", "sim", "-", "n/a", "x"]) {
      const v = a11yAprovado(); v.criterios[0].evidencia_operacional = oco; // criterios[0] é coberto
      assert.equal(prepararEAvaliar(v), 1, `coberto com evidência oca "${oco}" deve REPROVAR`);
    }
  });

  it("REPROVA issue sem localizacao", () => {
    const v = a11yReprovado(); v.issues[0].localizacao = "";
    assert.equal(prepararEAvaliar(v), 1);
  });

  it("REPROVA issue sem acao", () => {
    const v = a11yReprovado(); v.issues[0].acao = "";
    assert.equal(prepararEAvaliar(v), 1);
  });

  // --- Circuito: violação vira issue ---

  it("REPROVA critério VIOLADO sem issue que o acione (violação órfã)", () => {
    const v = a11yReprovado(); v.issues = []; // mantém o violado mas tira a issue
    assert.equal(prepararEAvaliar(v), 1, "violação sem issue deve REPROVAR");
  });

  it("REPROVA violação órfã de critério SEM código WCAG (C1: 'foco entra' ≠ 'foco retorna')", () => {
    // Furo achado pela revisão cega: ancorar no 1º token deixava uma issue de "foco retorna ao gatilho"
    // satisfazer a violação órfã de "foco entra ao abrir (modal)" (ambos começam com "foco"). Agora a issue
    // precisa conter o NOME INTEIRO do critério violado.
    const iEntra = CATALOGO_WCAG.findIndex((W) => /foco entra/.test(W.nome));
    const iRetorna = CATALOGO_WCAG.findIndex((W) => /foco retorna/.test(W.nome));
    assert.ok(iEntra >= 0 && iRetorna >= 0, "fixture: os 2 critérios de foco existem");
    const criterios = criteriosCompletos({ 0: "coberto", [iEntra]: "violado" });
    criterios[iEntra].evidencia_operacional = "operei: o foco não entra no modal ao abrir";
    const v = {
      veredito: "reprovado", resumo: "foco não entra no modal",
      criterios,
      // a ÚNICA issue cita OUTRO critério de foco — não deve cobrir a violação de "foco entra"
      issues: [{ id: "X", severidade: "alta", criterio: CATALOGO_WCAG[iRetorna].nome,
                 localizacao: "modal", descricao: "outro", acao: "outra" }],
      fica_para_humano: ["x"],
    };
    assert.equal(prepararEAvaliar(v), 1, "issue de 'foco retorna' não cobre a violação de 'foco entra'");
  });

  // --- Injeção do catálogo no briefing ---

  it("o briefing injeta TODOS os critérios WCAG do catálogo (o verificador os vê para declarar cada um)", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
    const e = carregarEstado(FEATURE);
    e.etapaAtual = "acessibilidade";
    e.dag_output = "m"; e.descoberta_output = "c"; e.gap_output = "g"; e.design_output = "d";
    e.mapa_dependencias_output = "ma"; e.implementacao_output = "im"; e.gate_a_output = "ga";
    salvarEstado(e);
    assert.equal(main(["next", FEATURE]), 0);
    const briefing = readFileSync(briefingPath(FEATURE, "acessibilidade"), "utf8");
    for (const W of CATALOGO_WCAG) {
      assert.ok(briefing.includes(W.nome), `o briefing deve listar o critério "${W.nome}"`);
    }
  });

  // --- Pré-condição (encanamento): precisa das 7 etapas anteriores ---

  it("next BLOQUEIA quando falta gate_a_output (mesmo com as outras 6)", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
    const e = carregarEstado(FEATURE);
    e.etapaAtual = "acessibilidade";
    e.dag_output = "m"; e.descoberta_output = "c"; e.gap_output = "g"; e.design_output = "d"; e.mapa_dependencias_output = "ma"; e.implementacao_output = "im"; // sem gate_a
    salvarEstado(e);
    assert.equal(main(["next", FEATURE]), 1, "sem gate_a_output, next bloqueia");
    assert.ok(!existsSync(briefingPath(FEATURE, "acessibilidade")), "briefing não gerado");
  });

  // --- Sincronia do CORE ---

  it("a cópia local cores/CORE-A11Y.md está em sincronia com a fonte", () => {
    const local = readFileSync(new URL("../cores/CORE-A11Y.md", import.meta.url), "utf8");
    const fonte = readFileSync(join(new URL("../", import.meta.url).pathname.replace(/^\//, ""), "..", "etapa-8-acessibilidade", "CORE-A11Y.md"), "utf8");
    assert.equal(local, fonte, "cores/CORE-A11Y.md divergiu da fonte etapa-8-acessibilidade/");
  });
});
