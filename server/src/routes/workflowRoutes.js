const express = require('express');
const { body } = require('express-validator');
const workflowController = require('../controllers/workflowController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/dashboard', workflowController.dashboard);
router.get('/', workflowController.list);

router.post(
  '/generate',
  [body('prompt').trim().notEmpty().withMessage('Prompt is required')],
  workflowController.generate
);

router.post(
  '/',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('nodes').optional().isArray().withMessage('Nodes must be an array'),
    body('edges').optional().isArray().withMessage('Edges must be an array'),
  ],
  workflowController.create
);

router.get('/:id', workflowController.getById);

router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('status').optional().isIn(['draft', 'active', 'paused', 'archived']).withMessage('Invalid status'),
    body('nodes').optional().isArray().withMessage('Nodes must be an array'),
    body('edges').optional().isArray().withMessage('Edges must be an array'),
  ],
  workflowController.update
);

router.post('/:id/duplicate', workflowController.duplicateWorkflow);
router.delete('/:id', workflowController.remove);

module.exports = router;
