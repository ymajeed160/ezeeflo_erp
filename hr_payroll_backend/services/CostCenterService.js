const repo = require('../repositories/CostCenterRepository');
const { ConflictError, NotFoundError } = require('../utils/appError');
const erpIntegration = require('../../shared/services/erpIntegration');

const toDTO = (c) => c ? {
  id: c.id, tenantId: c.tenantId, code: c.code, name: c.name, nameAr: c.nameAr,
  departmentId: c.departmentId, description: c.description, isActive: c.isActive,
  department: c.department ? { id: c.department.id, code: c.department.code, name: c.department.name } : null,
  createdAt: c.createdAt, updatedAt: c.updatedAt,
} : null;

class CostCenterService {
  async getAll(tenantId, query) { const r = await repo.findAll({ tenantId, query }); r.data = r.data.map(toDTO); return r; }
  async getById(id, tenantId) { const c = await repo.findById(id, tenantId); if (!c) throw new NotFoundError('Cost Center not found'); return toDTO(c); }

  async create(data, tenantId, userId, token) {
    const ex = await repo.findByCode(data.code, tenantId); if (ex) throw new ConflictError(`Cost Center code '${data.code}' already exists`);
    const c = await repo.create({ ...data, tenantId, createdBy: userId, updatedBy: userId });
    await erpIntegration.sendAuditEvent(token, { tenantId, userId, action: 'CREATE', entity: 'CostCenter', entityId: c.id, newValues: { code: c.code, name: c.name }, description: `Cost Center ${c.code} - ${c.name} created` });
    return toDTO(await repo.findById(c.id, tenantId));
  }

  async update(id, data, tenantId, userId, token) {
    const c = await repo.findById(id, tenantId); if (!c) throw new NotFoundError('Cost Center not found');
    if (data.code && data.code !== c.code) { const ex = await repo.findByCode(data.code, tenantId, id); if (ex) throw new ConflictError(`Cost Center code '${data.code}' already exists`); }
    await repo.update(id, tenantId, { ...data, updatedBy: userId });
    await erpIntegration.sendAuditEvent(token, { tenantId, userId, action: 'UPDATE', entity: 'CostCenter', entityId: id, oldValues: { code: c.code, name: c.name }, newValues: { code: data.code || c.code, name: data.name || c.name }, description: `Cost Center ${c.code} updated` });
    return toDTO(await repo.findById(id, tenantId));
  }

  async delete(id, tenantId, userId, token) {
    const c = await repo.findById(id, tenantId); if (!c) throw new NotFoundError('Cost Center not found');
    await repo.delete(id, tenantId);
    await erpIntegration.sendAuditEvent(token, { tenantId, userId, action: 'DELETE', entity: 'CostCenter', entityId: id, oldValues: { code: c.code, name: c.name }, description: `Cost Center ${c.code} deleted` });
    return { success: true };
  }
}

module.exports = new CostCenterService();
