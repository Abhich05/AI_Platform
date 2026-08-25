const env = require('../config/env');
const { buildDeterministicWorkflow } = require('./ruleBasedWorkflowBuilder');

const CONFIG_FIELDS = {
  trigger: [],
  gmail_send: ['to', 'subject', 'body'],
  gmail_read: ['query'],
  slack_post: ['channel', 'message'],
  discord_post: ['channel', 'message'],
  sheets_append: ['spreadsheetId', 'range', 'values'],
  sheets_read: ['spreadsheetId', 'range'],
  condition: ['expression'],
  delay: ['seconds'],
};

const VALID_NODE_TYPES = Object.keys(CONFIG_FIELDS);

const NODE_TYPE_SCHEMA = VALID_NODE_TYPES.map((type) => `  - "${type}": config keys = [${CONFIG_FIELDS[type].map((f) => `"${f}"`).join(', ') || 'none'}]`).join('\n');

const SYSTEM_PROMPT = `You are a workflow graph generator for an automation platform. Given a user's plain-English automation request, output ONLY a JSON object (no markdown, no commentary) with this exact shape:
{
  "name": string,
  "description": string,
  "nodes": [{ "id": string, "type": one of [${VALID_NODE_TYPES.join(', ')}], "position": {"x": number, "y": number}, "data": {"label": string, "config": object} }],
  "edges": [{ "id": string, "source": string, "target": string, "animated": true }],
  "tags": string[]
}
Each node's "data.config" object must use EXACTLY these keys for its type (all values are strings, "seconds" is a number) - do not invent other key names:
${NODE_TYPE_SCHEMA}
The first node must be type "trigger". Lay nodes out left-to-right with increasing x (e.g. 80, 340, 600...) and the same y (e.g. 150). Every node after the first must be reachable via edges from the trigger.`;

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('No JSON object found in model response');
  }
  return JSON.parse(match[0]);
}

function validateWorkflow(workflow) {
  if (!workflow || typeof workflow !== 'object') return false;
  if (!Array.isArray(workflow.nodes) || workflow.nodes.length === 0) return false;
  if (!Array.isArray(workflow.edges)) return false;
  if (workflow.nodes[0].type !== 'trigger') return false;
  return workflow.nodes.every((n) => VALID_NODE_TYPES.includes(n.type) && n.id && n.position && n.data);
}

function sanitizeWorkflow(workflow) {
  const nodeIds = new Set(workflow.nodes.map((n) => String(n.id)));

  const nodes = workflow.nodes.map((node) => {
    const allowedFields = CONFIG_FIELDS[node.type] || [];
    const rawConfig = node.data?.config || {};
    const config = {};
    for (const field of allowedFields) {
      config[field] = field === 'seconds' ? Number(rawConfig[field]) || 0 : String(rawConfig[field] ?? '');
    }

    return {
      id: String(node.id),
      type: node.type,
      position: {
        x: Number(node.position?.x) || 0,
        y: Number(node.position?.y) || 0,
      },
      data: {
        label: String(node.data?.label || node.type),
        config,
      },
    };
  });

  const edges = workflow.edges
    .filter((edge) => nodeIds.has(String(edge.source)) && nodeIds.has(String(edge.target)))
    .map((edge, i) => ({
      id: String(edge.id || `edge_${i}`),
      source: String(edge.source),
      target: String(edge.target),
      animated: true,
    }));

  return {
    name: String(workflow.name || 'Generated Workflow'),
    description: String(workflow.description || ''),
    nodes,
    edges,
    tags: Array.isArray(workflow.tags) ? workflow.tags.map(String) : [],
  };
}

async function generateWithOpenRouter(prompt) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenRouter request failed: ${res.status}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('OpenRouter returned no content');
  }
  return extractJson(text);
}

async function generateWithGemini(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nUser request: ${prompt}` }] }],
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`Gemini request failed: ${res.status}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned no content');
  }
  return extractJson(text);
}

async function generateWorkflow(prompt) {
  if (env.OPENROUTER_API_KEY) {
    try {
      const workflow = await generateWithOpenRouter(prompt);
      if (validateWorkflow(workflow)) {
        return { ...sanitizeWorkflow(workflow), source: 'openrouter' };
      }
      console.error('[aiService] OpenRouter response failed validation, falling back');
    } catch (err) {
      console.error('[aiService] OpenRouter generation failed, falling back:', err.message);
    }
  }

  if (env.GEMINI_API_KEY) {
    try {
      const workflow = await generateWithGemini(prompt);
      if (validateWorkflow(workflow)) {
        return { ...sanitizeWorkflow(workflow), source: 'gemini' };
      }
      console.error('[aiService] Gemini response failed validation, falling back');
    } catch (err) {
      console.error('[aiService] Gemini generation failed, falling back:', err.message);
    }
  }

  return { ...buildDeterministicWorkflow(prompt), source: 'deterministic' };
}

module.exports = { generateWorkflow };
