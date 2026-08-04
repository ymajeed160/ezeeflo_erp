const repo = require('../repositories/NotificationRepository');
const logger = require('../utils/logger');

const notifToDTO = (n) => n ? {
  id: n.id,
  tenantId: n.tenantId,
  userId: n.userId,
  employeeId: n.employeeId,
  type: n.type,
  title: n.title,
  message: n.message,
  data: n.data,
  isRead: n.isRead,
  createdAt: n.createdAt,
  readAt: n.readAt,
} : null;

class NotificationService {
  async getAll(tenantId, query) {
    const r = await repo.findAll({ tenantId, query });
    r.data = r.data.map(notifToDTO);
    return r;
  }

  async getById(id, tenantId) {
    const n = await repo.findById(id, tenantId);
    return notifToDTO(n);
  }

  /**
   * Create a notification — call this from other services (e.g. leave approval).
   */
  async create({ tenantId, userId, employeeId, type, title, message, data = null, createdBy = null }) {
    try {
      const notif = await repo.create({ tenantId, userId, employeeId, type, title, message, data, createdBy });
      logger.info(`Notification created: ${type} for user ${userId}`);
      return notifToDTO(notif);
    } catch (error) {
      logger.error('Failed to create notification:', { error: error.message, type, userId });
      return null; // non-fatal
    }
  }

  async markAsRead(id, tenantId) {
    return repo.markAsRead(id, tenantId);
  }

  async markAllAsRead(userId, tenantId) {
    return repo.markAllAsRead(userId, tenantId);
  }

  async getUnreadCount(userId, tenantId) {
    return repo.getUnreadCount(userId, tenantId);
  }

  async delete(id, tenantId) {
    return repo.delete(id, tenantId);
  }
}

module.exports = new NotificationService();
