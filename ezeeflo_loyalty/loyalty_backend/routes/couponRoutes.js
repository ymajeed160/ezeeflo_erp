const express = require('express');
const router = express.Router();
const couponController = require('../controllers/CouponController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const validate = require('../middleware/validate');
const { generateCouponValidator, validateCouponValidator, redeemCouponValidator } = require('../validators/phase4Validator');

router.use(authMiddleware);

router.get('/usage', requirePermission('coupons.view'), couponController.getUsageHistory);
router.post('/validate', requirePermission('coupons.view'), validate(validateCouponValidator), couponController.validate);
router.post('/redeem', requirePermission('coupons.manage'), validate(redeemCouponValidator), couponController.redeem);

router.get('/', requirePermission('coupons.view'), couponController.getAll);
router.get('/:id', requirePermission('coupons.view'), couponController.getById);
router.post('/generate', requirePermission('coupons.manage'), validate(generateCouponValidator), couponController.generate);
router.put('/:id', requirePermission('coupons.manage'), couponController.update);
router.delete('/:id', requirePermission('coupons.manage'), couponController.delete);
router.patch('/:id/toggle-status', requirePermission('coupons.manage'), couponController.toggleStatus);

module.exports = router;
