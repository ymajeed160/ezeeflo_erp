const { Op } = require('sequelize');
const { Roster, Employee, Shift } = require('../models');

class RosterRepository {
  async findAll({ tenantId, query = {} }) {
    const { page = 1, limit = 20, employeeId, dateFrom, dateTo, shiftId } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    if (shiftId) where.shiftId = shiftId;
    if (dateFrom && dateTo) where.rosterDate = { [Op.between]: [dateFrom, dateTo] };
    const { count, rows } = await Roster.findAndCountAll({
      where,
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'departmentId'], required: false },
        { model: Shift, as: 'shift', attributes: ['id', 'code', 'name', 'startTime', 'endTime', 'shiftType', 'color'], required: false },
      ],
      order: [['rosterDate', 'ASC']], offset, limit: parseInt(limit), distinct: true,
    });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)), hasNext: offset + parseInt(limit) < count, hasPrev: parseInt(page) > 1 } };
  }
  async findById(id, tenantId) { return Roster.findOne({ where: { id, tenantId }, include: [{ model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName'], required: false }, { model: Shift, as: 'shift', attributes: ['id', 'code', 'name', 'startTime', 'endTime', 'shiftType', 'color'], required: false }] }); }
  async findByEmployeeAndDate(employeeId, rosterDate, tenantId) { return Roster.findOne({ where: { employeeId, rosterDate, tenantId } }); }
  async create(data) { return Roster.create(data); }
  async update(id, tenantId, data) { const r = await Roster.findOne({ where: { id, tenantId } }); if (!r) return null; return r.update(data); }
  async delete(id, tenantId) { const r = await Roster.findOne({ where: { id, tenantId } }); if (!r) return null; return r.destroy(); }
  async bulkCreate(records) { return Roster.bulkCreate(records, { updateOnDuplicate: ['shift_id', 'is_weekly_off', 'notes', 'updated_at'] }); }
}

module.exports = new RosterRepository();
