const { Op } = require('sequelize');
const { OvertimeEntry, Employee } = require('../models');

class OvertimeRepository {
  async findAll({ tenantId, query = {} }) {
    const { page = 1, limit = 10, employeeId, status, dateFrom, dateTo } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (dateFrom && dateTo) where.overtimeDate = { [Op.between]: [dateFrom, dateTo] };
    const { count, rows } = await OvertimeEntry.findAndCountAll({
      where,
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName'], required: false }],
      order: [['overtimeDate', 'DESC']], offset, limit: parseInt(limit), distinct: true,
    });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)), hasNext: offset + parseInt(limit) < count, hasPrev: parseInt(page) > 1 } };
  }
  async findById(id, tenantId) { return OvertimeEntry.findOne({ where: { id, tenantId }, include: [{ model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName'], required: false }] }); }
  async create(data) { return OvertimeEntry.create(data); }
  async update(id, tenantId, data) { const o = await OvertimeEntry.findOne({ where: { id, tenantId } }); if (!o) return null; return o.update(data); }
  async delete(id, tenantId) { const o = await OvertimeEntry.findOne({ where: { id, tenantId } }); if (!o) return null; return o.destroy(); }
}

module.exports = new OvertimeRepository();
