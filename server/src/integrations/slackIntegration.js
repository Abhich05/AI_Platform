const BaseIntegration = require('./baseIntegration');
const env = require('../config/env');

const AUTH_URL = 'https://slack.com/oauth/v2/authorize';
const TOKEN_URL = 'https://slack.com/api/oauth.v2.access';
const SCOPE = 'chat:write,channels:read';

class SlackIntegration extends BaseIntegration {
  constructor() {
    super('slack');
  }

  get redirectUri() {
    return `${env.SERVER_URL}/api/integrations/oauth/slack/callback`;
  }

  isConfigured() {
    return Boolean(env.SLACK_CLIENT_ID && env.SLACK_CLIENT_SECRET);
  }

  getAuthUrl(state) {
    const params = new URLSearchParams({
      client_id: env.SLACK_CLIENT_ID,
      scope: SCOPE,
      redirect_uri: this.redirectUri,
      state,
    });
    return `${AUTH_URL}?${params.toString()}`;
  }

  async exchangeCode(code) {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.SLACK_CLIENT_ID,
        client_secret: env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: this.redirectUri,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      throw new Error(`Slack token exchange failed: ${data.error}`);
    }
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
      scopes: (data.scope || '').split(',').filter(Boolean),
    };
  }

  async postMessage(accessToken, { channel, message }) {
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, text: message }),
    });
    const data = await res.json();
    if (!data.ok) {
      throw new Error(`Slack post failed: ${data.error}`);
    }
    return data;
  }
}

module.exports = new SlackIntegration();
