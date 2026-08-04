'use strict';

const express = require('express');
const router = express.Router();
const reportController = require('./report.controller');
const { validateReportQuery } = require('./report.validation');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

router.use(authenticate);

// Unified report endpoint: GET /api/reports/:reportName
router.get(
  '/:reportName',
  validateReportQuery,
  reportController.executeReport.bind(reportController)
);

module.exports = router;
