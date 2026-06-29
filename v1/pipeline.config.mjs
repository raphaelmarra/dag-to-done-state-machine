// pipeline.config.mjs — CONTEÚDO das 13 etapas (o "cartucho"). [v1 pós-MVP]
// O motor (dag.mjs) é genérico e não conhece nenhuma etapa; ele só lê esta config.
//
// ETAPA 1 (DAG): CORE-DAG v4.0 CRISTALIZADO, carregado de cores/CORE-DAG.md (cópia local
//   autocontida da fonte docs/CORE-DAG.md — sincronia garantida por teste). Schema reflete o v4.0.
// ETAPAS 2–13: ainda placeholders/COREs específicos da aba CLIs (dívida deliberada). Cada uma será
//   destilada pela metodologia (docs/METODOLOGIA-CORE.md) e plugada aqui, como foi a etapa 1.

/**
 * Cada etapa:
 *  - id: chave estável
 *  - nome: rótulo legível
 *  - agente: quem executa (informativo no MVP)
 *  - core: o briefing/CORE que o motor IMPRIME para o operador LLM (hardcoded no MVP)
 *  - schema: campos obrigatórios que o output da etapa deve conter (validação mínima)
 *  - aceita(output): critério de aceitação binário — o porteiro chama isto
 */

// Validador genérico mínimo: todos os campos do schema presentes e não-vazios.
function camposPresentes(output, schema) {
  const faltando = schema.filter((campo) => {
    const v = output?.[campo];
    return v === undefined || v === null || v === "" ||
      (Array.isArray(v) && v.length === 0);
  });
  return { ok: faltando.length === 0, faltando };
}


// --- Validação ESTRUTURAL declarativa (peças 4+5) ----------------------------------------------
// O schema é um DADO (objeto), não prosa markdown (F3 da revisão cega). Cada campo de topo declara
// sua forma; o validador genérico abaixo a interpreta. É dinâmico: enums podem vir de uma função
// que lê o contexto (ex.: o enum de confiança vem do executor — fonte única).
//
// Gramática do schema (por campo):
//   { tipo: "lista-de-objetos", itemCampos: { campo: regraDeCampo, ... }, minItens?: n }
//   { tipo: "objeto", campos: { campo: regraDeCampo, ... } }
// regraDeCampo:
//   { obrigatorio?: bool, enum?: [..] | (etapa)=>[..] }   (enum como função = derivado do contexto)

function valorVazio(v) {
  return v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
}

function resolverEnum(regra, etapa) {
  if (typeof regra.enum === "function") return regra.enum(etapa);
  return regra.enum;
}

// Valida UM valor contra UMA forma — RECURSIVO (resolve a profundidade-3+ do CORE: um campo pode ser
// ele próprio uma lista-de-objetos/objeto). Cobre tipo, vazio e enum em qualquer nível (corrige o gap
// "campo de item só checava presença"). `forma` aceita:
//   { tipo: "lista-de-objetos", itemCampos: {campo: forma}, minItens? }
//   { tipo: "objeto", campos: {campo: forma} }
//   { tipo: "escalar"?, enum?: [..]|(etapa)=>[..] }   (escalar é o default quando não há 'tipo')
//   qualquer forma pode ter { obrigatorio: bool } quando aninhada como campo.
function validarForma(valor, forma, etapa, caminho, erros) {
  const ausente = valor === undefined || valor === null;
  if (ausente) {
    // `obrigatorio` (não-vazio) OU `presente` (a chave deve existir, mas pode ser lista vazia):
    // ambos reprovam ausência. `presente` serve para "registre que não há, em vez de omitir" (A4).
    if (forma.obrigatorio || forma.presente) erros.push(`${caminho}: campo obrigatório ausente`);
    return; // opcional ausente: ok
  }
  // Lista/objeto obrigatório porém VAZIO escapa se só checarmos null/undefined — fechar a assimetria
  // topo↔aninhado. `presente` (sem `obrigatorio`) permite vazio: registrar [] ≠ omitir.
  if (forma.obrigatorio && valorVazio(valor)) {
    erros.push(`${caminho}: obrigatório porém vazio`);
    return;
  }

  if (forma.tipo === "lista-de-objetos") {
    if (!Array.isArray(valor)) { erros.push(`${caminho}: deveria ser uma lista`); return; }
    if (forma.minItens && valor.length < forma.minItens) erros.push(`${caminho}: mínimo ${forma.minItens} item(ns)`);
    valor.forEach((item, i) => {
      if (typeof item !== "object" || item === null || Array.isArray(item)) {
        erros.push(`${caminho}[${i}]: deveria ser um objeto (recebido: ${Array.isArray(item) ? "lista" : typeof item})`);
        return;
      }
      for (const [ic, regra] of Object.entries(forma.itemCampos || {})) {
        validarForma(item[ic], regra, etapa, `${caminho}[${i}].${ic}`, erros);
      }
    });
  } else if (forma.tipo === "objeto") {
    if (typeof valor !== "object" || Array.isArray(valor)) { erros.push(`${caminho}: deveria ser um objeto`); return; }
    for (const [ic, regra] of Object.entries(forma.campos || {})) {
      validarForma(valor[ic], regra, etapa, `${caminho}.${ic}`, erros);
    }
  } else if (forma.tipo === "lista-de-strings") {
    if (!Array.isArray(valor)) { erros.push(`${caminho}: deveria ser uma lista`); return; }
    valor.forEach((s, i) => {
      if (typeof s !== "string") erros.push(`${caminho}[${i}]: deveria ser string (recebido: ${typeof s})`);
    });
  } else if (forma.tipo === "string") {
    // Campo de PROVA TEXTUAL (nota/evidencia): um objeto/array aqui escaparia da defesa anti-oco virando
    // "[object Object]" — fecha na ORIGEM (furo residual da 2ª revisão cega da etapa 9). Enum ainda vale se houver.
    if (typeof valor !== "string") { erros.push(`${caminho}: deveria ser string (recebido: ${Array.isArray(valor) ? "lista" : typeof valor})`); return; }
    // String obrigatória só-de-espaços é tão vazia quanto "" (a checagem de topo `valorVazio` não pega "   ").
    if (forma.obrigatorio && valor.trim() === "") { erros.push(`${caminho}: obrigatório porém vazio (só espaços)`); return; }
    const enumValido = forma.enum ? resolverEnum(forma, etapa) : null;
    if (enumValido && enumValido.length > 0 && !enumValido.includes(valor)) {
      erros.push(`${caminho}: valor "${valor}" fora do enum [${enumValido.join(", ")}]`);
    }
  } else {
    // escalar: valida enum se houver E não estiver vazio. Enum vazio (ex.: executor ausente) =
    // SEM restrição (não reprova tudo silenciosamente — fail-open, coerente com "lacuna visível").
    const enumValido = forma.enum ? resolverEnum(forma, etapa) : null;
    if (enumValido && enumValido.length > 0 && !enumValido.includes(valor)) {
      erros.push(`${caminho}: valor "${valor}" fora do enum [${enumValido.join(", ")}]`);
    }
  }
}

// Valida `output` (um objeto) contra `schemaEstrutural` (mapa campo→forma). Cada campo de topo é
// tratado como obrigatório e não-vazio. Retorna {ok, faltando} (contrato do motor).
function validarEstrutura(output, schemaEstrutural, etapa) {
  const erros = [];
  for (const [campo, forma] of Object.entries(schemaEstrutural)) {
    const v = output?.[campo];
    const ausenteNoTopo = v === undefined || v === null;
    // `presente`: a chave deve EXISTIR, mas pode ser lista vazia (registrar [] ≠ omitir). Então só
    // reprova se ausente; se presente-mas-vazia, segue para validarForma (que aceita lista vazia).
    if (forma.presente) {
      if (ausenteNoTopo) { erros.push(`${campo}: campo obrigatório ausente`); continue; }
      validarForma(v, forma, etapa, campo, erros);
      continue;
    }
    if (valorVazio(v)) {
      if (!forma.opcionalNoTopo) erros.push(`${campo}: ausente ou vazio`);
      continue; // campo opcional de topo ausente (ex.: ciclos, A5 provisória): ok
    }
    validarForma(v, forma, etapa, campo, erros);
  }
  return { ok: erros.length === 0, faltando: erros };
}

// Gera a PROSA do schema (o "## Nós / - tipo: ..." da Seção 4 do CORE) a partir do schemaEstrutural —
// fonte única: a mesma estrutura que valida também descreve o contrato ao executor. Elimina a
// duplicação schema(código)↔Seção 4(prosa) que já tinha divergido. Enums resolvidos do contexto.
function descreverForma(forma, etapa) {
  if (forma.tipo === "lista-de-objetos") return "lista de objetos";
  if (forma.tipo === "lista-de-strings") return "lista de strings";
  if (forma.tipo === "objeto") return "objeto";
  if (forma.enum) return resolverEnum(forma, etapa).map((v) => `\`${v}\``).join(" | ");
  return "texto";
}
function camposDeProsa(itemCampos, etapa, indent) {
  return Object.entries(itemCampos || {})
    .map(([nome, regra]) => {
      const opc = regra.obrigatorio ? "" : " (opcional)";
      let linha = `${indent}- ${nome}${opc}: ${descreverForma(regra, etapa)}`;
      // recursa em qualquer profundidade (espelha validarForma)
      if (regra.tipo === "lista-de-objetos" && regra.itemCampos) {
        linha += "\n" + camposDeProsa(regra.itemCampos, etapa, indent + "    ");
      } else if (regra.tipo === "objeto" && regra.campos) {
        linha += "\n" + camposDeProsa(regra.campos, etapa, indent + "    ");
      }
      return linha;
    })
    .join("\n");
}
function gerarSchemaProsa(schemaEstrutural, etapa) {
  return Object.entries(schemaEstrutural)
    .map(([campo, forma]) => {
      const campos = forma.itemCampos || forma.campos;
      const cab = `## ${campo}${forma.opcionalNoTopo ? " (opcional)" : ""} — ${descreverForma(forma, etapa)}`;
      return campos ? `${cab}\n${camposDeProsa(campos, etapa, "")}` : cab;
    })
    .join("\n\n");
}

// --- Gerador de DOSSIÊ da etapa 10 (Aprovação humana / HITL) -----------------------------------------
// Deriva do ESTADO (os <etapa>_output promovidos) um resumo LEGÍVEL para o HUMANO ler antes de aprovar — não
// um briefing-para-LLM (a etapa 10 não tem agente). 3 blocos (decisão do design): (a) o que foi construído,
// (b) o veredito de cada gate, (c) o que ficou FORA (honestidade). É robusto: outputs ausentes/degenerados
// viram "(não disponível)" — nunca crasha nem vaza "[object Object]" (a mesma defesa do formatarValor do motor).

// Extrai um texto LEGÍVEL de um campo que pode ser string, ausente, ou aninhado por um caminho. Nunca
// "[object Object]": objeto/array sem extrator vira "(não disponível)" (o dossiê não inventa nem despeja lixo).
function textoLegivel(v, fallback = "(não disponível)") {
  if (v === undefined || v === null || v === "") return fallback;
  if (typeof v === "string") return v.trim() || fallback;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return fallback; // objeto/array: sem extrator específico, não despeja "[object Object]"
}

// Lista os rótulos de uma lista-de-objetos por um conjunto de chaves candidatas (risco/descricao/...), tolerando
// itens string. Vazio → fallback. Genérico: não sabe o nome do campo, tenta as chaves comuns (M1-ish).
function rotulosDeLista(lista, chaves, fallback = "(nenhum declarado)") {
  if (!Array.isArray(lista) || lista.length === 0) return [fallback];
  return lista.map((it) => {
    if (typeof it === "string") return it.trim() || "(item vazio)";
    if (it && typeof it === "object") {
      for (const k of chaves) if (typeof it[k] === "string" && it[k].trim()) return it[k].trim();
    }
    return "(item sem rótulo)";
  });
}

// O LIMITE epistêmico que o humano PRECISA saber ao aprovar (dívida A018): o Gate B re-avalia a asserção sobre a
// evidência, mas NÃO prova que o par request/response é autêntico — o agente poderia tê-lo fabricado. A
// autenticidade última é justamente do humano nesta etapa. DADO (texto fixo): é um invariante do pipeline, não
// algo a descobrir do contexto.
const LIMITE_A018 = "O Gate B re-avalia a evidência declarada, mas NÃO re-chama a API nem prova que ela é autêntica (limite A018) — a autenticidade última é SUA, ao usar a tela.";

function gerarDossieAprovacao(estado) {
  const e = estado ?? {};
  const design = e.design_output;
  // resumo_design pode ser objeto {objetivo|resumo|...} OU string direta; tenta os caminhos comuns e degrada
  // honestamente p/ "(não disponível)" se o design nomear o campo de outro jeito (acoplamento aceito — o schema
  // do design é controlado pelo pipeline; revisão cega registrou como limite, não furo).
  const rd = (design && typeof design === "object") ? design.resumo_design : undefined;
  const objetivo = (design && typeof design === "object")
    ? textoLegivel((rd && typeof rd === "object" ? (rd.objetivo ?? rd.resumo) : rd) ?? design.resumo)
    : textoLegivel(design);
  const veredito = (out) => (out && typeof out === "object") ? textoLegivel(out.veredito) : textoLegivel(out);
  const gateA = veredito(e.gate_a_output);
  const gateB = veredito(e.gate_b_output);
  const a11y = veredito(e.acessibilidade_output);

  // chaves candidatas mesmo aqui: hoje fica_para_humano é lista-de-strings, mas se um Gate B futuro emitir
  // lista-de-objetos, extrair o conteúdo em vez de apagá-lo (honestidade por omissão — achado da revisão cega).
  const ficaParaHumano = (e.gate_b_output && typeof e.gate_b_output === "object")
    ? rotulosDeLista(e.gate_b_output.fica_para_humano, ["ponto", "texto", "descricao", "item"], "(nada declarado pelo Gate B)")
    : ["(Gate B não disponível)"];
  const riscos = (design && typeof design === "object")
    ? rotulosDeLista(design.riscos_premortem, ["risco", "descricao", "o_que_revisar"], "(nenhum risco declarado)")
    : ["(design não disponível)"];

  return [
    `## O que foi construído`,
    `- ${objetivo}`,
    ``,
    `## Vereditos dos gates (o caminho que a feature percorreu)`,
    `- Gate A (revisão de código): **${gateA}**`,
    `- Gate B (verificação ao vivo): **${gateB}**`,
    `- Acessibilidade (runtime): **${a11y}**`,
    ``,
    `## O que ficou FORA (aprove sabendo disto)`,
    `- Fica para o seu olho humano (do Gate B):`,
    ...ficaParaHumano.map((x) => `  - ${x}`),
    `- Riscos levantados no pre-mortem (do Design):`,
    ...riscos.map((x) => `  - ${x}`),
    `- ${LIMITE_A018}`,
  ].join("\n");
}

// --- Porteiro genérico (A012): compõe as três camadas de validação numa só (declarativo) -----------
// 1) presença de campos de topo (schema) · 2) estrutura (schemaEstrutural) · 3) regras EXTRAS da etapa
// (regrasExtras: lista de (output, etapa, estado)=>{ok, faltando}). Substitui o `aceita` custom imperativo:
// uma etapa declara `schema`/`schemaEstrutural`/`regrasExtras` e o motor avalia. Regra além de
// presença/estrutura ("se confianca==X então Y obrigatório") vira UMA função reutilizável, não um
// dialeto solto. Mantém o contrato {ok, faltando} que o motor consome.
//
// `estado` (3º arg, A015/A014): o estado acumulado da feature (com os <etapa>_output das etapas anteriores
// já promovidos). A maioria das regras o IGNORA (validam só o output da etapa). Mas regras de RASTREABILIDADE
// — "toda âncora aponta um id que EXISTE nos outputs anteriores" — precisam cruzar com a fonte (a etapa 6 é
// o 1º caso). Retrocompatível: regras de aridade 2 funcionam intactas (recebem o 3º arg e o descartam).
function avaliarEtapa(etapa, output, estado) {
  if (Array.isArray(etapa.schema)) {
    const presenca = camposPresentes(output, etapa.schema);
    if (!presenca.ok) return presenca;
  }
  if (etapa.schemaEstrutural) {
    const estrutura = validarEstrutura(output, etapa.schemaEstrutural, etapa);
    if (!estrutura.ok) return estrutura;
  }
  // `estado` é passado às regras como fonte READ-ONLY (regras de rastreabilidade leem os <etapa>_output
  // anteriores). Congelamos uma CÓPIA RASA — nunca o original (o motor ainda precisa mutar o estado real
  // depois, p.ex. promover <etapa>_output). A cópia rasa basta: impede a regra de re-atribuir chaves de topo
  // do estado; mutação profunda de um output é improvável e o ganho não justifica um deep-freeze. (Hardening
  // da revisão cega — a 1ª versão congelava o original e quebrava a promoção de output.)
  const estadoRO = estado && typeof estado === "object" ? Object.freeze({ ...estado }) : estado;
  for (const regra of etapa.regrasExtras ?? []) {
    const r = regra(output, etapa, estadoRO);
    if (!r.ok) return r;
  }
  return { ok: true, faltando: [] };
}

// "Vazio de verdade": undefined/null/""/[], objeto sem chaves, string só-espaços, número/bool.
// Usado por regras de evidência (uma evidência {} ou "  " não é prova — achado das revisões cegas).
function evidenciaVazia(v) {
  if (valorVazio(v)) return true;
  if (typeof v === "string") return v.trim() === "";
  if (typeof v === "object") return Object.keys(v).length === 0;
  return true; // número/bool não é evidência
}

// Escapa metacaracteres de regex num literal (ids como "CA-1", "GAP-001" são seguros, mas robustez antes
// de tudo: um id com "." ou "(" não deve virar metacaractere). Usado na ancoragem de id por palavra inteira.
function escaparRegex(s) {
  return `${s}`.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
}

// Fábrica de regra (A012): "o campo `campo` do output deve ser exatamente `valor`". Migra os gates
// (veredito==="APROVA", status==="verde"...) do antigo `comCondicao` para o padrão declarativo único.
function regraCampoIgual(campo, valor, motivo) {
  return (output) => (output?.[campo] === valor
    ? { ok: true, faltando: [] }
    : { ok: false, faltando: [motivo ?? `${campo} deve ser "${valor}"`] });
}

// Regra de coerência do resumo: o resumo não pode MENTIR sobre a lista (total_gaps == gaps.length;
// p0 == nº de gaps P0). Honestidade imposta pelo formato (achado da revisão cega da etapa 3).
function regraResumoCoerente(output) {
  const gaps = output?.gaps ?? [];
  const r = output?.resumo ?? {};
  const num = (v) => (typeof v === "number" ? v : parseInt(v, 10));
  const erros = [];
  if (num(r.total_gaps) !== gaps.length) erros.push(`resumo.total_gaps (${r.total_gaps}) ≠ nº real de gaps (${gaps.length})`);
  const p0Real = gaps.filter((g) => g.prioridade === "P0").length;
  if (num(r.p0) !== p0Real) erros.push(`resumo.p0 (${r.p0}) ≠ nº real de gaps P0 (${p0Real})`);
  return erros.length ? { ok: false, faltando: erros } : { ok: true, faltando: [] };
}

// Regra E3: gap descrito como impossível/sem-solução exige `angulos_tentados` não-vazio (senão é
// desistência, não conclusão). Heurística de texto na descricao+evidencia (o schema não tem flag).
function regraAngulosSeImpossivel(output) {
  const re = /imposs[íi]vel|sem solu[çc][ãa]o|inviável|n[ãa]o h[áa] como/i;
  const sem = (output?.gaps ?? []).filter((g) => {
    const texto = `${g.descricao ?? ""} ${g.evidencia ?? ""}`;
    return re.test(texto) && evidenciaVazia(g.angulos_tentados);
  });
  if (sem.length) {
    return { ok: false, faltando: sem.map((g) => `${g.id}: descrito como impossível sem angulos_tentados (E3)`) };
  }
  return { ok: true, faltando: [] };
}

// Fábrica de regra (E1/E2): a matriz de estados deve COBRIR um catálogo de estados difíceis (cada um
// presente em um estado DISTINTO — não no mesmo). O catálogo é DADO (passado da config, M1), não fixo
// na função; cada item tem sinônimos. Corrige: falso-positivo do "render", cross-contamination (um
// estado satisfazendo vários), e o hardcode (achados da revisão cega). Reusável por qualquer etapa.
function regraCatalogoCoberto(campoLista, catalogo) {
  return (output) => {
    const itens = output?.[campoLista] ?? [];
    // Casamento 1-para-1: cada item do catálogo precisa de um estado DISTINTO (um estado já usado para
    // cobrir "vazio" não pode também cobrir "erro"). Isso barra cross-contamination (um único estado
    // citando as 3 palavras na descrição passaria, indevidamente — achado da revisão cega).
    const usados = new Set();
    const faltam = [];
    for (const cat of catalogo) {
      const idx = itens.findIndex((e, i) =>
        !usados.has(i) && cat.re.test(`${e.estado ?? ""} ${e.descricao ?? ""}`.toLowerCase()));
      if (idx === -1) faltam.push(cat.nome);
      else usados.add(idx);
    }
    return faltam.length
      ? { ok: false, faltando: faltam.map((n) => `estado difícil ausente: '${n}' (cada um num estado DISTINTO — E1/E2)`) }
      : { ok: true, faltando: [] };
  };
}

// Catálogo de estados difíceis da etapa 4 (DADO — editável sem tocar o mecanismo). "render" NÃO é
// sinônimo de loading (era falso-positivo: "prompt_renderizado" casava). loading = carga/spinner/aguardando.
const CATALOGO_ESTADOS_UI = [
  { nome: "vazio", re: /vazi|empty|nenhum|sem (resultado|comando|item|dado)|lista zerada|0 result/ },
  { nome: "erro", re: /erro|error|falh|fail/ },
  { nome: "carregando", re: /carreg|loading|spinner|aguard|buscando/ },
];

// Regra D-H da etapa 4: o CIRCUITO fecha — todo comportamento aponta `criterios` (IDs) que EXISTEM de
// fato em criterios_aceitacao. Comportamento que aponta um critério inexistente, ou critério órfão
// apontado por ninguém, quebra a rastreabilidade que o Gate B usará.
function regraCircuitoComportamentoCriterio(output) {
  const comps = output?.three_amigos ?? [];
  const criterios = output?.criterios_aceitacao ?? [];
  const idsExistentes = new Set(criterios.map((c) => c.id));
  const idsApontados = new Set(comps.flatMap((c) => c.criterios ?? []));
  const erros = [];
  // (a) todo comportamento aponta critérios que EXISTEM (sem isso, intenção→prova quebrada).
  for (const c of comps) {
    for (const id of c.criterios ?? []) {
      if (!idsExistentes.has(id)) erros.push(`comportamento "${c.comportamento}" aponta critério inexistente "${id}"`);
    }
  }
  // (b) todo critério é apontado por ALGUM comportamento (sem isso, critério órfão — o Gate B não sabe
  //     a que comportamento ele pertence). Fecha o circuito nos dois sentidos (D-H).
  for (const c of criterios) {
    if (!idsApontados.has(c.id)) erros.push(`critério "${c.id}" é órfão: nenhum comportamento o aponta (D-H)`);
  }
  return erros.length ? { ok: false, faltando: erros } : { ok: true, faltando: [] };
}

// Regra de coerência do resumo_design (mesmo padrão da etapa 3): o resumo não pode MENTIR sobre as
// listas — contagens batem com a realidade. Honestidade imposta pelo formato.
function regraResumoDesignCoerente(output) {
  const r = output?.resumo_design ?? {};
  const n = (v) => (typeof v === "number" ? v : parseInt(v, 10));
  const pares = [
    ["comportamentos", (output?.three_amigos ?? []).length],
    ["criterios", (output?.criterios_aceitacao ?? []).length],
    ["riscos", (output?.riscos_premortem ?? []).length],
  ];
  const erros = pares
    .filter(([k, real]) => n(r[k]) !== real)
    .map(([k, real]) => `resumo_design.${k} (${r[k]}) ≠ nº real (${real})`);
  return erros.length ? { ok: false, faltando: erros } : { ok: true, faltando: [] };
}

// Regra P1 da etapa 5 (o coração): cada grupo PARALELO deve ter arquivos DISJUNTOS — a interseção dos
// arquivos das unidades do grupo é vazia. Paralelo é PROVADO mecanicamente, não afirmado. (Limite
// honesto P4: cobre o conflito TEXTUAL; o semântico é aresta do DAG, herdado — fora do escopo do porteiro.)
function regraParaleloDisjunto(output) {
  const porId = new Map((output?.unidades ?? []).map((u) => [u.id, u]));
  const erros = [];
  for (const g of output?.paralelizavel ?? []) {
    const ids = g.grupo ?? [];
    const vistos = new Map(); // arquivo -> primeira unidade que o tocou
    for (const id of ids) {
      const u = porId.get(id);
      if (!u) { erros.push(`paralelizavel aponta unidade inexistente "${id}"`); continue; }
      // sem arquivos NÃO é "disjunto de tudo": é falta de prova. Paralelo sem arquivo declarado não se prova.
      if (!(u.arquivos?.length)) erros.push(`paralelo inválido [${ids.join(", ")}]: "${id}" não declara arquivos (paralelo não provado)`);
      for (const arq of u.arquivos ?? []) {
        if (vistos.has(arq)) {
          const dono = vistos.get(arq);
          erros.push(dono === id
            ? `unidade "${id}" lista o arquivo "${arq}" duplicado`
            : `paralelo inválido [${ids.join(", ")}]: "${id}" e "${dono}" compartilham "${arq}" (não são disjuntos)`);
        } else {
          vistos.set(arq, id);
        }
      }
      // também não pode haver dependência mútua dentro do grupo (P3)
      for (const dep of u.depende_de ?? []) {
        if (ids.includes(dep)) erros.push(`paralelo inválido [${ids.join(", ")}]: "${id}" depende de "${dep}" (mesmo grupo)`);
      }
    }
  }
  return erros.length ? { ok: false, faltando: erros } : { ok: true, faltando: [] };
}

// Regra O1 da etapa 5: a `ordem` é topologicamente válida (toda unidade vem DEPOIS das que ela depende)
// e cobre TODAS as unidades exatamente. Sem ciclo (uma unidade não pode depender de si via ordem).
function regraOrdemTopologica(output) {
  const unidades = output?.unidades ?? [];
  const ordem = output?.ordem ?? [];
  const ids = new Set(unidades.map((u) => u.id));
  const erros = [];
  // a ordem cobre todas as unidades (e nada a mais)
  const setOrdem = new Set(ordem);
  for (const u of unidades) if (!setOrdem.has(u.id)) erros.push(`unidade "${u.id}" ausente da ordem`);
  for (const id of ordem) if (!ids.has(id)) erros.push(`ordem inclui unidade inexistente "${id}"`);
  // ids duplicados na ordem mascarariam a checagem topológica (Map.get pega a ÚLTIMA posição) → reprova
  if (setOrdem.size !== ordem.length) {
    const dup = ordem.filter((id, i) => ordem.indexOf(id) !== i);
    erros.push(`ordem tem id(s) repetido(s): ${[...new Set(dup)].map((d) => `"${d}"`).join(", ")} (cada unidade aparece 1×)`);
  }
  // toda dependência aparece ANTES na ordem (topológica). posicao = PRIMEIRA ocorrência (não a última).
  const posicao = new Map();
  ordem.forEach((id, i) => { if (!posicao.has(id)) posicao.set(id, i); });
  for (const u of unidades) {
    for (const dep of u.depende_de ?? []) {
      if (!ids.has(dep)) { erros.push(`unidade "${u.id}" depende de "${dep}" inexistente`); continue; }
      if (posicao.get(dep) >= posicao.get(u.id)) {
        erros.push(`ordem inválida: "${u.id}" depende de "${dep}" mas vem antes/junto (não topológica)`);
      }
    }
  }
  return erros.length ? { ok: false, faltando: erros } : { ok: true, faltando: [] };
}

// --- Regras da etapa 6 (Implementação) ---------------------------------------------------------------
// Catálogo de GATES do critério oficial (PIPELINE.md). DADO (M1, editável sem tocar o mecanismo): trocar
// de stack troca os gates (tsc→mypy, vitest→pytest). O porteiro força DECLARAR cada um (mesmo como
// `nao_aplicavel` com motivo) — transporta "tsc/contracts/vitest/integrity/placeholder/hardcode" para a
// etapa SEM rodá-los. Qual é VERDE é variável da demanda; quais são DECLARADOS é o invariante.
const CATALOGO_GATES = ["tsc", "check:contracts", "vitest", "integrity-check", "placeholders", "hardcode"];

// Regra G-cob da etapa 6: o bloco `prontidao` declara TODOS os gates do catálogo (por nome exato no campo
// `gate`). Cobertura por nome — não regex/sinônimo (ao contrário de estados de UI): gate é identificador
// técnico, não conceito difuso. Gate omitido = prestação de contas incompleta = reprova. (A4: registrar
// que não se aplica, em vez de omitir.)
function regraGatesDeclarados(output) {
  const declarados = new Set((output?.prontidao ?? []).map((p) => p?.gate));
  const faltam = CATALOGO_GATES.filter((g) => !declarados.has(g));
  return faltam.length
    ? { ok: false, faltando: faltam.map((g) => `gate não declarado em prontidao: "${g}" (declare estado + evidência, mesmo que nao_aplicavel)`) }
    : { ok: true, faltando: [] };
}

// Padrão de id ancorável: PREFIXO-MAIÚSCULO seguido de dígito (GAP-001, CA-04, ADR-002, U1, R1, R-201...).
// Só ids nesse formato entram no universo de âncoras válidas — barra ids espúrios (ex.: estados[].id="estado-loading"
// de UI, que não é requisito). É a CONVENÇÃO do pipeline, não um nome de campo fixo (M1 preservado: a regra
// não sabe que vêm de "gaps"/"criterios_aceitacao"; sabe a FORMA de uma âncora). Achado da revisão cega (W1).
const RE_ID_ANCORA = /^[A-Z]+-?\d+$/;

// Coleta RECURSIVA de ids ancoráveis em qualquer profundidade de um valor (W2 da revisão cega: a varredura
// rasa desligava `temFonte` se a fonte aninhasse os requisitos, deixando fantasma passar). Desce por arrays
// e objetos; junta todo `item.id` que casa RE_ID_ANCORA. Retorna se achou ALGUM id ancorável (temFonte).
function coletarIdsAncoraveis(valor, acc) {
  if (Array.isArray(valor)) {
    for (const v of valor) coletarIdsAncoraveis(v, acc);
  } else if (valor && typeof valor === "object") {
    if (typeof valor.id === "string" && RE_ID_ANCORA.test(valor.id)) acc.add(valor.id);
    for (const v of Object.values(valor)) coletarIdsAncoraveis(v, acc);
  }
}

// Regra A-rastr da etapa 6 (D-1, B-restrito — A014/A015): toda âncora de `arquivos_alterados` aponta um id
// que EXISTE nos outputs das etapas anteriores (gap/design/mapa, promovidos no estado). Integridade
// REFERENCIAL (o id existe?), NÃO pertinência (é a âncora certa? → Gate A). DINÂMICA (M1): varre o estado
// coletando ids no formato de âncora (RE_ID_ANCORA) em qualquer profundidade; não hardcoda nomes de campo.
// Fonte ausente (nenhum id ancorável no estado) → `nao_verificavel`: não reprova (não dá para cruzar sem
// fonte), distinto de âncora-fantasma (id não encontrado quando há fonte) = reprova.
function regraAncoraRastreavel(output, _etapa, estado) {
  // 1. Monta o SET de ids válidos varrendo (recursivo) os <etapa>_output do estado (genérico, M1).
  const idsValidos = new Set();
  for (const [chave, valor] of Object.entries(estado ?? {})) {
    if (!chave.endsWith("_output")) continue;
    coletarIdsAncoraveis(valor, idsValidos);
  }
  // 2. Sem fonte indexável: não dá para verificar — não reprova (limite honesto declarado no CORE).
  if (idsValidos.size === 0) return { ok: true, faltando: [] };
  // 3. Cada âncora de cada mudança deve existir no set. Reporta as fantasmas.
  const fantasmas = [];
  for (const m of output?.arquivos_alterados ?? []) {
    for (const a of m?.ancora ?? []) {
      if (!idsValidos.has(a)) fantasmas.push(`âncora "${a}" (em ${m?.arquivo ?? "mudança"}) não existe em nenhum output anterior`);
    }
  }
  return fantasmas.length ? { ok: false, faltando: fantasmas } : { ok: true, faltando: [] };
}

// --- Regras da etapa 7 (Gate A — Revisão adversarial) ------------------------------------------------
// CATÁLOGO DE LENTES (DADO plano no CORE, M1): a bateria COMPLETA de verificação, de TODOS os arquétipos de
// UI. Decisão (operador): não se decide "arquétipo" — injeta-se o catálogo inteiro e o revisor declara, por
// lente, se ela COBRE/DESCOBRE/NÃO-SE-APLICA à feature (igual aos 6 gates da etapa 6). Elimina o conceito de
// arquétipo como entrada; serve features multi-arquétipo (a aba CLIs já era LISTA+MUTACAO). Cada lente tem
// `nome` (rótulo) e `re` (matching CONCEITUAL — lente é conceito difuso, como estados de UI; NÃO id técnico).
// Fontes canônicas: USWDS (a11y por componente) + OWASP ASVS (por operação). Adicionar lente = +item, 0 código.
const CATALOGO_LENTES = [
  // LISTA
  { nome: "estado vazio", re: /vazi|empty|nenhum|sem (resultado|item|dado|registro)|zerada|0 result/ },
  { nome: "estado de erro", re: /erro|error|falh|fail/ },
  { nome: "paginação/volume", re: /pagina|volume|limit|offset|scroll|lazy|carregar mais/ },
  { nome: "ordenação", re: /orden|sort|shadow|dedupe|precedência/ }, // não "ordem" solto (casaria "persistência de ordem")
  // MUTACAO
  { nome: "validação de input", re: /valida.*input|input.*valida|allow.?list|sanitiz|range|length|formato do (nome|campo)/ },
  { nome: "confirmação de ação destrutiva", re: /confirma|destrut|delete|exclu|dialog de confirma/ },
  { nome: "reversibilidade", re: /revers|desfaz|restaur|undo|históric/ }, // não "rollback" (casaria "optimistic update e rollback")
  { nome: "edge de escrita", re: /edge.*escrit|escrit.*edge|write|fs\b|workspace|permiss.*escrit|cwd/ },
  { nome: "concorrência", re: /concorr|lost.?update|race|submiss.*dupl|dupl.*submit|idempot/ }, // não "stale" (casaria "dados obsoletos/stale")
  { nome: "autorização", re: /autoriza|permiss|least privilege|acesso|role|escopo/ },
  // DRAWER / MODAL
  { nome: "foco ao abrir", re: /foco|focus|aria-label|labelledby|título do (modal|drawer|dialog)/ },
  { nome: "escape/fechar por teclado", re: /escape|esc\b|fechar.*teclad|teclad.*fechar/ },
  { nome: "fechamento acidental", re: /fechamento.*acident|acident.*fechamento|click.?out|outside.?click|backdrop|dados não salvos/ },
  // DETALHE
  { nome: "registro inexistente (404)", re: /404|inexistent|não encontrad|removid|deletad.*aberto|fantasma/ },
  { nome: "campos opcionais ausentes", re: /campo.*(opcional|nul|ausent)|fallback|null.*safe/ },
  // estados transversais
  { nome: "estado de loading", re: /loading|carreg|spinner|skeleton|aguard/ },
  { nome: "dados obsoletos/stale", re: /obsolet|stale|desatualiz|refetch|dados antig/ },
  // BOARD
  { nome: "drag-drop e persistência de ordem", re: /drag|drop|arrast|reorden|persist.*ordem|kanban/ },
  { nome: "optimistic update e rollback", re: /optimist|otimist|rollback.*falh|reverter.*servidor/ },
  // UPLOAD / DISCO
  { nome: "validação de arquivo (tipo/tamanho)", re: /mime|magic byte|validação de arquivo|tipo.*arquivo|tamanho|extens/ },
  { nome: "path traversal e segurança de upload", re: /path.?travers|presigned|sanitiz.*path|vírus|scan|audit.*upload/ },
];

// Regra L-cob da etapa 7: o revisor declara TODAS as lentes do catálogo (cada uma aparece em `lentes[].lente`,
// matching conceitual por regex). Lente do catálogo silenciosa = revisão incompleta = REPROVA do porteiro
// (não da feature). Molde: regraGatesDeclarados (etapa 6) + matching 1-para-1 de regraCatalogoCoberto (etapa 4).
// O casamento 1-para-1 (Set `usados`) é a defesa ESTRUTURAL contra colisão de regex (achado da revisão cega):
// cada lente DECLARADA satisfaz no máximo UMA lente do catálogo, então uma declaração ("persistência de ordem")
// não pode cobrir indevidamente DUAS lentes (ordenação E drag-drop) mesmo que ambos os regex a casassem.
function regraCatalogoLentesDeclaradas(output) {
  const declaradas = (output?.lentes ?? []).map((l) => `${l?.lente ?? ""}`.toLowerCase());
  const usados = new Set();
  const faltam = [];
  for (const L of CATALOGO_LENTES) {
    const idx = declaradas.findIndex((d, i) => !usados.has(i) && L.re.test(d));
    if (idx === -1) faltam.push(L.nome);
    else usados.add(idx);
  }
  return faltam.length
    ? { ok: false, faltando: faltam.map((nome) => `lente não considerada na revisão: '${nome}' (declare coberta/descoberta/nao_aplicavel)`) }
    : { ok: true, faltando: [] };
}

// Regra V-just da etapa 7: coerência veredito↔exigências E veredito↔p0_coberto. `exigencias_antes_de_mergear`
// é o PIVÔ FORMAL do veredito (como `evidencia` p/ gate verde na etapa 6). REPROVA SEM exigência = reprova em
// silêncio (proibido); APROVA COM exigência = contradição (há trabalho ANTES de mergear, logo não dá p/ aprovar
// o merge). E APROVA com p0_coberto="não" é incoerente (se o crítico não está coberto, não se aprova o merge —
// achado da revisão cega). São checagens LÓGICAS (não-semânticas) — validam consistência interna, não se o
// veredito é "justo".
function regraVeredictoJustificado(output) {
  const v = output?.veredito;
  const n = (output?.exigencias_antes_de_mergear ?? []).filter((e) => `${e ?? ""}`.trim()).length;
  const issuesAltas = (output?.issues ?? []).filter((i) => i?.severidade === "alta").length;
  if (v === "REPROVA" && n === 0) return { ok: false, faltando: ['veredito "REPROVA" sem exigencias_antes_de_mergear (não se reprova em silêncio)'] };
  if (v === "APROVA" && n > 0) return { ok: false, faltando: [`veredito "APROVA" com ${n} exigência(s) antes de mergear (contradição: se há exigência, não dá para aprovar o merge)`] };
  if (v === "APROVA" && output?.p0_coberto === "não") return { ok: false, faltando: ['veredito "APROVA" com p0_coberto "não" (incoerente: o crítico não está coberto — não se aprova o merge)'] };
  // APROVA com issue 'alta' DECLARADA é incoerência mecânica (você mesmo a marcou alta e aprovou sem exigir
  // nada) — distinto do sandbagging semântico (rebaixar p/ baixa), que fica fora (achado da revisão cega).
  if (v === "APROVA" && issuesAltas > 0) return { ok: false, faltando: [`veredito "APROVA" com ${issuesAltas} issue(s) de severidade "alta" (se há defeito alto, vire exigência ou rebaixe — não se aprova com alta em aberto)`] };
  return { ok: true, faltando: [] };
}

// Regra L-motivo da etapa 7 (a defesa ANTI-FUGA central do catálogo plano — eu a planejei e perdi ao
// "simplificar"; o anti-viés a repôs): uma lente `nao_aplicavel` exige um MOTIVO SUBSTANTIVO, não nota-lixo
// ("n/a", "-", "na", "não"). O schema já barra nota vazia; esta barra a nota oca. Sem ela, marcar tudo N/A com
// "n/a" + APROVA passa o porteiro — teatro de revisão. O N/A tem de ser decisão consciente, não automática.
// Motivo OCO: evidência/nota sem substância. Um item legítimo diz POR QUE (não se aplica) ou PROVA (operou).
// Inclui as fugas comuns: "n/a", "-", "não", e os assentimentos vazios "ok"/"sim"/"feito"/"verificado" (que
// afirmam sem provar — o pior caso num "coberto", a afirmação mais forte do agente). Achado D1/W1 da revisão.
// 2ª revisão cega (etapa 9): + irmãos de "n/a" (nd/n.d), placeholders de "ainda não fiz" (tbd/todo/wip/pendente),
// abreviações de 1 letra (s/y/t/f), "?" e número EM QUALQUER FORMATO (não só \d+: "-1"/"12.5"/"1e3" também são
// número solto, que não é prova). A normalização de pontuação de borda (em `oco`) fecha a fuga "ok." → "ok".
const NUM_SOLTO = "[+-]?\\d+(?:[.,]\\d+)?(?:e[+-]?\\d+)?"; // inteiro/decimal/notação científica, com sinal
const NOTA_OCA = new RegExp(
  `^(n\\/?a|na|n\\/?d|nd|n\\.?a\\.?|não|nao|sem|nenhum|x|ok|sim|yes|s|y|t|f|feito|done|pass|passou|true|false|` +
  `tbd|todo|wip|pendente|verificado|verified|checado|✓|✔|${NUM_SOLTO})$`, "i");

// Fábrica (A012 — generalizada ao 2º caso, etapa 8): "todo item de `listaCampo` cujo `situCampo` == `valorNA`
// exige um `motivoCampo` SUBSTANTIVO (não-oco)". A defesa anti-fuga do catálogo declarado (etapa 7: lentes;
// etapa 8: critérios WCAG) — sem ela, marcar tudo N/A com "n/a" passa o porteiro. `idCampo` rotula o erro.
// `valorNA === null` → aplica a TODO item (qualquer situação): a evidência precisa de substância SEMPRE — não
// só "coberto" com "ok" passaria teatro (achado D1 da revisão cega: a defesa anti-teatro vale p/ toda situação).
function regraNaoAplicavelComMotivo(listaCampo, idCampo, situCampo, valorNA, motivoCampo) {
  const aplica = (it) => valorNA === null || it?.[situCampo] === valorNA;
  // Oco = (a) vazio-de-verdade OU OBJETO/ARRAY — só no modo valorNA===null ("evidência ao vivo é prova TEXTUAL":
  // um objeto vira "[object Object]" e fugia do NOTA_OCA — furo 1 da 2ª revisão cega); OU (b) texto sem substância.
  // (b) normaliza pontuação/emoji de borda ANTES de casar NOTA_OCA — senão "ok." escapa do ^ok$ por um ponto
  // (furo 2). Sobrar "" após normalizar (era só pontuação, ex.: "-"/"??"/".") também é oco. Evidência real
  // ("GET /x → 200. Confere.") tem texto no meio → não casa. Achados C1 (1ª) + furos 1/2/3 (2ª revisão cega).
  const SINAL_BORDA = /^[\s.,;:!?…·•\-—–_*~"'`✓✔✗✘•·]+|[\s.,;:!?…·•\-—–_*~"'`✓✔✗✘•·]+$/g;
  const ocoTexto = (v) => {
    const norm = `${v ?? ""}`.trim().replace(SINAL_BORDA, "");
    return norm === "" || NOTA_OCA.test(norm);
  };
  const oco = (v) =>
    (valorNA === null && (evidenciaVazia(v) || (v && typeof v === "object"))) || ocoTexto(v);
  return (output) => {
    const ocas = (output?.[listaCampo] ?? []).filter((it) => aplica(it) && oco(it?.[motivoCampo]));
    const rotulo = valorNA === null ? "com evidência oca" : `${valorNA} com motivo oco`;
    return ocas.length
      ? { ok: false, faltando: ocas.map((it) => `"${it?.[idCampo] ?? "(item)"}" ${rotulo} ("${it?.[motivoCampo]}") — dê uma evidência/motivo SUBSTANTIVO`) }
      : { ok: true, faltando: [] };
  };
}

// Regra D-I da etapa 7: toda lente DESCOBERTA (= sem cobertura, = problema) é referenciada por ao menos uma
// issue. Fecha o circuito descoberta→issue→ação; impede a "descoberta órfã" (apontar buraco e não acionar).
// Matching conceitual (a issue.lente pode instanciar a lente em alvos: "MUTACAO/confirmação (delete)"). Molde:
// regraCircuitoComportamentoCriterio (etapa 4).
function regraDescobertaViraIssue(output) {
  const descobertas = (output?.lentes ?? []).filter((l) => l?.situacao === "descoberta");
  const lentesDeIssues = (output?.issues ?? []).map((i) => `${i?.lente ?? ""}`.toLowerCase());
  const orfas = descobertas.filter((d) => {
    const nome = `${d?.lente ?? ""}`.toLowerCase();
    // a issue cobre a lente se sua `lente` CONTÉM o nome INTEIRO da lente descoberta (a issue instancia a
    // lente, possivelmente com alvo: "confirmação de ação destrutiva (delete)" contém "confirmação de ação
    // destrutiva"). Só esta direção (li.includes(nome)) — a inversa (nome.includes(li)) deixava uma issue
    // genérica "estado" cobrir 3 descobertas distintas (vazio/erro/loading); furo achado pela revisão cega.
    return !lentesDeIssues.some((li) => li.includes(nome));
  });
  return orfas.length
    ? { ok: false, faltando: orfas.map((d) => `lente "${d.lente}" declarada DESCOBERTA mas sem issue que a acione (descoberta órfã)`) }
    : { ok: true, faltando: [] };
}

// Regra I-acion da etapa 7 (e 8): toda issue tem localizacao + acao não-vazias (sem isso a etapa 6 não sabe
// onde mexer nem o quê fazer). Reúso da filosofia de evidência obrigatória, aplicada a 2 campos.
function regraIssueAcionavel(output) {
  const erros = [];
  for (const i of output?.issues ?? []) {
    if (evidenciaVazia(i?.localizacao)) erros.push(`issue "${i?.id ?? "(sem id)"}" sem localizacao (onde está o defeito)`);
    if (evidenciaVazia(i?.acao)) erros.push(`issue "${i?.id ?? "(sem id)"}" sem acao (o que fazer — acionável)`);
  }
  return erros.length ? { ok: false, faltando: erros } : { ok: true, faltando: [] };
}

// --- Regras da etapa 8 (Acessibilidade — o "Gate A do runtime") -------------------------------------
// CATÁLOGO WCAG OPERACIONAL (DADO no CORE — exceção HONESTA a M1: é norma EXTERNA estável e finita, WCAG 2.2
// A/AA + APG do W3C; o dinâmico é a SITUAÇÃO de cada critério, não o catálogo). ≈16 critérios que SÓ se pegam
// operando a tela (Deque: Focus Order 0%, Keyboard 2,5% automatizáveis — o Gate A estático é cego a eles).
// Decisão (operador, simetria c/ etapa 7): injeta-se o catálogo INTEIRO e o agente declara cada critério
// coberto/violado/nao_aplicavel — a condicionalidade (só interação real) vira N/A com motivo (NÃO pular: VPAT
// + CI/CD compliance convergem — pular gera falso-verde). Cada {nome, re} com matching conceitual; regex
// DISJUNTOS (anti-colisão da etapa 7) — invariantes "casa o próprio nome" e "não casa o de outro" testados.
const CATALOGO_WCAG = [
  // Foco / teclado (transversais a qualquer interação)
  { nome: "2.1.1 Keyboard", re: /2\.1\.1|operável por teclado|operavel por teclado|todo interativo.*teclado/ }, // não "keyboard" solto (casaria "Keyboard Trap")
  { nome: "2.1.2 No Keyboard Trap", re: /2\.1\.2|keyboard trap|armadilha de foco|foco preso/ },
  { nome: "2.4.3 Focus Order", re: /2\.4\.3|focus order|ordem de (foco|tabula)/ },
  { nome: "2.4.7 Focus Visible", re: /2\.4\.7|focus visible|foco vis[íi]vel|anel de foco/ },
  { nome: "2.4.11 Focus Not Obscured", re: /2\.4\.11|not obscured|foco (não|nao) (obscurecido|escondido|coberto)/ },
  // Formulário (MUTACAO)
  { nome: "3.3.1 Error Identification", re: /3\.3\.1|error identification|identifica[çc][ãa]o de erro|erro identificado/ },
  { nome: "3.3.2 Labels or Instructions", re: /3\.3\.2|labels or instructions|r[óo]tulo|label.*campo|campo.*label/ },
  { nome: "3.3.3 Error Suggestion", re: /3\.3\.3|error suggestion|sugest[ãa]o de (corre[çc][ãa]o|erro)/ },
  { nome: "4.1.3 Status Messages", re: /4\.1\.3|status messages|mensagem de status|anunci|aria-live|live region|regi[ãa]o viva/ },
  // Modal / drawer (4 critérios distintos — os casos provaram que aparecem separados)
  { nome: "foco entra ao abrir (modal)", re: /foco entra|entra ao abrir|foco inicial.*(modal|drawer|dialog)/ },
  { nome: "focus trap no modal", re: /focus trap|trap.*(modal|foco)|prend(er|e) o foco.*modal/ },
  { nome: "Escape fecha o modal", re: /escape fecha|esc.*fecha|fecha.*escape/ },
  { nome: "foco retorna ao gatilho", re: /foco retorna|retorna ao gatilho|restaura[çr].*foco/ },
  // Board / drag-drop
  { nome: "2.5.7 Dragging Movements", re: /2\.5\.7|dragging|arrast|drag.*alternativa|alternativa.*arrast/ },
  // Transversais (todo conteúdo)
  { nome: "1.4.3 Contrast", re: /1\.4\.3|contrast|contraste/ },
  { nome: "4.1.2 Name Role Value", re: /4\.1\.2|name.*role.*value|nome.*papel|papel.*nome|nome acess[íi]vel/ },
];

// Regra W-cob da etapa 8: o agente declara TODOS os critérios do catálogo WCAG (cada um aparece em
// `criterios[].criterio`, matching conceitual 1-para-1 — molde regraCatalogoLentesDeclaradas da etapa 7).
// Critério em silêncio = verificação incompleta = REPROVA do porteiro (não da feature).
function regraCatalogoWcagDeclarado(output) {
  const declarados = (output?.criterios ?? []).map((c) => `${c?.criterio ?? ""}`.toLowerCase());
  const usados = new Set();
  const faltam = [];
  for (const W of CATALOGO_WCAG) {
    const idx = declarados.findIndex((d, i) => !usados.has(i) && W.re.test(d));
    if (idx === -1) faltam.push(W.nome);
    else usados.add(idx);
  }
  return faltam.length
    ? { ok: false, faltando: faltam.map((nome) => `critério WCAG não considerado: '${nome}' (declare coberto/violado/nao_aplicavel)`) }
    : { ok: true, faltando: [] };
}

// Regra V-a11y da etapa 8: coerência veredito↔issues (molde regraVeredictoJustificado da etapa 7). `aprovado`
// com issue 'alta' é incoerente (defeito de a11y alto barra o merge); `reprovado` sem nenhuma issue é reprovar
// em silêncio. Checagem lógica (não-semântica) — não julga se o defeito é real, só a consistência interna.
function regraVeredictoA11y(output) {
  const v = output?.veredito;
  const issuesAltas = (output?.issues ?? []).filter((i) => i?.severidade === "alta").length;
  const totalIssues = (output?.issues ?? []).length;
  if (v === "aprovado" && issuesAltas > 0) return { ok: false, faltando: [`veredito "aprovado" com ${issuesAltas} issue(s) de severidade "alta" (defeito de a11y alto não aprova — corrija ou rebaixe)`] };
  if (v === "reprovado" && totalIssues === 0) return { ok: false, faltando: ['veredito "reprovado" sem nenhuma issue (não se reprova em silêncio — aponte o defeito)'] };
  return { ok: true, faltando: [] };
}

// Regra W-circ da etapa 8: todo critério `violado` é referenciado por ≥1 issue (molde regraDescobertaViraIssue
// da etapa 7). Impede a "violação órfã" (declarar violado e não acionar). Matching: a issue.criterio CONTÉM o
// NOME INTEIRO do critério (a issue o instancia, possivelmente com alvo: "3.3.1 Error Identification (div#erro)"
// contém "3.3.1 error identification"). NÃO o 1º token — ancorar em "foco"/"focus" deixava uma issue de um
// critério satisfazer a violação órfã de OUTRO sem código (4 critérios de modal começam com foco/focus/escape).
// Furo achado pela revisão cega (C1); a etapa 7 já ancorava por nome inteiro — aqui a 8 regrediu e voltou.
function regraViolacaoViraIssue(output) {
  const violados = (output?.criterios ?? []).filter((c) => c?.situacao === "violado");
  const criteriosDeIssues = (output?.issues ?? []).map((i) => `${i?.criterio ?? ""}`.toLowerCase());
  const orfaos = violados.filter((c) => {
    const nome = `${c?.criterio ?? ""}`.toLowerCase().trim();
    return !criteriosDeIssues.some((ci) => ci.includes(nome));
  });
  return orfaos.length
    ? { ok: false, faltando: orfaos.map((c) => `critério "${c.criterio}" declarado VIOLADO mas sem issue que o acione (violação órfã)`) }
    : { ok: true, faltando: [] };
}

// --- Regras da etapa 9 (Gate B — Verificação ao vivo) -----------------------------------------------
// A etapa 9 é de GÊNERO diferente do Gate A/8: verifica a VERDADE (chama a API ao vivo), não a forma de uma
// declaração. Veredito QUATERNÁRIO (verificado/diverge/inconclusivo/precisa-humano) e FAIL-CLOSED: só
// "verificado" avança (a frase-âncora: o agente nunca é sua própria autoridade de verdade; o porteiro audita
// a evidência). Motivos enumerados de inconclusivo (lista fechada — o "motivo obrigatório do SKIP" do TAP).
const MOTIVOS_INCONCLUSIVO = ["ambiente-indisponivel", "endpoint-fora-do-proxy", "timeout", "sem-credencial-readonly", "pre-condicao-de-dado-ausente"];

// Regra B-mot da etapa 9: todo critério `inconclusivo` exige um `motivo` do enum fechado (não texto livre, não
// vazio). É o ônus de prova que impede "marco tudo inconclusivo e passo": inconclusivo sem motivo enumerado é
// output malformado. (A `evidencia` substantiva — a prova-da-tentativa — já é exigida pela regra de evidência.)
function regraInconclusivoComMotivo(output) {
  const erros = [];
  for (const c of output?.criterios ?? []) {
    if (c?.situacao !== "inconclusivo") continue;
    if (!MOTIVOS_INCONCLUSIVO.includes(c?.motivo)) {
      erros.push(`critério "${c?.criterio ?? "(item)"}" inconclusivo sem motivo do enum (use: ${MOTIVOS_INCONCLUSIVO.join("|")})`);
    }
  }
  return erros.length ? { ok: false, faltando: erros } : { ok: true, faltando: [] };
}

// Regra B-coer da etapa 9: o veredito GLOBAL deriva das situações por-critério, e FAIL-CLOSED. A verdade é
// composta: só "verificado" se TODOS os critérios CONFEREM; ≥1 diverge → o global tem de ser "diverge"; senão
// ≥1 precisa-humano → "precisa-humano"; senão ≥1 inconclusivo → "inconclusivo". O porteiro REJEITA um veredito
// global mais otimista que as situações permitem (ex.: "verificado" com um critério que diverge) — é o coração
// do fail-closed: a incerteza/divergência de QUALQUER critério rebaixa o todo, nunca o inverso.
function regraVeredictoGlobalCoerente(output) {
  const sits = (output?.criterios ?? []).map((c) => c?.situacao);
  const esperado =
    sits.some((s) => s === "diverge") ? "diverge" :
    sits.some((s) => s === "precisa-humano") ? "precisa-humano" :
    sits.some((s) => s === "inconclusivo") ? "inconclusivo" :
    "verificado"; // só quando TODOS conferem
  const v = output?.veredito;
  if (v !== esperado) {
    return { ok: false, faltando: [`veredito global "${v}" incoerente com as situações dos critérios (esperado "${esperado}" — fail-closed: a divergência/incerteza de qualquer critério rebaixa o todo)`] };
  }
  return { ok: true, faltando: [] };
}

// Regra B-cob da etapa 9: todo critério de aceitação do design (etapa 4) é ENDEREÇADO na verificação — nenhum
// em silêncio. CRUZA o estado: extrai os ids de `design_output.criterios_aceitacao[]` e exige que cada um
// apareça em `criterios[].criterio`. Molde regraAncoraRastreavel (etapa 6) — usa o 3º arg `estado`. Limite
// honesto: se o design_output não tem ids extraíveis (string/ausente), não dá para cobrar — não reprova.
function regraCriteriosDoDesignCobertos(output, _etapa, estado) {
  const design = estado?.design_output;
  const ids = (design && typeof design === "object" ? (design.criterios_aceitacao ?? []) : [])
    .map((c) => c?.id).filter((id) => typeof id === "string");
  if (ids.length === 0) return { ok: true, faltando: [] }; // sem fonte de ids — não verificável (limite declarado)
  const enderecados = (output?.criterios ?? []).map((c) => `${c?.criterio ?? ""}`.toLowerCase());
  // Ancoragem no id INTEIRO, não substring: "ca-12" NÃO endereça "ca-1" (furo C1 da revisão cega — a mesma
  // classe que a etapa 8 corrigiu: ver regraViolacaoViraIssue). O id casa só se delimitado — não estendido por
  // um caractere de id (dígito/letra/hífen) à direita. Ex.: "CA-1" casa "CA-1: x" e "ca-1)" mas não "CA-12".
  const enderecaId = (texto, id) => {
    const re = new RegExp(`(^|[^a-z0-9-])${escaparRegex(id)}(?![a-z0-9-])`, "i");
    return re.test(texto);
  };
  const faltam = ids.filter((id) => !enderecados.some((e) => enderecaId(e, id)));
  return faltam.length
    ? { ok: false, faltando: faltam.map((id) => `critério do design "${id}" não foi endereçado na verificação ao vivo`) }
    : { ok: true, faltando: [] };
}

// Fábrica de regra reutilizável (A012): "todo item de `listaCampo` cujo `condCampo` == `condValor`
// DEVE ter `evidCampo` não-vazio". Usada pela etapa 2 ("confirmado ao vivo" exige evidencia_ao_vivo)
// e pela etapa 3 (todo gap exige evidencia). A honestidade é imposta pelo formato, não pela boa-fé.
function regraEvidenciaObrigatoria(listaCampo, idCampo, condCampo, condValor, evidCampo) {
  // condCampo === null → aplica a TODO item (ex.: todo gap exige evidência). Senão, só aos itens
  // cujo condCampo == condValor (ex.: só os "confirmado ao vivo" exigem evidencia_ao_vivo).
  const aplica = (item) => condCampo === null || item?.[condCampo] === condValor;
  const rotulo = condCampo === null ? "exige" : `"${condValor}" sem`;
  return (output) => {
    const sem = (output?.[listaCampo] ?? []).filter(
      (item) => aplica(item) && evidenciaVazia(item?.[evidCampo])
    );
    if (sem.length) {
      return { ok: false, faltando: sem.map(
        (item) => `${item?.[idCampo] ?? "(item)"}: ${rotulo} ${evidCampo} (sem prova = suposição, não gap)`
      ) };
    }
    return { ok: true, faltando: [] };
  };
}

// Regra X2 da etapa 3: a banda de complexidade deve ser COERENTE com os drivers (computada, não opinada).
// Não força uma fórmula rígida (pesos a validar — provisório), mas barra incoerências grosseiras: banda
// "simples" com P0>0 ou infra nova; banda "alta" sem nenhum driver de peso. Imposta pelo formato.
function regraComplexidadeCoerente(output) {
  const c = output?.complexidade;
  if (!c || !c.drivers) return { ok: true, faltando: [] }; // estrutura já validada antes
  const d = c.drivers;
  const num = (v) => (typeof v === "number" ? v : parseInt(v, 10) || 0);
  const p0 = num(d.p0), p1 = num(d.p1), integ = num(d.integracoes), inc = num(d.incertezas);
  const infraNova = d.exige_infra_nova === "sim";
  const peso = p0 * 3 + p1 + integ + inc + (infraNova ? 4 : 0);
  const erros = [];
  // Simetria (achado da revisão cega): cada banda barra a incoerência grosseira no seu lado. Não é
  // fórmula rígida (pesos provisórios — M4); só rejeita o que contradiz os drivers de forma óbvia.
  if (c.banda === "simples" && (p0 > 0 || infraNova)) {
    erros.push(`complexidade "simples" incoerente: há ${p0} P0${infraNova ? " e exige infra nova" : ""}`);
  }
  if (peso === 0 && c.banda !== "simples") {
    erros.push(`complexidade "${c.banda}" incoerente: nenhum driver de peso (tudo zero) deveria ser "simples"`);
  }
  if (c.banda !== "alta" && (p0 >= 3 || (infraNova && p0 >= 1))) {
    erros.push(`complexidade "${c.banda}" incoerente: ${p0} P0${infraNova ? " + infra nova" : ""} é perfil de "alta"`);
  }
  return erros.length ? { ok: false, faltando: erros } : { ok: true, faltando: [] };
}

export const PIPELINE = [
  {
    id: "dag",
    nome: "DAG — Mapa de correlações",
    agente: "Explore",
    // Executor como DADO consultável (peça 2): capacidade + enum de confiança vivem aqui, não em
    // prosa no CORE. O enum REFLETE a capacidade (peça 3): o Explore não toca a rede, então não tem
    // valores de runtime ("confirmado ao vivo"). Trocar de executor = editar este objeto (M1).
    executor: {
      nome: "Explore",
      capacidade: "lê código; não toca a rede; não cria arquivos",
      // Fonte única do enum de confiança (injetado em TODO o CORE via placeholders). Arestas usam um
      // subconjunto (não têm "não encontrado" — uma aresta ou foi lida ou inferida).
      confianca_enum: ["lido no código", "inferido do código", "não encontrado"],
      confianca_enum_arestas: ["lido no código", "inferido do código"],
    },
    core: "[fallback] Construa o DAG de dependências de consumo do entry_point. Ver cores/CORE-DAG.md.",
    corePath: "cores/CORE-DAG.md",
    // Pré-condições (peça 6): campos do estado que DEVEM existir para a etapa rodar. O motor verifica
    // antes de gerar o briefing; se faltar, bloqueia (early-exit). Dado, não prosa no CORE.
    precondicoes: ["entry_point", "project_root"],
    // Estado curado (peça 7): quais campos do estado entram no briefing DESTA etapa (R5 do CORE —
    // injetar só o necessário). Dado por etapa; etapas sem isto usam o default do motor.
    estadoCurado: ["entry_point", "description", "project_root", "next_stage", "concluidas"],
    // 'gaps' NÃO entra na checagem de presença de topo (camposPresentes reprova []): zero gaps é
    // válido. A seção é exigida via `presente: true` no schemaEstrutural (existe, mas pode ser vazia).
    schema: ["nos", "arestas", "blast_radius", "fronteira", "confianca"],
    // Schema ESTRUTURAL (dado único, peças 4+5): descreve a forma de cada campo. O enum de confiança
    // é uma FUNÇÃO que lê o executor da etapa — fonte única (o mesmo enum do briefing valida o output).
    // Forma COMPLETA do output (profundidade-3, recursiva). Fonte única: valida E gera a Seção 4 do
    // CORE (ver gerarSchemaProsa). Enums de confiança vêm do executor (mesma fonte do briefing).
    schemaEstrutural: {
      nos: { tipo: "lista-de-objetos", minItens: 1, itemCampos: {
        nome: { obrigatorio: true },
        tipo: { obrigatorio: true },
        path: { obrigatorio: true },
        shape: { obrigatorio: true },
        hub: { obrigatorio: true, enum: ["sim", "não"] },
        confianca: { obrigatorio: true, enum: (e) => e.executor?.confianca_enum ?? [] },
      } },
      arestas: { tipo: "lista-de-objetos", minItens: 1, itemCampos: {
        consumidor: { obrigatorio: true },
        provedor: { obrigatorio: true },
        tipo: { obrigatorio: true, enum: ["consome", "depende"] },
        custo_reverso: { obrigatorio: true, enum: ["🟢 cheap", "🟡 indireto", "🔴 scan", "a-confirmar", "n/a"] },
        confianca: { obrigatorio: true, enum: (e) => e.executor?.confianca_enum_arestas ?? [] },
      } },
      blast_radius: { tipo: "lista-de-objetos", minItens: 1, itemCampos: {
        no: { obrigatorio: true },
        consumido_por: { obrigatorio: true, tipo: "lista-de-strings" },
        amplitude: { obrigatorio: true, enum: ["BAIXA", "MÉDIA", "ALTA", "CRÍTICA"] },
      } },
      fronteira: { tipo: "objeto", campos: {
        nos_folha: { obrigatorio: true, tipo: "lista-de-strings" },
        saidas_1hop: { obrigatorio: true, tipo: "lista-de-strings" },
        // `presente`: a chave DEVE existir (A4 — "registre, nunca silencie"), mas pode ser lista
        // vazia (registrar explicitamente que não houve expansão ≠ omitir).
        expansoes: { presente: true, tipo: "lista-de-objetos", itemCampos: {
          vizinho: { obrigatorio: true },
          motivo: { obrigatorio: true, enum: ["hub", "pass-through", "contrato"] },
        } },
        candidatos_transitivos: { presente: true, tipo: "lista-de-strings" },
      } },
      ciclos: { opcionalNoTopo: true, tipo: "lista-de-objetos", itemCampos: {
        nos: { obrigatorio: true, tipo: "lista-de-strings" },
        relacao: { obrigatorio: true },
      } },
      // `presente` (não `minItens`): a seção gaps deve existir, mas ZERO gaps é resultado válido —
      // C1 é um FILTRO (pode resultar em nenhum), não uma cota. Forçar inventar gap contraria o CORE.
      gaps: { presente: true, tipo: "lista-de-objetos", itemCampos: {
        id: { obrigatorio: true },
        prioridade: { obrigatorio: true, enum: ["P0", "P1", "P2"] },
        acao: { obrigatorio: true },
      } },
      confianca: { tipo: "objeto", campos: {
        lido: { obrigatorio: true },
        inferido: { obrigatorio: true },
        nao_encontrado: { obrigatorio: true },
      } },
    },
    // Sem `aceita` custom: o avaliador genérico do motor faz presença (schema) + estrutura (schemaEstrutural).
  },
  {
    id: "descoberta",
    nome: "Descoberta da API",
    agente: "fiscal",
    // Executor: fiscal — TOCA a rede (oposto do Explore), mas read-only por construção. Enum de
    // confiança próprio da etapa 2 (ao-vivo). "confirmado ao vivo" só vale com evidência anexada
    // (o porteiro rebaixa — ver aceita).
    executor: {
      nome: "fiscal",
      capacidade: "verifica endpoints ao vivo (read-only por construção); não muta estado",
      confianca_enum: ["confirmado ao vivo", "inferido do código", "não verificado"],
    },
    core: "[fallback] Confirme ao vivo o contrato dos endpoints que o DAG listou. Ver cores/CORE-DISCOVERY.md.",
    corePath: "cores/CORE-DISCOVERY.md",
    // Pré-condição: precisa do mapa do DAG (quais endpoints importam). Sem ele, a Descoberta não sabe
    // o que confirmar — o motor bloqueia antes do briefing.
    precondicoes: ["entry_point", "project_root", "dag_output"],
    estadoCurado: ["entry_point", "description", "project_root", "dag_output", "next_stage", "concluidas"],
    schema: ["endpoints_confirmados", "resumo_confianca"],
    // Schema estrutural da Ficha de API. Cada endpoint carrega contrato observado + confiança + evidência.
    schemaEstrutural: {
      endpoints_confirmados: { tipo: "lista-de-objetos", minItens: 1, itemCampos: {
        endpoint: { obrigatorio: true },
        // params como lista-de-objetos (não objeto-vazio): captura a forma rica que o CORE exige —
        // cada param com tipo real, obrigatoriedade, traço crítico. (Correção do schema raso.)
        params: { obrigatorio: true, tipo: "lista-de-objetos", itemCampos: {
          nome: { obrigatorio: true },
          tipo: { obrigatorio: true },        // ex.: "string opcional (NÃO number)"
          obrigatorio: { obrigatorio: true }, // "sim" | "não"
        } },
        shape_resposta: { obrigatorio: true },
        limites: { obrigatorio: true },       // paginação, timeout, tetos (ou "não determinado")
        bordas: { obrigatorio: true },        // duplicações, coexistências, normalização, erros
        divergencias: {},                     // doc↔realidade (opcional — pode não haver)
        confianca: { obrigatorio: true, enum: (e) => e.executor?.confianca_enum ?? [] },
        evidencia_ao_vivo: { tipo: "objeto", campos: {} }, // forma; obrigatoriedade condicional no aceita()
      } },
      // O que não foi possível confirmar — COM justificativa (critério oficial: zero sem motivo).
      nao_verificado: { opcionalNoTopo: true, tipo: "lista-de-objetos", itemCampos: {
        item: { obrigatorio: true },
        motivo: { obrigatorio: true },
      } },
      resumo_confianca: { tipo: "objeto", campos: {
        confirmado_ao_vivo: { obrigatorio: true },
        inferido: { obrigatorio: true },
        nao_verificado: { obrigatorio: true },
      } },
    },
    // Regra estrutural da etapa 2 (achado P2) — agora declarativa via regrasExtras (A012), não `aceita`
    // imperativo. "confirmado ao vivo" SEM evidencia_ao_vivo é mentira → REPROVA. Imposta pelo formato.
    regrasExtras: [regraEvidenciaObrigatoria(
      "endpoints_confirmados", "endpoint", "confianca", "confirmado ao vivo", "evidencia_ao_vivo"
    )],
  },
  {
    id: "gap",
    nome: "GAP",
    agente: "error-detective",
    // Executor: error-detective — ANALISTA (confronta o já descoberto; não re-descobre, não toca rede).
    // Confiança herda a origem da evidência das etapas 1-2.
    executor: {
      nome: "error-detective",
      capacidade: "confronta o output do DAG e da Descoberta com o que a feature precisa; analisa, não descobre",
      confianca_enum: ["confirmado na descoberta", "inferido do código", "a confirmar via spike"],
    },
    core: "[fallback] Confronte o DAG + a Descoberta com o que a feature precisa. Ver cores/CORE-GAP.md.",
    corePath: "cores/CORE-GAP.md",
    // Pré-condições: precisa do mapa do DAG E do contrato da Descoberta (confronta os dois). Sem eles,
    // não há o que confrontar — o motor bloqueia antes do briefing.
    precondicoes: ["entry_point", "project_root", "dag_output", "descoberta_output"],
    estadoCurado: ["entry_point", "description", "project_root", "dag_output", "descoberta_output", "next_stage", "concluidas"],
    schema: ["complexidade", "resumo"],
    schemaEstrutural: {
      // gaps: pode ser [] (zero gaps é válido — C1 é filtro). Cada gap exige evidencia (regra extra).
      gaps: { presente: true, tipo: "lista-de-objetos", itemCampos: {
        id: { obrigatorio: true },
        descricao: { obrigatorio: true },
        prioridade: { obrigatorio: true, enum: ["P0", "P1", "P2"] },
        categoria: { obrigatorio: true, enum: ["quebra", "alinhamento", "indefinicao"] },
        evidencia: { obrigatorio: true },         // origem auditável (E1)
        angulos_tentados: {},                     // opcional; OBRIGATÓRIO se o gap é "impossível" (regra E3)
        confianca: { obrigatorio: true, enum: (e) => e.executor?.confianca_enum ?? [] },
      } },
      pronto_para_reuso: { presente: true, tipo: "lista-de-objetos", itemCampos: {
        item: { obrigatorio: true },
        por_que_serve: { obrigatorio: true },     // o "não reconstruir"
      } },
      no_gos: { presente: true, tipo: "lista-de-objetos", itemCampos: {
        o_que: { obrigatorio: true },
        motivo: { obrigatorio: true },
        destino: { obrigatorio: true, enum: ["desta-feature", "de-proposito", "de-outra-etapa"] },
      } },
      incertezas: { presente: true, tipo: "lista-de-objetos", itemCampos: {
        incerteza: { obrigatorio: true },
        spike: { obrigatorio: true },             // plano executável
      } },
      complexidade: { tipo: "objeto", campos: {
        banda: { obrigatorio: true, enum: ["simples", "média", "alta"] },
        drivers: { obrigatorio: true, tipo: "objeto", campos: {
          p0: { obrigatorio: true },
          p1: { obrigatorio: true },
          integracoes: { obrigatorio: true },
          incertezas: { obrigatorio: true },
          exige_infra_nova: { obrigatorio: true, enum: ["sim", "não"] },
        } },
        justificativa: { obrigatorio: true },     // o rastro dos drivers, não narrativa
      } },
      resumo: { tipo: "objeto", campos: {
        total_gaps: { obrigatorio: true },
        p0: { obrigatorio: true },
      } },
    },
    // Regras estruturais da etapa 3 (A012, declarativas): (1) todo gap exige evidencia (E1 — qualquer
    // gap, não só os "impossíveis"); (2) a banda de complexidade é coerente com os drivers (X2).
    regrasExtras: [
      regraEvidenciaObrigatoria("gaps", "id", null, undefined, "evidencia"), // null cond = TODO item (E1)
      regraAngulosSeImpossivel,   // E3: gap "impossível" exige angulos_tentados
      regraComplexidadeCoerente,  // X2: banda coerente com drivers
      regraResumoCoerente,        // resumo não pode mentir sobre a lista
    ],
  },
  {
    id: "design",
    nome: "Design",
    agente: "ui-ux-designer",
    // Executor: ui-ux-designer — DESIGNER (produz decisões, não analisa). Confiança = origem da decisão.
    executor: {
      nome: "ui-ux-designer",
      capacidade: "decide o comportamento da feature (estados, interação, critérios) ancorado no descoberto; não re-descobre",
      confianca_enum: ["ancorado em descoberta", "decisão de produto", "a confirmar via spike"],
    },
    core: "[fallback] Desenhe o comportamento da feature ancorado no DAG+Descoberta+GAP. Ver cores/CORE-DESIGN.md.",
    corePath: "cores/CORE-DESIGN.md",
    // Pré-condições: precisa das 3 etapas anteriores (confronta/decide sobre elas). O motor bloqueia se faltar.
    precondicoes: ["entry_point", "project_root", "dag_output", "descoberta_output", "gap_output"],
    estadoCurado: ["entry_point", "description", "project_root", "dag_output", "descoberta_output", "gap_output", "next_stage", "concluidas"],
    schema: ["resumo_design"],
    schemaEstrutural: {
      three_amigos: { tipo: "lista-de-objetos", minItens: 1, itemCampos: {
        comportamento: { obrigatorio: true },
        por_que: { obrigatorio: true },      // propósito (lente Negócio)
        como: { obrigatorio: true },         // mecânica concreta (lente Dev)
        criterios: { obrigatorio: true, tipo: "lista-de-strings" }, // IDs dos critérios (lente QA)
      } },
      criterios_aceitacao: { tipo: "lista-de-objetos", minItens: 1, itemCampos: {
        id: { obrigatorio: true },
        given: { obrigatorio: true },
        when: { obrigatorio: true },
        then: { obrigatorio: true },         // o resultado OBSERVÁVEL (C1 — o porteiro exige)
      } },
      riscos_premortem: { tipo: "lista-de-objetos", minItens: 3, itemCampos: { // ≥3 (pre-mortem)
        id: { obrigatorio: true },
        risco: { obrigatorio: true },        // causa → consequência
        mitigacao: { obrigatorio: true },
        o_que_revisar: { obrigatorio: true },// a lente do Gate A (R2 — sem isso, ruído no Gate A)
      } },
      estados: { tipo: "lista-de-objetos", minItens: 1, itemCampos: {
        estado: { obrigatorio: true },
        descricao: { obrigatorio: true },
        usuario_pode: { obrigatorio: true }, // as ações (matriz estado×ação)
      } },
      adrs: { tipo: "lista-de-objetos", minItens: 1, itemCampos: { // ≥1: toda etapa de design decide algo
        id: { obrigatorio: true },
        decisao: { obrigatorio: true },
        motivo: { obrigatorio: true },       // factual + no-go
      } },
      resumo_design: { tipo: "objeto", campos: {
        comportamentos: { obrigatorio: true },
        criterios: { obrigatorio: true },
        riscos: { obrigatorio: true },
      } },
    },
    // Regras estruturais da etapa 4: (1) catálogo de estados difíceis coberto, cada um distinto (E1/E2);
    // (2) o circuito fecha nos dois sentidos — comportamento↔critério (D-H); (3) o resumo não mente.
    regrasExtras: [
      regraCatalogoCoberto("estados", CATALOGO_ESTADOS_UI),
      regraCircuitoComportamentoCriterio,
      regraResumoDesignCoerente,
    ],
  },
  {
    id: "mapa_dependencias",
    nome: "Mapa de dependências",
    agente: "Plan",
    // Executor: Plan — PLANEJADOR (organiza trabalho em unidades/ordem/paralelo; não implementa).
    executor: {
      nome: "Plan",
      capacidade: "organiza a implementação em unidades ancoradas, ordem e paralelo provado; planeja, não implementa",
      confianca_enum: ["ancorado em gap/critério", "decisão de plano"],
    },
    core: "[fallback] Organize a implementação em unidades ancoradas, ordem e paralelo provado. Ver cores/CORE-MAPA.md.",
    corePath: "cores/CORE-MAPA.md",
    // Pré-condições: as 4 etapas anteriores (Definition of Ready). O motor bloqueia se faltar.
    precondicoes: ["entry_point", "project_root", "dag_output", "descoberta_output", "gap_output", "design_output"],
    estadoCurado: ["entry_point", "description", "project_root", "dag_output", "descoberta_output", "gap_output", "design_output", "next_stage", "concluidas"],
    schema: ["walking_skeleton"],
    schemaEstrutural: {
      unidades: { tipo: "lista-de-objetos", minItens: 1, itemCampos: {
        id: { obrigatorio: true },
        nome: { obrigatorio: true },
        objetivo: { obrigatorio: true },         // prescritivo (U4)
        arquivos: { obrigatorio: true, tipo: "lista-de-strings" }, // exatos (U3 — habilita o teste de paralelismo)
        ancora: { obrigatorio: true, tipo: "lista-de-strings" },   // ≥1 (U2 — rastreabilidade)
        depende_de: { presente: true, tipo: "lista-de-strings" },  // pode ser vazia (sem bloqueio)
      } },
      ordem: { obrigatorio: true, tipo: "lista-de-strings" },      // ids na sequência topológica
      paralelizavel: { presente: true, tipo: "lista-de-objetos", itemCampos: {
        grupo: { obrigatorio: true, tipo: "lista-de-strings" },
        justificativa: { obrigatorio: true },     // a prova de arquivos disjuntos
      } },
      walking_skeleton: { tipo: "objeto", campos: {
        necessario: { obrigatorio: true, enum: ["sim", "não"] }, // mesmo vocabulário binário do resto do arquivo
        justificativa: { obrigatorio: true },     // ancorada em fato (W3)
      } },
      ancoragem_no_gos: { presente: true, tipo: "lista-de-strings" }, // rastreamento negativo
    },
    // Regras estruturais da etapa 5: (1) paralelo PROVADO — pares paralelos têm arquivos disjuntos
    // (P1, mecânico); (2) ordem topologicamente válida — respeita depende_de e cobre todas as unidades (O1).
    regrasExtras: [
      regraParaleloDisjunto,
      regraOrdemTopologica,
    ],
  },
  {
    id: "implementacao",
    nome: "Implementação",
    agente: "frontend/typescript/fullstack",
    // Executor: dev que APLICA o código E roda os checks (auto-correção), e entrega um handoff verificável
    // com PROVA por gate. Ele faz de juiz de si só para virar o gate verde; o veredito de verdade não é dele
    // (Gate A refuta, Done re-roda). confianca = se aplicou SABENDO (confirmado) ou SUPONDO (inferido).
    executor: {
      nome: "frontend/typescript/fullstack",
      capacidade: "aplica o código conforme o mapa, roda os checks no loop, e entrega um plano de diff ancorado + prontidão com prova; não é o juiz final",
      confianca_enum: ["confirmado", "inferido"],
    },
    core: "[fallback] Aplique o código conforme o mapa e entregue o handoff ancorado com prova. Ver cores/CORE-IMPL.md.",
    corePath: "cores/CORE-IMPL.md",
    // Pré-condições: as 5 etapas anteriores (o mapa pronto pressupõe todas). O motor bloqueia se faltar.
    precondicoes: ["entry_point", "project_root", "dag_output", "descoberta_output", "gap_output", "design_output", "mapa_dependencias_output"],
    estadoCurado: ["entry_point", "description", "project_root", "dag_output", "descoberta_output", "gap_output", "design_output", "mapa_dependencias_output", "next_stage", "concluidas"],
    schema: ["resumo"],
    schemaEstrutural: {
      resumo: { obrigatorio: true },
      arquivos_alterados: { tipo: "lista-de-objetos", minItens: 1, itemCampos: {
        arquivo: { obrigatorio: true },
        mudanca: { obrigatorio: true },                                  // o diff conceitual preciso
        ancora: { obrigatorio: true, tipo: "lista-de-strings" },         // ≥1 (INV-1: sem mudança órfã)
        confianca: { obrigatorio: true, enum: ["confirmado", "inferido"] },
        nota: {},  // opcional no topo; obrigatória só p/ "inferido" (regra extra). Declarada p/ aparecer na prosa (paridade A013).
      } },
      golden_path_test: { tipo: "objeto", campos: {
        given: { obrigatorio: true },
        when: { obrigatorio: true },
        then: { obrigatorio: true },                                     // observável (INV-2)
        verifica: { obrigatorio: true, tipo: "lista-de-strings" },       // ids dos critérios exercitados
      } },
      riscos_de_regressao: { obrigatorio: true, tipo: "lista-de-strings" }, // ≥1 (INV-3: alvo concreto)
      prontidao: { tipo: "lista-de-objetos", minItens: 1, itemCampos: {
        gate: { obrigatorio: true },
        estado: { obrigatorio: true, enum: ["verde", "vermelho", "nao_aplicavel"] },
        evidencia: { obrigatorio: true },                               // verde→prova; n/a→motivo (regras extras)
      } },
      no_gos_respeitados: { presente: true, tipo: "lista-de-strings" },  // [] válido = não havia no-go
    },
    // Regras da etapa 6: TODO estado de gate carrega sua justificativa em `evidencia` — "verde"→prova,
    // "nao_aplicavel"→motivo, "vermelho"→o erro encontrado (3 irmãs via a fábrica da etapa 2; réu-não-é-juiz,
    // e fecham a fuga "marco tudo N/A e passo"). Mais: (4) os 6 gates do critério oficial declarados; (5)
    // confiança "inferido" exige nota; (6) toda âncora existe na fonte (B-restrito, cruza com o estado).
    regrasExtras: [
      regraEvidenciaObrigatoria("prontidao", "gate", "estado", "verde", "evidencia"),
      regraEvidenciaObrigatoria("prontidao", "gate", "estado", "nao_aplicavel", "evidencia"),
      regraEvidenciaObrigatoria("prontidao", "gate", "estado", "vermelho", "evidencia"),
      regraGatesDeclarados,
      regraEvidenciaObrigatoria("arquivos_alterados", "arquivo", "confianca", "inferido", "nota"),
      regraAncoraRastreavel,
    ],
  },
  {
    id: "gate_a",
    nome: "Gate A — Revisão",
    agente: "code-reviewer",
    // Executor: code-reviewer — REFUTADOR. Tenta achar defeito no diff (não valida, não conserta). É o JUIZ
    // do "réu" da etapa 6 (fecha o anti-viés do projeto: réu nunca é juiz → aqui entra um agente DIFERENTE).
    // O enquadramento adversarial é EMPÍRICO (pesquisa: "valide" derruba a detecção até 93pp; "refute" maximiza).
    executor: {
      nome: "code-reviewer",
      capacidade: "revisão ADVERSARIAL — passa o diff sob todas as lentes e tenta refutar; não valida, não conserta",
      confianca_enum: ["achado confirmado no diff", "risco potencial"],
    },
    core: "[fallback] Revisão adversarial: passe o diff sob TODAS as lentes do catálogo. Ver cores/CORE-GATEA.md.",
    corePath: "cores/CORE-GATEA.md",
    catalogoBriefing: CATALOGO_LENTES, // injeta as lentes no briefing ({catalogo_lentes}) — fonte única com a regra
    schemaPlaceholdersExtra: ["catalogo_lentes"], // documenta o placeholder extra (além de schema_prosa)
    // Pré-condições: as 6 etapas anteriores (precisa do diff da etapa 6). O motor bloqueia se faltar.
    precondicoes: ["entry_point", "project_root", "dag_output", "descoberta_output", "gap_output", "design_output", "mapa_dependencias_output", "implementacao_output"],
    estadoCurado: ["entry_point", "description", "project_root", "dag_output", "descoberta_output", "gap_output", "design_output", "mapa_dependencias_output", "implementacao_output", "next_stage", "concluidas"],
    schema: ["veredito"],
    schemaEstrutural: {
      veredito: { obrigatorio: true, enum: ["APROVA", "REPROVA"] }, // NÃO exige APROVA — REPROVA é sucesso da etapa
      resumo: { obrigatorio: true },
      lentes: { tipo: "lista-de-objetos", minItens: 1, itemCampos: {
        lente: { obrigatorio: true },
        situacao: { obrigatorio: true, enum: ["coberta", "descoberta", "nao_aplicavel"] },
        nota: { obrigatorio: true, tipo: "string" },  // onde (coberta) / exigência (descoberta) / motivo (nao_aplicavel) — sempre; string (anti-objeto, 2ª rev. cega)
      } },
      issues: { presente: true, tipo: "lista-de-objetos", itemCampos: {
        id: { obrigatorio: true },
        severidade: { obrigatorio: true, enum: ["alta", "media", "baixa"] },
        lente: { obrigatorio: true },
        localizacao: { obrigatorio: true },  // onde está o defeito (regra extra reforça)
        descricao: { obrigatorio: true },
        acao: { obrigatorio: true },          // o conserto prescrito, acionável (regra extra reforça)
      } },
      p0_coberto: { obrigatorio: true, enum: ["sim", "não"] },
      exigencias_antes_de_mergear: { presente: true, tipo: "lista-de-strings" }, // [] válido só quando APROVA
    },
    // Regras da etapa 7 (todas reúso de mecanismo — zero dialeto novo): (1) TODAS as lentes do catálogo
    // declaradas (cobertura total); (2) toda issue tem localizacao+acao acionáveis; (3) veredito coerente com
    // exigências (REPROVA→≥1, APROVA→0 — pivô formal); (4) descoberta vira issue (circuito). A `nota` de cada
    // lente (onde/exigência/motivo) já é obrigatória no schema p/ TODAS — não precisa de regra condicional.
    // NÃO usa `estado` (não cruza arquétipo — o catálogo é injetado inteiro, decisão do operador).
    regrasExtras: [
      regraCatalogoLentesDeclaradas,
      regraNaoAplicavelComMotivo("lentes", "lente", "situacao", "nao_aplicavel", "nota"), // anti-fuga (fábrica)
      regraIssueAcionavel,
      regraVeredictoJustificado,    // inclui: REPROVA→≥1 exig; APROVA→0 exig + P0 coberto + 0 issue 'alta'
      regraDescobertaViraIssue,
    ],
  },
  {
    id: "acessibilidade",
    nome: "Acessibilidade",
    agente: "web-accessibility-checker",
    // Executor: web-accessibility-checker — opera a tela (Playwright+axe) e verifica WCAG OPERACIONAL (foco,
    // teclado, leitura de tela, contraste com dado real) EM MOVIMENTO. É o "Gate A do runtime": o Gate A (7)
    // leu o código estaticamente; esta vê operando (Deque: Focus Order 0%, Keyboard 2,5% automatizáveis — o
    // estático é cego a isto). confianca = o que VERIFICOU operando vs. o que JULGOU semanticamente (falível).
    executor: {
      nome: "web-accessibility-checker",
      capacidade: "opera a tela (Playwright+axe) e verifica WCAG operacional em movimento; não lê código, não conserta",
      confianca_enum: ["verificado operando a tela", "julgamento semântico (falível)"],
    },
    core: "[fallback] Opere a tela e verifique CADA critério WCAG do catálogo, com evidência operacional. Ver cores/CORE-A11Y.md.",
    corePath: "cores/CORE-A11Y.md",
    catalogoBriefing: CATALOGO_WCAG, // injeta os critérios WCAG no briefing ({catalogo_lentes}) — fonte única com a regra
    // Pré-condições: as 7 etapas anteriores (precisa do Gate A aprovado). O motor bloqueia se faltar.
    precondicoes: ["entry_point", "project_root", "dag_output", "descoberta_output", "gap_output", "design_output", "mapa_dependencias_output", "implementacao_output", "gate_a_output"],
    estadoCurado: ["entry_point", "description", "project_root", "design_output", "implementacao_output", "gate_a_output", "next_stage", "concluidas"],
    schema: ["veredito"],
    schemaEstrutural: {
      veredito: { obrigatorio: true, enum: ["aprovado", "reprovado"] }, // binário; reprovado é resultado válido
      resumo: { obrigatorio: true },
      criterios: { tipo: "lista-de-objetos", minItens: 1, itemCampos: {
        criterio: { obrigatorio: true },
        situacao: { obrigatorio: true, enum: ["coberto", "violado", "nao_aplicavel"] },
        evidencia_operacional: { obrigatorio: true, tipo: "string" }, // âncora(coberto)/observado(violado)/motivo(nao_aplicavel) — string (anti-objeto, 2ª rev. cega)
      } },
      issues: { presente: true, tipo: "lista-de-objetos", itemCampos: {
        id: { obrigatorio: true },
        severidade: { obrigatorio: true, enum: ["alta", "media", "baixa"] },
        criterio: { obrigatorio: true },     // qual critério WCAG
        localizacao: { obrigatorio: true },  // onde (elemento/seletor) — regra extra reforça
        descricao: { obrigatorio: true },
        acao: { obrigatorio: true },          // correção acionável — regra extra reforça
      } },
      fica_para_humano: { presente: true, tipo: "lista-de-strings" }, // a fronteira p/ a etapa 10 (screen reader real)
    },
    // Regras da etapa 8 (todas reúso/molde — zero dialeto novo): (1) TODOS os critérios WCAG do catálogo
    // declarados; (2) nao_aplicavel exige motivo SUBSTANTIVO (a fábrica generalizada da etapa 7); (3) toda
    // issue tem localizacao+acao; (4) veredito coerente (aprovado→0 issue 'alta'; reprovado→≥1 issue); (5)
    // critério violado vira issue (circuito). NÃO usa `estado` (não cruza nada — o catálogo é injetado inteiro).
    regrasExtras: [
      regraCatalogoWcagDeclarado,
      // null = TODA situação: a evidência_operacional precisa de substância sempre (coberto com "ok" também
      // é teatro — achado D1). Cobre o anti-fuga do N/A e a defesa anti-teatro de coberto/violado de uma vez.
      regraNaoAplicavelComMotivo("criterios", "criterio", "situacao", null, "evidencia_operacional"),
      regraIssueAcionavel,
      regraVeredictoA11y,
      regraViolacaoViraIssue,
    ],
  },
  {
    id: "gate_b",
    nome: "Gate B — Verificação ao vivo",
    agente: "fiscal",
    // Executor: fiscal — JUIZ DA AUTENTICIDADE. Chama a API AO VIVO (read-only) e confronta o real com os
    // critérios do design. NÃO lê código, NÃO muta produção. Re-verifica o que a etapa 6 declarou e a 8 afirmou
    // ter operado. Parente da etapa 2 (Descoberta): mesma verificação ao vivo, mesma evidência obrigatória.
    executor: {
      nome: "fiscal",
      capacidade: "chama a API ao vivo (read-only) e confronta o comportamento real com os critérios; não lê código, não muta produção",
      confianca_enum: ["verificado ao vivo", "inconclusivo (não deu para checar)"],
    },
    core: "[fallback] Confronte o comportamento real (API ao vivo) com cada critério do design. Ver cores/CORE-GATEB.md.",
    corePath: "cores/CORE-GATEB.md",
    // Pré-condições: as 8 etapas anteriores (precisa dos critérios do design + a acessibilidade). O motor bloqueia.
    precondicoes: ["entry_point", "project_root", "dag_output", "descoberta_output", "gap_output", "design_output", "mapa_dependencias_output", "implementacao_output", "gate_a_output", "acessibilidade_output"],
    estadoCurado: ["entry_point", "description", "project_root", "design_output", "gap_output", "gate_a_output", "acessibilidade_output", "next_stage", "concluidas"],
    schema: ["veredito"],
    schemaEstrutural: {
      // QUATERNÁRIO (não binário): verificado/diverge/inconclusivo/precisa-humano. FAIL-CLOSED: só "verificado"
      // avança (regra extra exige). diverge/inconclusivo/precisa-humano são outputs VÁLIDOS mas bloqueiam (a
      // feature não está pronta / não pôde ser confirmada — volta à etapa 6 ou escala).
      veredito: { obrigatorio: true, enum: ["verificado", "diverge", "inconclusivo", "precisa-humano"] },
      resumo: { obrigatorio: true },
      criterios: { tipo: "lista-de-objetos", minItens: 1, itemCampos: {
        criterio: { obrigatorio: true },
        situacao: { obrigatorio: true, enum: ["confere", "diverge", "inconclusivo", "precisa-humano"] },
        evidencia: { obrigatorio: true, tipo: "string" }, // request+response real / ESPERADO-vs-REAL / prova-da-tentativa — string (anti-objeto, 2ª rev. cega)
        motivo: {}, // enum exigido SÓ se inconclusivo (regra extra) — opcional no topo
      } },
      fica_para_humano: { presente: true, tipo: "lista-de-strings" }, // a fronteira p/ a etapa 10 (humano)
    },
    // Regras da etapa 9 (reúso/molde — zero dialeto novo): (1) cada critério tem evidência SUBSTANTIVA (a
    // fábrica da etapa 8 com valorNA=null — evidência oca "ok" reprova em qualquer situação); (2) inconclusivo
    // exige motivo do enum; (3) o veredito global é coerente com as situações (fail-closed); (4) todo critério
    // do design é endereçado (cruza o estado); (5) FAIL-CLOSED: só "verificado" passa o porteiro (avança).
    regrasExtras: [
      regraNaoAplicavelComMotivo("criterios", "criterio", "situacao", null, "evidencia"), // evidência substantiva sempre
      regraInconclusivoComMotivo,
      regraVeredictoGlobalCoerente,
      regraCriteriosDoDesignCobertos,
      regraCampoIgual("veredito", "verificado", 'Gate B fail-closed: só "verificado" avança — diverge/inconclusivo/precisa-humano BLOQUEIAM (a feature não está pronta ou não pôde ser confirmada ao vivo)'),
    ],
  },
  {
    id: "aprovacao_humana",
    nome: "Aprovação humana",
    agente: "humano",
    // Etapa HITL — gênero NÃO-CORE: o executor é o HUMANO, não um agente LLM. Não há meta-prompt; o `next`
    // gera um DOSSIÊ derivado do estado (peça 2) e o humano aprova. A garantia é PROCESSUAL (o agente mostra o
    // dossiê e ESPERA a fala humana real antes do advance — não a fabrica), declarada honesta (dívida A019):
    // num pipeline dirigido por agente, o motor não prova cripto que um humano aprovou. FAIL-CLOSED: só
    // "aprovado" avança (é o último checkpoint humano antes do deploy — etapa 12 — e aprovação-antes-do-
    // side-effect é a regra inviolável do HITL).
    core: [
      "Esta é a etapa de APROVAÇÃO HUMANA (HITL). O agente NÃO aprova sozinho: apresente o dossiê abaixo ao",
      "humano, espere ele USAR a tela e dar o OK explícito (uma fala como \"tá bom\" basta), e só então registre",
      "o output com `aprovado_por` (o nome de quem aprovou) e `decisao`. Se o humano pedir mudança, registre",
      "`decisao: \"rejeitado\"` com a `observacao` — a feature fica parada (fail-closed).",
      "",
      "> LIMITE (dívida A019): a garantia desta etapa é PROCESSUAL, não criptográfica. Como o pipeline é",
      "> dirigido por um agente, o motor não consegue PROVAR que um humano aprovou — ele confia que houve uma",
      "> fala humana real autorizando. Não invente o OK: se não houve fala humana de aprovação, não registre",
      "> `aprovado`. A autenticidade última é do próprio ato de o humano usar a tela e dizer que está bom.",
      "",
      "{dossie_aprovacao}",
    ].join("\n"),
    dossie: true, // sinaliza ao motor: injetar {dossie_aprovacao} derivado do estado (genérico, M1)
    schema: ["aprovado_por", "decisao"],
    schemaEstrutural: {
      aprovado_por: { obrigatorio: true, tipo: "string" }, // o nome do humano que aprovou (texto, não objeto)
      decisao: { obrigatorio: true, enum: ["aprovado", "rejeitado"] }, // binário; rejeitado é válido mas bloqueia
      observacao: { opcionalNoTopo: true, tipo: "string" }, // opcional — o que o humano disse/pediu (pode faltar)
    },
    regrasExtras: [
      // FAIL-CLOSED: só "aprovado" avança. "rejeitado" BLOQUEIA (retorno 1, a feature PERMANECE em
      // aprovacao_humana). "volta à etapa 6" é semântica PROCESSUAL (o humano pediu mudança) — o motor não
      // rebobina o DAG; quem reabre a etapa 6 é o operador. Vale p/ todos os gates fail-closed (idem Gate B).
      regraCampoIgual("decisao", "aprovado", 'Aprovação humana fail-closed: só "aprovado" avança — "rejeitado" BLOQUEIA (a feature fica parada aqui; reabrir a implementação é decisão do operador)'),
    ],
  },
  {
    id: "done",
    nome: "Done",
    agente: "sistema",
    core: "[PLACEHOLDER MVP] dag verify + check ci verdes; INDEX e ADRs commitados.",
    schema: ["verify_ok"],
    regrasExtras: [regraCampoIgual("verify_ok", true, "verify_ok deve ser true")],
  },
  {
    id: "smoke",
    nome: "Smoke pós-deploy",
    agente: "devops-engineer",
    core: "[PLACEHOLDER MVP] Verifique a feature em produção real. Verde/alerta/rollback.",
    schema: ["status"],
    regrasExtras: [regraCampoIgual("status", "verde", 'status deve ser "verde"')],
  },
  {
    id: "retrospectiva",
    nome: "Retrospectiva de cicatriz",
    agente: "documentador",
    core: "[PLACEHOLDER MVP] Registre lições e proponha melhorias no pipeline. Mínimo 1 lição.",
    schema: ["licoes"],
    aceita: (o) => camposPresentes(o, ["licoes"]),
  },
];

export const PRIMEIRA_ETAPA = PIPELINE[0].id;

export function etapaPorId(id) {
  return PIPELINE.find((e) => e.id === id) ?? null;
}

export function proximaEtapa(id) {
  const i = PIPELINE.findIndex((e) => e.id === id);
  if (i === -1 || i === PIPELINE.length - 1) return null;
  return PIPELINE[i + 1].id;
}

// Nome legível de uma etapa pelo id (para substituir {next_stage} no briefing de forma dinâmica:
// o valor vem do pipeline, não de uma constante). Inclui o id entre parênteses para rastreio.
export function nomeEtapa(id) {
  const e = etapaPorId(id);
  return e ? `${e.nome} (etapa ${id})` : id;
}

// Exporta o gerador de prosa do schema (motor injeta {schema_prosa} no briefing) e o validador
// estrutural (para testes diretos).
export { gerarSchemaProsa, gerarDossieAprovacao, validarEstrutura, avaliarEtapa, CATALOGO_LENTES, CATALOGO_WCAG };
