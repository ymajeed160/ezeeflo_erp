const express = require('express');
const router = express.Router();
const { ApiIntegrationController, AuditController } = require('../controllers/IntegrationController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(authMiddleware);

// API Keys
router.get('/keys', requirePermission('api.manage'), ApiIntegrationController.listKeys);
router.post('/keys', requirePermission('api.manage'), ApiIntegrationController.createKey);
router.delete('/keys/:id', requirePermission('api.manage'), ApiIntegrationController.deleteKey);
router.patch('/keys/:id/revoke', requirePermission('api.manage'), ApiIntegrationController.revokeKey);

// POS Integration (requires API key OR auth)
router.post('/pos/earn', ApiIntegrationController.posEarn);
router.get('/pos/balance/:customerId', ApiIntegrationController.posBalance);
router.post('/pos/redeem', ApiIntegrationController.posRedeem);

// Audit Trail
router.get('/audit/logs', requirePermission('audit.view'), AuditController.getLogs);
router.get('/audit/actions', requirePermission('audit.view'), AuditController.getActions);
router.get('/audit/entity-types', requirePermission('audit.view'), AuditController.getEntityTypes);

module.exports = router;
