// gate_a.test.mjs — testes próprios da etapa 7 (Gate A — Revisão adversarial). Foco nas regras: cobertura
// TOTAL do catálogo de lentes, veredito coerente com exigências (o pivô), issue acionável, descoberta vira
// issue (circuito). Mais: o INVARIANTE "toda lente casa o próprio nome" (pegou um bug real na construção) e a
// injeção do catálogo no briefing. Espelha implementacao.test.mjs. A etapa 7 NÃO usa o estado nas regras.

import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { main, outputPath, briefingPath, featureDir, carregarEstado, salvarEstado } from "../dag.mjs";
import { etapaPorId, CATALOGO_LENTES } from "../pipeline.config.mjs";

const FEATURE = "gatea-test";
function limpar() { rmSync(featureDir(FEATURE), { recursive: true, force: true }); }

// Gera as lentes cobrindo TODO o catálogo: uma "coberta", o resto "nao_aplicavel" com motivo. (cada nome casa
// o próprio regex da lente — invariante testado abaixo.)
function lentesCompletas(situacaoPorIndice = {}) {
  return CATALOGO_LENTES.map((L, i) => ({
    lente: L.nome,
    situacao: situacaoPorIndice[i] ?? (i === 0 ? "coberta" : "nao_aplicavel"),
    nota: i === 0 ? "tratado no diff (a.tsx)" : "não se aplica a esta feature de correção de contrato",
  }));
}

// Revisão APROVA válida: catálogo completo, sem descobertas, sem issues, sem exigências.
function revisaoAprova() {
  return {
    veredito: "APROVA",
    resumo: "Diff mínimo e ancorado; lentes aplicáveis cobertas, demais não se aplicam.",
    lentes: lentesCompletas(),
    issues: [],
    p0_coberto: "sim",
    exigencias_antes_de_mergear: [],
  };
}

// Revisão REPROVA válida: a lente 0 vira descoberta + issue que a cita + exigência.
function revisaoReprova() {
  const lentes = lentesCompletas({ 0: "descoberta" });
  lentes[0].nota = "falta tratar o estado vazio com mensagem própria";
  return {
    veredito: "REPROVA",
    resumo: "Estado vazio descoberto — bloqueia o merge.",
    lentes,
    issues: [{ id: "ISS-01", severidade: "alta", lente: CATALOGO_LENTES[0].nome,
               localizacao: "a.tsx (sem branch de vazio)", descricao: "lista vazia cai no mesmo render de erro",
               acao: "adicionar estado 'lista_vazia' distinto com CTA" }],
    p0_coberto: "não",
    exigencias_antes_de_mergear: ["Adicionar tratamento de estado vazio distinto (ISS-01)."],
  };
}

function prepararEAvaliar(rev) {
  limpar();
  assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
  const e = carregarEstado(FEATURE);
  e.etapaAtual = "gate_a";
  // as 6 pré-condições (a etapa 7 não cruza nada, mas o motor exige os outputs presentes)
  e.dag_output = "m"; e.descoberta_output = "c"; e.gap_output = "g"; e.design_output = "d";
  e.mapa_dependencias_output = "ma"; e.implementacao_output = "im";
  salvarEstado(e);
  writeFileSync(outputPath(FEATURE, "gate_a"), JSON.stringify(rev), "utf8");
  return main(["advance", FEATURE]);
}

describe("Etapa 7 — Gate A (Revisão adversarial)", () => {
  after(() => limpar());

  it("declara executor (code-reviewer), enum, precondicoes (6 etapas) e schema", () => {
    const d = etapaPorId("gate_a");
    assert.equal(d.executor.nome, "code-reviewer");
    assert.ok(d.precondicoes.includes("implementacao_output"), "precondicao implementacao_output");
    assert.ok(d.schemaEstrutural.lentes && d.schemaEstrutural.veredito);
  });

  // --- INVARIANTE de consistência do catálogo (pegou um bug real na construção) ---

  it("INVARIANTE: toda lente do catálogo casa o próprio nome (senão a lente nunca se reconhece)", () => {
    for (const L of CATALOGO_LENTES) {
      assert.ok(L.re.test(L.nome.toLowerCase()), `lente "${L.nome}" não casa o próprio regex ${L.re}`);
    }
  });

  it("INVARIANTE: nenhum regex de lente casa o NOME de OUTRA lente (anti-colisão — achado da revisão cega)", () => {
    // Bug real achado na construção: "ordenação" (re tinha 'ordem') casava "persistência de ordem"; idem
    // "reversibilidade"/rollback e "concorrência"/stale. Uma lente casando o nome de outra deixaria uma do
    // catálogo "coberta" indevidamente. O matching 1-para-1 protege, mas regex disjuntos é a defesa de base.
    for (const L of CATALOGO_LENTES) {
      const casados = CATALOGO_LENTES.filter((O) => L.re.test(O.nome.toLowerCase()));
      assert.equal(casados.length, 1, `regex de "${L.nome}" casa ${casados.length} nomes: ${casados.map((c) => c.nome).join(", ")}`);
    }
  });

  // --- Veredito binário + coerência com exigências (o pivô) ---

  it("APROVA uma revisão válida (catálogo completo, sem exigências)", () => {
    assert.equal(prepararEAvaliar(revisaoAprova()), 0);
    assert.equal(carregarEstado(FEATURE).etapaAtual, "acessibilidade", "avançou");
  });

  it("APROVA uma revisão que REPROVA o diff (REPROVA é sucesso da etapa, não bloqueia o porteiro)", () => {
    // O ponto central da etapa 7: o porteiro NÃO exige veredito APROVA. Uma revisão REPROVA bem-feita PASSA.
    assert.equal(prepararEAvaliar(revisaoReprova()), 0, "revisão REPROVA bem-feita deve PASSAR no porteiro");
    assert.equal(carregarEstado(FEATURE).etapaAtual, "acessibilidade", "avançou (o veredito REPROVA é o conteúdo, não o gate)");
  });

  it("REPROVA (porteiro) veredito fora do enum (ex.: 'depende')", () => {
    const r = revisaoAprova(); r.veredito = "depende";
    assert.equal(prepararEAvaliar(r), 1, "veredito não-binário deve REPROVAR no porteiro");
  });

  it("REPROVA (porteiro) veredito REPROVA SEM exigências (reprovar em silêncio)", () => {
    const r = revisaoReprova(); r.exigencias_antes_de_mergear = [];
    assert.equal(prepararEAvaliar(r), 1, "REPROVA sem exigência deve REPROVAR no porteiro");
  });

  it("REPROVA (porteiro) veredito APROVA COM exigências (contradição: há trabalho antes de mergear)", () => {
    const r = revisaoAprova(); r.exigencias_antes_de_mergear = ["fechar X antes"];
    assert.equal(prepararEAvaliar(r), 1, "APROVA com exigência deve REPROVAR no porteiro");
  });

  it("REPROVA (porteiro) veredito APROVA com p0_coberto 'não' (incoerente — achado do anti-viés)", () => {
    const r = revisaoAprova(); r.p0_coberto = "não";
    assert.equal(prepararEAvaliar(r), 1, "APROVA com P0 não coberto deve REPROVAR no porteiro");
  });

  // --- Cobertura total do catálogo de lentes ---

  it("REPROVA quando UMA lente do catálogo não foi considerada (cobertura incompleta)", () => {
    const r = revisaoAprova();
    r.lentes = r.lentes.filter((l) => l.lente !== CATALOGO_LENTES[5].nome); // remove 1 lente
    assert.equal(prepararEAvaliar(r), 1, "lente do catálogo em silêncio deve REPROVAR");
  });

  it("REPROVA quando a situação de uma lente está fora do enum", () => {
    const r = revisaoAprova(); r.lentes[1].situacao = "talvez";
    assert.equal(prepararEAvaliar(r), 1);
  });

  it("REPROVA lente sem nota (onde/exigência/motivo é sempre obrigatório)", () => {
    const r = revisaoAprova(); r.lentes[1].nota = "";
    assert.equal(prepararEAvaliar(r), 1, "lente sem nota deve REPROVAR");
  });

  it("REPROVA nao_aplicavel com motivo OCO ('n/a', '-', 'não') — a defesa anti-fuga central", () => {
    // O furo achado pelo anti-viés: tudo-N/A com nota "n/a" + APROVA passaria (teatro de revisão). O N/A
    // tem de ter motivo SUBSTANTIVO, não nota-lixo. Testa os principais ocos.
    for (const oco of ["n/a", "N/A", "-", "—", "na", "não", "x", "  -  "]) {
      const r = revisaoAprova(); r.lentes[1].nota = oco;
      assert.equal(prepararEAvaliar(r), 1, `nao_aplicavel com nota oca "${oco}" deve REPROVAR`);
    }
  });

  it("ACEITA nao_aplicavel com motivo REAL (frase que explica por que não se aplica)", () => {
    const r = revisaoAprova();
    r.lentes[1].nota = "feature read-only; não há escrita, logo concorrência de escrita não se aplica";
    assert.equal(prepararEAvaliar(r), 0, "N/A com motivo substantivo deve PASSAR");
  });

  it("REPROVA tudo-N/A com nota oca + APROVA (o cenário-teatro que o anti-viés expôs)", () => {
    const r = {
      veredito: "APROVA", resumo: "tudo ok",
      lentes: CATALOGO_LENTES.map((L) => ({ lente: L.nome, situacao: "nao_aplicavel", nota: "n/a" })),
      issues: [], p0_coberto: "sim", exigencias_antes_de_mergear: [],
    };
    assert.equal(prepararEAvaliar(r), 1, "tudo-N/A com 'n/a' deve REPROVAR (não é revisão de verdade)");
  });

  it("REPROVA veredito APROVA com issue de severidade 'alta' em aberto (incoerência mecânica)", () => {
    const r = revisaoAprova();
    // adiciona uma issue alta mas mantém APROVA sem exigências — incoerente (você marcou alta e aprovou)
    r.issues = [{ id: "ISS-X", severidade: "alta", lente: "coerência", localizacao: "a.tsx", descricao: "bug", acao: "corrigir" }];
    assert.equal(prepararEAvaliar(r), 1, "APROVA com issue alta deve REPROVAR no porteiro");
  });

  // --- Issue acionável ---

  it("REPROVA issue sem localizacao", () => {
    const r = revisaoReprova(); r.issues[0].localizacao = "";
    assert.equal(prepararEAvaliar(r), 1, "issue sem localizacao deve REPROVAR");
  });

  it("REPROVA issue sem acao", () => {
    const r = revisaoReprova(); r.issues[0].acao = "";
    assert.equal(prepararEAvaliar(r), 1, "issue sem acao deve REPROVAR");
  });

  it("REPROVA issue com severidade fora do enum", () => {
    const r = revisaoReprova(); r.issues[0].severidade = "crítica";
    assert.equal(prepararEAvaliar(r), 1);
  });

  // --- Coerência: descoberta vira issue (circuito) ---

  it("REPROVA lente DESCOBERTA sem issue que a acione (descoberta órfã)", () => {
    const r = revisaoReprova();
    // mantém a lente 0 descoberta mas remove a issue que a cita, e troca a exigência p/ não ficar incoerente
    r.issues = [];
    assert.equal(prepararEAvaliar(r), 1, "descoberta sem issue deve REPROVAR");
  });

  it("ACEITA issue SEM lente descoberta correspondente (o inverso é livre — C2)", () => {
    const r = revisaoReprova();
    // adiciona uma issue de coerência que não corresponde a nenhuma lente descoberta — deve passar
    r.issues.push({ id: "ISS-02", severidade: "baixa", lente: "coerência / contrato",
                    localizacao: "design vs descoberta", descricao: "campo X ignorado", acao: "consumir X" });
    assert.equal(prepararEAvaliar(r), 0, "issue sem descoberta correspondente é permitida");
  });

  it("REPROVA issue GENÉRICA que tenta cobrir várias descobertas distintas (W2 — substring largo)", () => {
    // Furo achado pela revisão cega: uma issue lente:"estado" cobria vazio+erro+loading de uma vez. Agora a
    // issue precisa CONTER o nome inteiro da lente descoberta. Uma issue "estado" não cobre "estado de erro".
    const lentes = lentesCompletas({ 1: "descoberta" }); // a lente[1] = "estado de erro"
    lentes[1].nota = "falta distinguir erro";
    const r = {
      veredito: "REPROVA", resumo: "erro descoberto",
      lentes,
      issues: [{ id: "ISS-01", severidade: "alta", lente: "estado", // genérica: NÃO contém "estado de erro"
                 localizacao: "a.tsx", descricao: "estados confusos", acao: "separar" }],
      p0_coberto: "não", exigencias_antes_de_mergear: ["separar estados (ISS-01)"],
    };
    assert.equal(prepararEAvaliar(r), 1, "issue genérica 'estado' não cobre a descoberta 'estado de erro'");
  });

  // --- Injeção do catálogo no briefing ---

  it("o briefing injeta TODAS as lentes do catálogo (o revisor as vê para declarar cada uma)", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
    const e = carregarEstado(FEATURE);
    e.etapaAtual = "gate_a";
    e.dag_output = "m"; e.descoberta_output = "c"; e.gap_output = "g"; e.design_output = "d";
    e.mapa_dependencias_output = "ma"; e.implementacao_output = "im";
    salvarEstado(e);
    assert.equal(main(["next", FEATURE]), 0, "next gera o briefing");
    const briefing = readFileSync(briefingPath(FEATURE, "gate_a"), "utf8");
    for (const L of CATALOGO_LENTES) {
      assert.ok(briefing.includes(L.nome), `o briefing deve listar a lente "${L.nome}"`);
    }
  });

  // --- Pré-condição (encanamento): precisa das 6 etapas anteriores ---

  it("next BLOQUEIA quando falta implementacao_output (mesmo com as outras 5)", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
    const e = carregarEstado(FEATURE);
    e.etapaAtual = "gate_a";
    e.dag_output = "m"; e.descoberta_output = "c"; e.gap_output = "g"; e.design_output = "d"; e.mapa_dependencias_output = "ma"; // sem implementacao
    salvarEstado(e);
    assert.equal(main(["next", FEATURE]), 1, "sem implementacao_output, next bloqueia");
    assert.ok(!existsSync(briefingPath(FEATURE, "gate_a")), "briefing não gerado");
  });

  // --- Sincronia do CORE ---

  it("a cópia local cores/CORE-GATEA.md está em sincronia com a fonte", () => {
    const local = readFileSync(new URL("../cores/CORE-GATEA.md", import.meta.url), "utf8");
    const fonte = readFileSync(join(new URL("../", import.meta.url).pathname.replace(/^\//, ""), "..", "etapa-7-gate-a", "CORE-GATEA.md"), "utf8");
    assert.equal(local, fonte, "cores/CORE-GATEA.md divergiu da fonte etapa-7-gate-a/");
  });
});
