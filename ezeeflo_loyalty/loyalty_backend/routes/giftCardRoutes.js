const express = require('express');
const router = express.Router();
const giftCardController = require('../controllers/GiftCardController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const validate = require('../middleware/validate');
const { purchaseGiftCardValidator, redeemGiftCardValidator, rechargeGiftCardValidator, cancelGiftCardValidator } = require('../validators/phase4Validator');

router.use(authMiddleware);

router.post('/purchase', requirePermission('giftcards.manage'), validate(purchaseGiftCardValidator), giftCardController.purchase);
router.post('/redeem', requirePermission('giftcards.manage'), validate(redeemGiftCardValidator), giftCardController.redeem);
router.post('/recharge', requirePermission('giftcards.manage'), validate(rechargeGiftCardValidator), giftCardController.recharge);
router.post('/cancel', requirePermission('giftcards.manage'), validate(cancelGiftCardValidator), giftCardController.cancel);

router.get('/', requirePermission('giftcards.view'), giftCardController.getAll);
router.get('/:id', requirePermission('giftcards.view'), giftCardController.getById);
router.get('/:id/transactions', requirePermission('giftcards.view'), giftCardController.getTransactions);

module.exports = router;
