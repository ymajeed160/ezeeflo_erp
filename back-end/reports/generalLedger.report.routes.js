'use strict';

const express = require('express');
const router = express.Router();
const generalLedgerReportController = require('./generalLedger.report.controller');
const { validateGeneralLedger } = require('./generalLedger.report.validation');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

router.use(authenticate);

router.get(
  '/',
  authorize('reports.financial.view'),
  validateGeneralLedger,
  generalLedgerReportController.getReport.bind(generalLedgerReportController)
);

module.exports = router;
