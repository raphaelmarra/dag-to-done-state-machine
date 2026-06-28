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

function validarCampoDeItem(valorItem, regra, etapa, caminho, erros) {
  if (regra.obrigatorio && (valorItem === undefined || valorItem === null)) {
    erros.push(`${caminho}: campo obrigatório ausente`);
    return;
  }
  if (valorItem === undefined || valorItem === null) return; // opcional ausente: ok
  const enumValido = regra.enum ? resolverEnum(regra, etapa) : null;
  if (enumValido && !enumValido.includes(valorItem)) {
    erros.push(`${caminho}: valor "${valorItem}" fora do enum [${enumValido.join(", ")}]`);
  }
}

// Valida `output` contra `schemaEstrutural`. Retorna {ok, faltando} (contrato do motor).
function validarEstrutura(output, schemaEstrutural, etapa) {
  const erros = [];
  for (const [campo, forma] of Object.entries(schemaEstrutural)) {
    const v = output?.[campo];
    if (valorVazio(v)) { erros.push(`${campo}: ausente ou vazio`); continue; }

    if (forma.tipo === "lista-de-objetos") {
      if (!Array.isArray(v)) { erros.push(`${campo}: deveria ser uma lista`); continue; }
      if (forma.minItens && v.length < forma.minItens) erros.push(`${campo}: mínimo ${forma.minItens} item(ns)`);
      v.forEach((item, i) => {
        if (typeof item !== "object" || item === null || Array.isArray(item)) {
          erros.push(`${campo}[${i}]: deveria ser um objeto (recebido: ${Array.isArray(item) ? "lista" : typeof item})`);
          return;
        }
        for (const [ic, regra] of Object.entries(forma.itemCampos || {})) {
          validarCampoDeItem(item[ic], regra, etapa, `${campo}[${i}].${ic}`, erros);
        }
      });
    } else if (forma.tipo === "objeto") {
      if (typeof v !== "object" || Array.isArray(v)) { erros.push(`${campo}: deveria ser um objeto`); continue; }
      for (const [ic, regra] of Object.entries(forma.campos || {})) {
        validarCampoDeItem(v[ic], regra, etapa, `${campo}.${ic}`, erros);
      }
    }
  }
  return { ok: erros.length === 0, faltando: erros };
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
    schema: ["nos", "arestas", "blast_radius", "fronteira", "gaps", "confianca"],
    // Schema ESTRUTURAL (dado único, peças 4+5): descreve a forma de cada campo. O enum de confiança
    // é uma FUNÇÃO que lê o executor da etapa — fonte única (o mesmo enum do briefing valida o output).
    schemaEstrutural: {
      nos: { tipo: "lista-de-objetos", minItens: 1, itemCampos: {
        nome: { obrigatorio: true },
        tipo: { obrigatorio: true },
        path: { obrigatorio: true },
        confianca: { obrigatorio: true, enum: (e) => e.executor?.confianca_enum ?? [] },
      } },
      arestas: { tipo: "lista-de-objetos", minItens: 1, itemCampos: {
        consumidor: { obrigatorio: true },
        provedor: { obrigatorio: true },
        confianca: { obrigatorio: true, enum: (e) => e.executor?.confianca_enum_arestas ?? [] },
      } },
      blast_radius: { tipo: "lista-de-objetos", minItens: 1, itemCampos: {
        no: { obrigatorio: true },
        amplitude: { obrigatorio: true, enum: ["BAIXA", "MÉDIA", "ALTA", "CRÍTICA"] },
      } },
      fronteira: { tipo: "objeto", campos: { nos_folha: { obrigatorio: true } } },
      gaps: { tipo: "lista-de-objetos", minItens: 1, itemCampos: {
        id: { obrigatorio: true },
        prioridade: { obrigatorio: true, enum: ["P0", "P1", "P2"] },
      } },
      confianca: { tipo: "objeto", campos: {} },
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
