const express = require('express');
const executionController = require('../controllers/executionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', executionController.list);
router.get('/:id', executionController.getById);
router.get('/:id/timeline', executionController.getTimeline);
router.post('/:id/pause', executionController.pause);
router.post('/:id/resume', executionController.resume);
router.post('/:id/cancel', executionController.cancel);

module.exports = router;
