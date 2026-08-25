const Integration = require('../models/Integration');

class NodeExecutionError extends Error {
  constructor(code, message, details) {
    super(message);
    this.code = code;
    this.details = details || {};
  }
}

const PROVIDER_BY_TYPE = {
  gmail_send: 'gmail',
  gmail_read: 'gmail',
  slack_post: 'slack',
  discord_post: 'discord',
  sheets_append: 'google-sheets',
  sheets_read: 'google-sheets',
};

const MAX_DELAY_SECONDS = 5;

async function runNode(node, context, owner) {
  switch (node.type) {
    case 'trigger':
      return { status: 'ok', triggeredAt: new Date().toISOString() };

    case 'condition':
      return { status: 'ok', passed: true };

    case 'delay': {
      const requested = Number(node.data?.config?.seconds) || 0;
      const seconds = Math.max(0, Math.min(requested, MAX_DELAY_SECONDS));
      if (seconds > 0) {
        await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
      }
      return { status: 'ok', waitedSeconds: seconds };
    }

    default: {
      const provider = PROVIDER_BY_TYPE[node.type];
      if (!provider) {
        throw new NodeExecutionError('UNSUPPORTED_NODE_TYPE', `No execution handler for node type "${node.type}"`);
      }

      const integration = await Integration.findOne({ owner, provider, isConnected: true });
      if (!integration) {
        throw new NodeExecutionError('INTEGRATION_NOT_CONNECTED', `${provider} is not connected`, { provider });
      }
      if (integration.expiresAt && integration.expiresAt < new Date()) {
        throw new NodeExecutionError('AUTH_EXPIRED', `${provider} credentials have expired`, { provider });
      }

      throw new NodeExecutionError('API_FAILURE', `${provider} integration is not yet implemented`, { provider });
    }
  }
}

module.exports = { runNode, NodeExecutionError };
