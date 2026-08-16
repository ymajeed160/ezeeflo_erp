const maintRepo = require('../repositories/AssetMaintenanceRepository');
const assetRepo = require('../repositories/AssetRepository');
const { Asset } = require('../models');
const { ConflictError, NotFoundError, BadRequestError } = require('../utils/appError');
const logger = require('../utils/logger');

class AssetMaintenanceService {
  async getMaintenances(tenantId, query = {}) {
    const { page = 1, limit = 20, assetId, status, maintenanceType, search } = query;
    const filters = {};
    if (assetId) filters.assetId = assetId;
    if (status) filters.status = status;
    if (maintenanceType) filters.maintenanceType = maintenanceType;
    return await maintRepo.findAndCountAll(tenantId, { page: parseInt(page, 10), limit: parseInt(limit, 10), filters, search });
  }

  async getMaintenanceById(id, tenantId) {
    const m = await maintRepo.findById(id, tenantId);
    if (!m) throw new NotFoundError('Maintenance record not found');
    return m;
  }

  async getNextMaintenanceNumber(tenantId) {
    return await maintRepo.getNextMaintenanceNumber(tenantId);
  }

  async getDueReminders(tenantId, days = 30) {
    return await maintRepo.findDueReminders(tenantId, days);
  }

  async createMaintenance(data, tenantId, userId) {
    const { assetId, maintenanceType, title } = data;

    if (!data.maintenanceNumber) {
      data.maintenanceNumber = await maintRepo.getNextMaintenanceNumber(tenantId);
    } else {
      const existing = await maintRepo.findByNumber(data.maintenanceNumber, tenantId);
      if (existing) throw new ConflictError(`Maintenance number "${data.maintenanceNumber}" already exists`);
    }

    const asset = await Asset.findOne({ where: { id: assetId, tenantId } });
    if (!asset) throw new NotFoundError('Asset not found');

    if (asset.status === 'under_maintenance' && maintenanceType === 'corrective') {
      // already under maintenance, that's fine
    }

    const record = await maintRepo.create({
      maintenanceNumber: data.maintenanceNumber,
      assetId,
      maintenanceType: maintenanceType || 'preventive',
      title,
      description: data.description || null,
      serviceProvider: data.serviceProvider || null,
      maintenanceDate: data.maintenanceDate || null,
      nextDueDate: data.nextDueDate || null,
      cost: parseFloat(data.cost || 0),
      status: data.status || 'scheduled',
      notes: data.notes || null,
    }, tenantId, userId);

    // If corrective maintenance, set asset to under_maintenance
    if (maintenanceType === 'corrective') {
      await assetRepo.update(asset.id, { status: 'under_maintenance' }, tenantId, userId);
    }

    logger.info(`Maintenance ${record.maintenanceNumber}: ${title} for asset ${asset.assetCode}`);
    return await maintRepo.findById(record.id, tenantId);
  }

  async updateMaintenance(id, data, tenantId, userId) {
    const maint = await maintRepo.findById(id, tenantId);
    if (!maint) throw new NotFoundError('Maintenance record not found');

    const updated = await maintRepo.update(id, data, tenantId, userId);

    // If completed, restore asset to active
    if (data.status === 'completed' && maint.maintenanceType === 'corrective') {
      await assetRepo.update(maint.assetId, { status: 'active' }, tenantId, userId);
    }

    logger.info(`Maintenance ${maint.maintenanceNumber} updated to ${data.status || 'no status change'}`);
    return await maintRepo.findById(id, tenantId);
  }

  async deleteMaintenance(id, tenantId) {
    const m = await maintRepo.findById(id, tenantId);
    if (!m) throw new NotFoundError('Maintenance record not found');
    await maintRepo.delete(id, tenantId);
  }
}

module.exports = new AssetMaintenanceService();
