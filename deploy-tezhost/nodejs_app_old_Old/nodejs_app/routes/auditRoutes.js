const express = require('express');
const router = express.Router();
const auditController = require('../controllers/AuditController');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { superAdminAuth } = require('../middleware/superAdminMiddleware');

// ========================================================
// Company-scoped audit routes (accessible within a company)
// ========================================================

// GET /api/audit-logs — list with filters
router.get('/', requirePermission('audit.view'), auditController.getAll.bind(auditController));

// GET /api/audit-logs/entity/:entityType/:entityId — entity history
router.get('/entity/:entityType/:entityId', requirePermission('audit.view'), auditController.getEntityHistory.bind(auditController));

// GET /api/audit-logs/user/:userId — user activity
router.get('/user/:userId', requirePermission('audit.view'), auditController.getByUser.bind(auditController));

// GET /api/audit-logs/module/:module — module activity
router.get('/module/:module', requirePermission('audit.view'), auditController.getByModule.bind(auditController));

// GET /api/audit-logs/:id — single log detail
router.get('/:id', requirePermission('audit.view_details'), auditController.getById.bind(auditController));

// Reports
router.get('/reports/user-activity', requirePermission('audit.view'), auditController.getUserActivityReport.bind(auditController));
router.get('/reports/login-activity', requirePermission('audit.view'), auditController.getLoginReport.bind(auditController));
router.get('/reports/data-changes', requirePermission('audit.view'), auditController.getDataChangeReport.bind(auditController));

// DELETE /api/audit-logs/:id — delete (requires audit.delete)
router.delete('/:id', requirePermission('audit.delete'), auditController.delete.bind(auditController));

// ========================================================
// Super Admin audit routes
// ========================================================

// Company-specific view (super admin can view any company's logs)
router.get('/company/:companyId', superAdminAuth, auditController.getByCompany.bind(auditController));

module.exports = router;
