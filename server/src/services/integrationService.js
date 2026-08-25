const Integration = require('../models/Integration');
const encryptionService = require('./encryptionService');
const { AppError } = require('./authService');
const gmailIntegration = require('../integrations/gmailIntegration');
const slackIntegration = require('../integrations/slackIntegration');
const discordIntegration = require('../integrations/discordIntegration');
const googleSheetsIntegration = require('../integrations/googleSheetsIntegration');

const PROVIDERS = {
  gmail: gmailIntegration,
  slack: slackIntegration,
  discord: discordIntegration,
  'google-sheets': googleSheetsIntegration,
};

const VALID_PROVIDERS = Object.keys(PROVIDERS);

function getProviderModule(provider) {
  const mod = PROVIDERS[provider];
  if (!mod) {
    throw new AppError(400, 'UNKNOWN_PROVIDER', `Unknown integration provider "${provider}"`);
  }
  return mod;
}

function serialize(integration) {
  return {
    id: integration._id,
    provider: integration.provider,
    isConnected: integration.isConnected,
    scopes: integration.scopes,
    expiresAt: integration.expiresAt,
    metadata: integration.metadata,
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt,
  };
}

async function list(owner) {
  const integrations = await Integration.find({ owner });
  return integrations.map(serialize);
}

async function status(owner) {
  const integrations = await Integration.find({ owner });
  const byProvider = new Map(integrations.map((i) => [i.provider, i]));

  return VALID_PROVIDERS.map((provider) => {
    const integration = byProvider.get(provider);
    const providerModule = PROVIDERS[provider];
    const expired = integration?.expiresAt ? integration.expiresAt < new Date() : false;

    return {
      provider,
      configured: providerModule.isConfigured(),
      isConnected: Boolean(integration?.isConnected) && !expired,
      expired,
      expiresAt: integration?.expiresAt || null,
    };
  });
}

function buildState(owner) {
  return Buffer.from(
    JSON.stringify({ owner: owner.toString(), nonce: Math.random().toString(36).slice(2) })
  ).toString('base64url');
}

function parseState(state) {
  try {
    return JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
  } catch (err) {
    throw new AppError(400, 'INVALID_STATE', 'Invalid OAuth state parameter');
  }
}

function startOAuth(owner, provider) {
  const providerModule = getProviderModule(provider);
  if (!providerModule.isConfigured()) {
    throw new AppError(
      503,
      'PROVIDER_NOT_CONFIGURED',
      `${provider} OAuth credentials are not configured on this server`
    );
  }
  const state = buildState(owner);
  return providerModule.getAuthUrl(state);
}

async function handleCallback(provider, code, state) {
  const providerModule = getProviderModule(provider);
  const { owner } = parseState(state);

  const tokenResult = await providerModule.exchangeCode(code);

  const update = {
    isConnected: true,
    scopes: tokenResult.scopes || [],
    encryptedAccessToken: encryptionService.encrypt(tokenResult.accessToken),
    expiresAt: tokenResult.expiresAt || null,
  };
  if (tokenResult.refreshToken) {
    update.encryptedRefreshToken = encryptionService.encrypt(tokenResult.refreshToken);
  }
  if (tokenResult.guildId) {
    update.metadata = { guildId: tokenResult.guildId };
  }

  const integration = await Integration.findOneAndUpdate(
    { owner, provider },
    { $set: update },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return serialize(integration);
}

async function manualSetup(owner, { provider, accessToken, refreshToken, scopes, expiresAt, metadata }) {
  getProviderModule(provider);

  const update = {
    isConnected: true,
    scopes: scopes || [],
    encryptedAccessToken: encryptionService.encrypt(accessToken),
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    metadata: metadata || {},
  };
  if (refreshToken) {
    update.encryptedRefreshToken = encryptionService.encrypt(refreshToken);
  }

  const integration = await Integration.findOneAndUpdate(
    { owner, provider },
    { $set: update },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return serialize(integration);
}

module.exports = { VALID_PROVIDERS, list, status, startOAuth, handleCallback, manualSetup, serialize };
