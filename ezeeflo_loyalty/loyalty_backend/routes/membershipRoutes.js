const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/MembershipController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const validate = require('../middleware/validate');
const { createTierValidator, updateTierValidator, assignTierValidator } = require('../validators/membershipValidator');

router.use(authMiddleware);

// Tier Statistics
router.get('/tiers/stats', requirePermission('membership.view'), membershipController.getTierStats);
router.post('/tiers/batch-evaluate', requirePermission('membership.manage'), membershipController.batchEvaluateTiers);

// Tiers CRUD
router.get('/tiers', requirePermission('membership.view'), membershipController.getAllTiers);
router.get('/tiers/:id', requirePermission('membership.view'), membershipController.getTierById);
router.post('/tiers', requirePermission('membership.manage'), validate(createTierValidator), membershipController.createTier);
router.put('/tiers/:id', requirePermission('membership.manage'), validate(updateTierValidator), membershipController.updateTier);
router.delete('/tiers/:id', requirePermission('membership.manage'), membershipController.deleteTier);
router.patch('/tiers/:id/toggle-status', requirePermission('membership.manage'), membershipController.toggleTierStatus);

// Customer Membership
router.get('/customers/:customerId/history', requirePermission('membership.view'), membershipController.getCustomerHistory);
router.post('/customers/:customerId/evaluate', requirePermission('membership.manage'), membershipController.evaluateTier);
router.post('/customers/:customerId/assign', requirePermission('membership.manage'), validate(assignTierValidator), membershipController.assignTier);

module.exports = router;
