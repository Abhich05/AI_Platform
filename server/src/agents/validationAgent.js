const REQUIRED_FIELDS_BY_TYPE = {
  trigger: ['status'],
  condition: ['status', 'passed'],
  delay: ['status'],
  gmail_send: ['status'],
  gmail_read: ['status'],
  slack_post: ['status'],
  discord_post: ['status'],
  sheets_append: ['status'],
  sheets_read: ['status'],
};

function validate(node, output) {
  const required = REQUIRED_FIELDS_BY_TYPE[node.type] || ['status'];
  const missing = required.filter((field) => output?.[field] === undefined);
  return { valid: missing.length === 0, missing };
}

module.exports = { validate };
