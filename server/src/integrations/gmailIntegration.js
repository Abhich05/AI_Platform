const BaseIntegration = require('./baseIntegration');
const googleOAuth = require('./googleOAuthClient');
const env = require('../config/env');

const SCOPE = 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly';

class GmailIntegration extends BaseIntegration {
  constructor() {
    super('gmail');
  }

  get redirectUri() {
    return `${env.SERVER_URL}/api/integrations/oauth/gmail/callback`;
  }

  isConfigured() {
    return googleOAuth.isConfigured();
  }

  getAuthUrl(state) {
    return googleOAuth.buildAuthUrl({ scope: SCOPE, redirectUri: this.redirectUri, state });
  }

  async exchangeCode(code) {
    return googleOAuth.exchangeCode({ code, redirectUri: this.redirectUri });
  }

  async refreshAccessToken(refreshToken) {
    return googleOAuth.refreshAccessToken(refreshToken);
  }

  async sendMail(accessToken, { to, subject, body }) {
    const message = [`To: ${to}`, `Subject: ${subject}`, '', body].join('\n');
    const encoded = Buffer.from(message).toString('base64url');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: encoded }),
    });
    if (!res.ok) {
      throw new Error(`Gmail send failed: ${res.status}`);
    }
    return res.json();
  }

  async readMail(accessToken, { query = '', maxResults = 5 } = {}) {
    const params = new URLSearchParams({ q: query, maxResults: String(maxResults) });
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`Gmail read failed: ${res.status}`);
    }
    return res.json();
  }
}

module.exports = new GmailIntegration();
