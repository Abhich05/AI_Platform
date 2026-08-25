const executionService = require('../services/executionService');

async function list(req, res, next) {
  try {
    const { page = 1, limit = 20, status = '', workflowId = '' } = req.query;
    const result = await executionService.list(req.user._id, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      status,
      workflowId,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const execution = await executionService.getById(req.user._id, req.params.id);
    res.status(200).json({ execution });
  } catch (err) {
    next(err);
  }
}

async function getTimeline(req, res, next) {
  try {
    const timeline = await executionService.getTimeline(req.user._id, req.params.id);
    res.status(200).json({ timeline });
  } catch (err) {
    next(err);
  }
}

async function pause(req, res, next) {
  try {
    const execution = await executionService.pause(req.user._id, req.params.id);
    res.status(200).json({ execution });
  } catch (err) {
    next(err);
  }
}

async function resume(req, res, next) {
  try {
    const execution = await executionService.resume(req.user._id, req.params.id);
    res.status(200).json({ execution });
  } catch (err) {
    next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const execution = await executionService.cancel(req.user._id, req.params.id);
    res.status(200).json({ execution });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, getTimeline, pause, resume, cancel };
