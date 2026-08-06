const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/AnalyticsController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/dashboard', analyticsController.dashboard);
router.get('/monthly-trends', analyticsController.monthlyTrends);
router.get('/top-campaigns', analyticsController.topCampaigns);
router.get('/customer-growth', analyticsController.customerGrowth);

module.exports = router;
