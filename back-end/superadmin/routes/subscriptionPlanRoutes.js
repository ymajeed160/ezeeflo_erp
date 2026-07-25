const express = require('express');
const router = express.Router();
const subscriptionPlanController = require('../controllers/SubscriptionPlanController');
const { superAdminAuth } = require('../../middleware/superAdminMiddleware');

// All routes require super admin auth
router.use(superAdminAuth);

router.get('/', subscriptionPlanController.getAll.bind(subscriptionPlanController));
router.get('/with-modules', subscriptionPlanController.getAllWithModules.bind(subscriptionPlanController));
router.get('/:id', subscriptionPlanController.getById.bind(subscriptionPlanController));
router.post('/', subscriptionPlanController.create.bind(subscriptionPlanController));
router.put('/:id', subscriptionPlanController.update.bind(subscriptionPlanController));
router.delete('/:id', subscriptionPlanController.delete.bind(subscriptionPlanController));
router.patch('/:id/toggle-status', subscriptionPlanController.toggleStatus.bind(subscriptionPlanController));

module.exports = router;
