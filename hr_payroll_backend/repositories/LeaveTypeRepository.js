const { Op } = require('sequelize');
const { LeaveType } = require('../models');

class LeaveTypeRepository {
  async findAll({ tenantId, query = {} }) {
    const { page = 1, limit = 20, search = '', leaveCategory, isActive } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId };
    if (leaveCategory) where.leaveCategory = leaveCategory;
    if (isActive !== undefined && isActive !== '') where.isActive = isActive === 'true';
    if (search) where[Op.or] = [{ code: { [Op.like]: `%${search}%` } }, { name: { [Op.like]: `%${search}%` } }];
    const { count, rows } = await LeaveType.findAndCountAll({ where, order: [['leaveCategory'], ['name']], offset, limit: parseInt(limit), distinct: true });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)), hasNext: offset + parseInt(limit) < count, hasPrev: parseInt(page) > 1 } };
  }
  async findById(id, tenantId) { return LeaveType.findOne({ where: { id, tenantId } }); }
  async findByCode(code, tenantId, excludeId = null) { const where = { code, tenantId }; if (excludeId) where.id = { [Op.ne]: excludeId }; return LeaveType.findOne({ where, paranoid: false }); }
  async create(data) { return LeaveType.create(data); }
  async update(id, tenantId, data) { const l = await LeaveType.findOne({ where: { id, tenantId } }); if (!l) return null; return l.update(data); }
  async delete(id, tenantId) { const l = await LeaveType.findOne({ where: { id, tenantId } }); if (!l) return null; return l.destroy(); }
}

module.exports = new LeaveTypeRepository();
