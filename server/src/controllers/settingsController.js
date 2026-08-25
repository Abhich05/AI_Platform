const settingsService = require('../services/settingsService');

function health(req, res) {
  res.status(200).json({ health: settingsService.getSystemHealth() });
}

module.exports = { health };
