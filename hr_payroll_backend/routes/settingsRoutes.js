const express = require('express');
const ctrl = require('../controllers/SettingsController');

const router = express.Router();

// General Settings
router.get('/general', ctrl.getGeneralSettings);
router.put('/general', ctrl.updateGeneralSettings);

// Company Profile
router.get('/company-profile', ctrl.getCompanyProfiles);
router.post('/company-profile', ctrl.createCompanyProfile);
router.put('/company-profile/:id', ctrl.updateCompanyProfile);
router.delete('/company-profile/:id', ctrl.deleteCompanyProfile);

// Localization
router.get('/localization', ctrl.getLocalization);
router.put('/localization', ctrl.updateLocalization);

// Working Hours
router.get('/working-hours', ctrl.getWorkingHours);
router.put('/working-hours', ctrl.updateWorkingHours);

// Attendance
router.get('/attendance', ctrl.getAttendanceSettings);
router.put('/attendance', ctrl.updateAttendanceSettings);

// Leave
router.get('/leave', ctrl.getLeaveSettings);
router.put('/leave', ctrl.updateLeaveSettings);

// Payroll
router.get('/payroll', ctrl.getPayrollSettings);
router.put('/payroll', ctrl.updatePayrollSettings);

// Security
router.get('/security', ctrl.getSecuritySettings);
router.put('/security', ctrl.updateSecuritySettings);

// Email
router.get('/email', ctrl.getEmailSettings);
router.put('/email', ctrl.updateEmailSettings);

// SMS
router.get('/sms', ctrl.getSmsSettings);
router.put('/sms', ctrl.updateSmsSettings);

// Notifications
router.get('/notifications', ctrl.getNotificationSettings);
router.put('/notifications', ctrl.updateNotificationSettings);

// Audit Logs
router.get('/audit-logs', ctrl.getAuditLogs);

module.exports = router;
