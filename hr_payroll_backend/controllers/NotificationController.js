const svc = require('../services/NotificationService');
const ApiResponse = require('../utils/apiResponse');

const NotificationController = {
  getAll: async (req, res, next) => {
    try {
      const r = await svc.getAll(req.tenantId, { ...req.query, userId: req.userId });
      return ApiResponse.paginated(res, { data: r.data, pagination: r.pagination });
    } catch (e) { next(e); }
  },

  markAsRead: async (req, res, next) => {
    try {
      const ok = await svc.markAsRead(req.params.id, req.tenantId);
      if (!ok) return ApiResponse.notFound(res, { message: 'Notification not found or already read' });
      return ApiResponse.success(res, { message: 'Marked as read' });
    } catch (e) { next(e); }
  },

  markAllAsRead: async (req, res, next) => {
    try {
      const count = await svc.markAllAsRead(req.userId, req.tenantId);
      return ApiResponse.success(res, { data: { count }, message: `${count} notifications marked as read` });
    } catch (e) { next(e); }
  },

  getUnreadCount: async (req, res, next) => {
    try {
      const count = await svc.getUnreadCount(req.userId, req.tenantId);
      return ApiResponse.success(res, { data: { count } });
    } catch (e) { next(e); }
  },

  delete: async (req, res, next) => {
    try {
      const ok = await svc.delete(req.params.id, req.tenantId);
      if (!ok) return ApiResponse.notFound(res, { message: 'Notification not found' });
      return ApiResponse.success(res, { message: 'Deleted' });
    } catch (e) { next(e); }
  },
};

module.exports = NotificationController;
