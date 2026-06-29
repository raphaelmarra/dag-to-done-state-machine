// encadeamento.test.mjs — prova que as etapas REAIS se encadeiam no FLUXO REAL do motor:
// DAG → Descoberta → GAP, onde o output de cada etapa (promovido pelo motor) satisfaz a pré-condição
// da próxima. Diferente do e2e geral (que usa `advance` direto e mascara a integração), este teste:
//   1. usa next → escreve output → advance (o ciclo real, incluindo a PROMOÇÃO de <etapa>_output);
//   2. NÃO injeta dag_output/descoberta_output à mão — o motor os promove (senão o bug do dag_output
//      inalcançável, achado pela revisão cega, voltaria escondido);
//   3. usa outputs fixos realistas que passam nos porteiros reais das 3 etapas.

import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { main, outputPath, briefingPath, featureDir, carregarEstado } from "../dag.mjs";

const FEATURE = "encadeamento-test";
function limpar() { rmSync(featureDir(FEATURE), { recursive: true, force: true }); }
function escrever(etapaId, obj) { writeFileSync(outputPath(FEATURE, etapaId), JSON.stringify(obj), "utf8"); }

// Outputs fixos que passam nos porteiros reais (estrutura completa de cada etapa).
const OUT_DAG = {
  nos: [{ nome: "commands-tab", tipo: "superfície-UI", path: "a.tsx", shape: "props", hub: "não", confianca: "lido no código" }],
  arestas: [{ consumidor: "commands-tab", provedor: "commands/list", tipo: "consome", custo_reverso: "a-confirmar", confianca: "lido no código" }],
  blast_radius: [{ no: "commands/list", consumido_por: ["commands-tab"], amplitude: "MÉDIA" }],
  fronteira: { nos_folha: ["commands/list"], saidas_1hop: ["api/ravi"], expansoes: [], candidatos_transitivos: [] },
  gaps: [{ id: "G1", prioridade: "P0", acao: "confirmar shape ao vivo" }],
  confianca: { lido: 1, inferido: 0, nao_encontrado: 0 },
};
const OUT_DESC = {
  endpoints_confirmados: [{
    endpoint: "POST /api/ravi/commands/list",
    params: [{ nome: "limit", tipo: "string opcional", obrigatorio: "não" }],
    shape_resposta: "{ data: { items[] } }",
    limites: "limit STRING; teto não determinado",
    bordas: "items≡commands duplicados",
    confianca: "confirmado ao vivo",
    evidencia_ao_vivo: { chamou: "{}", retornou: "total:1" },
  }],
  resumo_confianca: { confirmado_ao_vivo: "1", inferido: "0", nao_verificado: "0" },
};
const OUT_GAP = {
  gaps: [{ id: "GAP-1", descricao: "args objeto→array", prioridade: "P0", categoria: "quebra",
           evidencia: "Descoberta commands/run + x.tsx:31", confianca: "confirmado na descoberta" }],
  pronto_para_reuso: [{ item: "ravi()", por_que_serve: "transporte confirmado" }],
  no_gos: [{ o_que: "executar agente", motivo: "run só renderiza", destino: "de-proposito" }],
  incertezas: [{ incerteza: "fonte de args", spike: "rastrear cadeia" }],
  complexidade: { banda: "média", drivers: { p0: 1, p1: 0, integracoes: 1, incertezas: 1, exige_infra_nova: "não" }, justificativa: "1 P0 sobre base existente" },
  resumo: { total_gaps: 1, p0: 1 },
};
const OUT_DESIGN = {
  three_amigos: [{ comportamento: "listar", por_que: "ver comandos", como: "commands/list", criterios: ["CA-01"] }],
  criterios_aceitacao: [{ id: "CA-01", given: "agente válido", when: "abre", then: "exibe lista, NUNCA spinner infinito" }],
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

describe("Encadeamento real DAG → Descoberta → GAP → Design (fluxo do motor, sem injeção manual)", () => {
  after(() => limpar());

  it("as 4 etapas reais se encadeiam: cada pré-condição é PRODUZIDA pela etapa anterior", () => {
    limpar();
    // init com o que o motor não promove (entry_point/project_root vêm do operador).
    assert.equal(main(["init", FEATURE, "--entry", "aba CLIs", "--root", "/proj"]), 0);
    assert.equal(carregarEstado(FEATURE).etapaAtual, "dag", "começa no DAG");

    // ETAPA 1 (DAG) — gera briefing, escreve output, avança.
    assert.equal(main(["next", FEATURE]), 0, "next DAG ok");
    assert.ok(existsSync(briefingPath(FEATURE, "dag")), "briefing DAG gerado");
    escrever("dag", OUT_DAG);
    assert.equal(main(["advance", FEATURE]), 0, "advance DAG aprova");
    // O motor PROMOVEU dag_output — sem isso a etapa 2 bloquearia. NÃO injetamos à mão.
    assert.ok(carregarEstado(FEATURE).dag_output, "motor promoveu dag_output");
    assert.equal(carregarEstado(FEATURE).etapaAtual, "descoberta", "avançou para Descoberta");

    // ETAPA 2 (Descoberta) — a pré-condição dag_output JÁ existe (promovida). next NÃO bloqueia.
    assert.equal(main(["next", FEATURE]), 0, "next Descoberta ok (dag_output presente)");
    assert.ok(existsSync(briefingPath(FEATURE, "descoberta")), "briefing Descoberta gerado");
    escrever("descoberta", OUT_DESC);
    assert.equal(main(["advance", FEATURE]), 0, "advance Descoberta aprova");
    assert.ok(carregarEstado(FEATURE).descoberta_output, "motor promoveu descoberta_output");
    assert.equal(carregarEstado(FEATURE).etapaAtual, "gap", "avançou para GAP");

    // ETAPA 3 (GAP) — exige dag_output E descoberta_output, AMBOS promovidos pelas etapas anteriores.
    assert.equal(main(["next", FEATURE]), 0, "next GAP ok (dag_output E descoberta_output presentes)");
    assert.ok(existsSync(briefingPath(FEATURE, "gap")), "briefing GAP gerado");
    escrever("gap", OUT_GAP);
    assert.equal(main(["advance", FEATURE]), 0, "advance GAP aprova");
    assert.ok(carregarEstado(FEATURE).gap_output, "motor promoveu gap_output");
    assert.equal(carregarEstado(FEATURE).etapaAtual, "design", "avançou para Design");

    // ETAPA 4 (Design) — exige dag+descoberta+gap, TODOS promovidos pelas etapas anteriores.
    assert.equal(main(["next", FEATURE]), 0, "next Design ok (3 pré-condições presentes)");
    assert.ok(existsSync(briefingPath(FEATURE, "design")), "briefing Design gerado");
    escrever("design", OUT_DESIGN);
    assert.equal(main(["advance", FEATURE]), 0, "advance Design aprova");
    assert.equal(carregarEstado(FEATURE).etapaAtual, "mapa_dependencias", "avançou para Mapa de dependências");

    // Encadeamento provado: 4 etapas percorridas pelo fluxo real, cada uma destravada pela anterior.
    assert.deepEqual(carregarEstado(FEATURE).concluidas, ["dag", "descoberta", "gap", "design"]);
  });

  it("o output promovido (objeto) aparece LEGÍVEL no briefing da próxima etapa, não '[object Object]'", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "aba CLIs", "--root", "/proj"]), 0);
    assert.equal(main(["next", FEATURE]), 0);
    escrever("dag", OUT_DAG);
    assert.equal(main(["advance", FEATURE]), 0);
    assert.equal(main(["next", FEATURE]), 0); // gera o briefing da Descoberta
    const briefing = readFileSync(briefingPath(FEATURE, "descoberta"), "utf8");
    assert.doesNotMatch(briefing, /\[object Object\]/, "dag_output não pode virar [object Object]");
    // o conteúdo real do output (um nome de nó) deve aparecer — o executor precisa do insumo de verdade
    assert.match(briefing, /commands-tab/, "o conteúdo do dag_output promovido aparece no briefing");
  });

  it("PROVA NEGATIVA: pular a promoção (não rodar advance do DAG) BLOQUEIA a Descoberta", () => {
    // Se o encanamento dependesse de injeção manual, este teste passaria indevidamente. Aqui ele
    // confirma que a Descoberta SÓ roda porque o DAG foi de fato concluído (promovendo dag_output).
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
    // força a etapa para 'descoberta' SEM ter concluído o DAG (sem dag_output no estado)
    const e = carregarEstado(FEATURE);
    e.etapaAtual = "descoberta";
    writeFileSync(featureDir(FEATURE) + "/state.json", JSON.stringify(e), "utf8");
    assert.equal(main(["next", FEATURE]), 1, "sem dag_output promovido, Descoberta BLOQUEIA");
  });
});
