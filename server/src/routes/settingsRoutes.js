const express = require('express');
const settingsController = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/health', settingsController.health);

module.exports = router;
