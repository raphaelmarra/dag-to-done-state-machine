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

export const PIPELINE = [
  {
    id: "dag",
    nome: "DAG — Mapa de correlações",
    agente: "Explore",
    core: "[fallback] Construa o DAG de dependências de consumo do entry_point. Ver cores/CORE-DAG.md.",
    corePath: "cores/CORE-DAG.md",
    schema: ["nos", "arestas", "blast_radius", "fronteira", "gaps", "confianca"],
    aceita: (o) => camposPresentes(o, ["nos", "arestas", "blast_radius", "fronteira", "gaps", "confianca"]),
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
