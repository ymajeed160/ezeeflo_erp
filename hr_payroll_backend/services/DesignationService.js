const repo = require('../repositories/DesignationRepository');
const { ConflictError, NotFoundError } = require('../utils/appError');
const erpIntegration = require('../../shared/services/erpIntegration');

const toDTO = (d) => d ? {
  id: d.id, tenantId: d.tenantId, code: d.code, name: d.name, nameAr: d.nameAr,
  departmentId: d.departmentId, grade: d.grade, description: d.description,
  isActive: d.isActive, sortOrder: d.sortOrder,
  department: d.department ? { id: d.department.id, code: d.department.code, name: d.department.name } : null,
  createdAt: d.createdAt, updatedAt: d.updatedAt,
} : null;

class DesignationService {
  async getAll(tenantId, query) { const r = await repo.findAll({ tenantId, query }); r.data = r.data.map(toDTO); return r; }
  async getById(id, tenantId) { const d = await repo.findById(id, tenantId); if (!d) throw new NotFoundError('Designation not found'); return toDTO(d); }

  async create(data, tenantId, userId, token) {
    const ex = await repo.findByCode(data.code, tenantId); if (ex) throw new ConflictError(`Designation code '${data.code}' already exists`);
    const d = await repo.create({ ...data, tenantId, createdBy: userId, updatedBy: userId });
    await erpIntegration.sendAuditEvent(token, { tenantId, userId, action: 'CREATE', entity: 'Designation', entityId: d.id, newValues: { code: d.code, name: d.name }, description: `Designation ${d.code} - ${d.name} created` });
    return toDTO(await repo.findById(d.id, tenantId));
  }

  async update(id, data, tenantId, userId, token) {
    const d = await repo.findById(id, tenantId); if (!d) throw new NotFoundError('Designation not found');
    if (data.code && data.code !== d.code) { const ex = await repo.findByCode(data.code, tenantId, id); if (ex) throw new ConflictError(`Designation code '${data.code}' already exists`); }
    await repo.update(id, tenantId, { ...data, updatedBy: userId });
    await erpIntegration.sendAuditEvent(token, { tenantId, userId, action: 'UPDATE', entity: 'Designation', entityId: id, oldValues: { code: d.code, name: d.name }, newValues: { code: data.code || d.code, name: data.name || d.name }, description: `Designation ${d.code} updated` });
    return toDTO(await repo.findById(id, tenantId));
  }

  async delete(id, tenantId, userId, token) {
    const d = await repo.findById(id, tenantId); if (!d) throw new NotFoundError('Designation not found');
    await repo.delete(id, tenantId);
    await erpIntegration.sendAuditEvent(token, { tenantId, userId, action: 'DELETE', entity: 'Designation', entityId: id, oldValues: { code: d.code, name: d.name }, description: `Designation ${d.code} deleted` });
    return { success: true };
  }
}

module.exports = new DesignationService();
