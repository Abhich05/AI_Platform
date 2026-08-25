const BaseIntegration = require('./baseIntegration');
const env = require('../config/env');

const AUTH_URL = 'https://discord.com/api/oauth2/authorize';
const TOKEN_URL = 'https://discord.com/api/oauth2/token';
const SCOPE = 'bot applications.commands';
const PERMISSIONS = '2048';

class DiscordIntegration extends BaseIntegration {
  constructor() {
    super('discord');
  }

  get redirectUri() {
    return `${env.SERVER_URL}/api/integrations/oauth/discord/callback`;
  }

  isConfigured() {
    return Boolean(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET && env.DISCORD_BOT_TOKEN);
  }

  getAuthUrl(state) {
    const params = new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: SCOPE,
      permissions: PERMISSIONS,
      state,
    });
    return `${AUTH_URL}?${params.toString()}`;
  }

  async exchangeCode(code) {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
      }),
    });
    if (!res.ok) {
      throw new Error(`Discord token exchange failed: ${res.status}`);
    }
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
      scopes: (data.scope || '').split(' ').filter(Boolean),
      guildId: data.guild?.id || null,
    };
  }

  async postMessage({ channelId, message }) {
    if (!env.DISCORD_BOT_TOKEN) {
      throw new Error('DISCORD_BOT_TOKEN is not configured');
    }
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });
    if (!res.ok) {
      throw new Error(`Discord post failed: ${res.status}`);
    }
    return res.json();
  }
}

module.exports = new DiscordIntegration();
