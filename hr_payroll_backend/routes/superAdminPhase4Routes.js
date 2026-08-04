const express = require('express');
const router = express.Router();
const { superAdminAuthMiddleware } = require('../middleware/superAdminAuthMiddleware');
const {
  listAuditLogs,
  listAnnouncements, getAnnouncement, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  getReports,
} = require('../controllers/SuperAdminPhase4Controller');

router.use(superAdminAuthMiddleware);

// Audit Logs
router.get('/audit-logs', listAuditLogs);

// Announcements
router.get('/announcements', listAnnouncements);
router.get('/announcements/:id', getAnnouncement);
router.post('/announcements', createAnnouncement);
router.put('/announcements/:id', updateAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

// Reports
router.get('/reports', getReports);

module.exports = router;
