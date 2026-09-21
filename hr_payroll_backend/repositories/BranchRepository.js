const { Op } = require('sequelize');
const { Branch } = require('../models');

class BranchRepository {
  async findAll({ tenantId, query = {} }) {
    const { page = 1, limit = 10, search = '', isActive } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId };
    if (isActive !== undefined && isActive !== '') where.isActive = isActive === 'true';
    if (search) { where[Op.or] = [{ code: { [Op.like]: `%${search}%` } }, { name: { [Op.like]: `%${search}%` } }, { city: { [Op.like]: `%${search}%` } }]; }
    const { count, rows } = await Branch.findAndCountAll({ where, order: [['name', 'ASC']], offset, limit: parseInt(limit), distinct: true });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)), hasNext: offset + parseInt(limit) < count, hasPrev: parseInt(page) > 1 } };
  }
  async findById(id, tenantId) { return Branch.findOne({ where: { id, tenantId } }); }
  async findByCode(code, tenantId, excludeId = null) { const where = { code, tenantId }; if (excludeId) where.id = { [Op.ne]: excludeId }; return Branch.findOne({ where, paranoid: false }); }
  async create(data) { return Branch.create(data); }
  async update(id, tenantId, data) { const d = await Branch.findOne({ where: { id, tenantId } }); if (!d) return null; return d.update(data); }
  async delete(id, tenantId) { const d = await Branch.findOne({ where: { id, tenantId } }); if (!d) return null; return d.destroy(); }
}

module.exports = new BranchRepository();
