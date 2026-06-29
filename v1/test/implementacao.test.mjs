// implementacao.test.mjs — testes próprios da etapa 6 (Implementação). Foco nas regras: âncora não-órfã +
// RASTREÁVEL (existe na fonte, B-restrito), prontidão com prova (verde→evidência, n/a→motivo), os 6 gates
// declarados, confiança inferida com nota, e pré-condições (as 5 etapas anteriores). Espelha mapa.test.mjs.
// A etapa 6 é a 1ª que usa o ESTADO nas regras (A015) — então o setup promove gap/design/mapa_output reais.

import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { main, outputPath, briefingPath, featureDir, carregarEstado, salvarEstado } from "../dag.mjs";
import { etapaPorId } from "../pipeline.config.mjs";

const FEATURE = "impl-test";
function limpar() { rmSync(featureDir(FEATURE), { recursive: true, force: true }); }

// ids que o setup promove nos outputs anteriores (a âncora do handoff tem que existir entre estes).
const GAP_OUT = { gaps: [{ id: "GAP-001" }, { id: "GAP-002" }], no_gos: [{ o_que: "executar agente" }] };
const DESIGN_OUT = { criterios_aceitacao: [{ id: "CA-04" }], riscos_premortem: [{ id: "R1" }], adrs: [{ id: "ADR-002" }] };
const MAPA_OUT = { unidades: [{ id: "U1" }, { id: "U2" }] };

function handoffValido() {
  return {
    resumo: "Corrige o contrato args (objeto→array) ancorado nos gaps/critérios reais.",
    arquivos_alterados: [
      { arquivo: "a.tsx", mudanca: "args → array posicional na ordem de command.arguments[]", ancora: ["GAP-001", "CA-04", "U1"], confianca: "confirmado" },
      { arquivo: "c.tsx", mudanca: "limit/offset como STRING", ancora: ["GAP-002", "U2"], confianca: "inferido", nota: "shape de pagination não confirmado ao vivo" },
    ],
    golden_path_test: {
      given: "agente válido com 1 comando #arch e campo 'pergunta'='teste'",
      when: "usuário clica em Renderizar prompt",
      then: "chama commands/run com args:['teste'] (ARRAY) e a UI exibe data.prompt; sem ValidationError",
      verifica: ["CA-04"],
    },
    riscos_de_regressao: ["ArgsForm é consumido por app-run-section.tsx (mesmo diretório) — manter fallback se result não tiver 'prompt'"],
    prontidao: [
      { gate: "tsc", estado: "verde", evidencia: "tsc --noEmit → exit 0, 0 erros" },
      { gate: "check:contracts", estado: "nao_aplicavel", evidencia: "projeto não tem script check:contracts" },
      { gate: "vitest", estado: "verde", evidencia: "vitest run → 4 passed, exit 0" },
      { gate: "integrity-check", estado: "nao_aplicavel", evidencia: "gate da state machine, não da feature" },
      { gate: "placeholders", estado: "verde", evidencia: "zero TODO/FIXME nos arquivos alterados" },
      { gate: "hardcode", estado: "verde", evidencia: "sem dado hardcoded; limites de constante de domínio" },
    ],
    no_gos_respeitados: ["não executa o agente — só renderiza o prompt"],
  };
}

// Prepara a feature na etapa 6 com os outputs anteriores PROMOVIDOS no estado (a âncora cruza com eles).
function prepararEAvaliar(h) {
  limpar();
  assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
  const e = carregarEstado(FEATURE);
  e.etapaAtual = "implementacao";
  e.dag_output = "mapa"; e.descoberta_output = "contrato";
  e.gap_output = GAP_OUT; e.design_output = DESIGN_OUT; e.mapa_dependencias_output = MAPA_OUT;
  salvarEstado(e);
  writeFileSync(outputPath(FEATURE, "implementacao"), JSON.stringify(h), "utf8");
  return main(["advance", FEATURE]);
}

describe("Etapa 6 — Implementação", () => {
  after(() => limpar());

  it("declara executor (implementador), enum, precondicoes (5 etapas) e schema", () => {
    const d = etapaPorId("implementacao");
    assert.equal(d.executor.nome, "frontend/typescript/fullstack");
    assert.ok(d.precondicoes.includes("mapa_dependencias_output"), "precondicao mapa_dependencias_output");
    assert.ok(d.schemaEstrutural.arquivos_alterados && d.schemaEstrutural.prontidao);
  });

  it("APROVA um handoff válido", () => {
    assert.equal(prepararEAvaliar(handoffValido()), 0);
    assert.equal(carregarEstado(FEATURE).etapaAtual, "gate_a", "avançou para Gate A");
  });

  // --- Âncora: não-órfã + RASTREÁVEL (B-restrito, A014) ---

  it("REPROVA mudança SEM âncora (código órfão = inventado)", () => {
    const h = handoffValido();
    delete h.arquivos_alterados[0].ancora;
    assert.equal(prepararEAvaliar(h), 1, "mudança sem âncora deve REPROVAR");
  });

  it("REPROVA âncora-FANTASMA (id que não existe em nenhum output anterior)", () => {
    const h = handoffValido();
    h.arquivos_alterados[0].ancora = ["GAP-999"]; // GAP-999 não está em GAP_OUT/DESIGN_OUT/MAPA_OUT
    assert.equal(prepararEAvaliar(h), 1, "âncora inexistente na fonte deve REPROVAR");
  });

  it("a âncora cruza com TODOS os tipos de fonte (gap, critério, ADR, unidade)", () => {
    const h = handoffValido();
    h.arquivos_alterados[0].ancora = ["ADR-002", "R1"]; // ambos existem em DESIGN_OUT
    assert.equal(prepararEAvaliar(h), 0, "âncoras a ADR e risco reais devem PASSAR");
  });

  it("SEM fonte indexável no estado, a rastreabilidade NÃO reprova (limite honesto: nao_verificavel)", () => {
    // Estado sem nenhum *_output com array-de-ids → não dá para cruzar → não reprova (só forma).
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
    const e = carregarEstado(FEATURE);
    e.etapaAtual = "implementacao";
    e.dag_output = "x"; e.descoberta_output = "y"; e.gap_output = "z"; e.design_output = "w"; e.mapa_dependencias_output = "v"; // strings, sem ids
    salvarEstado(e);
    writeFileSync(outputPath(FEATURE, "implementacao"), JSON.stringify(handoffValido()), "utf8");
    assert.equal(main(["advance", FEATURE]), 0, "sem fonte indexável, não cruza — aprova pela forma");
  });

  // --- Prontidão: verde→evidência, n/a→motivo, 6 gates declarados ---

  it("REPROVA gate 'verde' SEM evidência (réu virando juiz)", () => {
    const h = handoffValido();
    h.prontidao[0].evidencia = ""; // tsc verde sem prova
    assert.equal(prepararEAvaliar(h), 1, "verde sem evidência deve REPROVAR");
  });

  it("REPROVA gate 'nao_aplicavel' SEM motivo (a fuga 'marco tudo N/A')", () => {
    const h = handoffValido();
    h.prontidao[1].evidencia = ""; // check:contracts n/a sem motivo
    assert.equal(prepararEAvaliar(h), 1, "nao_aplicavel sem motivo deve REPROVAR");
  });

  it("REPROVA quando falta declarar um dos 6 gates do catálogo oficial", () => {
    const h = handoffValido();
    h.prontidao = h.prontidao.filter((p) => p.gate !== "integrity-check"); // omite 1 gate
    assert.equal(prepararEAvaliar(h), 1, "gate omitido = prestação de contas incompleta = REPROVA");
  });

  it("REPROVA estado de gate fora do enum (ex.: 'amarelo')", () => {
    const h = handoffValido();
    h.prontidao[0].estado = "amarelo";
    assert.equal(prepararEAvaliar(h), 1, "estado fora de {verde,vermelho,nao_aplicavel} REPROVA");
  });

  // --- Confiança inferida exige nota (INV-5) ---

  it("REPROVA mudança 'inferido' SEM nota", () => {
    const h = handoffValido();
    delete h.arquivos_alterados[1].nota; // a c.tsx é inferido
    assert.equal(prepararEAvaliar(h), 1, "inferido sem nota deve REPROVAR");
  });

  it("APROVA mudança 'confirmado' sem nota (nota só é exigida p/ inferido)", () => {
    const h = handoffValido();
    // a[0] já é confirmado e não tem nota — deve passar
    assert.equal(prepararEAvaliar(h), 0);
  });

  // --- Golden path: then observável + verifica ---

  it("REPROVA golden_path sem 'then'", () => {
    const h = handoffValido();
    delete h.golden_path_test.then;
    assert.equal(prepararEAvaliar(h), 1, "golden_path sem then deve REPROVAR");
  });

  it("REPROVA golden_path sem 'verifica'", () => {
    const h = handoffValido();
    delete h.golden_path_test.verifica;
    assert.equal(prepararEAvaliar(h), 1);
  });

  // --- Riscos de regressão obrigatórios ---

  it("REPROVA quando riscos_de_regressao está vazio", () => {
    const h = handoffValido();
    h.riscos_de_regressao = [];
    assert.equal(prepararEAvaliar(h), 1, "≥1 risco é obrigatório");
  });

  // --- Pré-condição (encanamento): precisa das 5 etapas anteriores ---

  it("next BLOQUEIA quando falta mapa_dependencias_output (mesmo com as outras 4)", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
    const e = carregarEstado(FEATURE);
    e.etapaAtual = "implementacao";
    e.dag_output = "m"; e.descoberta_output = "c"; e.gap_output = "g"; e.design_output = "d"; // sem mapa
    salvarEstado(e);
    assert.equal(main(["next", FEATURE]), 1, "sem mapa_dependencias_output, next bloqueia");
    assert.ok(!existsSync(briefingPath(FEATURE, "implementacao")), "briefing não gerado");
  });

  // --- Casos perigosos achados pela revisão cega (W1/W2 + adversariais) ---

  it("REPROVA âncora-fantasma mesmo com fonte ANINHADA FUNDO (W2: varredura recursiva)", () => {
    // A fonte tem os ids só em profundidade 2 (gap_output.bloco.itens[].id). Antes da correção, a varredura
    // rasa não os via → temFonte=false → desligava a regra → fantasma passava. Agora deve achar e reprovar.
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
    const e = carregarEstado(FEATURE);
    e.etapaAtual = "implementacao";
    e.dag_output = "x"; e.descoberta_output = "y";
    e.gap_output = { bloco: { itens: [{ id: "GAP-001" }] } }; // id aninhado 2 níveis
    e.design_output = "w"; e.mapa_dependencias_output = "v";
    salvarEstado(e);
    const h = handoffValido();
    h.arquivos_alterados = [{ arquivo: "a.tsx", mudanca: "x", ancora: ["GAP-999"], confianca: "confirmado" }]; // fantasma
    writeFileSync(outputPath(FEATURE, "implementacao"), JSON.stringify(h), "utf8");
    assert.equal(main(["advance", FEATURE]), 1, "fantasma deve REPROVAR mesmo com fonte aninhada (recursivo achou GAP-001)");
  });

  it("ACEITA âncora a id aninhado fundo (a varredura recursiva o alcança)", () => {
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
    const e = carregarEstado(FEATURE);
    e.etapaAtual = "implementacao";
    e.dag_output = "x"; e.descoberta_output = "y";
    e.gap_output = { bloco: { itens: [{ id: "GAP-001" }] } };
    e.design_output = "w"; e.mapa_dependencias_output = "v";
    salvarEstado(e);
    const h = handoffValido();
    h.arquivos_alterados = [{ arquivo: "a.tsx", mudanca: "x", ancora: ["GAP-001"], confianca: "confirmado" }];
    writeFileSync(outputPath(FEATURE, "implementacao"), JSON.stringify(h), "utf8");
    assert.equal(main(["advance", FEATURE]), 0, "âncora a id aninhado real deve PASSAR");
  });

  it("id ESPÚRIO (fora do formato de âncora) NÃO valida uma fantasma (W1: filtro de namespace)", () => {
    // design_output tem estados[].id="estado-loading" (id de UI, não-requisito). Ancorar nele deve REPROVAR
    // — RE_ID_ANCORA (PREFIXO-dígito) não casa "estado-loading", então ele não entra no set de ids válidos.
    const h = handoffValido();
    h.arquivos_alterados = [{ arquivo: "a.tsx", mudanca: "x", ancora: ["estado-loading"], confianca: "confirmado" }];
    // injeta um id espúrio na fonte do setup padrão:
    limpar();
    assert.equal(main(["init", FEATURE, "--entry", "X", "--root", "/p"]), 0);
    const e = carregarEstado(FEATURE);
    e.etapaAtual = "implementacao";
    e.dag_output = "x"; e.descoberta_output = "y"; e.gap_output = GAP_OUT;
    e.design_output = { ...DESIGN_OUT, estados: [{ id: "estado-loading", estado: "loading" }] };
    e.mapa_dependencias_output = MAPA_OUT;
    salvarEstado(e);
    writeFileSync(outputPath(FEATURE, "implementacao"), JSON.stringify(h), "utf8");
    assert.equal(main(["advance", FEATURE]), 1, "id espúrio (estado-loading) não é âncora válida → REPROVA");
  });

  it("REPROVA gate 'vermelho' SEM evidência (todo estado carrega justificativa — irmã de verde/n-a)", () => {
    const h = handoffValido();
    h.prontidao[0] = { gate: "tsc", estado: "vermelho", evidencia: "" }; // vermelho sem o erro
    assert.equal(prepararEAvaliar(h), 1, "vermelho sem evidência deve REPROVAR");
  });

  it("APROVA gate 'vermelho' COM o erro descrito (handoff honesto sobre o que falhou)", () => {
    const h = handoffValido();
    h.prontidao[0] = { gate: "tsc", estado: "vermelho", evidencia: "tsc --noEmit → 2 erros em a.tsx:31 (TS2345)" };
    assert.equal(prepararEAvaliar(h), 0, "vermelho com erro descrito é honesto e passa a forma (Gate A decide o avanço)");
  });

  it("gate DUPLICADO não engana a cobertura (Set): omitir outro ainda REPROVA", () => {
    const h = handoffValido();
    // duplica 'tsc' e remove 'hardcode' — a duplicata não compensa o gate faltante
    h.prontidao.push({ gate: "tsc", estado: "verde", evidencia: "tsc dup → exit 0" });
    h.prontidao = h.prontidao.filter((p) => p.gate !== "hardcode");
    assert.equal(prepararEAvaliar(h), 1, "gate duplicado + um faltando deve REPROVAR (o faltante)");
  });

  it("âncora NUMÉRICA reprova pela forma (lista-de-strings barra number antes da regra)", () => {
    const h = handoffValido();
    h.arquivos_alterados[0].ancora = [123]; // não-string
    assert.equal(prepararEAvaliar(h), 1, "ancora com número reprova (lista-de-strings)");
  });

  it("PARIDADE: todo campo exigido por uma regra de evidência existe no schemaEstrutural (lente A013)", () => {
    // Institucionaliza a lente da A013: um campo condicionalmente obrigatório (ex.: 'nota' p/ inferido) deve
    // estar declarado no schema, senão não aparece na prosa gerada e o executor não o vê.
    const d = etapaPorId("implementacao");
    const campos = d.schemaEstrutural.arquivos_alterados.itemCampos;
    assert.ok("nota" in campos, "'nota' (exigida p/ inferido) deve estar declarada no schema");
  });

  // --- Sincronia do CORE ---

  it("a cópia local cores/CORE-IMPL.md está em sincronia com a fonte", () => {
    const local = readFileSync(new URL("../cores/CORE-IMPL.md", import.meta.url), "utf8");
    const fonte = readFileSync(join(new URL("../", import.meta.url).pathname.replace(/^\//, ""), "..", "etapa-6-implementacao", "CORE-IMPL.md"), "utf8");
    assert.equal(local, fonte, "cores/CORE-IMPL.md divergiu da fonte etapa-6-implementacao/");
  });
});
