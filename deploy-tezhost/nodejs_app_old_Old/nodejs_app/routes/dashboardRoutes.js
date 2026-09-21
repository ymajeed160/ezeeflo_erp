'use strict';
const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');

// Note: authMiddleware + companyMiddleware are already applied globally in app.js
// for all business routes. No need for duplicate router.use(authenticate) here.

// GET /api/dashboard/summary — Summary cards
router.get('/summary', DashboardController.getSummary);

// GET /api/dashboard/revenue — Revenue overview chart data
router.get('/revenue', DashboardController.getRevenueOverview);

// GET /api/dashboard/recent-transactions — Recent transactions list
router.get('/recent-transactions', DashboardController.getRecentTransactions);

// GET /api/dashboard/customer-balances — Customer balances
router.get('/customer-balances', DashboardController.getCustomerBalances);

// GET /api/dashboard/inventory-alerts — Inventory alerts
router.get('/inventory-alerts', DashboardController.getInventoryAlerts);

// GET /api/dashboard/quick-stats — Additional quick stats
router.get('/quick-stats', DashboardController.getQuickStats);

module.exports = router;
