const express = require('express');
const router = express.Router();
const referralController = require('../controllers/ReferralController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const validate = require('../middleware/validate');
const { generateReferralCodeValidator, createReferralValidator } = require('../validators/phase4Validator');

router.use(authMiddleware);

router.get('/stats', requirePermission('referrals.view'), referralController.getStats);
router.post('/generate-code', requirePermission('referrals.manage'), validate(generateReferralCodeValidator), referralController.generateCode);
router.post('/register', validate(createReferralValidator), referralController.createReferral);

router.get('/', requirePermission('referrals.view'), referralController.getAll);
router.get('/:id', requirePermission('referrals.view'), referralController.getById);
router.post('/:id/grant-rewards', requirePermission('referrals.manage'), referralController.grantRewards);

module.exports = router;
