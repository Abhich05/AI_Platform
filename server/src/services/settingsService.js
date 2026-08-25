const env = require('../config/env');
const { isRedisEnabled } = require('../queues/executionQueue');
const { getLangGraphStatus } = require('../agents/orchestrator');

function getSystemHealth() {
  return {
    database: env.USE_IN_MEMORY_DB ? 'in-memory' : 'external',
    jwtSecretConfigured: env.JWT_SECRET !== 'dev-insecure-jwt-secret-change-me',
    credentialEncryptionConfigured: Boolean(env.CREDENTIAL_ENCRYPTION_KEY),
    redis: isRedisEnabled() ? 'connected' : 'not-configured',
    langGraph: getLangGraphStatus(),
    aiProviders: {
      openrouter: Boolean(env.OPENROUTER_API_KEY),
      gemini: Boolean(env.GEMINI_API_KEY),
    },
    integrationProviders: {
      gmail: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      'google-sheets': Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      slack: Boolean(env.SLACK_CLIENT_ID && env.SLACK_CLIENT_SECRET),
      discord: Boolean(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET && env.DISCORD_BOT_TOKEN),
    },
  };
}

module.exports = { getSystemHealth };
