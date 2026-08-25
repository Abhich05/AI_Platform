const { validationResult } = require('express-validator');
const integrationService = require('../services/integrationService');
const env = require('../config/env');

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: errors.array()[0].msg });
    return true;
  }
  return false;
}

async function list(req, res, next) {
  try {
    const integrations = await integrationService.list(req.user._id);
    res.status(200).json({ integrations });
  } catch (err) {
    next(err);
  }
}

async function status(req, res, next) {
  try {
    const result = await integrationService.status(req.user._id);
    res.status(200).json({ status: result });
  } catch (err) {
    next(err);
  }
}

async function oauthStart(req, res, next) {
  try {
    const url = integrationService.startOAuth(req.user._id, req.params.provider);
    res.status(200).json({ url });
  } catch (err) {
    next(err);
  }
}

async function oauthCallback(req, res) {
  const { code, state, error } = req.query;
  if (error) {
    return res.redirect(`${env.CLIENT_URL}/integrations?error=${encodeURIComponent(error)}`);
  }
  try {
    await integrationService.handleCallback(req.params.provider, code, state);
    res.redirect(`${env.CLIENT_URL}/integrations?connected=${req.params.provider}`);
  } catch (err) {
    console.error('[integrations] OAuth callback failed:', err.message);
    res.redirect(`${env.CLIENT_URL}/integrations?error=${encodeURIComponent(err.message)}`);
  }
}

function oauthError(req, res) {
  res.status(400).json({ error: 'OAUTH_ERROR', message: req.query.message || 'OAuth flow failed' });
}

async function manualSetup(req, res, next) {
  if (handleValidation(req, res)) return;
  try {
    const integration = await integrationService.manualSetup(req.user._id, req.body);
    res.status(201).json({ integration });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, status, oauthStart, oauthCallback, oauthError, manualSetup };
