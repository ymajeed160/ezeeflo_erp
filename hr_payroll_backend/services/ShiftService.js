const repo = require('../repositories/ShiftRepository');
const { ConflictError, NotFoundError } = require('../utils/appError');

const toDTO = (s) => s ? { id: s.id, tenantId: s.tenantId, code: s.code, name: s.name, shiftType: s.shiftType, startTime: s.startTime, endTime: s.endTime, gracePeriodMinutes: s.gracePeriodMinutes, lateThresholdMinutes: s.lateThresholdMinutes, halfDayThresholdMinutes: s.halfDayThresholdMinutes, earlyLeavingThresholdMinutes: s.earlyLeavingThresholdMinutes, breakStartTime: s.breakStartTime, breakEndTime: s.breakEndTime, totalWorkingHours: s.totalWorkingHours, weeklyOffDays: s.weeklyOffDays, isNightShift: s.isNightShift, color: s.color, description: s.description, isActive: s.isActive, createdAt: s.createdAt, updatedAt: s.updatedAt } : null;

class ShiftService {
  async getAll(tenantId, query) { const r = await repo.findAll({ tenantId, query }); r.data = r.data.map(toDTO); return r; }
  async getById(id, tenantId) { const s = await repo.findById(id, tenantId); if (!s) throw new NotFoundError('Shift not found'); return toDTO(s); }
  async create(data, tenantId, userId) {
    const ex = await repo.findByCode(data.code, tenantId); if (ex) throw new ConflictError(`Shift code '${data.code}' already exists`);
    return toDTO(await repo.create({ ...data, tenantId, createdBy: userId, updatedBy: userId }));
  }
  async update(id, data, tenantId, userId) {
    const s = await repo.findById(id, tenantId); if (!s) throw new NotFoundError('Shift not found');
    if (data.code && data.code !== s.code) { const ex = await repo.findByCode(data.code, tenantId, id); if (ex) throw new ConflictError(`Shift code '${data.code}' already exists`); }
    await repo.update(id, tenantId, { ...data, updatedBy: userId });
    return toDTO(await repo.findById(id, tenantId));
  }
  async delete(id, tenantId) { const s = await repo.findById(id, tenantId); if (!s) throw new NotFoundError('Shift not found'); await repo.delete(id, tenantId); return { success: true }; }
}

module.exports = new ShiftService();
