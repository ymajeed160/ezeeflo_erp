const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/ReportsController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(authMiddleware, requirePermission('reports.view'));

router.get('/customer-ledger', reportsController.customerLedger);
router.get('/points-expiry', reportsController.pointsExpiry);
router.get('/redeemed-rewards', reportsController.redeemedRewards);
router.get('/campaign-performance', reportsController.campaignPerformance);
router.get('/top-customers', reportsController.topCustomers);
router.get('/inactive-customers', reportsController.inactiveCustomers);
router.get('/membership', reportsController.membershipReport);
router.get('/revenue-impact', reportsController.revenueImpact);

module.exports = router;
