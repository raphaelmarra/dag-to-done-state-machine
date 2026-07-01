#!/usr/bin/env node
// dag.mjs — MOTOR da state machine DAG-to-Done (MVP / Walking Skeleton).
// Node puro, zero dependências (ADR 0001). O motor é GENÉRICO: não conhece nenhuma
// etapa — só lê pipeline.config.mjs. O LLM (Claude Code) é o operador externo.
//
// Modelo: o agente DIRIGE as transições (roda os verbos); o motor é o JUIZ que valida
// e aprova/recusa. Enforcement vive aqui, não no comportamento do agente nem em hooks.
//
// Verbos: init · next · advance · status   (ver MVP/spec.md, MVP/plan.md)

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PIPELINE, PRIMEIRA_ETAPA, etapaPorId, proximaEtapa, nomeEtapa, gerarSchemaProsa, gerarDossieAprovacao, avaliarEtapa } from "./pipeline.config.mjs";

const RAIZ = dirname(fileURLToPath(import.meta.url));
const DAG_DIR = join(RAIZ, ".dag");

// ---------------------------------------------------------------------------
// PARTE 1 — Estado + persistência
// ---------------------------------------------------------------------------

function featureDir(feature) {
  return join(DAG_DIR, feature);
}
function statePath(feature) {
  return join(featureDir(feature), "state.json");
}
function outputPath(feature, etapaId) {
  return join(featureDir(feature), `${etapaId}.output.json`);
}
function briefingPath(feature, etapaId) {
  return join(featureDir(feature), `${etapaId}.briefing.md`);
}

function garantirDir(p) {
  mkdirSync(p, { recursive: true });
}

// Sentinela "estado corrompido": distinguível de "feature inexistente" (null).
const ESTADO_CORROMPIDO = Symbol("estado-corrompido");

// Lê JSON tolerando BOM UTF-8 (﻿). Editores/ferramentas no Windows (e agentes
// escrevendo arquivos) frequentemente prefixam BOM, que JSON.parse recusa. O motor
// precisa ser tolerante a isso para o handoff por arquivo funcionar de forma confiável.
function lerJSON(path) {
  const raw = readFileSync(path, "utf8").replace(/^﻿/, "");
  return JSON.parse(raw);
}

function carregarEstado(feature) {
  const p = statePath(feature);
  if (!existsSync(p)) return null;
  try {
    return lerJSON(p);
  } catch {
    // P1-2: state.json corrompido nunca derruba o CLI com stack trace cru.
    return ESTADO_CORROMPIDO;
  }
}

function salvarEstado(estado) {
  garantirDir(featureDir(estado.feature));
  // P1-1: escrita atômica — grava em .tmp e renomeia (rename é atômico no mesmo volume),
  // evitando state.json truncado se o processo morrer no meio da escrita.
  const dest = statePath(estado.feature);
  const tmp = dest + ".tmp";
  writeFileSync(tmp, JSON.stringify(estado, null, 2) + "\n", "utf8");
  renameSync(tmp, dest);
}

// Terminalidade é uma PROPRIEDADE do estado, não um id de etapa. O motor não
// reusa nenhuma string do espaço de nomes do cartucho (corrige P0-1): quando
// completo, etapaAtual = null e estado.completo = true.
function estaCompleto(estado) {
  return estado.completo === true || estado.etapaAtual == null;
}

function nowISO() {
  // Determinístico o suficiente para o MVP; evita depender de relógio nos testes.
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Verbo: init
// ---------------------------------------------------------------------------

function cmdInit(feature, flags) {
  if (!feature) return erro("uso: dag init <feature> [--entry X] [--desc Y] [--root Z]");
  if (existsSync(statePath(feature))) {
    return erro(`feature "${feature}" já existe (${statePath(feature)}). Use 'status' para inspecionar.`);
  }
  // next_stage é derivado do pipeline (a próxima etapa real), não hardcoded (M1). Recalculado a
  // cada avanço em cmdAdvance, para refletir sempre o consumidor imediato do output da etapa atual.
  const prox = proximaEtapa(PRIMEIRA_ETAPA);
  const estado = {
    feature,
    entry_point: flags.entry ?? feature,
    description: flags.desc ?? "",
    project_root: flags.root ?? "",
    etapaAtual: PRIMEIRA_ETAPA,
    next_stage: prox ? nomeEtapa(prox) : "(última etapa)",
    concluidas: [],
    historico: [{ evento: "init", etapa: PRIMEIRA_ETAPA, em: nowISO() }],
  };
  salvarEstado(estado);
  console.log(`✅ feature "${feature}" criada na etapa: ${PRIMEIRA_ETAPA}`);
  console.log(`   estado: ${statePath(feature)}`);
  console.log(`   próximo: node dag.mjs next ${feature}`);
  return 0;
}

// ---------------------------------------------------------------------------
// Verbo: status
// ---------------------------------------------------------------------------

function cmdStatus(feature) {
  if (!feature) return erro("uso: dag status <feature>");
  const estado = carregarEstado(feature);
  if (estado === ESTADO_CORROMPIDO) return erro(estadoCorrompidoMsg(feature));
  if (!estado) return erro(`feature "${feature}" não encontrada. Crie com 'init'.`);

  const total = PIPELINE.length;
  console.log(`feature: ${estado.feature}`);
  if (estaCompleto(estado)) {
    console.log(`etapa atual: (COMPLETO) — pipeline finalizado`);
  } else {
    const etapa = etapaPorId(estado.etapaAtual);
    console.log(`etapa atual: ${estado.etapaAtual}${etapa ? " — " + etapa.nome : " (etapa desconhecida)"}`);
  }
  console.log(`progresso: ${estado.concluidas.length}/${total} etapas concluídas`);
  if (estado.concluidas.length) console.log(`concluídas: ${estado.concluidas.join(", ")}`);
  console.log(`histórico:`);
  for (const h of estado.historico) {
    console.log(`  - [${h.em}] ${h.evento}${h.etapa ? " (" + h.etapa + ")" : ""}${h.detalhe ? " — " + h.detalhe : ""}`);
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Verbos next / advance — implementados nas Partes 2 e 3 (placeholders por ora)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// PARTE 2 — next: prepara a instrução da etapa atual.
// Escreve o briefing completo em arquivo (evita limite de 30KB do stdout do Bash);
// o stdout só aponta para os caminhos. (RF-002)
// ---------------------------------------------------------------------------

// Resolve o CORE da etapa: se houver corePath, carrega o arquivo (CORE rico); senão usa
// a string inline `core`. Permite COREs ricos em .md sem inchar o config.
function resolverCore(etapa) {
  if (etapa.corePath) {
    const p = join(RAIZ, etapa.corePath);
    if (existsSync(p)) return readFileSync(p, "utf8").replace(/^﻿/, "");
    return `[CORE não encontrado em ${etapa.corePath}] ${etapa.core ?? ""}`;
  }
  return etapa.core ?? "(sem CORE definido)";
}

// Substitui placeholders {chave} no texto pelos valores escalares do estado da instância (M1: o CORE
// referencia campos por nome; o motor resolve do contexto, sem lista fixa). Regras:
//  - só substitui chaves cujo valor é string/number não-vazio; sem valor → mantém {chave} (lacuna
//    visível, nunca "undefined");
//  - NÃO toca em código INLINE (entre `crases`): ali ficam as menções-literais ao próprio
//    placeholder (ex.: `{next_stage}` na doc) e eventuais literais de código tipo `{nos}` — não
//    devem ser substituídos (ressalva da revisão cega da peça 1).
//  - Blocos ```fenced``` deste CORE são TEMPLATES a preencher (ex.: as FRONTEIRAS com {next_stage}),
//    não código literal — portanto a substituição OCORRE dentro deles. (Semântica específica deste
//    projeto: o fenced é um molde, não um exemplo.)
function substituirPlaceholders(texto, estado) {
  const trocar = (s) => s.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (match, chave) => {
    const v = estado[chave];
    if (typeof v === "string" && v !== "") return v;
    if (typeof v === "number") return String(v);
    // Objeto/array (ex.: dag_output promovido): serializa legível, nunca "[object Object]".
    if (v && typeof v === "object") return "\n```json\n" + JSON.stringify(v, null, 2) + "\n```\n";
    return match; // sem valor → mantém o placeholder (lacuna visível)
  });
  // Divide preservando só código inline (`...`); índices ímpares = inline a NÃO tocar.
  return texto
    .split(/(`[^`\n]*`)/g)
    .map((parte, i) => (i % 2 === 1 ? parte : trocar(parte)))
    .join("");
}

// Contexto de substituição = estado da instância + campos derivados da etapa (M1: o CORE pode
// referenciar dados do executor por nome). Ex.: {confianca_enum} vem do executor declarado na config.
function contextoDeSubstituicao(estado, etapa) {
  // Campos do executor têm precedência sobre o estado (dado da etapa > instância). Colisão de chave
  // é intencional: o dado da etapa vence. Hoje não há colisão (os nomes não existem no estado).
  const ctx = { ...estado };
  const fmtEnum = (lista) => lista.map((v) => `\`${v}\``).join(" | ");
  if (etapa.executor) {
    const ex = etapa.executor;
    // Lista vazia = sem enum (placeholder fica cru, lacuna visível) — não degrada para "".
    if (Array.isArray(ex.confianca_enum) && ex.confianca_enum.length > 0) {
      ctx.confianca_enum = fmtEnum(ex.confianca_enum);
    }
    if (Array.isArray(ex.confianca_enum_arestas) && ex.confianca_enum_arestas.length > 0) {
      ctx.confianca_enum_arestas = fmtEnum(ex.confianca_enum_arestas);
    }
    if (ex.nome) ctx.executor_nome = ex.nome;
    if (ex.capacidade) ctx.executor_capacidade = ex.capacidade;
  }
  // Schema em prosa GERADO do schemaEstrutural (fonte única: valida E descreve ao executor).
  if (etapa.schemaEstrutural) {
    ctx.schema_prosa = gerarSchemaProsa(etapa.schemaEstrutural, etapa);
  }
  // Catálogo injetável (genérico, M1): se a etapa declara `catalogoBriefing` (lista de {nome}), o motor o
  // renderiza como prosa em `{catalogo_lentes}`. A etapa 7 injeta TODAS as lentes (decisão: catálogo plano,
  // sem arquétipo). Qualquer etapa futura com um catálogo a injetar reusa este placeholder. Fonte única: o
  // MESMO dado que a regra do porteiro consome (CATALOGO_LENTES) é o que o executor vê.
  if (Array.isArray(etapa.catalogoBriefing) && etapa.catalogoBriefing.length > 0) {
    ctx.catalogo_lentes = etapa.catalogoBriefing.map((item) => `- ${item.nome}`).join("\n");
  }
  // Dossiê de aprovação (etapa 10 HITL, genérico M1): se a etapa declara `dossie: true`, o motor injeta em
  // `{dossie_aprovacao}` um resumo LEGÍVEL derivado do estado (o que foi construído + vereditos dos gates + o
  // que ficou fora). Como `{schema_prosa}`, é conteúdo gerado de fonte única (o estado real), não texto fixo.
  if (etapa.dossie === true) {
    ctx.dossie_aprovacao = gerarDossieAprovacao(estado);
  }
  return ctx;
}

// Campos default do estado curado quando a etapa não declara `estadoCurado` (preserva o comportamento
// histórico — nenhuma das 12 outras etapas regride).
const ESTADO_CURADO_DEFAULT = ["entry_point", "description", "project_root", "next_stage", "concluidas"];

// Formata um valor do estado para texto LEGÍVEL no briefing. Objetos/arrays (ex.: dag_output promovido
// pelo motor, que é o output inteiro da etapa anterior) viram JSON formatado — NUNCA "[object Object]"
// (bug achado pelo teste de encadeamento: o executor da próxima etapa recebia lixo no lugar do insumo).
function formatarValor(v) {
  if (v === undefined || v === null || v === "") return "(vazio)";
  if (typeof v === "object") return "\n```json\n" + JSON.stringify(v, null, 2) + "\n```";
  return String(v);
}

// Formata um campo do estado curado para a linha do briefing (trata lista e vazio).
function linhaEstadoCurado(estado, campo) {
  const v = estado[campo];
  if (campo === "concluidas") {
    return `- concluidas: ${Array.isArray(v) && v.length ? v.join(", ") : "(nenhuma)"}`;
  }
  return `- ${campo}: ${formatarValor(v)}`;
}

function montarBriefing(estado, etapa) {
  // Estado curado POR ETAPA (peça 7): a etapa declara `estadoCurado`; senão usa o default.
  const camposCurados = etapa.estadoCurado ?? ESTADO_CURADO_DEFAULT;
  const coreResolvido = substituirPlaceholders(resolverCore(etapa), contextoDeSubstituicao(estado, etapa));
  return [
    `# Briefing — Etapa: ${etapa.nome}`,
    ``,
    `> Feature: ${estado.feature} | Agente: ${etapa.agente}`,
    `> Gerado por: dag.mjs next`,
    ``,
    `## Estado curado da instância`,
    ...camposCurados.map((campo) => linhaEstadoCurado(estado, campo)),
    ``,
    `## CORE / instrução desta etapa`,
    coreResolvido,
    ``,
    `## Output esperado`,
    `Escreva o resultado desta etapa (JSON) no arquivo de output indicado.`,
    `Campos obrigatórios (schema): ${etapa.schema.join(", ")}`,
    ``,
  ].join("\n");
}

// Gera o briefing da etapa atual em disco. Núcleo compartilhado por `next` e pelo auto-next do `advance`
// (ADR 0034): a MESMA geração serve os dois caminhos, sem duplicar a checagem de pré-condições. Não imprime
// nada (o chamador decide a mensagem) e não muta estado. Retorna:
//   { ok: true,  bPath, oPath }                  — briefing gerado
//   { ok: false, precondicao: [campos] }         — pré-condição ausente (briefing NÃO gerado)
// Pressupõe estado não-terminal e etapa válida (o chamador já garantiu).
function emitirBriefing(feature, estado, etapa) {
  // PRÉ-CONDIÇÕES (peça 6): a etapa declara os campos do estado que precisa; o motor verifica ANTES de
  // gerar o briefing. Se algum falta, não gera (lacuna visível, nunca briefing meio-pronto).
  const faltando = (etapa.precondicoes ?? []).filter((campo) => {
    const v = estado[campo];
    return v === undefined || v === null || v === "";
  });
  if (faltando.length) return { ok: false, precondicao: faltando };

  garantirDir(featureDir(feature));
  const bPath = briefingPath(feature, etapa.id);
  const oPath = outputPath(feature, etapa.id);
  writeFileSync(bPath, montarBriefing(estado, etapa), "utf8");
  return { ok: true, bPath, oPath };
}

function cmdNext(feature) {
  if (!feature) return erro("uso: dag next <feature>");
  const estado = carregarEstado(feature);
  if (estado === ESTADO_CORROMPIDO) return erro(estadoCorrompidoMsg(feature));
  if (!estado) return erro(`feature "${feature}" não encontrada. Crie com 'init'.`);

  if (estaCompleto(estado)) {
    // No-op idempotente: pipeline terminal não muta estado.
    console.log(`feature "${feature}" já está COMPLETA — não há próxima etapa (no-op).`);
    return 0;
  }
  const etapa = etapaPorId(estado.etapaAtual);
  if (!etapa) {
    return erro(`estado inconsistente: etapa "${estado.etapaAtual}" não existe no cartucho.`);
  }

  const r = emitirBriefing(feature, estado, etapa);
  if (!r.ok) {
    return erro(
      `BLOQUEADO na etapa "${etapa.id}" — pré-condição ausente: ${r.precondicao.join(", ")}.\n` +
      `   forneça no init (ex.: --root, --entry) e rode 'next' de novo. Briefing não gerado.`
    );
  }

  // stdout curto — só aponta (adaptação ao limite de 30KB do Bash do Claude Code).
  console.log(`etapa: ${etapa.id} — ${etapa.nome}`);
  console.log(`briefing: ${r.bPath}`);
  console.log(`escreva o resultado em: ${r.oPath}`);
  console.log(`depois rode: node dag.mjs advance ${feature}`);
  return 0;
}
// ---------------------------------------------------------------------------
// PARTE 3 — advance: o PORTEIRO (juiz intransigente). (RF-003, RF-006)
// O agente DIRIGE (roda advance); o motor VALIDA e aprova/recusa.
// Lê o output da etapa atual, valida schema + critério; se passa, avança; senão bloqueia.
// ---------------------------------------------------------------------------

function cmdAdvance(feature) {
  if (!feature) return erro("uso: dag advance <feature>");
  const estado = carregarEstado(feature);
  if (estado === ESTADO_CORROMPIDO) return erro(estadoCorrompidoMsg(feature));
  if (!estado) return erro(`feature "${feature}" não encontrada. Crie com 'init'.`);

  if (estaCompleto(estado)) {
    // No-op idempotente: não regride, não muta estado, não duplica concluidas.
    console.log(`feature "${feature}" já está COMPLETA — nada a avançar (no-op).`);
    return 0;
  }
  const etapa = etapaPorId(estado.etapaAtual);
  if (!etapa) {
    return erro(`estado inconsistente: etapa "${estado.etapaAtual}" não existe no cartucho.`);
  }

  // 1. O output da etapa precisa existir no caminho de convenção.
  const oPath = outputPath(feature, etapa.id);
  if (!existsSync(oPath)) {
    return erro(
      `output da etapa "${etapa.id}" não encontrado.\n` +
      `   esperado em: ${oPath}\n` +
      `   rode 'node dag.mjs next ${feature}', produza o resultado e escreva nesse arquivo.`
    );
  }

  // 2. Precisa ser JSON válido (tolerante a BOM — ver lerJSON).
  let output;
  try {
    output = lerJSON(oPath);
  } catch (e) {
    return erro(`output da etapa "${etapa.id}" não é JSON válido: ${e.message}`);
  }

  // 3. PORTEIRO: precisa passar no critério de aceitação da etapa. Usa o avaliador genérico (A012:
  // schema + estrutura + regrasExtras); `aceita` custom só se a etapa ainda o definir (compat). O `estado`
  // (com os <etapa>_output anteriores promovidos) é passado para regras de RASTREABILIDADE (A015): a etapa 6
  // cruza cada âncora com os ids reais das etapas 3/4/5.
  const veredito = typeof etapa.aceita === "function" ? etapa.aceita(output) : avaliarEtapa(etapa, output, estado);
  if (!veredito.ok) {
    const faltando = veredito.faltando?.length
      ? `campos ausentes/vazios: ${veredito.faltando.join(", ")}`
      : `critério de aceitação não satisfeito`;
    registrarHistorico(estado, { evento: "bloqueado", etapa: etapa.id, detalhe: faltando });
    salvarEstado(estado);
    return erro(
      `BLOQUEADO na etapa "${etapa.id}".\n` +
      `   ${faltando}\n` +
      `   corrija o output em ${oPath} e rode advance de novo.`
    );
  }

  // 4. APROVADO: registra conclusão e avança.
  estado.concluidas.push(etapa.id);
  // Promove o output da etapa para o estado (genérico, M1): a próxima etapa pode declarar
  // `<etapaId>_output` como pré-condição/estado curado. Ex.: a Descoberta exige `dag_output`. Sem isto,
  // a pré-condição da etapa seguinte seria inalcançável (achado da revisão cega — defeito de integração).
  estado[`${etapa.id}_output`] = output;
  registrarHistorico(estado, { evento: "aprovado", etapa: etapa.id });

  const prox = proximaEtapa(etapa.id);
  if (prox) {
    estado.etapaAtual = prox;
    // Recalcula next_stage para o consumidor do output da NOVA etapa atual (M1 — derivado, não fixo).
    const seguinte = proximaEtapa(prox);
    estado.next_stage = seguinte ? nomeEtapa(seguinte) : "(última etapa)";
    registrarHistorico(estado, { evento: "avancou", etapa: prox });
    salvarEstado(estado);
    console.log(`✅ etapa "${etapa.id}" APROVADA. Avançou para: ${prox}`);

    // AUTO-NEXT (ADR 0034): ao aprovar, o motor já emite o briefing da nova etapa — o agente não precisa
    // rodar `next` manualmente entre etapas. É o `advance` fundindo o passo `next` seguinte. A geração é a
    // MESMA de cmdNext (via emitirBriefing), então o handoff por arquivo é idêntico. Se a nova etapa tem
    // pré-condição ausente (não deveria, pois o motor promove os <etapa>_output ao aprovar), cai no fallback
    // manual: avisa e pede `next`, sem falhar o advance (a aprovação já é fato consumado no estado salvo).
    const etapaProx = etapaPorId(prox);
    const b = emitirBriefing(feature, estado, etapaProx);
    if (b.ok) {
      console.log(`etapa: ${etapaProx.id} — ${etapaProx.nome}`);
      console.log(`briefing: ${b.bPath}`);
      console.log(`escreva o resultado em: ${b.oPath}`);
      console.log(`depois rode: node dag.mjs advance ${feature}`);
    } else {
      console.log(`   ⚠️ briefing da próxima etapa não gerado — pré-condição ausente: ${b.precondicao.join(", ")}.`);
      console.log(`   próximo: node dag.mjs next ${feature}`);
    }
  } else {
    // Terminal: sentinela fora do espaço de nomes do cartucho (P0-1).
    estado.etapaAtual = null;
    estado.completo = true;
    registrarHistorico(estado, { evento: "completo" });
    salvarEstado(estado);
    console.log(`🏁 etapa "${etapa.id}" APROVADA. Pipeline COMPLETO.`);
  }
  return 0;
}

function registrarHistorico(estado, entrada) {
  estado.historico.push({ ...entrada, em: nowISO() });
}

// ---------------------------------------------------------------------------
// Infra de CLI
// ---------------------------------------------------------------------------

function erro(msg) {
  console.error(`❌ ${msg}`);
  return 1;
}

function estadoCorrompidoMsg(feature) {
  return `state.json da feature "${feature}" está corrompido (JSON inválido).\n` +
    `   arquivo: ${statePath(feature)}\n` +
    `   corrija ou remova o arquivo e rode 'init' novamente.`;
}

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const chave = args[i].slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : true;
      flags[chave] = val;
    }
  }
  return flags;
}

function main(argv) {
  const [verbo, feature, ...resto] = argv;
  const flags = parseFlags(resto);
  switch (verbo) {
    case "init": return cmdInit(feature, flags);
    case "next": return cmdNext(feature);
    case "advance": return cmdAdvance(feature);
    case "status": return cmdStatus(feature);
    default:
      return erro(`verbo desconhecido: "${verbo ?? ""}". Use: init | next | advance | status`);
  }
}

// Exporta para testes; roda se invocado direto.
export { main, carregarEstado, salvarEstado, statePath, outputPath, briefingPath, featureDir, estaCompleto, ESTADO_CORROMPIDO, contextoDeSubstituicao, substituirPlaceholders, montarBriefing, emitirBriefing };

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("dag.mjs")) {
  process.exit(main(process.argv.slice(2)));
}
