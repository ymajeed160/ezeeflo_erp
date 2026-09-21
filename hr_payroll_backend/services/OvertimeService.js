const repo = require('../repositories/OvertimeRepository');
const { NotFoundError } = require('../utils/appError');

const toDTO = (o) => o ? {
  id: o.id, tenantId: o.tenantId, employeeId: o.employeeId, attendanceId: o.attendanceId,
  overtimeDate: o.overtimeDate, startTime: o.startTime, endTime: o.endTime,
  totalMinutes: o.totalMinutes, overtimeType: o.overtimeType, rateMultiplier: parseFloat(o.rateMultiplier),
  status: o.status, reason: o.reason, approvedBy: o.approvedBy, approvedAt: o.approvedAt,
  employee: o.employee ? { id: o.employee.id, employeeCode: o.employee.employeeCode, name: `${o.employee.firstName} ${o.employee.lastName}` } : null,
  createdAt: o.createdAt, updatedAt: o.updatedAt,
} : null;

class OvertimeService {
  async getAll(tenantId, query) { const r = await repo.findAll({ tenantId, query }); r.data = r.data.map(toDTO); return r; }
  async getById(id, tenantId) { const o = await repo.findById(id, tenantId); if (!o) throw new NotFoundError('Overtime record not found'); return toDTO(o); }
  async create(data, tenantId, userId) {
    // Calculate total minutes
    const startParts = data.startTime.split(':');
    const endParts = data.endTime.split(':');
    const startMins = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
    const endMins = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
    data.totalMinutes = endMins > startMins ? endMins - startMins : 0;
    return toDTO(await repo.create({ ...data, tenantId, createdBy: userId, updatedBy: userId }));
  }
  async update(id, data, tenantId, userId) {
    const o = await repo.findById(id, tenantId); if (!o) throw new NotFoundError('Overtime record not found');
    if (data.startTime && data.endTime) {
      const startParts = data.startTime.split(':');
      const endParts = data.endTime.split(':');
      data.totalMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]) - (parseInt(startParts[0]) * 60 + parseInt(startParts[1]));
    }
    await repo.update(id, tenantId, { ...data, updatedBy: userId });
    return toDTO(await repo.findById(id, tenantId));
  }
  async delete(id, tenantId) { const o = await repo.findById(id, tenantId); if (!o) throw new NotFoundError('Overtime record not found'); await repo.delete(id, tenantId); return { success: true }; }
  async approve(id, tenantId, userId) {
    const o = await repo.findById(id, tenantId); if (!o) throw new NotFoundError('Overtime record not found');
    await repo.update(id, tenantId, { status: 'Approved', approvedBy: userId, approvedAt: new Date(), updatedBy: userId });
    return toDTO(await repo.findById(id, tenantId));
  }
}

module.exports = new OvertimeService();
