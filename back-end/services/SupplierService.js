const supplierRepository = require('../repositories/SupplierRepository');
const { ConflictError } = require('../utils/appError');
const SupplierDTO = require('../dto/SupplierDTO');
const { AuditLog } = require('../models');
const logger = require('../utils/logger');

class SupplierService {
  async getAll(tenantId, query) {
    const result = await supplierRepository.findAll({ tenantId, query });
    result.data = SupplierDTO.toListResponse(result.data);
    return result;
  }

  async getById(id, tenantId) {
    const supplier = await supplierRepository.findById(id, tenantId);
    return SupplierDTO.toResponse(supplier);
  }

  async getForSelect(tenantId, search = '') {
    const suppliers = await supplierRepository.findPaginatedForSelect(tenantId, search);
    return SupplierDTO.toCompactListResponse(suppliers);
  }

  async create(data, tenantId, userId) {
    const existing = await supplierRepository.findByCode(data.code, tenantId);
    if (existing) {
      throw new ConflictError(`Supplier with code '${data.code}' already exists`);
    }
    const createData = {
      ...data,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    };
    const supplier = await supplierRepository.create(createData);
    await AuditLog.create({
      tenantId,
      userId,
      action: 'CREATE',
      entity: 'Supplier',
      entityId: supplier.id,
      newValues: { code: supplier.code, name: supplier.name },
      description: `Supplier ${supplier.code} - ${supplier.name} created`,
    });
    logger.info(`Supplier created: ${supplier.code} by user ${userId} in tenant ${tenantId}`);
    return SupplierDTO.toResponse(await supplierRepository.findById(supplier.id, tenantId));
  }

  async update(id, data, tenantId, userId) {
    if (data.code) {
      const existing = await supplierRepository.findByCode(data.code, tenantId, id);
      if (existing) {
        throw new ConflictError(`Supplier with code '${data.code}' already exists`);
      }
    }
    const oldSupplier = await supplierRepository.findById(id, tenantId);
    const updatedData = { ...data, updatedBy: userId };
    const supplier = await supplierRepository.update(id, updatedData, tenantId);

    const changes = {};
    if (data.name && data.name !== oldSupplier.name) changes.name = { from: oldSupplier.name, to: data.name };
    if (data.status && data.status !== oldSupplier.status) changes.status = { from: oldSupplier.status, to: data.status };
    if (data.creditLimit !== undefined && Number(data.creditLimit) !== Number(oldSupplier.creditLimit)) {
      changes.creditLimit = { from: oldSupplier.creditLimit, to: data.creditLimit };
    }
    if (Object.keys(changes).length > 0) {
      await AuditLog.create({
        tenantId,
        userId,
        action: 'UPDATE',
        entity: 'Supplier',
        entityId: id,
        oldValues: { code: oldSupplier.code, name: oldSupplier.name },
        newValues: changes,
        description: `Supplier ${oldSupplier.code} updated`,
      });
    }
    logger.info(`Supplier updated: ${supplier.code} by user ${userId} in tenant ${tenantId}`);
    return SupplierDTO.toResponse(supplier);
  }

  async delete(id, tenantId, userId) {
    const supplier = await supplierRepository.findById(id, tenantId);
    await supplierRepository.delete(id, tenantId);
    await AuditLog.create({
      tenantId,
      userId,
      action: 'DELETE',
      entity: 'Supplier',
      entityId: id,
      oldValues: { code: supplier.code, name: supplier.name },
      description: `Supplier ${supplier.code} - ${supplier.name} deleted`,
    });
    logger.info(`Supplier deleted: ${supplier.code} by user ${userId} in tenant ${tenantId}`);
    return { id, deleted: true };
  }

  async toggleStatus(id, tenantId, userId) {
    const supplier = await supplierRepository.toggleStatus(id, tenantId, userId);
    await AuditLog.create({
      tenantId,
      userId,
      action: 'UPDATE',
      entity: 'Supplier',
      entityId: id,
      description: `Supplier ${supplier.code} status toggled to ${supplier.isActive ? 'Active' : 'Inactive'}`,
    });
    return SupplierDTO.toResponse(await supplierRepository.findById(id, tenantId));
  }
}

module.exports = new SupplierService();