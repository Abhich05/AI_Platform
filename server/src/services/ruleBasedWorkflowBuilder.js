const NODE_LABELS = {
  trigger: 'Manual Trigger',
  gmail_send: 'Send Email (Gmail)',
  gmail_read: 'Read Email (Gmail)',
  slack_post: 'Post to Slack',
  discord_post: 'Post to Discord',
  sheets_append: 'Append Row (Sheets)',
  sheets_read: 'Read Range (Sheets)',
  condition: 'Condition',
  delay: 'Delay',
};

function detectActions(promptLower) {
  if (promptLower.includes('invoice')) {
    return [
      { type: 'condition', config: { expression: 'input.amount > 0' } },
      { type: 'gmail_send', config: { to: '', subject: 'Your invoice', body: 'Please find your invoice attached.' } },
      { type: 'sheets_append', config: { spreadsheetId: '', range: 'Sheet1!A1', values: '' } },
    ];
  }

  const actions = [];
  if (promptLower.includes('email') || promptLower.includes('gmail')) {
    actions.push({ type: 'gmail_send', config: { to: '', subject: '', body: '' } });
  }
  if (promptLower.includes('slack')) {
    actions.push({ type: 'slack_post', config: { channel: '#general', message: '' } });
  }
  if (promptLower.includes('discord')) {
    actions.push({ type: 'discord_post', config: { channel: '#general', message: '' } });
  }
  if (promptLower.includes('sheet') || promptLower.includes('spreadsheet')) {
    actions.push({ type: 'sheets_append', config: { spreadsheetId: '', range: 'Sheet1!A1', values: '' } });
  }
  if (promptLower.includes('wait') || promptLower.includes('delay')) {
    actions.push({ type: 'delay', config: { seconds: 60 } });
  }

  if (actions.length === 0) {
    actions.push({ type: 'slack_post', config: { channel: '#general', message: '' } });
  }

  return actions;
}

function deriveName(prompt) {
  const trimmed = prompt.trim().replace(/\s+/g, ' ');
  if (!trimmed) return 'Generated Workflow';
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return capitalized.length > 60 ? `${capitalized.slice(0, 57)}...` : capitalized;
}

function buildDeterministicWorkflow(prompt) {
  const actions = detectActions(prompt.toLowerCase());

  const nodes = [
    {
      id: 'node_0',
      type: 'trigger',
      position: { x: 80, y: 150 },
      data: { label: NODE_LABELS.trigger, config: {} },
    },
    ...actions.map((action, i) => ({
      id: `node_${i + 1}`,
      type: action.type,
      position: { x: 80 + (i + 1) * 260, y: 150 },
      data: { label: NODE_LABELS[action.type], config: action.config },
    })),
  ];

  const edges = nodes.slice(1).map((node, i) => ({
    id: `edge_${i}`,
    source: nodes[i].id,
    target: node.id,
    animated: true,
  }));

  return {
    name: deriveName(prompt),
    description: prompt,
    nodes,
    edges,
    tags: ['ai-generated', 'deterministic'],
  };
}

module.exports = { buildDeterministicWorkflow };
