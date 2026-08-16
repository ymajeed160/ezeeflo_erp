const express = require('express');
const router = express.Router();
const bankAccountController = require('../controllers/BankAccountController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const {
  createBankAccountValidation,
  updateBankAccountValidation,
  bankAccountIdValidation,
} = require('../validators/bankAccountValidation');

// All routes require authentication
router.use(authMiddleware);

// Get active bank accounts (compact list for dropdowns)
router.get(
  '/active',
  requirePermission('bankaccount.view'),
  (req, res, next) => bankAccountController.getActiveBankAccounts(req, res, next)
);

// List bank accounts
router.get(
  '/',
  requirePermission('bankaccount.view'),
  (req, res, next) => bankAccountController.getBankAccounts(req, res, next)
);

// Get single bank account
router.get(
  '/:id',
  requirePermission('bankaccount.view'),
  bankAccountIdValidation,
  (req, res, next) => bankAccountController.getBankAccountById(req, res, next)
);

// Create bank account
router.post(
  '/',
  requirePermission('bankaccount.create'),
  createBankAccountValidation,
  (req, res, next) => bankAccountController.createBankAccount(req, res, next)
);

// Update bank account
router.put(
  '/:id',
  requirePermission('bankaccount.edit'),
  bankAccountIdValidation,
  updateBankAccountValidation,
  (req, res, next) => bankAccountController.updateBankAccount(req, res, next)
);

// Toggle active status
router.patch(
  '/:id/toggle-status',
  requirePermission('bankaccount.edit'),
  bankAccountIdValidation,
  (req, res, next) => bankAccountController.toggleBankAccountStatus(req, res, next)
);

// Set as default
router.patch(
  '/:id/set-default',
  requirePermission('bankaccount.edit'),
  bankAccountIdValidation,
  (req, res, next) => bankAccountController.setDefaultBankAccount(req, res, next)
);

// Delete bank account
router.delete(
  '/:id',
  requirePermission('bankaccount.delete'),
  bankAccountIdValidation,
  (req, res, next) => bankAccountController.deleteBankAccount(req, res, next)
);

module.exports = router;
