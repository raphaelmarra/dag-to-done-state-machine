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

// Combina camposPresentes com uma condição extra preservando o contrato {ok, faltando}
// que o motor (dag.mjs) consome via `veredito.ok`. Sem isto, `camposPresentes(...) && cond`
// colapsaria para um boolean cru e o motor leria `true.ok === undefined` → bloqueio indevido.
function comCondicao(base, ok, motivo) {
  if (!base.ok) return base;
  if (ok) return base;
  return { ok: false, faltando: base.faltando, motivo };
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
    if (forma.obrigatorio) erros.push(`${caminho}: campo obrigatório ausente`);
    return; // opcional ausente: ok
  }
  // Lista/objeto obrigatório porém VAZIO escapa se só checarmos null/undefined — fechar a assimetria
  // topo↔aninhado (o topo já barra vazio via valorVazio; aqui replicamos para qualquer nível).
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
    schema: ["nos", "arestas", "blast_radius", "fronteira", "gaps", "confianca"],
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
        hub: { enum: ["sim", "não"] },
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
        expansoes: { tipo: "lista-de-objetos", itemCampos: {
          vizinho: { obrigatorio: true },
          motivo: { obrigatorio: true, enum: ["hub", "pass-through", "contrato"] },
        } },
        candidatos_transitivos: { tipo: "lista-de-strings" },
      } },
      ciclos: { opcionalNoTopo: true, tipo: "lista-de-objetos", itemCampos: {
        nos: { obrigatorio: true, tipo: "lista-de-strings" },
        relacao: { obrigatorio: true },
      } },
      gaps: { tipo: "lista-de-objetos", minItens: 1, itemCampos: {
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
    aceita(o) {
      const presenca = camposPresentes(o, this.schema);
      if (!presenca.ok) return presenca;
      return validarEstrutura(o, this.schemaEstrutural, this);
    },
  },
  {
    id: "descoberta",
    nome: "Descoberta da API",
    agente: "fiscal",
    core: "[fallback] Confirme os endpoints que o DAG listou.",
    corePath: "cores-aba-clis/descoberta.md",
    schema: ["endpoints_confirmados"],
    aceita: (o) => camposPresentes(o, ["endpoints_confirmados"]),
  },
  {
    id: "gap",
    nome: "GAP",
    agente: "error-detective",
    core: "[fallback] Confronte o que existe com o que a feature precisa.",
    corePath: "cores-aba-clis/gap.md",
    schema: ["gaps", "complexidade"],
    aceita: (o) => camposPresentes(o, ["gaps", "complexidade"]),
  },
  {
    id: "design",
    nome: "Design",
    agente: "ui-ux-designer",
    core: "[fallback] Defina estados, comportamento, critérios e riscos.",
    corePath: "cores-aba-clis/design.md",
    schema: ["criterios_aceitacao", "riscos_premortem"],
    aceita: (o) => camposPresentes(o, ["criterios_aceitacao", "riscos_premortem"]),
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
    aceita: (o) => comCondicao(camposPresentes(o, ["veredito"]), o.veredito === "APROVA", 'veredito deve ser "APROVA"'),
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
    aceita: (o) => comCondicao(camposPresentes(o, ["veredito", "evidencia"]), o.veredito === "verificado", 'veredito deve ser "verificado"'),
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
    aceita: (o) => comCondicao(camposPresentes(o, ["verify_ok"]), o.verify_ok === true, "verify_ok deve ser true"),
  },
  {
    id: "smoke",
    nome: "Smoke pós-deploy",
    agente: "devops-engineer",
    core: "[PLACEHOLDER MVP] Verifique a feature em produção real. Verde/alerta/rollback.",
    schema: ["status"],
    aceita: (o) => comCondicao(camposPresentes(o, ["status"]), o.status === "verde", 'status deve ser "verde"'),
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
export { gerarSchemaProsa, validarEstrutura };
