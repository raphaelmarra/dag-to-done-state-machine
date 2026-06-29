// e2e.test.mjs — Teste end-to-end do motor da state machine (RF-007).
// Prova: caminho feliz (13 etapas init→done), porteiro bloqueia sem output,
// porteiro bloqueia output inválido. Roda os verbos via main() (sem spawn).

import { describe, it, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { rmSync, writeFileSync } from "node:fs";
import { main, carregarEstado, outputPath, featureDir, statePath, estaCompleto } from "../dag.mjs";
import { PIPELINE, PRIMEIRA_ETAPA, CATALOGO_LENTES } from "../pipeline.config.mjs";

const FEATURE = "e2e-test";

// Gera um valor que satisfaz uma forma do schemaEstrutural — RECURSIVO (espelha o validador).
function valorParaForma(forma, etapa) {
  if (forma.tipo === "lista-de-objetos") {
    const item = {};
    for (const [campo, regra] of Object.entries(forma.itemCampos || {})) {
      if (regra.obrigatorio || !regra.tipo) item[campo] = valorParaForma(regra, etapa);
    }
    return [item];
  }
  if (forma.tipo === "objeto") {
    const obj = {};
    for (const [campo, regra] of Object.entries(forma.campos || {})) {
      if (regra.obrigatorio) obj[campo] = valorParaForma(regra, etapa);
      else if (regra.presente) obj[campo] = regra.tipo === "lista-de-strings" ? [] : []; // presente: lista vazia ok
    }
    if (Object.keys(obj).length === 0) obj.x = 1; // objeto sem campos exigidos: não-vazio
    return obj;
  }
  if (forma.tipo === "lista-de-strings") return ["s"];
  // escalar: primeiro valor do enum, ou "x"
  const enumV = typeof forma.enum === "function" ? forma.enum(etapa) : forma.enum;
  return enumV && enumV.length ? enumV[0] : "x";
}

// Gera um output VÁLIDO para uma etapa. Se a etapa tem schemaEstrutural, gera a forma rica a partir
// dele (dinâmico); senão, preenche cada campo do schema com ["item"]. Aplica exceções de valor exato.
function outputValido(etapa) {
  const out = {};
  if (etapa.schemaEstrutural) {
    for (const [campo, forma] of Object.entries(etapa.schemaEstrutural)) {
      out[campo] = valorParaForma(forma, etapa);
    }
  } else {
    for (const campo of etapa.schema) out[campo] = ["item"];
  }

  switch (etapa.id) {
    case "descoberta":
      // Ficha de API honesta: "confirmado ao vivo" COM evidência (a regra estrutural exige).
      // Não confiar no gerador genérico aqui (ele produziria evidência inválida — ver discovery.test).
      out.endpoints_confirmados = [{
        endpoint: "POST /api/x/list",
        params: [{ nome: "limit", tipo: "string opcional", obrigatorio: "não" }],
        shape_resposta: "{ data: {...} }",
        limites: "não determinado",
        bordas: "nenhuma",
        confianca: "confirmado ao vivo",
        evidencia_ao_vivo: { chamou: "{}", retornou: "ok" },
      }];
      out.resumo_confianca = { confirmado_ao_vivo: "1", inferido: "0", nao_verificado: "0" };
      break;
    case "gap":
      // Análise de GAP honesta: cada gap com evidência; complexidade coerente com os drivers.
      out.gaps = [{ id: "G1", descricao: "args objeto→array", prioridade: "P0", categoria: "quebra",
                    evidencia: "Descoberta commands/run + código x.tsx:31", confianca: "confirmado na descoberta" }];
      out.pronto_para_reuso = [{ item: "ravi()", por_que_serve: "transporte confirmado" }];
      out.no_gos = [{ o_que: "executar agente", motivo: "run só renderiza", destino: "de-proposito" }];
      out.incertezas = [{ incerteza: "fonte de args", spike: "rastrear cadeia antes do design" }];
      out.complexidade = { banda: "média", drivers: { p0: 1, p1: 0, integracoes: 1, incertezas: 1, exige_infra_nova: "não" }, justificativa: "1 P0 de contrato sobre base existente" };
      out.resumo = { total_gaps: 1, p0: 1 };
      break;
    case "design":
      // Dossiê de design honesto: 3 amigos→critérios (circuito), critérios com then, ≥3 riscos com
      // o_que_revisar, estados difíceis (vazio/erro/loading) presentes.
      out.three_amigos = [{ comportamento: "listar", por_que: "ver comandos", como: "commands/list", criterios: ["CA-01"] }];
      out.criterios_aceitacao = [{ id: "CA-01", given: "agente válido", when: "abre a aba", then: "exibe a lista, NUNCA spinner infinito" }];
      out.riscos_premortem = [
        { id: "R1", risco: "SE args vai objeto ENTÃO quebra", mitigacao: "converter p/ array", o_que_revisar: "payload é array?" },
        { id: "R2", risco: "SE label diz Executar ENTÃO promessa falsa", mitigacao: "renomear", o_que_revisar: "copy do botão" },
        { id: "R3", risco: "SE vazio confundido com erro ENTÃO esconde causa", mitigacao: "3 estados", o_que_revisar: "vazio ≠ erro?" },
      ];
      out.estados = [
        { estado: "loading", descricao: "carregando", usuario_pode: "aguardar" },
        { estado: "erro_de_carga", descricao: "erro/falha na carga", usuario_pode: "tentar de novo" },
        { estado: "lista_vazia", descricao: "vazio: nenhum comando", usuario_pode: "criar novo" },
      ];
      out.adrs = [{ id: "ADR-1", decisao: "run renderiza", motivo: "confirmado ao vivo; executar é no-go" }];
      out.resumo_design = { comportamentos: 1, criterios: 1, riscos: 3 };
      break;
    case "mapa_dependencias":
      // Mapa honesto: unidades com arquivos+âncora; ordem topológica; paralelo provado (arquivos disjuntos).
      out.unidades = [
        { id: "U1", nome: "args array", objetivo: "converter para array em x.tsx", arquivos: ["a.tsx", "b.tsx"], ancora: ["GAP-1", "CA-04"], depende_de: [] },
        { id: "U2", nome: "paginação", objetivo: "limit/offset string em y.tsx", arquivos: ["c.tsx"], ancora: ["GAP-4"], depende_de: [] },
        { id: "U3", nome: "render", objetivo: "exibir prompt", arquivos: ["a.tsx"], ancora: ["GAP-2"], depende_de: ["U1"] },
      ];
      out.ordem = ["U1", "U2", "U3"];
      out.paralelizavel = [{ grupo: ["U1", "U2"], justificativa: "U1 toca a/b.tsx; U2 toca c.tsx — disjuntos" }];
      out.walking_skeleton = { necessario: "não", justificativa: "a aba já roda end-to-end (DAG confirma); trabalho é correção incremental" };
      out.ancoragem_no_gos = ["nenhuma unidade executa o agente (só renderiza)"];
      break;
    case "implementacao":
      // Handoff honesto: cada mudança ancorada em ids REAIS das etapas anteriores (G1/CA-01/R1/U1 — existem
      // nos outputs gap/design/mapa acima, senão regraAncoraRastreavel reprova); golden_path com then
      // observável + verifica; riscos com alvo; os 6 gates declarados (verde→evidência, n/a→motivo).
      out.resumo = "Corrige o contrato args (objeto→array) e a paginação; ancorado nos gaps/critérios reais.";
      out.arquivos_alterados = [
        { arquivo: "a.tsx", mudanca: "args: enviar array posicional na ordem de command.arguments[], nunca objeto", ancora: ["G1", "CA-01", "U1"], confianca: "confirmado" },
        { arquivo: "c.tsx", mudanca: "limit/offset como STRING; consumir hasMore/nextOffset", ancora: ["U2"], confianca: "inferido", nota: "shape de pagination não confirmado ao vivo para >50 itens" },
      ];
      out.golden_path_test = {
        given: "agente válido com 1 comando #arch e campo 'pergunta'='teste'",
        when: "usuário clica em Renderizar prompt",
        then: "chama commands/run com args:['teste'] (ARRAY) e a UI exibe data.prompt; sem ValidationError",
        verifica: ["CA-01"],
      };
      out.riscos_de_regressao = ["ArgsForm é consumido também por app-run-section.tsx (mesmo diretório) — manter fallback se result não tiver 'prompt'"];
      out.prontidao = [
        { gate: "tsc", estado: "verde", evidencia: "tsc --noEmit → exit 0, 0 erros" },
        { gate: "check:contracts", estado: "nao_aplicavel", evidencia: "projeto não tem script check:contracts; contrato coberto por tsc" },
        { gate: "vitest", estado: "verde", evidencia: "vitest run → 4 passed, exit 0" },
        { gate: "integrity-check", estado: "nao_aplicavel", evidencia: "gate da state machine, não da feature" },
        { gate: "placeholders", estado: "verde", evidencia: "zero TODO/FIXME nos arquivos alterados" },
        { gate: "hardcode", estado: "verde", evidencia: "sem dado hardcoded; limites vêm de constante de domínio" },
      ];
      out.no_gos_respeitados = ["não executa o agente — só renderiza o prompt (no-go do GAP)"];
      break;
    case "gate_a":
      // Revisão adversarial honesta: TODAS as lentes do catálogo declaradas (a regra exige cobertura total);
      // aqui o diff é mínimo e limpo, então APROVA com 0 exigências (o pivô: APROVA⟹exigencias==0). A maioria
      // das lentes é nao_aplicavel COM motivo (a regra-gêmea exige motivo). Sem issue ⟹ sem descoberta órfã.
      out.veredito = "APROVA";
      out.resumo = "Diff mínimo e ancorado; as lentes aplicáveis (lista) estão cobertas, as demais não se aplicam.";
      out.lentes = CATALOGO_LENTES.map((L) => (
        /vazi|empty|nenhum/.test(L.re.source)
          ? { lente: L.nome, situacao: "coberta", nota: "tratado no diff (a.tsx exibe estado próprio)" }
          : { lente: L.nome, situacao: "nao_aplicavel", nota: "feature de correção de contrato; esta dimensão não se aplica ao diff" }
      ));
      out.issues = [];
      out.p0_coberto = "sim";
      out.exigencias_antes_de_mergear = [];
      break;
    case "gate_b":
      out.veredito = "verificado";
      out.evidencia = ["evidencia-x"];
      break;
    case "done":
      out.verify_ok = true;
      break;
    case "smoke":
      out.status = "verde";
      break;
  }
  return out;
}

function escreverOutput(feature, etapa, obj) {
  writeFileSync(outputPath(feature, etapa.id), JSON.stringify(obj, null, 2), "utf8");
}

function limpar() {
  rmSync(featureDir(FEATURE), { recursive: true, force: true });
}

describe("e2e: motor da state machine DAG-to-Done", () => {
  beforeEach(() => limpar());
  after(() => limpar());

  it("CAMINHO FELIZ: percorre as 13 etapas do init ao done", () => {
    assert.equal(main(["init", FEATURE]), 0, "init deve retornar 0");

    let estado = carregarEstado(FEATURE);
    assert.equal(estado.etapaAtual, PRIMEIRA_ETAPA, "começa na primeira etapa");
    assert.equal(estado.concluidas.length, 0, "nenhuma etapa concluída no início");

    for (let i = 0; i < PIPELINE.length; i++) {
      const etapa = PIPELINE[i];
      assert.equal(
        carregarEstado(FEATURE).etapaAtual,
        etapa.id,
        `deveria estar na etapa ${etapa.id} (índice ${i})`
      );

      escreverOutput(FEATURE, etapa, outputValido(etapa));
      assert.equal(main(["advance", FEATURE]), 0, `advance da etapa ${etapa.id} deve aprovar`);

      if (i === PIPELINE.length - 1) {
        // Terminal: sentinela fora do espaço de nomes do cartucho (etapaAtual = null).
        const e = carregarEstado(FEATURE);
        assert.equal(e.etapaAtual, null, "após a última etapa, etapaAtual = null (terminal)");
        assert.equal(e.completo, true, "estado.completo = true ao finalizar");
      } else {
        assert.equal(
          carregarEstado(FEATURE).etapaAtual,
          PIPELINE[i + 1].id,
          `após advance de ${etapa.id} deveria avançar para ${PIPELINE[i + 1].id}`
        );
      }
    }

    estado = carregarEstado(FEATURE);
    assert.ok(estaCompleto(estado), "estado final deve ser terminal");
    assert.equal(estado.concluidas.length, 13, "13 etapas concluídas");
    assert.deepEqual(estado.concluidas, PIPELINE.map((e) => e.id), "ordem das concluídas");
  });

  it("PORTEIRO BLOQUEIA: advance sem output não avança e sinaliza falha", () => {
    assert.equal(main(["init", FEATURE]), 0);

    const ret = main(["advance", FEATURE]);
    assert.equal(ret, 1, "advance sem output deve retornar 1 (falha)");

    const estado = carregarEstado(FEATURE);
    assert.equal(estado.etapaAtual, PRIMEIRA_ETAPA, "continua na primeira etapa");
    assert.equal(estado.concluidas.length, 0, "nada concluído");
  });

  it("PORTEIRO BLOQUEIA INVÁLIDO: output faltando campos não avança", () => {
    assert.equal(main(["init", FEATURE]), 0);

    const etapa = PIPELINE[0]; // schema: nos, arestas, gaps
    escreverOutput(FEATURE, etapa, { nos: ["item"] }); // faltam arestas e gaps

    const ret = main(["advance", FEATURE]);
    assert.equal(ret, 1, "advance com output inválido deve retornar 1 (falha)");

    const estado = carregarEstado(FEATURE);
    assert.equal(estado.etapaAtual, PRIMEIRA_ETAPA, "continua na mesma etapa");
    assert.equal(estado.concluidas.length, 0, "nada concluído");
  });

  // P0-1: colisão da string "done". Antes, advance numa feature finalizada
  // REGREDIA (done → smoke) e duplicava concluidas. Agora é no-op idempotente.
  it("APÓS COMPLETO: advance e next são no-op idempotentes (sem regressão)", () => {
    assert.equal(main(["init", FEATURE]), 0);

    // Leva a feature até o fim.
    for (const etapa of PIPELINE) {
      escreverOutput(FEATURE, etapa, outputValido(etapa));
      assert.equal(main(["advance", FEATURE]), 0, `advance de ${etapa.id} deve aprovar`);
    }

    const antes = carregarEstado(FEATURE);
    assert.ok(estaCompleto(antes), "deve estar terminal");
    assert.equal(antes.etapaAtual, null, "etapaAtual terminal = null");
    assert.equal(antes.concluidas.length, 13, "13 concluídas antes do no-op");
    const snapshot = JSON.stringify(antes);

    // Verbos após terminal: não mutam estado, não erram com regressão.
    assert.equal(main(["advance", FEATURE]), 0, "advance terminal é no-op (retorna 0)");
    assert.equal(main(["next", FEATURE]), 0, "next terminal é no-op (retorna 0)");
    assert.equal(main(["advance", FEATURE]), 0, "advance terminal repetido continua no-op");

    const depois = carregarEstado(FEATURE);
    assert.equal(JSON.stringify(depois), snapshot, "estado NÃO mudou após os no-ops");
    assert.equal(depois.etapaAtual, null, "etapaAtual continua terminal (não regrediu p/ smoke)");
    assert.equal(depois.concluidas.length, 13, "concluidas continua com 13 (sem duplicatas)");
    assert.deepEqual(
      depois.concluidas,
      [...new Set(depois.concluidas)],
      "sem entradas duplicadas em concluidas"
    );
  });

  // P1-2: state.json corrompido não derruba o CLI com stack trace cru.
  it("ESTADO CORROMPIDO: JSON inválido retorna erro limpo (sem stack trace)", () => {
    assert.equal(main(["init", FEATURE]), 0);
    writeFileSync(statePath(FEATURE), "{ isto não é json válido ", "utf8");

    assert.equal(main(["status", FEATURE]), 1, "status com estado corrompido retorna 1");
    assert.equal(main(["advance", FEATURE]), 1, "advance com estado corrompido retorna 1");
    assert.equal(main(["next", FEATURE]), 1, "next com estado corrompido retorna 1");
  });
});
