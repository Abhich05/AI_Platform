const { validationResult } = require('express-validator');
const authService = require('../services/authService');

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: errors.array()[0].msg, details: errors.array() });
    return true;
  }
  return false;
}

async function register(req, res, next) {
  if (handleValidation(req, res)) return;
  try {
    const { name, email, password } = req.body;
    const result = await authService.register({ name, email, password });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  if (handleValidation(req, res)) return;
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.status(200).json({ user: authService.sanitizeUser(req.user) });
}

async function updateProfile(req, res, next) {
  if (handleValidation(req, res)) return;
  try {
    const user = await authService.updateProfile(req.user._id, req.body);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  if (handleValidation(req, res)) return;
  try {
    await authService.changePassword(req.user._id, req.body);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, updateProfile, changePassword };
