/**
 * @swagger
 * tags:
 *   name: Dashboard
 * /api/hr/dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: HR Dashboard summary
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Dashboard summary data
 */
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/DashboardController');

/**
 * Dashboard Routes
 * 
 * GET /api/hr/dashboard/summary — HR Dashboard summary statistics
 */

router.get('/summary', dashboardController.getSummary);

module.exports = router;
