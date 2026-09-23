const sellingResourceRepository = require('../repositories/SellingResourceRepository');
const sellingResourceTypeRepository = require('../repositories/SellingResourceTypeRepository');
const { ConflictError } = require('../utils/appError');
const SellingResourceDTO = require('../dto/SellingResourceDTO');
const { AuditLog } = require('../models');
const logger = require('../utils/logger');

class SellingResourceService {
  // ============================================================
  // Selling Resources
  // ============================================================

  async getAll(tenantId, query) {
    const result = await sellingResourceRepository.findAll({ tenantId, query });
    result.data = SellingResourceDTO.toListResponse(result.data);
    return result;
  }

  async getById(id, tenantId) {
    const resource = await sellingResourceRepository.findById(id, tenantId);
    return SellingResourceDTO.toResponse(resource);
  }

  async getForSelect(tenantId, search = '') {
    const resources = await sellingResourceRepository.findActiveForSelect(tenantId, search);
    return SellingResourceDTO.toCompactListResponse(resources);
  }

  async create(data, tenantId, userId) {
    // Auto-generate resource code if not provided
    if (!data.resourceCode) {
      data.resourceCode = await sellingResourceRepository.getNextResourceCode(tenantId);
    }

    const existing = await sellingResourceRepository.findByCode(data.resourceCode, tenantId);
    if (existing) {
      throw new ConflictError(`Selling Resource with code '${data.resourceCode}' already exists`);
    }

    // Validate resource type belongs to tenant (if provided)
    if (data.resourceTypeId) {
      await sellingResourceTypeRepository.findById(data.resourceTypeId, tenantId);
    }

    const createData = { ...data, tenantId, createdBy: userId, updatedBy: userId };
    const resource = await sellingResourceRepository.create(createData);

    await AuditLog.create({
      tenantId,
      userId,
      action: 'CREATE',
      entity: 'SellingResource',
      entityId: resource.id,
      newValues: { resourceCode: resource.resourceCode, resourceName: resource.resourceName },
      description: `Selling Resource ${resource.resourceCode} - ${resource.resourceName} created`,
    });
    logger.info(`Selling Resource created: ${resource.resourceCode} by user ${userId} in tenant ${tenantId}`);
    return SellingResourceDTO.toResponse(await sellingResourceRepository.findById(resource.id, tenantId));
  }

  async update(id, data, tenantId, userId) {
    if (data.resourceCode) {
      const existing = await sellingResourceRepository.findByCode(data.resourceCode, tenantId, id);
      if (existing) {
        throw new ConflictError(`Selling Resource with code '${data.resourceCode}' already exists`);
      }
    }
    if (data.resourceTypeId) {
      await sellingResourceTypeRepository.findById(data.resourceTypeId, tenantId);
    }

    const oldResource = await sellingResourceRepository.findById(id, tenantId);
    const updated = await sellingResourceRepository.update(id, { ...data, updatedBy: userId }, tenantId);

    await AuditLog.create({
      tenantId,
      userId,
      action: 'UPDATE',
      entity: 'SellingResource',
      entityId: id,
      oldValues: { resourceCode: oldResource.resourceCode, resourceName: oldResource.resourceName },
      newValues: { resourceCode: updated.resourceCode, resourceName: updated.resourceName },
      description: `Selling Resource ${updated.resourceCode} updated`,
    });
    return SellingResourceDTO.toResponse(updated);
  }

  async delete(id, tenantId, userId) {
    const resource = await sellingResourceRepository.findById(id, tenantId);
    await sellingResourceRepository.delete(id, tenantId);
    await AuditLog.create({
      tenantId,
      userId,
      action: 'DELETE',
      entity: 'SellingResource',
      entityId: id,
      oldValues: { resourceCode: resource.resourceCode, resourceName: resource.resourceName },
      description: `Selling Resource ${resource.resourceCode} - ${resource.resourceName} deleted`,
    });
    return { id, deleted: true };
  }

  async toggleStatus(id, tenantId, userId) {
    const resource = await sellingResourceRepository.toggleStatus(id, tenantId, userId);
    await AuditLog.create({
      tenantId,
      userId,
      action: 'UPDATE',
      entity: 'SellingResource',
      entityId: id,
      description: `Selling Resource ${resource.resourceCode} status toggled to ${resource.isActive ? 'Active' : 'Inactive'}`,
    });
    return SellingResourceDTO.toResponse(resource);
  }

  // ============================================================
  // Resource Types
  // ============================================================

  async getAllTypes(tenantId, query) {
    return sellingResourceTypeRepository.findAll({ tenantId, query });
  }

  async getTypeById(id, tenantId) {
    const type = await sellingResourceTypeRepository.findById(id, tenantId);
    return SellingResourceDTO.toTypeResponse(type);
  }

  async createType(data, tenantId, userId) {
    // Auto-generate type code if not provided
    if (!data.typeCode) {
      data.typeCode = await sellingResourceTypeRepository.getNextTypeCode(tenantId);
    }
    const existing = await sellingResourceTypeRepository.findByCode(data.typeCode, tenantId);
    if (existing) {
      throw new ConflictError(`Resource Type with code '${data.typeCode}' already exists`);
    }
    const type = await sellingResourceTypeRepository.create({
      ...data,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });
    await AuditLog.create({
      tenantId,
      userId,
      action: 'CREATE',
      entity: 'SellingResourceType',
      entityId: type.id,
      newValues: { typeCode: type.typeCode, typeName: type.typeName },
      description: `Resource Type ${type.typeCode} - ${type.typeName} created`,
    });
    return SellingResourceDTO.toTypeResponse(type);
  }

  async updateType(id, data, tenantId, userId) {
    if (data.typeCode) {
      const existing = await sellingResourceTypeRepository.findByCode(data.typeCode, tenantId, id);
      if (existing) {
        throw new ConflictError(`Resource Type with code '${data.typeCode}' already exists`);
      }
    }
    const updated = await sellingResourceTypeRepository.update(id, { ...data, updatedBy: userId }, tenantId);
    await AuditLog.create({
      tenantId,
      userId,
      action: 'UPDATE',
      entity: 'SellingResourceType',
      entityId: id,
      description: `Resource Type ${updated.typeCode} updated`,
    });
    return SellingResourceDTO.toTypeResponse(updated);
  }

  async deleteType(id, tenantId, userId) {
    const type = await sellingResourceTypeRepository.findById(id, tenantId);
    await sellingResourceTypeRepository.delete(id, tenantId);
    await AuditLog.create({
      tenantId,
      userId,
      action: 'DELETE',
      entity: 'SellingResourceType',
      entityId: id,
      oldValues: { typeCode: type.typeCode, typeName: type.typeName },
      description: `Resource Type ${type.typeCode} deleted`,
    });
    return { id, deleted: true };
  }
}

module.exports = new SellingResourceService();
