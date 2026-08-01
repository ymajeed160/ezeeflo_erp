const { Op, fn, col, literal } = require('sequelize');
const { Shift } = require('../models');

class ShiftRepository {
  async findAll({ tenantId, query = {} }) {
    const { page = 1, limit = 10, search = '', shiftType, isActive } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId };
    if (shiftType) where.shiftType = shiftType;
    if (isActive !== undefined && isActive !== '') where.isActive = isActive === 'true';
    if (search) { where[Op.or] = [{ code: { [Op.like]: `%${search}%` } }, { name: { [Op.like]: `%${search}%` } }]; }
    const { count, rows } = await Shift.findAndCountAll({ where, order: [['createdAt', 'DESC']], offset, limit: parseInt(limit), distinct: true });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)), hasNext: offset + parseInt(limit) < count, hasPrev: parseInt(page) > 1 } };
  }
  async findById(id, tenantId) { return Shift.findOne({ where: { id, tenantId } }); }
  async findByCode(code, tenantId, excludeId = null) { const where = { code, tenantId }; if (excludeId) where.id = { [Op.ne]: excludeId }; return Shift.findOne({ where, paranoid: false }); }
  async create(data) { return Shift.create(data); }
  async update(id, tenantId, data) { const s = await Shift.findOne({ where: { id, tenantId } }); if (!s) return null; return s.update(data); }
  async delete(id, tenantId) { const s = await Shift.findOne({ where: { id, tenantId } }); if (!s) return null; return s.destroy(); }
}

module.exports = new ShiftRepository();
