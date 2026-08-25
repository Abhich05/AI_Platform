const notificationService = require('../services/notificationService');

async function list(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await notificationService.list(req.user._id, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { list };
