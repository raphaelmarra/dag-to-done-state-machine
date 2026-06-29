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

// --- Porteiro genérico (A012): compõe as três camadas de validação numa só (declarativo) -----------
// 1) presença de campos de topo (schema) · 2) estrutura (schemaEstrutural) · 3) regras EXTRAS da etapa
// (regrasExtras: lista de (output)=>{ok, faltando}). Substitui o `aceita` custom imperativo por etapa:
// uma etapa declara `schema`/`schemaEstrutural`/`regrasExtras` e o motor avalia. Regra além de
// presença/estrutura ("se confianca==X então Y obrigatório") vira UMA função reutilizável, não um
// dialeto solto. Mantém o contrato {ok, faltando} que o motor consome.
function avaliarEtapa(etapa, output) {
  if (Array.isArray(etapa.schema)) {
    const presenca = camposPresentes(output, etapa.schema);
    if (!presenca.ok) return presenca;
  }
  if (etapa.schemaEstrutural) {
    const estrutura = validarEstrutura(output, etapa.schemaEstrutural, etapa);
    if (!estrutura.ok) return estrutura;
  }
  for (const regra of etapa.regrasExtras ?? []) {
    const r = regra(output, etapa);
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
    core: "[fallback] Organize unidades de implementação e ordem.",
    corePath: "cores-aba-clis/mapa_dependencias.md",
    schema: ["unidades", "ordem"],
    aceita: (o) => camposPresentes(o, ["unidades", "ordem"]),
  },
  {
    id: "implementacao",
    nome: "Implementação",
    agente: "frontend/typescript/fullstack",
    core: "[fallback] Plano de implementação conforme o mapa.",
    corePath: "cores-aba-clis/implementacao.md",
    schema: ["arquivos_alterados"],
    aceita: (o) => camposPresentes(o, ["arquivos_alterados"]),
  },
  {
    id: "gate_a",
    nome: "Gate A — Revisão",
    agente: "code-reviewer",
    core: "[fallback] Revisão adversarial com lentes por arquétipo.",
    corePath: "cores-aba-clis/gate_a.md",
    schema: ["veredito"],
    regrasExtras: [regraCampoIgual("veredito", "APROVA", 'veredito deve ser "APROVA"')],
  },
  {
    id: "acessibilidade",
    nome: "Acessibilidade",
    agente: "web-accessibility-checker",
    core: "[PLACEHOLDER MVP] Teste a tela em movimento (foco, teclado, leitura). Só MUTACAO/DRAWER/BOARD.",
    schema: ["resultado"],
    aceita: (o) => camposPresentes(o, ["resultado"]),
  },
  {
    id: "gate_b",
    nome: "Gate B — Verificação ao vivo",
    agente: "fiscal",
    core: "[fallback] Execute os cenários com dado real.",
    corePath: "cores-aba-clis/gate_b.md",
    schema: ["veredito", "evidencia"],
    regrasExtras: [regraCampoIgual("veredito", "verificado", 'veredito deve ser "verificado"')],
  },
  {
    id: "aprovacao_humana",
    nome: "Aprovação humana",
    agente: "humano",
    core: "[PLACEHOLDER MVP] O humano usa a tela e aprova explicitamente.",
    schema: ["aprovado_por"],
    aceita: (o) => camposPresentes(o, ["aprovado_por"]),
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
export { gerarSchemaProsa, validarEstrutura, avaliarEtapa };
