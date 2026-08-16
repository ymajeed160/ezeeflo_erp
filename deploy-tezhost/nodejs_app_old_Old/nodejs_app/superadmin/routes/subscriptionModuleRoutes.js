const express = require('express');
const router = express.Router();
const subscriptionModuleController = require('../controllers/SubscriptionModuleController');
const { superAdminAuth } = require('../../middleware/superAdminMiddleware');

// All routes require super admin auth
router.use(superAdminAuth);

router.get('/', subscriptionModuleController.getAll.bind(subscriptionModuleController));
router.get('/active', subscriptionModuleController.getAllActive.bind(subscriptionModuleController));
router.get('/:id', subscriptionModuleController.getById.bind(subscriptionModuleController));
router.post('/', subscriptionModuleController.create.bind(subscriptionModuleController));
router.put('/:id', subscriptionModuleController.update.bind(subscriptionModuleController));
router.delete('/:id', subscriptionModuleController.delete.bind(subscriptionModuleController));

module.exports = router;
