class BaseIntegration {
  constructor(provider) {
    this.provider = provider;
  }

  isConfigured() {
    throw new Error(`${this.provider}: isConfigured() not implemented`);
  }

  getAuthUrl(state) {
    throw new Error(`${this.provider}: getAuthUrl() not implemented`);
  }

  async exchangeCode(code) {
    throw new Error(`${this.provider}: exchangeCode() not implemented`);
  }

  async refreshAccessToken(refreshToken) {
    throw new Error(`${this.provider}: refreshAccessToken() not implemented`);
  }
}

module.exports = BaseIntegration;
