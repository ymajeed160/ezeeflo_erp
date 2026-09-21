const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/NotificationController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(authMiddleware);

router.get('/templates', notificationController.getTemplates);
router.post('/templates', requirePermission('settings.manage'), notificationController.createTemplate);
router.put('/templates/:id', requirePermission('settings.manage'), notificationController.updateTemplate);
router.delete('/templates/:id', requirePermission('settings.manage'), notificationController.deleteTemplate);
router.post('/send', requirePermission('settings.manage'), notificationController.send);
router.get('/history', notificationController.getHistory);

module.exports = router;
