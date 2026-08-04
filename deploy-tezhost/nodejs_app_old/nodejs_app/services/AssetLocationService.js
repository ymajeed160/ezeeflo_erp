const assetLocationRepository = require('../repositories/AssetLocationRepository');
const { ConflictError, NotFoundError } = require('../utils/appError');
const logger = require('../utils/logger');

class AssetLocationService {
  async getLocations(tenantId, query = {}) {
    const { page = 1, limit = 20, isActive, search } = query;
    const filters = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true' || isActive === true;
    return await assetLocationRepository.findAndCountAll(tenantId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      filters,
      search,
      order: [['locationCode', 'ASC']],
    });
  }

  async getLocationById(id, tenantId) {
    const location = await assetLocationRepository.findById(id, tenantId);
    if (!location) throw new NotFoundError('Asset location not found');
    return location;
  }

  async getActiveLocations(tenantId) {
    return await assetLocationRepository.findActive(tenantId);
  }

  async createLocation(data, tenantId, userId) {
    const existing = await assetLocationRepository.findByCode(data.locationCode, tenantId);
    if (existing) {
      throw new ConflictError(`Asset location code "${data.locationCode}" already exists`);
    }

    const location = await assetLocationRepository.create(data, tenantId, userId);
    logger.info(`Asset location created: ${location.locationCode} - ${location.locationName} in tenant ${tenantId}`);
    return await assetLocationRepository.findById(location.id, tenantId);
  }

  async updateLocation(id, data, tenantId, userId) {
    const location = await assetLocationRepository.findById(id, tenantId);
    if (!location) throw new NotFoundError('Asset location not found');

    if (data.locationCode && data.locationCode !== location.locationCode) {
      const existing = await assetLocationRepository.findByCode(data.locationCode, tenantId);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Asset location code "${data.locationCode}" already exists`);
      }
    }

    const updated = await assetLocationRepository.update(id, data, tenantId, userId);
    if (!updated) throw new NotFoundError('Asset location not found after update');
    logger.info(`Asset location updated: ${updated.locationCode} - ${updated.locationName} in tenant ${tenantId}`);
    return await assetLocationRepository.findById(id, tenantId);
  }

  async toggleStatus(id, tenantId, userId) {
    const location = await assetLocationRepository.findById(id, tenantId);
    if (!location) throw new NotFoundError('Asset location not found');
    const updated = await assetLocationRepository.update(id, { isActive: !location.isActive }, tenantId, userId);
    return updated;
  }

  async deleteLocation(id, tenantId) {
    const location = await assetLocationRepository.findById(id, tenantId);
    if (!location) throw new NotFoundError('Asset location not found');
    await assetLocationRepository.delete(id, tenantId);
    logger.info(`Asset location deleted: ${location.locationCode} - ${location.locationName} in tenant ${tenantId}`);
  }
}

module.exports = new AssetLocationService();
