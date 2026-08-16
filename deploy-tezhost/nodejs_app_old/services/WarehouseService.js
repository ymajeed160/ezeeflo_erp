const warehouseRepository = require('../repositories/WarehouseRepository');
const { ConflictError, NotFoundError, BadRequestError } = require('../utils/appError');
const logger = require('../utils/logger');

class WarehouseService {
  async getWarehouses(tenantId, query = {}) {
    const { page = 1, limit = 20, isActive, search } = query;
    const filters = {};

    if (isActive !== undefined) filters.isActive = isActive === 'true' || isActive === true;

    return await warehouseRepository.findAndCountAll(tenantId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      filters,
      search,
      order: [['code', 'ASC']],
    });
  }

  async getWarehouseById(id, tenantId) {
    const warehouse = await warehouseRepository.findById(id, tenantId);
    if (!warehouse) {
      throw new NotFoundError('Warehouse not found');
    }
    return warehouse;
  }

  async getActiveWarehouses(tenantId) {
    return await warehouseRepository.findActive(tenantId);
  }

  async createWarehouse(data, tenantId) {
    // Validate code uniqueness
    const existingByCode = await warehouseRepository.findByCode(data.code, tenantId);
    if (existingByCode) {
      throw new ConflictError(`Warehouse code "${data.code}" already exists in this tenant`);
    }

    // Validate name uniqueness
    const existingByName = await warehouseRepository.findByName(data.name, tenantId);
    if (existingByName) {
      throw new ConflictError(`Warehouse name "${data.name}" already exists in this tenant`);
    }

    const warehouse = await warehouseRepository.create(data, tenantId);
    logger.info(`Warehouse created: ${warehouse.code} (${warehouse.name}) in tenant ${tenantId}`);
    return warehouse;
  }

  async updateWarehouse(id, data, tenantId) {
    const warehouse = await warehouseRepository.findById(id, tenantId);
    if (!warehouse) {
      throw new NotFoundError('Warehouse not found');
    }

    // Validate code uniqueness if changed
    if (data.code && data.code !== warehouse.code) {
      const existingByCode = await warehouseRepository.findByCode(data.code, tenantId);
      if (existingByCode) {
        throw new ConflictError(`Warehouse code "${data.code}" already exists`);
      }
    }

    // Validate name uniqueness if changed
    if (data.name && data.name !== warehouse.name) {
      const existingByName = await warehouseRepository.findByName(data.name, tenantId);
      if (existingByName) {
        throw new ConflictError(`Warehouse name "${data.name}" already exists`);
      }
    }

    const updated = await warehouseRepository.update(id, data, tenantId);
    logger.info(`Warehouse updated: ${id} (${warehouse.code}) in tenant ${tenantId}`);
    return updated;
  }

  async deleteWarehouse(id, tenantId) {
    const warehouse = await warehouseRepository.findById(id, tenantId);
    if (!warehouse) {
      throw new NotFoundError('Warehouse not found');
    }

    await warehouseRepository.delete(id, tenantId, false);
    logger.info(`Warehouse deleted: ${id} (${warehouse.code}) from tenant ${tenantId}`);
    return true;
  }

  async toggleStatus(id, tenantId) {
    const warehouse = await warehouseRepository.findById(id, tenantId);
    if (!warehouse) {
      throw new NotFoundError('Warehouse not found');
    }

    const updated = await warehouseRepository.update(id, { isActive: !warehouse.isActive }, tenantId);
    logger.info(`Warehouse ${warehouse.code} ${updated.isActive ? 'activated' : 'deactivated'} in tenant ${tenantId}`);
    return updated;
  }
}

module.exports = new WarehouseService();