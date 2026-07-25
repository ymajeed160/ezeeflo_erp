const express = require('express');
const router = express.Router();
const generalLedgerController = require('../controllers/GeneralLedgerController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const {
  getLedgerValidation,
  getLedgerAccountsValidation,
  getAccountHierarchyValidation,
  exportLedgerValidation,
} = require('../validators/generalLedgerValidation');

// All routes require authentication and tenant context
router.use(authMiddleware);

// GET /api/general-ledger - View general ledger with filters
router.get(
  '/',
  requirePermission('general-ledger.read'),
  getLedgerValidation,
  generalLedgerController.getGeneralLedger
);

// GET /api/general-ledger/accounts - Get accounts for filter dropdown
router.get(
  '/accounts',
  requirePermission('general-ledger.read'),
  getLedgerAccountsValidation,
  generalLedgerController.getLedgerAccounts
);

// GET /api/general-ledger/account/:accountId/hierarchy - Get account with its child hierarchy
router.get(
  '/account/:accountId/hierarchy',
  requirePermission('general-ledger.read'),
  getAccountHierarchyValidation,
  generalLedgerController.getAccountHierarchy
);

// GET /api/general-ledger/export - Export full ledger data
router.get(
  '/export',
  requirePermission('general-ledger.export'),
  exportLedgerValidation,
  generalLedgerController.exportLedger
);

module.exports = router;