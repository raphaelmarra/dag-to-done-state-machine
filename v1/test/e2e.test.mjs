// e2e.test.mjs — Teste end-to-end do motor da state machine (RF-007).
// Prova: caminho feliz (13 etapas init→done), porteiro bloqueia sem output,
// porteiro bloqueia output inválido. Roda os verbos via main() (sem spawn).

import { describe, it, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { rmSync, writeFileSync, readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { main, carregarEstado, salvarEstado, outputPath, briefingPath, featureDir, statePath, estaCompleto, emitirBriefing } from "../dag.mjs";
import { PIPELINE, PRIMEIRA_ETAPA, CATALOGO_LENTES, CATALOGO_WCAG, etapaPorId } from "../pipeline.config.mjs";

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
    case "acessibilidade":
      // Verificação a11y honesta: TODOS os critérios WCAG declarados (cobertura total); aqui o foco/teclado é OK
      // (coberto com evidência operacional) e os de modal/drag/form não se aplicam (N/A com motivo SUBSTANTIVO —
      // a fábrica rejeita "n/a"). Sem issue ⟹ aprovado (aprovado⟹0 issue 'alta') e sem violação órfã.
      out.veredito = "aprovado";
      out.resumo = "Operei a tela: foco/teclado sadios; dimensões de form/modal/drag não se aplicam a esta feature.";
      out.criterios = CATALOGO_WCAG.map((W) => (
        /2\.4\.3|focus order/.test(W.re.source)
          ? { criterio: W.nome, situacao: "coberto", evidencia_operacional: "Tab percorreu input→botão na ordem visual (activeElement registrado)" }
          : { criterio: W.nome, situacao: "nao_aplicavel", evidencia_operacional: "feature de correção de contrato sem este padrão de interação; critério não se aplica a este diff" }
      ));
      out.issues = [];
      out.fica_para_humano = ["confirmar com leitor de tela real na etapa 10"];
      break;
    case "gate_b":
      // Verificação ao vivo honesta: cada critério do design (CA-01, do design_output acima) endereçado com
      // evidência REAL substantiva; todos CONFEREM → veredito global "verificado" (fail-closed: só verificado
      // avança). Coerência global↔por-critério: como todos conferem, o global é verificado.
      out.veredito = "verificado";
      out.resumo = "Confrontei os critérios com a API ao vivo; o comportamento real bate com o design.";
      out.criterios = [
        { criterio: "CA-01: ao abrir, a lista carrega e nunca mostra spinner infinito",
          situacao: "confere",
          evidencia: "Request real: POST commands/list {agent:'main'} → 200, data.items com 1 comando. Asserção: a lista carrega ao vivo, sem spinner infinito.",
          motivo: null },
      ];
      out.fica_para_humano = ["confirmar a janela de acesso ao ambiente; testar com >50 itens (paginação)"];
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

  // ADR 0034 (AUTO-NEXT): ao APROVAR, o advance já emite o briefing da PRÓXIMA etapa — o agente não precisa
  // rodar `next` manualmente entre etapas. Prova: sem NENHUM `next`, os briefings surgem só com `advance`.
  it("AUTO-NEXT: advance ao aprovar já gera o briefing da próxima etapa (sem next manual)", () => {
    // init COM as pré-condições da 1ª etapa (entry_point, project_root) satisfeitas — senão o auto-next da
    // 2ª etapa cairia no fallback de pré-condição ausente (project_root vazio). Este é o caminho de uso real.
    assert.equal(main(["init", FEATURE, "--root", ".", "--entry", "x"]), 0);

    for (let i = 0; i < PIPELINE.length - 1; i++) {
      const etapa = PIPELINE[i];
      const proxima = PIPELINE[i + 1];

      // Antes de aprovar a etapa i, o briefing da etapa i+1 NÃO deve existir (nenhum next foi rodado).
      assert.ok(
        !existsSync(briefingPath(FEATURE, proxima.id)),
        `briefing de ${proxima.id} não deve existir antes de aprovar ${etapa.id}`
      );

      escreverOutput(FEATURE, etapa, outputValido(etapa));
      assert.equal(main(["advance", FEATURE]), 0, `advance de ${etapa.id} deve aprovar`);

      // Depois de aprovar a etapa i, o AUTO-NEXT deve ter emitido o briefing da etapa i+1 — SEM next manual.
      assert.ok(
        existsSync(briefingPath(FEATURE, proxima.id)),
        `AUTO-NEXT: advance de ${etapa.id} deveria ter gerado o briefing de ${proxima.id}`
      );
    }
  });

  // ADR 0034 — fallback do auto-next: se a PRÓXIMA etapa tem pré-condição ausente, emitirBriefing RECUSA
  // (não gera briefing meio-pronto). Testa o mecanismo diretamente (unidade), com um estado sem project_root.
  it("AUTO-NEXT fallback: emitirBriefing recusa quando a próxima etapa tem pré-condição ausente", () => {
    const descoberta = etapaPorId("descoberta"); // precondicoes: entry_point, project_root, dag_output
    // Estado que satisfaz entry_point e dag_output, mas NÃO project_root (vazio) — simula init sem --root.
    const estado = {
      feature: FEATURE,
      entry_point: "x",
      project_root: "", // ← ausente
      dag_output: { nos: [] },
    };
    const r = emitirBriefing(FEATURE, estado, descoberta);
    assert.equal(r.ok, false, "deve recusar quando falta pré-condição");
    assert.deepEqual(r.precondicao, ["project_root"], "deve apontar exatamente a pré-condição ausente");
    assert.ok(!existsSync(briefingPath(FEATURE, "descoberta")), "não deve ter escrito briefing meio-pronto");
  });

  // ADR 0034 — ramo INTEGRADO do fallback (dentro de cmdAdvance, não só emitirBriefing isolado): quando a
  // aprovação avança para uma etapa cuja pré-condição está ausente, o advance NÃO deve falhar — a aprovação
  // já é fato consumado (estado salvo, etapa avançada); só o auto-next é adiado (avisa + pede next manual).
  // Regressão-guard: impede que alguém troque o ramo `else` do fallback por um `return erro()` sem perceber.
  it("AUTO-NEXT fallback integrado: advance ainda retorna 0 e avança mesmo sem poder emitir o próximo briefing", () => {
    assert.equal(main(["init", FEATURE, "--root", ".", "--entry", "x"]), 0);

    const primeira = PIPELINE[0];   // dag (exige entry_point, project_root)
    const segunda = PIPELINE[1];    // descoberta (exige entry_point, project_root, dag_output)
    escreverOutput(FEATURE, primeira, outputValido(primeira));

    // Sabota a pré-condição da PRÓXIMA etapa DEPOIS que a 1ª já é válida: remove project_root do estado.
    // A etapa 1 já passou (foi validada no init/next); mas o auto-next da etapa 2 vai recusar por falta dele.
    const estado = carregarEstado(FEATURE);
    delete estado.project_root;
    salvarEstado(estado);

    // advance da etapa 1: APROVA (retorna 0) apesar de o auto-next da etapa 2 não poder emitir o briefing.
    assert.equal(main(["advance", FEATURE]), 0, "advance deve APROVAR mesmo caindo no fallback do auto-next");

    const depois = carregarEstado(FEATURE);
    assert.equal(depois.etapaAtual, segunda.id, "a aprovação avançou o estado para a próxima etapa (fato consumado)");
    assert.ok(depois.concluidas.includes(primeira.id), "a 1ª etapa consta como concluída");
    assert.ok(
      !existsSync(briefingPath(FEATURE, segunda.id)),
      "o briefing da próxima etapa NÃO foi gerado (pré-condição ausente) — fallback, não briefing meio-pronto"
    );
  });

  // ADR 0034 — coexistência auto-next + next: um agente pode, por hábito, rodar `next` DEPOIS do auto-next.
  // Como ambos chamam a mesma emitirBriefing (writeFileSync determinístico), o `next` redundante deve ser um
  // no-op idempotente: mesmo briefing, sem mutar estado (não duplica concluidas, não re-avança).
  it("AUTO-NEXT + next redundante: next após auto-next é idempotente (mesmo briefing, estado intacto)", () => {
    assert.equal(main(["init", FEATURE, "--root", ".", "--entry", "x"]), 0);

    const primeira = PIPELINE[0];
    const segunda = PIPELINE[1];
    escreverOutput(FEATURE, primeira, outputValido(primeira));
    assert.equal(main(["advance", FEATURE]), 0);

    // Estado + briefing logo após o auto-next.
    const estadoAposAutoNext = JSON.stringify(carregarEstado(FEATURE));
    const briefingAposAutoNext = readFileSync(briefingPath(FEATURE, segunda.id), "utf8");

    // Agente roda `next` por hábito — deve ser inócuo.
    assert.equal(main(["next", FEATURE]), 0, "next após auto-next retorna 0");

    assert.equal(JSON.stringify(carregarEstado(FEATURE)), estadoAposAutoNext, "next redundante NÃO mutou o estado");
    assert.equal(readFileSync(briefingPath(FEATURE, segunda.id), "utf8"), briefingAposAutoNext, "briefing reescrito é idêntico");
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
