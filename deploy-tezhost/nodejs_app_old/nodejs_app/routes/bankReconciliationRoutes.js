const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/BankReconciliationController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { createReconciliationValidation, importStatementLinesValidation, reconciliationIdValidation } = require('../validators/bankReconciliationValidation');

router.use(authMiddleware);

router.get('/', requirePermission('bankreconciliation.view'), (r, s, n) => ctrl.getReconciliations(r, s, n));
router.get('/unmatched-transactions', requirePermission('bankreconciliation.view'), (r, s, n) => ctrl.getUnmatchedSystemTransactions(r, s, n));
router.get('/:id', requirePermission('bankreconciliation.view'), reconciliationIdValidation, (r, s, n) => ctrl.getReconciliationById(r, s, n));
router.post('/', requirePermission('bankreconciliation.create'), createReconciliationValidation, (r, s, n) => ctrl.createReconciliation(r, s, n));
router.post('/:id/import-lines', requirePermission('bankreconciliation.edit'), reconciliationIdValidation, importStatementLinesValidation, (r, s, n) => ctrl.importStatementLines(r, s, n));
router.post('/:id/manual-match', requirePermission('bankreconciliation.edit'), reconciliationIdValidation, (r, s, n) => ctrl.manualMatch(r, s, n));
router.post('/:id/unmatch', requirePermission('bankreconciliation.edit'), reconciliationIdValidation, (r, s, n) => ctrl.unmatchLine(r, s, n));
router.post('/:id/complete', requirePermission('bankreconciliation.reconcile'), reconciliationIdValidation, (r, s, n) => ctrl.completeReconciliation(r, s, n));
router.post('/:id/override-complete', requirePermission('bankreconciliation.reconcile', 'bankreconciliation.override'), reconciliationIdValidation, (r, s, n) => ctrl.overrideCompleteReconciliation(r, s, n));
router.post('/:id/reverse', requirePermission('bankreconciliation.reverse'), reconciliationIdValidation, (r, s, n) => ctrl.reverseReconciliation(r, s, n));
router.delete('/:id', requirePermission('bankreconciliation.delete'), reconciliationIdValidation, (r, s, n) => ctrl.deleteReconciliation(r, s, n));

module.exports = router;
