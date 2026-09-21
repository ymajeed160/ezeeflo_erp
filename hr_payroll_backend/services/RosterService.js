const rosterRepo = require('../repositories/RosterRepository');
const { NotFoundError } = require('../utils/appError');

const toDTO = (r) => r ? {
  id: r.id, tenantId: r.tenantId, employeeId: r.employeeId, shiftId: r.shiftId,
  rosterDate: r.rosterDate, isWeeklyOff: r.isWeeklyOff, isHoliday: r.isHoliday, notes: r.notes,
  employee: r.employee ? { id: r.employee.id, employeeCode: r.employee.employeeCode, name: `${r.employee.firstName} ${r.employee.lastName}` } : null,
  shift: r.shift ? { id: r.shift.id, code: r.shift.code, name: r.shift.name, startTime: r.shift.startTime, endTime: r.shift.endTime, shiftType: r.shift.shiftType, color: r.shift.color } : null,
  createdAt: r.createdAt, updatedAt: r.updatedAt,
} : null;

class RosterService {
  async getAll(tenantId, query) { const r = await rosterRepo.findAll({ tenantId, query }); r.data = r.data.map(toDTO); return r; }
  async getById(id, tenantId) { const r = await rosterRepo.findById(id, tenantId); if (!r) throw new NotFoundError('Roster not found'); return toDTO(r); }
  async create(data, tenantId, userId) { return toDTO(await rosterRepo.create({ ...data, tenantId, createdBy: userId, updatedBy: userId })); }
  async update(id, data, tenantId, userId) {
    const r = await rosterRepo.findById(id, tenantId); if (!r) throw new NotFoundError('Roster not found');
    await rosterRepo.update(id, tenantId, { ...data, updatedBy: userId });
    return toDTO(await rosterRepo.findById(id, tenantId));
  }
  async delete(id, tenantId) { const r = await rosterRepo.findById(id, tenantId); if (!r) throw new NotFoundError('Roster not found'); await rosterRepo.delete(id, tenantId); return { success: true }; }
  async bulkCreate(records, tenantId, userId) {
    return rosterRepo.bulkCreate(records.map(r => ({ ...r, tenantId, createdBy: userId, updatedBy: userId })));
  }
  async generateRoster(tenantId, dateFrom, dateTo, userId) {
    // Get all active employees with shift assignments and auto-create roster entries
    const shiftAssignments = await require('../repositories/ShiftAssignmentRepository').findAll({ tenantId, query: { limit: 9999 } });
    const results = [];
    let current = new Date(dateFrom);
    const end = new Date(dateTo);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayOfWeek = current.getDay();
      for (const sa of shiftAssignments.data) {
        const shift = sa.shift;
        if (!shift || !sa.employeeId) continue;
        const weeklyOffDays = (shift.weeklyOffDays || '').split(',').map(Number);
        const isWeeklyOff = weeklyOffDays.includes(dayOfWeek);
        const existing = await rosterRepo.findByEmployeeAndDate(sa.employeeId, dateStr, tenantId);
        if (!existing) {
          results.push({ employeeId: sa.employeeId, shiftId: sa.shiftId, rosterDate: dateStr, isWeeklyOff, tenantId, createdBy: userId, updatedBy: userId });
        }
      }
      current.setDate(current.getDate() + 1);
    }
    if (results.length > 0) await rosterRepo.bulkCreate(results);
    return { generated: results.length };
  }
}

module.exports = new RosterService();
