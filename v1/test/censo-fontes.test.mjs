// censo-fontes.test.mjs — Etapa 0 (Censo de Fontes / Gate de Intenção), A020.
// Exercita o PORTEIRO REAL (avaliarEtapa) contra ETAPA_CENSO_FONTES. A etapa está ISOLADA (ainda não
// inserida em PIPELINE), então testamos a definição diretamente — sem o fluxo init/next/advance.
// Prova: (1) censo honesto APROVA; (2) fonte sondada ao vivo SEM evidência REPROVA (anti-fuga A017/A018);
// (3) fonte encontrada e não confrontada (a_decidir) REPROVA (a cegueira do E2E); (4) descarte sem motivo
// REPROVA; (5) fail-closed: "faltam_fontes" BLOQUEIA; (6) estrutura mínima exigida.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ETAPA_CENSO_FONTES, avaliarEtapa } from "../pipeline.config.mjs";

const ETAPA = ETAPA_CENSO_FONTES;

// Um censo HONESTO e COMPLETO: o humano declarou 1 fonte; a busca achou mais 2 (uma no código, uma ao vivo
// COM evidência) e AMBAS foram resolvidas (uma incorporada, uma descartada com motivo); veredito humano fechou.
// É exatamente o cenário que teria pego a cegueira do E2E (a fonte paralela é confrontada, não fica solta).
function censoHonesto() {
  return {
    intencao: "Listar todos os comandos/ferramentas disponíveis no ambiente, de qualquer origem.",
    fontes: [
      { nome: "tabela cli_servers (legado)", tipo: "tabela",
        proveniencia: "declarada-pelo-humano", resolucao: "no_escopo" },
      { nome: "registry de agentes (SDK)", tipo: "api",
        proveniencia: "lida-no-codigo", resolucao: "no_escopo" },
      { nome: "fila de comandos do n8n (sistema paralelo)", tipo: "fila",
        proveniencia: "sondada-ao-vivo",
        evidencia: "Listei as filas do broker: existe 'commands.inbox' com 1964 itens não cobertos pela tabela legada.",
        resolucao: "no_escopo" },
    ],
    veredito_humano: "censo_completo",
    fontes_faltantes: [],
  };
}

describe("Etapa 0 — Censo de Fontes (porteiro)", () => {
  it("APROVA um censo honesto e completo (fontes confrontadas, evidência colada, veredito humano fechado)", () => {
    const r = avaliarEtapa(ETAPA, censoHonesto());
    assert.ok(r.ok, `deveria aprovar; faltando: ${JSON.stringify(r.faltando)}`);
  });

  it("REPROVA fonte sondada-ao-vivo SEM evidência (anti-fuga / autenticidade declarada — A018)", () => {
    const o = censoHonesto();
    delete o.fontes[2].evidencia; // a fonte ao vivo perde a prova do que foi varrido
    const r = avaliarEtapa(ETAPA, o);
    assert.equal(r.ok, false, "sondada-ao-vivo sem evidência não pode passar");
    assert.match(r.faltando.join(" "), /evidencia/i);
  });

  it("REPROVA fonte encontrada pela busca e NÃO confrontada (resolucao=a_decidir) — a cegueira do E2E", () => {
    const o = censoHonesto();
    // O agente ACHOU a fonte paralela ao vivo mas deixou o confronto em aberto: é exatamente o buraco que
    // matou o piloto (a máquina viu, ninguém decidiu). O porteiro deve bloquear até o diff fechar.
    o.fontes[2].resolucao = "a_decidir";
    const r = avaliarEtapa(ETAPA, o);
    assert.equal(r.ok, false, "fonte 'a_decidir' deixa o confronto aberto — deve bloquear");
    assert.match(r.faltando.join(" "), /a_decidir|confronte/i);
  });

  it("REPROVA descarte de fonte SEM motivo substantivo (descartar não pode virar a nova fuga)", () => {
    const o = censoHonesto();
    o.fontes[2].resolucao = "descartada"; // descartou a fonte paralela...
    delete o.fontes[2].motivo_resolucao; // ...mas sem dizer por quê
    const r = avaliarEtapa(ETAPA, o);
    assert.equal(r.ok, false, "descarte sem motivo é fuga");
    assert.match(r.faltando.join(" "), /motivo_resolucao|descart/i);
  });

  it("ACEITA descarte de fonte COM motivo substantivo (confronto legítimo: vi e decidi não incluir)", () => {
    const o = censoHonesto();
    o.fontes[2].resolucao = "descartada";
    o.fontes[2].motivo_resolucao = "A fila do n8n é de comandos internos de automação, fora do escopo de 'ferramentas do usuário' — confirmado com o operador.";
    const r = avaliarEtapa(ETAPA, o);
    assert.ok(r.ok, `descarte motivado é válido; faltando: ${JSON.stringify(r.faltando)}`);
  });

  it("FAIL-CLOSED: veredito_humano='faltam_fontes' BLOQUEIA (território aberto fica parado na Etapa 0)", () => {
    const o = censoHonesto();
    o.veredito_humano = "faltam_fontes";
    o.fontes_faltantes = ["o universo de comandos do sistema X ainda não foi mapeado"];
    const r = avaliarEtapa(ETAPA, o);
    assert.equal(r.ok, false, 'só "censo_completo" avança');
    assert.match(r.faltando.join(" "), /fail-closed|censo_completo|BLOQUEIA/i);
  });

  it("REPROVA estrutura incompleta: faltam campos de topo (intencao/fontes/veredito_humano)", () => {
    const r = avaliarEtapa(ETAPA, { intencao: "algo" }); // sem fontes nem veredito
    assert.equal(r.ok, false, "output sem fontes/veredito não pode passar");
  });

  it("REPROVA proveniência fora do enum (uma fonte tem que dizer COMO foi achada)", () => {
    const o = censoHonesto();
    o.fontes[0].proveniencia = "chute"; // valor inventado
    const r = avaliarEtapa(ETAPA, o);
    assert.equal(r.ok, false, "proveniência fora do enum reprova");
    assert.match(r.faltando.join(" "), /proveniencia|enum/i);
  });
});
