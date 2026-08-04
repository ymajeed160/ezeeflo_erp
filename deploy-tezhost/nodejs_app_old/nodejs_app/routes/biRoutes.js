'use strict';

const express = require('express');
const router = express.Router();
const biController = require('../controllers/BIController');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

// BI Dashboard endpoints
router.get('/sales-dashboard', biController.getSalesDashboard.bind(biController));
router.get('/purchase-dashboard', biController.getPurchaseDashboard.bind(biController));
router.get('/inventory-dashboard', biController.getInventoryDashboard.bind(biController));
router.get('/financial-dashboard', biController.getFinancialDashboard.bind(biController));

module.exports = router;
