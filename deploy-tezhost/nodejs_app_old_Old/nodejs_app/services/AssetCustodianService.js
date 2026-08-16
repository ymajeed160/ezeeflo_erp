const assetCustodianRepository = require('../repositories/AssetCustodianRepository');
const { ConflictError, NotFoundError } = require('../utils/appError');
const logger = require('../utils/logger');

class AssetCustodianService {
  async getCustodians(tenantId, query = {}) {
    const { page = 1, limit = 20, isActive, search } = query;
    const filters = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true' || isActive === true;
    return await assetCustodianRepository.findAndCountAll(tenantId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      filters,
      search,
      order: [['custodianCode', 'ASC']],
    });
  }

  async getCustodianById(id, tenantId) {
    const custodian = await assetCustodianRepository.findById(id, tenantId);
    if (!custodian) throw new NotFoundError('Asset custodian not found');
    return custodian;
  }

  async getActiveCustodians(tenantId) {
    return await assetCustodianRepository.findActive(tenantId);
  }

  async createCustodian(data, tenantId, userId) {
    const existing = await assetCustodianRepository.findByCode(data.custodianCode, tenantId);
    if (existing) {
      throw new ConflictError(`Asset custodian code "${data.custodianCode}" already exists`);
    }

    const custodian = await assetCustodianRepository.create(data, tenantId, userId);
    logger.info(`Asset custodian created: ${custodian.custodianCode} - ${custodian.custodianName} in tenant ${tenantId}`);
    return await assetCustodianRepository.findById(custodian.id, tenantId);
  }

  async updateCustodian(id, data, tenantId, userId) {
    const custodian = await assetCustodianRepository.findById(id, tenantId);
    if (!custodian) throw new NotFoundError('Asset custodian not found');

    if (data.custodianCode && data.custodianCode !== custodian.custodianCode) {
      const existing = await assetCustodianRepository.findByCode(data.custodianCode, tenantId);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Asset custodian code "${data.custodianCode}" already exists`);
      }
    }

    const updated = await assetCustodianRepository.update(id, data, tenantId, userId);
    if (!updated) throw new NotFoundError('Asset custodian not found after update');
    logger.info(`Asset custodian updated: ${updated.custodianCode} - ${updated.custodianName} in tenant ${tenantId}`);
    return await assetCustodianRepository.findById(id, tenantId);
  }

  async toggleStatus(id, tenantId, userId) {
    const custodian = await assetCustodianRepository.findById(id, tenantId);
    if (!custodian) throw new NotFoundError('Asset custodian not found');
    const updated = await assetCustodianRepository.update(id, { isActive: !custodian.isActive }, tenantId, userId);
    return updated;
  }

  async deleteCustodian(id, tenantId) {
    const custodian = await assetCustodianRepository.findById(id, tenantId);
    if (!custodian) throw new NotFoundError('Asset custodian not found');
    await assetCustodianRepository.delete(id, tenantId);
    logger.info(`Asset custodian deleted: ${custodian.custodianCode} - ${custodian.custodianName} in tenant ${tenantId}`);
  }
}

module.exports = new AssetCustodianService();
