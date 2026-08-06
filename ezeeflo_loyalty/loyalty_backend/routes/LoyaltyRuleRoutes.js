const express = require('express');
const router = express.Router();
const loyaltyRuleController = require('../controllers/LoyaltyRuleController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const validate = require('../middleware/validate');
const { createRuleValidator, updateRuleValidator } = require('../validators/loyaltyRuleValidator');

router.use(authMiddleware);

router.get('/', requirePermission('loyalty_rules.view'), loyaltyRuleController.getAll);
router.get('/:id', requirePermission('loyalty_rules.view'), loyaltyRuleController.getById);
router.post('/', requirePermission('loyalty_rules.manage'), validate(createRuleValidator), loyaltyRuleController.create);
router.put('/:id', requirePermission('loyalty_rules.manage'), validate(updateRuleValidator), loyaltyRuleController.update);
router.delete('/:id', requirePermission('loyalty_rules.manage'), loyaltyRuleController.delete);
router.patch('/:id/toggle', requirePermission('loyalty_rules.manage'), loyaltyRuleController.toggleStatus);
router.post('/evaluate', requirePermission('loyalty_rules.view'), loyaltyRuleController.evaluate);

module.exports = router;
