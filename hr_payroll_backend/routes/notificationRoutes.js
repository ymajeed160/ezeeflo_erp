/**
 * Notification Routes
 *
 * /api/hr/notifications
 */
const express = require('express');
const ctrl = require('../controllers/NotificationController');

const router = express.Router();

router.get('/unread-count', ctrl.getUnreadCount);
router.patch('/read-all', ctrl.markAllAsRead);
router.patch('/:id/read', ctrl.markAsRead);
router.get('/', ctrl.getAll);
router.delete('/:id', ctrl.delete);

module.exports = router;
