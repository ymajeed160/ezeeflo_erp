const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');

class AuditService {
  async getLogs(companyId, { page = 1, limit = 50, action, entityType, userId, startDate, endDate, search } = {}) {
    const where = { companyId };
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (userId) where.userId = userId;
    if (startDate || endDate) { where.createdAt = {}; if (startDate) where.createdAt[Op.gte] = new Date(startDate); if (endDate) where.createdAt[Op.lte] = new Date(endDate + 'T23:59:59.999Z'); }
    if (search) { where[Op.or] = [{ action: { [Op.like]: `%${search}%` } }, { entityType: { [Op.like]: `%${search}%` } }]; }

    const offset = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 50);
    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName'], required: false }],
      limit: parseInt(limit) || 50, offset, order: [['createdAt', 'DESC']], distinct: true,
    });
    return { rows, count, pagination: { page: parseInt(page) || 1, limit: parseInt(limit) || 50, total: count, totalPages: Math.ceil(count / (parseInt(limit) || 50)), hasNext: offset + parseInt(limit) < count, hasPrev: (parseInt(page) || 1) > 1 } };
  }

  async getActions(companyId) {
    const actions = await AuditLog.findAll({ where: { companyId }, attributes: ['action'], group: ['action'], order: [['action', 'ASC']] });
    return actions.map(a => a.action);
  }

  async getEntityTypes(companyId) {
    const types = await AuditLog.findAll({ where: { companyId }, attributes: ['entityType'], group: ['entityType'], order: [['entityType', 'ASC']] });
    return types.map(t => t.entityType);
  }
}

module.exports = new AuditService();
