const transferRepo = require('../repositories/AssetTransferRepository');
const assetRepo = require('../repositories/AssetRepository');
const { Asset } = require('../models');
const { ConflictError, NotFoundError, BadRequestError } = require('../utils/appError');
const logger = require('../utils/logger');

class AssetTransferService {
  async getTransfers(tenantId, query = {}) {
    const { page = 1, limit = 20, assetId, search } = query;
    const filters = {};
    if (assetId) filters.assetId = assetId;
    return await transferRepo.findAndCountAll(tenantId, {
      page: parseInt(page, 10), limit: parseInt(limit, 10), filters, search,
    });
  }

  async getTransferById(id, tenantId) {
    const t = await transferRepo.findById(id, tenantId);
    if (!t) throw new NotFoundError('Transfer not found');
    return t;
  }

  async getNextTransferNumber(tenantId) {
    return await transferRepo.getNextTransferNumber(tenantId);
  }

  async getTransferHistory(assetId, tenantId) {
    const asset = await Asset.findOne({ where: { id: assetId, tenantId } });
    if (!asset) throw new NotFoundError('Asset not found');
    return await transferRepo.findByAsset(assetId, tenantId);
  }

  async createTransfer(data, tenantId, userId) {
    if (!data.transferNumber) {
      data.transferNumber = await transferRepo.getNextTransferNumber(tenantId);
    } else {
      const existing = await transferRepo.findByNumber(data.transferNumber, tenantId);
      if (existing) throw new ConflictError(`Transfer number "${data.transferNumber}" already exists`);
    }

    const asset = await Asset.findOne({ where: { id: data.assetId, tenantId } });
    if (!asset) throw new NotFoundError('Asset not found');
    if (asset.status !== 'active') throw new BadRequestError('Asset must be in "Active" status to transfer');

    if (!data.toLocation && !data.toDepartment && !data.toCustodian && !data.toWarehouse && !data.toBranch) {
      throw new BadRequestError('At least one destination field (location, department, custodian, warehouse, branch) is required');
    }

    // Capture current values as "from" if not explicitly provided
    if (!data.fromLocation) data.fromLocation = asset.location;
    if (!data.fromDepartment) data.fromDepartment = asset.department;
    if (!data.fromCustodian) data.fromCustodian = asset.custodian;

    data.transferDate = data.transferDate || new Date().toISOString().split('T')[0];

    const transfer = await transferRepo.create(data, tenantId, userId);

    // Update the asset with new location/department/custodian
    const updateData = {};
    if (data.toLocation) updateData.location = data.toLocation;
    if (data.toDepartment) updateData.department = data.toDepartment;
    if (data.toCustodian) updateData.custodian = data.toCustodian;

    if (Object.keys(updateData).length > 0) {
      await assetRepo.update(asset.id, updateData, tenantId, userId);
    }

    logger.info(`Asset transfer ${transfer.transferNumber}: ${asset.assetCode} transferred in tenant ${tenantId}`);
    return await transferRepo.findById(transfer.id, tenantId);
  }

  async deleteTransfer(id, tenantId) {
    const transfer = await transferRepo.findById(id, tenantId);
    if (!transfer) throw new NotFoundError('Transfer not found');
    await transferRepo.delete(id, tenantId);
    logger.info(`Asset transfer ${transfer.transferNumber} deleted from tenant ${tenantId}`);
  }
}

module.exports = new AssetTransferService();
