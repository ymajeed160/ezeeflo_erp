const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/RewardController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const validate = require('../middleware/validate');
const { createRewardValidator, updateRewardValidator, redeemRewardValidator } = require('../validators/rewardValidator');

router.use(authMiddleware);

// Redemptions (before /:id to prevent route conflicts)
router.get('/redemptions', requirePermission('rewards.view'), rewardController.getRedemptions);
router.post('/redeem', requirePermission('rewards.manage'), validate(redeemRewardValidator), rewardController.redeem);
router.post('/redemptions/:redemptionId/cancel', requirePermission('rewards.manage'), rewardController.cancelRedemption);

// Reward CRUD
router.get('/', requirePermission('rewards.view'), rewardController.getAll);
router.get('/:id', requirePermission('rewards.view'), rewardController.getById);
router.post('/', requirePermission('rewards.manage'), validate(createRewardValidator), rewardController.create);
router.put('/:id', requirePermission('rewards.manage'), validate(updateRewardValidator), rewardController.update);
router.delete('/:id', requirePermission('rewards.manage'), rewardController.delete);
router.patch('/:id/toggle-status', requirePermission('rewards.manage'), rewardController.toggleStatus);

module.exports = router;
