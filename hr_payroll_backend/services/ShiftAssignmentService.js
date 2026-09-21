const saRepo = require('../repositories/ShiftAssignmentRepository');
const shiftRepo = require('../repositories/ShiftRepository');
const { NotFoundError } = require('../utils/appError');

const toDTO = (a) => a ? {
  id: a.id, tenantId: a.tenantId, employeeId: a.employeeId, shiftId: a.shiftId,
  effectiveFrom: a.effectiveFrom, effectiveTo: a.effectiveTo, isActive: a.isActive, notes: a.notes,
  employee: a.employee ? { id: a.employee.id, employeeCode: a.employee.employeeCode, name: `${a.employee.firstName} ${a.employee.lastName}` } : null,
  shift: a.shift ? { id: a.shift.id, code: a.shift.code, name: a.shift.name, startTime: a.shift.startTime, endTime: a.shift.endTime, shiftType: a.shift.shiftType } : null,
  createdAt: a.createdAt, updatedAt: a.updatedAt,
} : null;

class ShiftAssignmentService {
  async getAll(tenantId, query) { const r = await saRepo.findAll({ tenantId, query }); r.data = r.data.map(toDTO); return r; }
  async getById(id, tenantId) { const a = await saRepo.findById(id, tenantId); if (!a) throw new NotFoundError('Shift assignment not found'); return toDTO(a); }
  async create(data, tenantId, userId) {
    // Deactivate previous active assignment for this employee if this is a new assignment
    if (!data.effectiveTo) {
      const existing = await saRepo.findActiveAssignment(data.employeeId, tenantId);
      if (existing) await saRepo.update(existing.id, tenantId, { effectiveTo: data.effectiveFrom, isActive: false });
    }
    return toDTO(await saRepo.create({ ...data, tenantId, assignedBy: userId, createdBy: userId, updatedBy: userId }));
  }
  async update(id, data, tenantId, userId) {
    const a = await saRepo.findById(id, tenantId); if (!a) throw new NotFoundError('Shift assignment not found');
    await saRepo.update(id, tenantId, { ...data, updatedBy: userId });
    return toDTO(await saRepo.findById(id, tenantId));
  }
  async delete(id, tenantId) { const a = await saRepo.findById(id, tenantId); if (!a) throw new NotFoundError('Shift assignment not found'); await saRepo.delete(id, tenantId); return { success: true }; }
}

module.exports = new ShiftAssignmentService();
