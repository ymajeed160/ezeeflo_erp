const { Op } = require('sequelize');
const { Department, Branch, Employee } = require('../models');

class DepartmentRepository {

  async findAll({ tenantId, query = {} }) {
    const { page = 1, limit = 10, search = '', branchId, parentId, isActive } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId };

    if (branchId) where.branchId = branchId;
    if (parentId) where.parentId = parentId;
    if (parentId === 'null') where.parentId = null;
    if (isActive !== undefined && isActive !== '') where.isActive = isActive === 'true';

    if (search) {
      where[Op.or] = [
        { code: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { nameAr: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Department.findAndCountAll({
      where,
      include: [
        { model: Branch, as: 'branch', attributes: ['id', 'code', 'name'], required: false },
        { model: Department, as: 'parent', attributes: ['id', 'code', 'name'], required: false },
        { model: Employee, as: 'manager', attributes: ['id', 'employeeCode', 'firstName', 'lastName'], required: false },
      ],
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      offset, limit: parseInt(limit), distinct: true,
    });

    return {
      data: rows,
      pagination: {
        page: parseInt(page), limit: parseInt(limit), total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
        hasNext: offset + parseInt(limit) < count,
        hasPrev: parseInt(page) > 1,
      },
    };
  }

  async findById(id, tenantId) {
    return Department.findOne({
      where: { id, tenantId },
      include: [
        { model: Branch, as: 'branch', attributes: ['id', 'code', 'name'], required: false },
        { model: Department, as: 'parent', attributes: ['id', 'code', 'name'], required: false },
        { model: Department, as: 'children', attributes: ['id', 'code', 'name'], required: false },
        { model: Employee, as: 'manager', attributes: ['id', 'employeeCode', 'firstName', 'lastName'], required: false },
      ],
    });
  }

  async findByCode(code, tenantId, excludeId = null) {
    const where = { code, tenantId };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    return Department.findOne({ where, paranoid: false });
  }

  async create(data) { return Department.create(data); }
  async update(id, tenantId, data) { const d = await Department.findOne({ where: { id, tenantId } }); if (!d) return null; return d.update(data); }
  async delete(id, tenantId) { const d = await Department.findOne({ where: { id, tenantId } }); if (!d) return null; return d.destroy(); }
}

module.exports = new DepartmentRepository();
