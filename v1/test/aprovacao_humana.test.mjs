// aprovacao_humana.test.mjs — testes próprios da etapa 10 (Aprovação humana — HITL). Foco da PEÇA 1:
// schema mínimo (aprovado_por + decisao) + porteiro FAIL-CLOSED binário (só "aprovado" avança; "rejeitado"
// é output válido mas BLOQUEIA → volta à etapa 6). A etapa 10 é de gênero NÃO-CORE: o executor é o humano.
// A garantia é PROCESSUAL (o agente espera a fala humana), não criptográfica — o porteiro valida forma/coerência.

import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, rmSync } from "node:fs";
import { existsSync, readFileSync } from "node:fs";
import { main, outputPath, briefingPath, featureDir, carregarEstado, salvarEstado } from "../dag.mjs";
import { etapaPorId, gerarDossieAprovacao } from "../pipeline.config.mjs";

const FEATURE = "aprovacao-test";
function limpar() { rmSync(featureDir(FEATURE), { recursive: true, force: true }); }

// Output de aprovação válido: o humano aprovou explicitamente.
function aprovado() {
  return { aprovado_por: "Raphael (Diretor)", decisao: "aprovado", observacao: "usei a tela, fluxo ok" };
}

// Coloca a feature na etapa 10 com as 9 etapas anteriores promovidas no estado, escreve o output e avança.
function prepararEAvaliar(out) {
  limpar();
  assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
  const e = carregarEstado(FEATURE);
  e.etapaAtual = "aprovacao_humana";
  // as 9 pré-condições promovidas (o motor exigiria; aqui injetamos para isolar a peça 1)
  e.dag_output = "m"; e.descoberta_output = "c"; e.gap_output = "g"; e.design_output = "d";
  e.mapa_dependencias_output = "ma"; e.implementacao_output = "im"; e.gate_a_output = "ga";
  e.acessibilidade_output = "a11y"; e.gate_b_output = "gb";
  salvarEstado(e);
  writeFileSync(outputPath(FEATURE, "aprovacao_humana"), JSON.stringify(out), "utf8");
  return main(["advance", FEATURE]);
}

describe("Etapa 10 — Aprovação humana (HITL) — peça 1: schema + fail-closed", () => {
  after(() => limpar());

  it("declara executor humano, schema mínimo (aprovado_por, decisao) e enum binário da decisão", () => {
    const d = etapaPorId("aprovacao_humana");
    assert.equal(d.agente, "humano");
    assert.ok(d.schemaEstrutural?.aprovado_por, "schemaEstrutural.aprovado_por");
    assert.deepEqual(d.schemaEstrutural.decisao.enum, ["aprovado", "rejeitado"]);
  });

  it("APROVA (avança para done) quando decisao='aprovado' e aprovado_por preenchido", () => {
    assert.equal(prepararEAvaliar(aprovado()), 0);
    assert.equal(carregarEstado(FEATURE).etapaAtual, "done", "avançou para done");
  });

  it("BLOQUEIA decisao='rejeitado' (fail-closed: volta à etapa 6, não avança)", () => {
    const o = aprovado(); o.decisao = "rejeitado"; o.observacao = "o filtro não funciona, refazer";
    assert.equal(prepararEAvaliar(o), 1, "rejeitado deve BLOQUEAR o avanço");
    assert.equal(carregarEstado(FEATURE).etapaAtual, "aprovacao_humana", "permanece (não avança)");
  });

  it("REPROVA decisao fora do enum binário", () => {
    const o = aprovado(); o.decisao = "talvez";
    assert.equal(prepararEAvaliar(o), 1);
  });

  it("REPROVA aprovado_por ausente ou vazio", () => {
    for (const v of ["", "   "]) {
      const o = aprovado(); o.aprovado_por = v;
      assert.equal(prepararEAvaliar(o), 1, `aprovado_por "${v}" deve REPROVAR`);
    }
  });

  it("REPROVA aprovado_por que é um OBJETO (deve ser texto — nome do humano)", () => {
    const o = aprovado(); o.aprovado_por = { nome: "x" };
    assert.equal(prepararEAvaliar(o), 1, "aprovado_por objeto deve REPROVAR");
  });
});

// --- PEÇA 2: gerador de dossiê (deriva resumo + gates + o que ficou fora do estado) ---

// Estado RICO: outputs das etapas anteriores como objetos reais (o caso do fluxo verdadeiro).
function estadoRico() {
  return {
    feature: "aba-clis",
    design_output: {
      resumo_design: { objetivo: "Lista de CLIs com filtro e ação de reiniciar" },
      riscos_premortem: [{ risco: "reiniciar o CLI errado por id duplicado" }, { risco: "filtro perde estado ao paginar" }],
    },
    gate_a_output: { veredito: "APROVA" },
    gate_b_output: { veredito: "verificado", fica_para_humano: ["a janela de manutenção do ambiente", "ordem dos args só testada com aridade 1"] },
    acessibilidade_output: { veredito: "aprovado" },
  };
}

describe("Etapa 10 — peça 2: gerador de dossiê", () => {
  it("a etapa declara o placeholder {dossie_aprovacao} no seu core/briefing", () => {
    const d = etapaPorId("aprovacao_humana");
    assert.match(d.core, /\{dossie_aprovacao\}/, "o core da etapa deve referenciar {dossie_aprovacao}");
  });

  it("o dossiê inclui o RESUMO do construído (do design) e os 3 VEREDITOS dos gates", () => {
    const dossie = gerarDossieAprovacao(estadoRico());
    assert.match(dossie, /Lista de CLIs com filtro/, "resumo do design");
    assert.match(dossie, /APROVA/, "veredito do Gate A");
    assert.match(dossie, /verificado/, "veredito do Gate B");
    assert.match(dossie, /aprovado/, "veredito da Acessibilidade");
  });

  it("o dossiê inclui O QUE FICOU FORA (fica_para_humano do Gate B + riscos do pre-mortem)", () => {
    const dossie = gerarDossieAprovacao(estadoRico());
    assert.match(dossie, /janela de manutenção/, "fica_para_humano do Gate B");
    assert.match(dossie, /id duplicado/, "risco do pre-mortem");
  });

  it("o dossiê declara o LIMITE A018 (o Gate B não autentica a evidência ao vivo)", () => {
    const dossie = gerarDossieAprovacao(estadoRico());
    assert.match(dossie, /A018|não autentica|autenticidade/i, "o limite epistêmico do Gate B");
  });

  it("extrai o conteúdo de fica_para_humano mesmo se vier como lista-de-OBJETOS (não some como 'sem rótulo')", () => {
    // Fraqueza latente da revisão cega: chaves=[] apagava itens-objeto. Hoje o Gate B emite lista-de-strings,
    // mas se um dia emitir [{ponto:"..."}], o humano não pode ver "(item sem rótulo)" — perda de honestidade.
    const estado = estadoRico();
    estado.gate_b_output.fica_para_humano = [{ ponto: "validar a janela de manutenção com o time" }, { descricao: "ordem dos args" }];
    const dossie = gerarDossieAprovacao(estado);
    assert.match(dossie, /validar a janela de manutenção com o time/, "extrai do objeto, não apaga");
    assert.match(dossie, /ordem dos args/, "extrai a 2ª chave candidata");
    assert.doesNotMatch(dossie, /item sem rótulo/, "não some o conteúdo");
  });

  it("NÃO vaza [object Object] nem crasha quando um output anterior está ausente ou é string", () => {
    // Robustez: no fluxo real os outputs são objetos, mas o dossiê não pode quebrar se algo vier degenerado.
    const magro = { feature: "x", design_output: "d", gate_a_output: undefined };
    const dossie = gerarDossieAprovacao(magro);
    assert.doesNotMatch(dossie, /\[object Object\]/, "nunca [object Object]");
    assert.match(dossie, /não disponível|n\/d|—/i, "marca o que falta, não inventa");
  });

  it("o briefing gerado por `next` na etapa 10 contém o dossiê (integração)", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
    const e = carregarEstado(FEATURE);
    e.etapaAtual = "aprovacao_humana";
    Object.assign(e, estadoRico(), { feature: FEATURE });
    // pré-condições restantes presentes (o motor exige os 9 outputs)
    e.dag_output = "m"; e.descoberta_output = "c"; e.gap_output = "g";
    e.mapa_dependencias_output = "ma"; e.implementacao_output = "im";
    salvarEstado(e);
    assert.equal(main(["next", FEATURE]), 0);
    assert.ok(existsSync(briefingPath(FEATURE, "aprovacao_humana")), "briefing gerado");
    const brief = readFileSync(briefingPath(FEATURE, "aprovacao_humana"), "utf8");
    assert.match(brief, /Lista de CLIs com filtro/, "o briefing embute o dossiê derivado do estado");
    assert.doesNotMatch(brief, /\{dossie_aprovacao\}/, "o placeholder foi substituído, não deixado cru");
    limpar();
  });
});
