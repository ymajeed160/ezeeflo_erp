const { Op } = require('sequelize');
const { ShiftAssignment, Employee, Shift } = require('../models');

class ShiftAssignmentRepository {
  async findAll({ tenantId, query = {} }) {
    const { page = 1, limit = 20, employeeId, shiftId } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId, isActive: true };
    if (employeeId) where.employeeId = employeeId;
    if (shiftId) where.shiftId = shiftId;
    const { count, rows } = await ShiftAssignment.findAndCountAll({
      where,
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'departmentId'], required: false },
        { model: Shift, as: 'shift', attributes: ['id', 'code', 'name', 'startTime', 'endTime', 'shiftType', 'color'], required: false },
      ],
      order: [['effectiveFrom', 'DESC']], offset, limit: parseInt(limit), distinct: true,
    });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)), hasNext: offset + parseInt(limit) < count, hasPrev: parseInt(page) > 1 } };
  }
  async findById(id, tenantId) {
    return ShiftAssignment.findOne({ where: { id, tenantId }, include: [{ model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName'], required: false }, { model: Shift, as: 'shift', attributes: ['id', 'code', 'name', 'startTime', 'endTime', 'shiftType'], required: false }] });
  }
  async findActiveAssignment(employeeId, tenantId) {
    const today = new Date().toISOString().split('T')[0];
    return ShiftAssignment.findOne({
      where: { employeeId, tenantId, isActive: true, effectiveFrom: { [Op.lte]: today }, [Op.or]: [{ effectiveTo: null }, { effectiveTo: { [Op.gte]: today } }] },
      include: [{ model: Shift, as: 'shift', required: false }],
      order: [['effectiveFrom', 'DESC']],
    });
  }
  async create(data) { return ShiftAssignment.create(data); }
  async update(id, tenantId, data) { const a = await ShiftAssignment.findOne({ where: { id, tenantId } }); if (!a) return null; return a.update(data); }
  async delete(id, tenantId) { const a = await ShiftAssignment.findOne({ where: { id, tenantId } }); if (!a) return null; return a.destroy(); }
}

module.exports = new ShiftAssignmentRepository();
