const { Op } = require('sequelize');
const { Designation, Department } = require('../models');

class DesignationRepository {

  async findAll({ tenantId, query = {} }) {
    const { page = 1, limit = 10, search = '', departmentId, isActive } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId };
    if (departmentId) where.departmentId = departmentId;
    if (isActive !== undefined && isActive !== '') where.isActive = isActive === 'true';
    if (search) {
      where[Op.or] = [
        { code: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { nameAr: { [Op.like]: `%${search}%` } },
      ];
    }
    const { count, rows } = await Designation.findAndCountAll({
      where,
      include: [{ model: Department, as: 'department', attributes: ['id', 'code', 'name'], required: false }],
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      offset, limit: parseInt(limit), distinct: true,
    });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)), hasNext: offset + parseInt(limit) < count, hasPrev: parseInt(page) > 1 } };
  }

  async findById(id, tenantId) {
    return Designation.findOne({ where: { id, tenantId }, include: [{ model: Department, as: 'department', attributes: ['id', 'code', 'name'], required: false }] });
  }

  async findByCode(code, tenantId, excludeId = null) {
    const where = { code, tenantId }; if (excludeId) where.id = { [Op.ne]: excludeId };
    return Designation.findOne({ where, paranoid: false });
  }

  async create(data) { return Designation.create(data); }
  async update(id, tenantId, data) { const d = await Designation.findOne({ where: { id, tenantId } }); if (!d) return null; return d.update(data); }
  async delete(id, tenantId) { const d = await Designation.findOne({ where: { id, tenantId } }); if (!d) return null; return d.destroy(); }
}

module.exports = new DesignationRepository();
