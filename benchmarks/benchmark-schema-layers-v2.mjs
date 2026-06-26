// Benchmark: schema estrito vs schema em camadas
// Usa @anthropic-ai/sdk sem ANTHROPIC_API_KEY — herda credencial do ambiente Claude Code
import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-haiku-4-5-20251001';
const client = new Anthropic();

const PROMPT = `Você é um agente de descoberta de correlações para uma feature de desenvolvimento de software.

Feature: Adicionar paginação à listagem de pedidos
Arquivos existentes no projeto: src/pages/orders/list.tsx, src/api/orders.ts, src/hooks/useOrders.ts

Mapeie as correlações e dependências desta feature. Use a tool submit_discovery para retornar seu mapeamento.`;

const toolA = {
  name: 'submit_discovery',
  description: 'Submete o mapeamento de correlações da feature',
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
  description: 'Submete o mapeamento de correlações da feature',
  input_schema: {
    type: 'object',
    properties: {
      components: { type: 'array', items: { type: 'string' }, description: 'Componentes afetados' },
      complexity: { type: 'string', enum: ['simples', 'média', 'alta'] },
      confidence: { type: 'string', enum: ['confirmado ao vivo', 'inferido do código', 'não verificado'] },
      metadata: { type: 'object', description: 'Informações adicionais relevantes não cobertas pelos campos estruturados' },
    },
    required: ['components', 'complexity', 'confidence'],
  },
};

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

function mechanicalCheck(out, schema) {
  const errors = [];
  for (const req of schema.required) {
    if (!(req in out)) errors.push(`faltando required: ${req}`);
  }
  for (const [k, v] of Object.entries(out)) {
    const spec = schema.properties[k];
    if (!spec) { errors.push(`campo fora do schema: ${k}`); continue; }
    if (spec.type === 'array' && !Array.isArray(v)) errors.push(`${k} deveria ser array`);
    if (spec.enum && !spec.enum.includes(v)) errors.push(`${k} fora do enum: ${v}`);
  }
  return errors;
}

function infoUnits(out) {
  let n = 0;
  for (const v of Object.values(out)) {
    if (Array.isArray(v)) n += v.length;
    else if (v && typeof v === 'object') n += Object.keys(v).length + JSON.stringify(v).length / 40;
    else if (v != null) n += 1;
  }
  return Math.round(n);
}

function score(errors, schema, units, maxUnits) {
  const hasFree = Object.values(schema.properties).some(p => p.type === 'object' && !p.enum && !p.properties);
  const verif = errors.length > 0 ? 0 : hasFree ? 1 : 2;
  const compl = units >= maxUnits * 0.95 ? 2 : units >= maxUnits * 0.6 ? 1 : 0;
  const adher = errors.length === 0 ? 2 : errors.length === 1 ? 1 : 0;
  return { verif, compl, adher, total: verif + compl + adher };
}

async function main() {
  console.log('=== BENCHMARK: Schema em Camadas ===\n');

  const [outA, outB] = await Promise.all([runAgent(toolA), runAgent(toolB)]);

  const errA = mechanicalCheck(outA, toolA.input_schema);
  const errB = mechanicalCheck(outB, toolB.input_schema);
  const unitsA = infoUnits(outA);
  const unitsB = infoUnits(outB);
  const maxUnits = Math.max(unitsA, unitsB, 1);

  const sA = score(errA, toolA.input_schema, unitsA, maxUnits);
  const sB = score(errB, toolB.input_schema, unitsB, maxUnits);

  console.log('[Abordagem A — Schema Estrito]');
  console.log('Output:', JSON.stringify(outA, null, 2));
  console.log(`Verificabilidade: ${sA.verif}/2`);
  console.log(`Completude: ${sA.compl}/2  (unidades de info: ${unitsA})`);
  console.log(`Aderência: ${sA.adher}/2`);
  console.log(`Total: ${sA.total}/6`);
  console.log(`Observação: ${errA.length ? 'desvios: ' + errA.join('; ') : 'output 100% tipado e enumerável'}\n`);

  console.log('[Abordagem B — Schema em Camadas]');
  console.log('Output:', JSON.stringify(outB, null, 2));
  console.log(`Verificabilidade: ${sB.verif}/2`);
  console.log(`Completude: ${sB.compl}/2  (unidades de info: ${unitsB})`);
  console.log(`Aderência: ${sB.adher}/2`);
  console.log(`Total: ${sB.total}/6`);
  console.log(`Observação: ${errB.length ? 'desvios: ' + errB.join('; ') : 'núcleo tipado + metadata livre'}\n`);

  console.log('[Veredicto]');
  const winner = sA.total > sB.total ? 'A' : sB.total > sA.total ? 'B' : 'empate';
  console.log(`Vencedor: ${winner}`);
  const motivo =
    winner === 'A' ? 'núcleo totalmente tipado venceu por verificabilidade plena sem perda de informação' :
    winner === 'B' ? 'metadata capturou contexto extra que o schema estrito truncou, mantendo núcleo verificável' :
    'ambas validam mecanicamente o núcleo; trade-off é verificabilidade total (A) vs expressividade extra (B)';
  console.log(`Motivo: ${motivo}`);
}

main().catch(e => { console.error('Falha:', e?.message ?? e); process.exit(1); });
