const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', notificationController.list);
router.post('/mark-all-read', notificationController.markAllRead);

module.exports = router;
