const express = require('express');
const router = express.Router();
const { superAdminAuthMiddleware } = require('../middleware/superAdminAuthMiddleware');
const {
  listAdmins, resetAdminPassword, toggleAdminStatus,
  impersonateCompany,
  listEmailTemplates, getEmailTemplate, updateEmailTemplate,
  getSettings, updateSettings,
} = require('../controllers/SuperAdminPhase5Controller');

router.use(superAdminAuthMiddleware);

// Company Administrators
router.get('/admins', listAdmins);
router.post('/admins/:id/reset-password', resetAdminPassword);
router.post('/admins/:id/toggle-status', toggleAdminStatus);

// Impersonation
router.post('/impersonate', impersonateCompany);

// Email Templates
router.get('/email-templates', listEmailTemplates);
router.get('/email-templates/:code', getEmailTemplate);
router.put('/email-templates/:code', updateEmailTemplate);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;
