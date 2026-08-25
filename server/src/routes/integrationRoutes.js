const express = require('express');
const { body } = require('express-validator');
const integrationController = require('../controllers/integrationController');
const { protect } = require('../middleware/auth');
const { VALID_PROVIDERS } = require('../services/integrationService');

const router = express.Router();

router.get('/oauth/error', integrationController.oauthError);
router.get('/oauth/:provider/callback', integrationController.oauthCallback);

router.use(protect);

router.get('/', integrationController.list);
router.get('/status', integrationController.status);
router.get('/oauth/:provider/start', integrationController.oauthStart);

router.post(
  '/',
  [
    body('provider').isIn(VALID_PROVIDERS).withMessage('Unknown provider'),
    body('accessToken').notEmpty().withMessage('accessToken is required'),
  ],
  integrationController.manualSetup
);

module.exports = router;
