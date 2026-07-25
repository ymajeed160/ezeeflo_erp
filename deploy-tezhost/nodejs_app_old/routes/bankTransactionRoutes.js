const express = require('express');
const router = express.Router();
const bankTransactionController = require('../controllers/BankTransactionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const {
  createBankTransactionValidation,
  updateBankTransactionValidation,
  bankTransactionIdValidation,
  bankTransactionFilterValidation,
} = require('../validators/bankTransactionValidation');

// All routes require authentication
router.use(authMiddleware);

// List transactions
router.get(
  '/',
  requirePermission('banktransaction.view'),
  bankTransactionFilterValidation,
  (req, res, next) => bankTransactionController.getTransactions(req, res, next)
);

// Get unreconciled transactions
router.get(
  '/unreconciled',
  requirePermission('banktransaction.view'),
  (req, res, next) => bankTransactionController.getUnreconciledTransactions(req, res, next)
);

// Get single transaction
router.get(
  '/:id',
  requirePermission('banktransaction.view'),
  bankTransactionIdValidation,
  (req, res, next) => bankTransactionController.getTransactionById(req, res, next)
);

// Create transaction
router.post(
  '/',
  requirePermission('banktransaction.create'),
  createBankTransactionValidation,
  (req, res, next) => bankTransactionController.createTransaction(req, res, next)
);

// Update transaction
router.put(
  '/:id',
  requirePermission('banktransaction.edit'),
  bankTransactionIdValidation,
  updateBankTransactionValidation,
  (req, res, next) => bankTransactionController.updateTransaction(req, res, next)
);

// Post transaction
router.patch(
  '/:id/post',
  requirePermission('banktransaction.post'),
  bankTransactionIdValidation,
  (req, res, next) => bankTransactionController.postTransaction(req, res, next)
);

// Reverse transaction
router.patch(
  '/:id/reverse',
  requirePermission('banktransaction.reverse'),
  bankTransactionIdValidation,
  (req, res, next) => bankTransactionController.reverseTransaction(req, res, next)
);

// Import CSV
router.post(
  '/import-csv',
  requirePermission('banktransaction.import'),
  (req, res, next) => bankTransactionController.importCSV(req, res, next)
);

// Delete transaction
router.delete(
  '/:id',
  requirePermission('banktransaction.delete'),
  bankTransactionIdValidation,
  (req, res, next) => bankTransactionController.deleteTransaction(req, res, next)
);

module.exports = router;
