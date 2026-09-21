const { Op } = require('sequelize');
const { LeaveBalance, Employee, LeaveType } = require('../models');

class LeaveBalanceRepository {
  async findAll({ tenantId, query = {} }) {
    const { page = 1, limit = 20, employeeId, leaveTypeId, year } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    if (leaveTypeId) where.leaveTypeId = leaveTypeId;
    if (year) where.year = parseInt(year);
    const { count, rows } = await LeaveBalance.findAndCountAll({
      where,
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName'], required: false },
        { model: LeaveType, as: 'leaveType', attributes: ['id', 'code', 'name', 'leaveCategory', 'isPaid', 'maxDaysPerYear', 'color'], required: false },
      ],
      order: [['year', 'DESC'], ['leaveTypeId']], offset, limit: parseInt(limit), distinct: true,
    });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)), hasNext: offset + parseInt(limit) < count, hasPrev: parseInt(page) > 1 } };
  }
  async findByEmployeeAndType(employeeId, leaveTypeId, year, tenantId) {
    return LeaveBalance.findOne({ where: { employeeId, leaveTypeId, year, tenantId } });
  }
  async findById(id, tenantId) { return LeaveBalance.findOne({ where: { id, tenantId }, include: [{ model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName'], required: false }, { model: LeaveType, as: 'leaveType', required: false }] }); }
  async create(data) { return LeaveBalance.create(data); }
  async update(id, tenantId, data) { const b = await LeaveBalance.findOne({ where: { id, tenantId } }); if (!b) return null; return b.update(data); }
  async delete(id, tenantId) { const b = await LeaveBalance.findOne({ where: { id, tenantId } }); if (!b) return null; return b.destroy(); }
}

module.exports = new LeaveBalanceRepository();
