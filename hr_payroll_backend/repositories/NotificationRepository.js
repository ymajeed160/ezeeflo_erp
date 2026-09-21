const { Op } = require('sequelize');
const { Notification } = require('../models');

class NotificationRepository {
  async findAll({ tenantId, query = {} }) {
    const { page = 1, limit = 20, userId, employeeId, type, isRead } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId };
    if (userId) where.userId = userId;
    if (employeeId) where.employeeId = employeeId;
    if (type) where.type = type;
    if (isRead !== undefined) where.isRead = isRead === 'true' || isRead === true;

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit),
      distinct: true,
    });

    return {
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
        hasNext: offset + parseInt(limit) < count,
        hasPrev: parseInt(page) > 1,
      },
    };
  }

  async findById(id, tenantId) {
    return Notification.findOne({ where: { id, tenantId } });
  }

  async create(data) {
    return Notification.create(data);
  }

  async markAsRead(id, tenantId) {
    const [affected] = await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { id, tenantId, isRead: false } }
    );
    return affected > 0;
  }

  async markAllAsRead(userId, tenantId) {
    const [affected] = await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId, tenantId, isRead: false } }
    );
    return affected;
  }

  async getUnreadCount(userId, tenantId) {
    return Notification.count({ where: { userId, tenantId, isRead: false } });
  }

  async delete(id, tenantId) {
    const notif = await Notification.findOne({ where: { id, tenantId } });
    if (notif) {
      await notif.destroy();
      return true;
    }
    return false;
  }
}

module.exports = new NotificationRepository();
