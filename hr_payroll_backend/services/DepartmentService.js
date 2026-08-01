const repo = require('../repositories/DepartmentRepository');
const { ConflictError, NotFoundError } = require('../utils/appError');
const logger = require('../utils/logger');
const erpIntegration = require('../../shared/services/erpIntegration');

// Generic DTO conversion
const toDTO = (d) => d ? {
  id: d.id, tenantId: d.tenantId, code: d.code, name: d.name, nameAr: d.nameAr,
  parentId: d.parentId, branchId: d.branchId, managerId: d.managerId,
  description: d.description, isActive: d.isActive, sortOrder: d.sortOrder,
  branch: d.branch ? { id: d.branch.id, code: d.branch.code, name: d.branch.name } : null,
  parent: d.parent ? { id: d.parent.id, code: d.parent.code, name: d.parent.name } : null,
  children: (d.children || []).map(c => ({ id: c.id, code: c.code, name: c.name })),
  manager: d.manager ? { id: d.manager.id, employeeCode: d.manager.employeeCode, name: `${d.manager.firstName} ${d.manager.lastName}` } : null,
  createdAt: d.createdAt, updatedAt: d.updatedAt,
} : null;

class DepartmentService {
  async getAll(tenantId, query) { const r = await repo.findAll({ tenantId, query }); r.data = r.data.map(toDTO); return r; }
  async getById(id, tenantId) { const d = await repo.findById(id, tenantId); if (!d) throw new NotFoundError('Department not found'); return toDTO(d); }

  async create(data, tenantId, userId, token) {
    const ex = await repo.findByCode(data.code, tenantId); if (ex) throw new ConflictError(`Department code '${data.code}' already exists`);
    const d = await repo.create({ ...data, tenantId, createdBy: userId, updatedBy: userId });
    await erpIntegration.sendAuditEvent(token, { tenantId, userId, action: 'CREATE', entity: 'Department', entityId: d.id, newValues: { code: d.code, name: d.name }, description: `Department ${d.code} - ${d.name} created` });
    return toDTO(await repo.findById(d.id, tenantId));
  }

  async update(id, data, tenantId, userId, token) {
    const d = await repo.findById(id, tenantId); if (!d) throw new NotFoundError('Department not found');
    if (data.code && data.code !== d.code) { const ex = await repo.findByCode(data.code, tenantId, id); if (ex) throw new ConflictError(`Department code '${data.code}' already exists`); }
    await repo.update(id, tenantId, { ...data, updatedBy: userId });
    await erpIntegration.sendAuditEvent(token, { tenantId, userId, action: 'UPDATE', entity: 'Department', entityId: id, oldValues: { code: d.code, name: d.name }, newValues: { code: data.code || d.code, name: data.name || d.name }, description: `Department ${d.code} updated` });
    return toDTO(await repo.findById(id, tenantId));
  }

  async delete(id, tenantId, userId, token) {
    const d = await repo.findById(id, tenantId); if (!d) throw new NotFoundError('Department not found');
    await repo.delete(id, tenantId);
    await erpIntegration.sendAuditEvent(token, { tenantId, userId, action: 'DELETE', entity: 'Department', entityId: id, oldValues: { code: d.code, name: d.name }, description: `Department ${d.code} deleted` });
    return { success: true };
  }
}

module.exports = new DepartmentService();
