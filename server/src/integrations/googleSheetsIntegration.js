const BaseIntegration = require('./baseIntegration');
const googleOAuth = require('./googleOAuthClient');
const env = require('../config/env');

const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

class GoogleSheetsIntegration extends BaseIntegration {
  constructor() {
    super('google-sheets');
  }

  get redirectUri() {
    return `${env.SERVER_URL}/api/integrations/oauth/google-sheets/callback`;
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

  async appendRow(accessToken, { spreadsheetId, range, values }) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}:append?valueInputOption=USER_ENTERED`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [values] }),
    });
    if (!res.ok) {
      throw new Error(`Sheets append failed: ${res.status}`);
    }
    return res.json();
  }

  async readRange(accessToken, { spreadsheetId, range }) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) {
      throw new Error(`Sheets read failed: ${res.status}`);
    }
    return res.json();
  }
}

module.exports = new GoogleSheetsIntegration();
