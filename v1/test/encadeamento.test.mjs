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
import { CATALOGO_LENTES, CATALOGO_WCAG } from "../pipeline.config.mjs";

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
const OUT_MAPA = {
  unidades: [
    { id: "U1", nome: "args array", objetivo: "converter", arquivos: ["a.tsx", "b.tsx"], ancora: ["GAP-1"], depende_de: [] },
    { id: "U2", nome: "paginação", objetivo: "string", arquivos: ["c.tsx"], ancora: ["GAP-4"], depende_de: [] },
    { id: "U3", nome: "render", objetivo: "exibir", arquivos: ["a.tsx"], ancora: ["GAP-2"], depende_de: ["U1"] },
  ],
  ordem: ["U1", "U2", "U3"],
  paralelizavel: [{ grupo: ["U1", "U2"], justificativa: "U1 a/b.tsx; U2 c.tsx — disjuntos" }],
  walking_skeleton: { necessario: "não", justificativa: "a aba já roda end-to-end" },
  ancoragem_no_gos: ["nenhuma unidade executa o agente"],
};
// Handoff que ancora em ids REAIS dos outputs promovidos (GAP-1 do OUT_GAP, CA-01 do OUT_DESIGN, U1 do OUT_MAPA)
// — a regraAncoraRastreavel cruza com o estado real, então âncora-fantasma aqui quebraria o encadeamento.
const OUT_IMPL = {
  resumo: "Aplica U1 (args→array) ancorado nos gaps/critérios reais; corrige o contrato confirmado.",
  arquivos_alterados: [
    { arquivo: "a.tsx", mudanca: "args: array posicional na ordem de command.arguments[], nunca objeto", ancora: ["GAP-1", "CA-01", "U1"], confianca: "confirmado" },
  ],
  golden_path_test: { given: "agente válido, comando #arch, campo preenchido", when: "clica Renderizar prompt",
    then: "chama commands/run com args:['teste'] (ARRAY) e exibe data.prompt; sem ValidationError", verifica: ["CA-01"] },
  riscos_de_regressao: ["ArgsForm é consumido por app-run-section.tsx — manter fallback se result não tiver 'prompt'"],
  prontidao: [
    { gate: "tsc", estado: "verde", evidencia: "tsc --noEmit → exit 0" },
    { gate: "check:contracts", estado: "nao_aplicavel", evidencia: "sem script no projeto" },
    { gate: "vitest", estado: "verde", evidencia: "vitest run → 3 passed, exit 0" },
    { gate: "integrity-check", estado: "nao_aplicavel", evidencia: "gate da máquina, não da feature" },
    { gate: "placeholders", estado: "verde", evidencia: "zero TODO nos arquivos" },
    { gate: "hardcode", estado: "verde", evidencia: "sem dado hardcoded" },
  ],
  no_gos_respeitados: ["não executa o agente — só renderiza"],
};
// Gate A honesto: TODAS as lentes do catálogo declaradas (cobertura total exigida); APROVA com 0 exigências.
const OUT_GATEA = {
  veredito: "APROVA",
  resumo: "Diff ancorado e mínimo; lentes aplicáveis cobertas, demais não se aplicam.",
  lentes: CATALOGO_LENTES.map((L, i) => (i === 0
    ? { lente: L.nome, situacao: "coberta", nota: "tratado no diff" }
    : { lente: L.nome, situacao: "nao_aplicavel", nota: "não se aplica a esta correção de contrato" })),
  issues: [],
  p0_coberto: "sim",
  exigencias_antes_de_mergear: [],
};
// Acessibilidade honesta: TODOS os critérios WCAG declarados (cobertura total); 1 coberto com evidência, o
// resto N/A com motivo substantivo. aprovado com 0 issue 'alta'.
const OUT_A11Y = {
  veredito: "aprovado",
  resumo: "Operei a tela: foco/teclado sadios; form/modal/drag não se aplicam a este diff.",
  criterios: CATALOGO_WCAG.map((W) => (
    /2\.4\.3|focus order/.test(W.re.source)
      ? { criterio: W.nome, situacao: "coberto", evidencia_operacional: "Tab percorreu input→botão na ordem visual (activeElement registrado)" }
      : { criterio: W.nome, situacao: "nao_aplicavel", evidencia_operacional: "feature de correção de contrato sem este padrão de interação; não se aplica" })),
  issues: [],
  fica_para_humano: ["confirmar com leitor de tela real na etapa 10"],
};
// Gate B honesto: endereça CA-01 (o único critério do OUT_DESIGN promovido). A regraCriteriosDoDesignCobertos
// cruza com design_output.criterios_aceitacao[].id — não endereçar CA-01 reprovaria. veredito=verificado, todos
// conferem com evidência real (request+response), avança para a etapa 10 (fail-closed: só verificado passa).
const OUT_GATEB = {
  veredito: "verificado",
  resumo: "Confrontei CA-01 com a API ao vivo (read-only): a lista carrega de fato; confere.",
  criterios: [
    { criterio: "CA-01: abre e exibe a lista, nunca spinner infinito", situacao: "confere",
      evidencia: "Request real: POST /api/ravi/commands/list {agent:'main'} → 200, data.items com 1 item ({id:'arch'}). Asserção: a lista carrega ao vivo, sem spinner preso.",
      motivo: null },
  ],
  fica_para_humano: ["confirmar a janela de acesso ao ambiente de produção"],
};

describe("Encadeamento real DAG → … → Gate A → Acessibilidade → Gate B (fluxo do motor, sem injeção manual)", () => {
  after(() => limpar());

  it("as 9 etapas reais se encadeiam: cada pré-condição é PRODUZIDA pela etapa anterior", () => {
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
    assert.ok(carregarEstado(FEATURE).design_output, "motor promoveu design_output");
    assert.equal(carregarEstado(FEATURE).etapaAtual, "mapa_dependencias", "avançou para Mapa de dependências");

    // ETAPA 5 (Mapa) — exige as 4 anteriores, TODAS promovidas pelas etapas anteriores.
    assert.equal(main(["next", FEATURE]), 0, "next Mapa ok (4 pré-condições presentes)");
    assert.ok(existsSync(briefingPath(FEATURE, "mapa_dependencias")), "briefing Mapa gerado");
    escrever("mapa_dependencias", OUT_MAPA);
    assert.equal(main(["advance", FEATURE]), 0, "advance Mapa aprova");
    assert.ok(carregarEstado(FEATURE).mapa_dependencias_output, "motor promoveu mapa_dependencias_output");
    assert.equal(carregarEstado(FEATURE).etapaAtual, "implementacao", "avançou para Implementação");

    // ETAPA 6 (Implementação) — exige as 5 anteriores. E a regraAncoraRastreavel CRUZA as âncoras de OUT_IMPL
    // com os ids reais de gap/design/mapa PROMOVIDOS — prova que a rastreabilidade funciona no fluxo real
    // (não em estado montado à mão). Âncora-fantasma aqui reprovaria o advance.
    assert.equal(main(["next", FEATURE]), 0, "next Implementação ok (5 pré-condições presentes)");
    assert.ok(existsSync(briefingPath(FEATURE, "implementacao")), "briefing Implementação gerado");
    escrever("implementacao", OUT_IMPL);
    assert.equal(main(["advance", FEATURE]), 0, "advance Implementação aprova (âncoras cruzam com a fonte real)");
    assert.ok(carregarEstado(FEATURE).implementacao_output, "motor promoveu implementacao_output");
    assert.equal(carregarEstado(FEATURE).etapaAtual, "gate_a", "avançou para Gate A");

    // ETAPA 7 (Gate A) — exige as 6 anteriores. O briefing injeta TODAS as lentes; o revisor as declara. O
    // porteiro NÃO exige APROVA (REPROVA seria sucesso) — aqui APROVA com 0 exigências (coerente).
    assert.equal(main(["next", FEATURE]), 0, "next Gate A ok (6 pré-condições presentes)");
    assert.ok(existsSync(briefingPath(FEATURE, "gate_a")), "briefing Gate A gerado");
    escrever("gate_a", OUT_GATEA);
    assert.equal(main(["advance", FEATURE]), 0, "advance Gate A aprova (revisão bem-feita, cobertura total)");
    assert.ok(carregarEstado(FEATURE).gate_a_output, "motor promoveu gate_a_output");
    assert.equal(carregarEstado(FEATURE).etapaAtual, "acessibilidade", "avançou para Acessibilidade");

    // ETAPA 8 (Acessibilidade) — exige as 7 anteriores. O briefing injeta o catálogo WCAG; o verificador opera
    // a tela e declara cada critério. aprovado com 0 issue 'alta' (coerente).
    assert.equal(main(["next", FEATURE]), 0, "next Acessibilidade ok (7 pré-condições presentes)");
    assert.ok(existsSync(briefingPath(FEATURE, "acessibilidade")), "briefing Acessibilidade gerado");
    escrever("acessibilidade", OUT_A11Y);
    assert.equal(main(["advance", FEATURE]), 0, "advance Acessibilidade aprova (verificação bem-feita, cobertura total)");
    assert.equal(carregarEstado(FEATURE).etapaAtual, "gate_b", "avançou para Gate B");

    // ETAPA 9 (Gate B) — exige as 8 anteriores. O fiscal confronta CA-01 (do design_output PROMOVIDO) com a API
    // ao vivo. A regraCriteriosDoDesignCobertos cruza com os ids reais; veredito=verificado avança (fail-closed).
    assert.equal(main(["next", FEATURE]), 0, "next Gate B ok (8 pré-condições presentes)");
    assert.ok(existsSync(briefingPath(FEATURE, "gate_b")), "briefing Gate B gerado");
    escrever("gate_b", OUT_GATEB);
    assert.equal(main(["advance", FEATURE]), 0, "advance Gate B aprova (verificado ao vivo, CA-01 endereçado)");
    assert.ok(carregarEstado(FEATURE).gate_b_output, "motor promoveu gate_b_output");
    assert.equal(carregarEstado(FEATURE).etapaAtual, "aprovacao_humana", "avançou para Aprovação humana (etapa 10)");

    // Encadeamento provado: 9 etapas percorridas pelo fluxo real, cada uma destravada pela anterior.
    assert.deepEqual(carregarEstado(FEATURE).concluidas, ["dag", "descoberta", "gap", "design", "mapa_dependencias", "implementacao", "gate_a", "acessibilidade", "gate_b"]);
  });

  it("PROVA da rastreabilidade no fluxo real: âncora-FANTASMA na etapa 6 BLOQUEIA o advance", () => {
    // Percorre até a etapa 6 e tenta avançar com uma âncora que NÃO existe nos outputs promovidos.
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
    for (const [id, out] of [["dag", OUT_DAG], ["descoberta", OUT_DESC], ["gap", OUT_GAP], ["design", OUT_DESIGN], ["mapa_dependencias", OUT_MAPA]]) {
      assert.equal(main(["next", FEATURE]), 0);
      escrever(id, out);
      assert.equal(main(["advance", FEATURE]), 0);
    }
    assert.equal(main(["next", FEATURE]), 0);
    const fantasma = { ...OUT_IMPL, arquivos_alterados: [{ ...OUT_IMPL.arquivos_alterados[0], ancora: ["GAP-INEXISTENTE"] }] };
    escrever("implementacao", fantasma);
    assert.equal(main(["advance", FEATURE]), 1, "âncora-fantasma reprova no fluxo real (cruza com gap/design/mapa promovidos)");
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
