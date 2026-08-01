/**
 * @swagger
 * /api/hr/reports:
 *   get:
 *     tags: [Reports]
 *     summary: List available reports
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Report list
 * /api/hr/reports/{reportType}:
 *   get:
 *     tags: [Reports]
 *     summary: Generate report
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: reportType
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [json, pdf, csv, excel] }
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Report generated
 */
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/ReportController');

router.get('/', reportController.listReports);
router.get('/:reportType', reportController.generate);

module.exports = router;
