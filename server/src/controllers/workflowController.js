const { validationResult } = require('express-validator');
const workflowService = require('../services/workflowService');
const aiService = require('../services/aiService');
const executionService = require('../services/executionService');

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: errors.array()[0].msg, details: errors.array() });
    return true;
  }
  return false;
}

async function dashboard(req, res, next) {
  try {
    const stats = await workflowService.dashboardStats(req.user._id);
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    const result = await workflowService.list(req.user._id, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      status,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function generate(req, res, next) {
  if (handleValidation(req, res)) return;
  try {
    const { prompt } = req.body;
    const result = await aiService.generateWorkflow(prompt);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  if (handleValidation(req, res)) return;
  try {
    const workflow = await workflowService.create(req.user._id, req.body);
    res.status(201).json({ workflow });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const workflow = await workflowService.getById(req.user._id, req.params.id);
    res.status(200).json({ workflow });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  if (handleValidation(req, res)) return;
  try {
    const workflow = await workflowService.update(req.user._id, req.params.id, req.body);
    res.status(200).json({ workflow });
  } catch (err) {
    next(err);
  }
}

async function duplicateWorkflow(req, res, next) {
  try {
    const workflow = await workflowService.duplicate(req.user._id, req.params.id);
    res.status(201).json({ workflow });
  } catch (err) {
    next(err);
  }
}

async function execute(req, res, next) {
  try {
    const execution = await executionService.triggerExecution(req.user._id, req.params.id, req.body?.inputs || {});
    res.status(202).json({ execution });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await workflowService.remove(req.user._id, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { dashboard, list, generate, create, getById, update, duplicateWorkflow, execute, remove };
