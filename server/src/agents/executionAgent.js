const Integration = require('../models/Integration');
const encryptionService = require('../services/encryptionService');
const gmailIntegration = require('../integrations/gmailIntegration');
const slackIntegration = require('../integrations/slackIntegration');
const discordIntegration = require('../integrations/discordIntegration');
const googleSheetsIntegration = require('../integrations/googleSheetsIntegration');

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

const PROVIDER_MODULES = {
  gmail: gmailIntegration,
  slack: slackIntegration,
  discord: discordIntegration,
  'google-sheets': googleSheetsIntegration,
};

const MAX_DELAY_SECONDS = 5;

async function getValidAccessToken(integration, providerModule) {
  const now = new Date();

  if (integration.expiresAt && integration.expiresAt < now) {
    if (!integration.encryptedRefreshToken) {
      throw new NodeExecutionError(
        'AUTH_EXPIRED',
        `${integration.provider} credentials have expired and cannot be refreshed`,
        { provider: integration.provider }
      );
    }
    const refreshToken = encryptionService.decrypt(integration.encryptedRefreshToken);
    const refreshed = await providerModule.refreshAccessToken(refreshToken);
    integration.encryptedAccessToken = encryptionService.encrypt(refreshed.accessToken);
    integration.expiresAt = refreshed.expiresAt;
    await integration.save();
    return refreshed.accessToken;
  }

  return encryptionService.decrypt(integration.encryptedAccessToken);
}

async function runProviderAction(node, owner) {
  const provider = PROVIDER_BY_TYPE[node.type];
  if (!provider) {
    throw new NodeExecutionError('UNSUPPORTED_NODE_TYPE', `No execution handler for node type "${node.type}"`);
  }

  const integration = await Integration.findOne({ owner, provider, isConnected: true }).select(
    '+encryptedAccessToken +encryptedRefreshToken'
  );
  if (!integration) {
    throw new NodeExecutionError('INTEGRATION_NOT_CONNECTED', `${provider} is not connected`, { provider });
  }

  const providerModule = PROVIDER_MODULES[provider];
  const config = node.data?.config || {};

  try {
    switch (node.type) {
      case 'gmail_send': {
        const accessToken = await getValidAccessToken(integration, providerModule);
        const result = await providerModule.sendMail(accessToken, config);
        return { status: 'ok', messageId: result.id };
      }
      case 'gmail_read': {
        const accessToken = await getValidAccessToken(integration, providerModule);
        const result = await providerModule.readMail(accessToken, config);
        return { status: 'ok', messages: result.messages || [] };
      }
      case 'slack_post': {
        const accessToken = await getValidAccessToken(integration, providerModule);
        const result = await providerModule.postMessage(accessToken, config);
        return { status: 'ok', ts: result.ts };
      }
      case 'discord_post': {
        const result = await providerModule.postMessage(config);
        return { status: 'ok', messageId: result.id };
      }
      case 'sheets_append': {
        const accessToken = await getValidAccessToken(integration, providerModule);
        const values = String(config.values || '')
          .split(',')
          .map((v) => v.trim());
        const result = await providerModule.appendRow(accessToken, { ...config, values });
        return { status: 'ok', updates: result.updates };
      }
      case 'sheets_read': {
        const accessToken = await getValidAccessToken(integration, providerModule);
        const result = await providerModule.readRange(accessToken, config);
        return { status: 'ok', values: result.values || [] };
      }
      default:
        throw new NodeExecutionError('UNSUPPORTED_NODE_TYPE', `No execution handler for node type "${node.type}"`);
    }
  } catch (err) {
    if (err instanceof NodeExecutionError) throw err;
    if (err.message?.includes('429')) {
      throw new NodeExecutionError('RATE_LIMIT', err.message, { provider });
    }
    throw new NodeExecutionError('API_FAILURE', err.message, { provider });
  }
}

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

    default:
      return runProviderAction(node, owner);
  }
}

module.exports = { runNode, NodeExecutionError };
