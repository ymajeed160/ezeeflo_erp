const express = require('express');
const router = express.Router();
const { PointsController, TransactionController } = require('../controllers/PointsController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const validate = require('../middleware/validate');
const {
  earnPointsValidator, redeemPointsValidator, reverseTransactionValidator,
  adjustPointsValidator, transferPointsValidator, bonusValidator,
} = require('../validators/pointsValidator');

router.use(authMiddleware);

// Points Engine Operations
router.post('/earn', requirePermission('points.manage'), validate(earnPointsValidator), PointsController.earn);
router.post('/redeem', requirePermission('points.manage'), validate(redeemPointsValidator), PointsController.redeem);
router.post('/reverse', requirePermission('points.manage'), validate(reverseTransactionValidator), PointsController.reverse);
router.post('/adjust', requirePermission('points.manage'), validate(adjustPointsValidator), PointsController.adjust);
router.post('/transfer', requirePermission('points.manage'), validate(transferPointsValidator), PointsController.transfer);
router.post('/expire', requirePermission('points.manage'), PointsController.expire);
router.post('/welcome-bonus', requirePermission('points.manage'), validate(bonusValidator), PointsController.welcomeBonus);
router.post('/birthday-bonus', requirePermission('points.manage'), validate(bonusValidator), PointsController.birthdayBonus);

// Calculate earnable points (query params)
router.get('/calculate', requirePermission('points.manage'), PointsController.calculate);

// Transactions
router.get('/transactions', requirePermission('transactions.view'), TransactionController.getAll);
router.get('/transactions/summary', requirePermission('transactions.view'), TransactionController.getSummary);
router.get('/transactions/:id', requirePermission('transactions.view'), TransactionController.getById);
router.get('/customers/:customerId/transactions', requirePermission('transactions.view'), TransactionController.getCustomerTransactions);

module.exports = router;
