const { Op } = require('sequelize');
const repo = require('../repositories/BranchRepository');
const { Branch } = require('../models');
const { ConflictError, NotFoundError } = require('../utils/appError');
const erpIntegration = require('../../shared/services/erpIntegration');

const toDTO = (b) => b ? {
  id: b.id, tenantId: b.tenantId, code: b.code, name: b.name, nameAr: b.nameAr,
  address: b.address, city: b.city, state: b.state, country: b.country,
  phone: b.phone, email: b.email, isHeadOffice: b.isHeadOffice, isActive: b.isActive,
  createdAt: b.createdAt, updatedAt: b.updatedAt,
} : null;

class BranchService {
  async getAll(tenantId, query) { const r = await repo.findAll({ tenantId, query }); r.data = r.data.map(toDTO); return r; }
  async getById(id, tenantId) { const b = await repo.findById(id, tenantId); if (!b) throw new NotFoundError('Branch not found'); return toDTO(b); }

  async create(data, tenantId, userId, token) {
    const ex = await repo.findByCode(data.code, tenantId); if (ex) throw new ConflictError(`Branch code '${data.code}' already exists`);
    // Ensure only one head office
    if (data.isHeadOffice) await Branch.update({ isHeadOffice: false }, { where: { tenantId } });
    const b = await repo.create({ ...data, tenantId, createdBy: userId, updatedBy: userId });
    await erpIntegration.sendAuditEvent(token, { tenantId, userId, action: 'CREATE', entity: 'Branch', entityId: b.id, newValues: { code: b.code, name: b.name }, description: `Branch ${b.code} - ${b.name} created` });
    return toDTO(b);
  }

  async update(id, data, tenantId, userId, token) {
    const b = await repo.findById(id, tenantId); if (!b) throw new NotFoundError('Branch not found');
    if (data.code && data.code !== b.code) { const ex = await repo.findByCode(data.code, tenantId, id); if (ex) throw new ConflictError(`Branch code '${data.code}' already exists`); }
    if (data.isHeadOffice) {
      await Branch.update({ isHeadOffice: false }, { where: { tenantId, id: { [Op.ne]: id } } });
    }
    await repo.update(id, tenantId, { ...data, updatedBy: userId });
    await erpIntegration.sendAuditEvent(token, { tenantId, userId, action: 'UPDATE', entity: 'Branch', entityId: id, oldValues: { code: b.code, name: b.name }, newValues: { code: data.code || b.code, name: data.name || b.name }, description: `Branch ${b.code} updated` });
    return toDTO(await repo.findById(id, tenantId));
  }

  async delete(id, tenantId, userId, token) {
    const b = await repo.findById(id, tenantId); if (!b) throw new NotFoundError('Branch not found');
    await repo.delete(id, tenantId);
    await erpIntegration.sendAuditEvent(token, { tenantId, userId, action: 'DELETE', entity: 'Branch', entityId: id, oldValues: { code: b.code, name: b.name }, description: `Branch ${b.code} deleted` });
    return { success: true };
  }
}

module.exports = new BranchService();
