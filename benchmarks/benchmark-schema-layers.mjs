// Isolated benchmark: "schema em camadas" vs "schema estrito" for Claude agent output
// Run: ANTHROPIC_API_KEY must be set. node benchmark-schema-layers.mjs
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/gouve/AppData/Local/Temp/claude/');
const Anthropic = require('@anthropic-ai/sdk').default ?? require('@anthropic-ai/sdk');

const MODEL = 'claude-haiku-4-5-20251001';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('ERRO: ANTHROPIC_API_KEY não está definida no ambiente.');
  process.exit(1);
}

const client = new Anthropic({ apiKey });

const PROMPT = `Você é um agente de descoberta de correlações para uma feature de desenvolvimento de software.

Feature: Adicionar paginação à listagem de pedidos
Arquivos existentes no projeto: src/pages/orders/list.tsx, src/api/orders.ts, src/hooks/useOrders.ts

Mapeie as correlações e dependências desta feature. Use a tool submit_discovery para retornar seu mapeamento.`;

const toolA = {
  name: 'submit_discovery',
  input_schema: {
    type: 'object',
    properties: {
      components: { type: 'array', items: { type: 'string' }, description: 'Componentes afetados' },
      endpoints: { type: 'array', items: { type: 'string' }, description: 'Endpoints relevantes' },
      dependencies: { type: 'array', items: { type: 'string' }, description: 'Dependências identificadas' },
      complexity: { type: 'string', enum: ['simples', 'média', 'alta'] },
      confidence: { type: 'string', enum: ['confirmado ao vivo', 'inferido do código', 'não verificado'] },
    },
    required: ['components', 'endpoints', 'dependencies', 'complexity', 'confidence'],
  },
};

const toolB = {
  name: 'submit_discovery',
  input_schema: {
    type: 'object',
    properties: {
      components: { type: 'array', items: { type: 'string' }, description: 'Componentes afetados' },
      complexity: { type: 'string', enum: ['simples', 'média', 'alta'] },
      confidence: { type: 'string', enum: ['confirmado ao vivo', 'inferido do código', 'não verificado'] },
      metadata: { type: 'object', description: 'Informações adicionais relevantes que não cabem nos campos estruturados' },
    },
    required: ['components', 'complexity', 'confidence'],
  },
};

/** Dispara o agente e retorna o input do tool_use. */
async function runAgent(tool) {
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    tools: [tool],
    tool_choice: { type: 'tool', name: 'submit_discovery' },
    messages: [{ role: 'user', content: PROMPT }],
  });
  const block = resp.content.find((b) => b.type === 'tool_use');
  return block?.input ?? null;
}

/** Valida mecanicamente (sem LLM) contra um schema simplificado. */
function mechanicalCheck(out, schema) {
  const errors = [];
  for (const req of schema.required) {
    if (!(req in out)) errors.push(`faltando required: ${req}`);
  }
  for (const [k, v] of Object.entries(out)) {
    const spec = schema.properties[k];
    if (!spec) { errors.push(`campo extra fora do schema: ${k}`); continue; }
    if (spec.type === 'array' && !Array.isArray(v)) errors.push(`${k} deveria ser array`);
    if (spec.enum && !spec.enum.includes(v)) errors.push(`${k} fora do enum: ${v}`);
  }
  return errors;
}

function infoUnits(out) {
  // Conta "unidades de informação" expressas pelo agente
  let n = 0;
  for (const v of Object.values(out)) {
    if (Array.isArray(v)) n += v.length;
    else if (v && typeof v === 'object') n += Object.keys(v).length + JSON.stringify(v).length / 40;
    else if (v != null) n += 1;
  }
  return Math.round(n);
}

function scoreVerifiability(errors, schema) {
  // 2 = totalmente verificável e sem erros; campos livres reduzem
  const hasFreeField = Object.values(schema.properties).some(
    (p) => p.type === 'object' && !p.enum && !p.properties,
  );
  if (errors.length > 0) return 0;
  return hasFreeField ? 1 : 2;
}

function scoreAdherence(errors) {
  if (errors.length === 0) return 2;
  if (errors.length <= 1) return 1;
  return 0;
}

async function main() {
  console.log('=== BENCHMARK: Schema em Camadas ===\n');

  const outA = await runAgent(toolA);
  const errA = mechanicalCheck(outA, toolA.input_schema);
  const unitsA = infoUnits(outA);

  const outB = await runAgent(toolB);
  const errB = mechanicalCheck(outB, toolB.input_schema);
  const unitsB = infoUnits(outB);

  // Completude: comparativa entre as duas saídas
  const maxUnits = Math.max(unitsA, unitsB, 1);
  const compl = (u) => (u >= maxUnits * 0.95 ? 2 : u >= maxUnits * 0.6 ? 1 : 0);

  const vA = scoreVerifiability(errA, toolA.input_schema);
  const cA = compl(unitsA);
  const aA = scoreAdherence(errA);
  const totA = vA + cA + aA;

  const vB = scoreVerifiability(errB, toolB.input_schema);
  const cB = compl(unitsB);
  const aB = scoreAdherence(errB);
  const totB = vB + cB + aB;

  console.log('[Abordagem A — Schema Estrito]');
  console.log('Output: ' + JSON.stringify(outA, null, 2));
  console.log(`Verificabilidade: ${vA}/2`);
  console.log(`Completude: ${cA}/2`);
  console.log(`Aderência: ${aA}/2`);
  console.log(`Total: ${totA}/6`);
  console.log(`Observação: ${errA.length ? 'desvios: ' + errA.join('; ') : 'output 100% tipado e enumerável; toda informação cabe em campos verificáveis sem LLM'} (unidades de info: ${unitsA})`);
  console.log('');

  console.log('[Abordagem B — Schema em Camadas]');
  console.log('Output: ' + JSON.stringify(outB, null, 2));
  console.log(`Verificabilidade: ${vB}/2`);
  console.log(`Completude: ${cB}/2`);
  console.log(`Aderência: ${aB}/2`);
  console.log(`Total: ${totB}/6`);
  console.log(`Observação: ${errB.length ? 'desvios: ' + errB.join('; ') : 'núcleo tipado verificável; metadata livre carrega contexto extra mas exige inspeção semântica'} (unidades de info: ${unitsB})`);
  console.log('');

  console.log('[Veredicto]');
  let winner = 'empate';
  if (totA > totB) winner = 'A';
  else if (totB > totA) winner = 'B';
  console.log(`Vencedor: ${winner}`);
  const motivo =
    winner === 'A'
      ? 'núcleo totalmente tipado venceu por verificabilidade mecânica plena sem perda relevante de informação'
      : winner === 'B'
        ? 'a camada metadata capturou contexto extra que o schema estrito truncou, mantendo o núcleo verificável'
        : 'ambas validam mecanicamente o núcleo; o trade-off é verificabilidade total (A) vs. expressividade extra (B)';
  console.log(`Motivo: ${motivo}`);
}

main().catch((e) => {
  console.error('Falha no benchmark:', e?.message ?? e);
  process.exit(1);
});
