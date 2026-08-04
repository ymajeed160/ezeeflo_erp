const assetRepository = require('../repositories/AssetRepository');
const { AssetCategory, Supplier, PurchaseInvoice } = require('../models');
const { ConflictError, NotFoundError, BadRequestError } = require('../utils/appError');
const logger = require('../utils/logger');

class AssetService {
  async getAssets(tenantId, query = {}) {
    const { page = 1, limit = 20, status, categoryId, search, condition } = query;
    const filters = {};
    if (status) filters.status = status;
    if (categoryId) filters.categoryId = categoryId;
    if (condition) filters.condition = condition;
    return await assetRepository.findAndCountAll(tenantId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      filters,
      search,
      order: [['createdAt', 'DESC']],
    });
  }

  async getAssetById(id, tenantId) {
    const asset = await assetRepository.findById(id, tenantId);
    if (!asset) throw new NotFoundError('Asset not found');
    return asset;
  }

  async getActiveAssets(tenantId) {
    return await assetRepository.findActive(tenantId);
  }

  async getNextAssetCode(tenantId) {
    return await assetRepository.getNextAssetCode(tenantId);
  }

  async createAsset(data, tenantId, userId) {
    // Generate asset code if not provided
    if (!data.assetCode) {
      data.assetCode = await assetRepository.getNextAssetCode(tenantId);
    } else {
      const existingByCode = await assetRepository.findByCode(data.assetCode, tenantId);
      if (existingByCode) {
        throw new ConflictError(`Asset code "${data.assetCode}" already exists`);
      }
    }

    // Validate category
    const category = await AssetCategory.findOne({
      where: { id: data.categoryId, tenantId, isActive: true },
    });
    if (!category) {
      throw new BadRequestError('Asset category not found or is inactive');
    }

    // Validate supplier if provided
    if (data.supplierId) {
      const supplier = await Supplier.findOne({
        where: { id: data.supplierId, tenantId },
      });
      if (!supplier) {
        throw new BadRequestError('Supplier not found');
      }
    }

    // Validate purchase invoice if provided
    if (data.purchaseInvoiceId) {
      const invoice = await PurchaseInvoice.findOne({
        where: { id: data.purchaseInvoiceId, tenantId },
      });
      if (!invoice) {
        throw new BadRequestError('Purchase invoice not found');
      }
    }

    // Set defaults from category if not provided
    if (!data.depreciationMethod) data.depreciationMethod = category.depreciationMethod || 'straight_line';
    if (!data.usefulLife) data.usefulLife = category.usefulLifeYears || 5;
    if (!data.residualValue && data.purchaseCost) {
      data.residualValue = (parseFloat(data.purchaseCost) * parseFloat(category.residualValuePercentage || 0)) / 100;
    }

    // Calculate initial book value
    const purchaseCost = parseFloat(data.purchaseCost || 0);
    data.currentBookValue = purchaseCost;

    // Set default status
    if (!data.status) data.status = 'draft';

    const asset = await assetRepository.create(data, tenantId, userId);
    logger.info(`Asset created: ${asset.assetCode} - ${asset.assetName} in tenant ${tenantId}`);
    return await assetRepository.findById(asset.id, tenantId);
  }

  async updateAsset(id, data, tenantId, userId) {
    const asset = await assetRepository.findById(id, tenantId);
    if (!asset) throw new NotFoundError('Asset not found');

    // Check unique code if changing
    if (data.assetCode && data.assetCode !== asset.assetCode) {
      const existingByCode = await assetRepository.findByCode(data.assetCode, tenantId);
      if (existingByCode && existingByCode.id !== id) {
        throw new ConflictError(`Asset code "${data.assetCode}" already exists`);
      }
    }

    // Validate category if changing
    if (data.categoryId && data.categoryId !== asset.categoryId) {
      const category = await AssetCategory.findOne({
        where: { id: data.categoryId, tenantId, isActive: true },
      });
      if (!category) {
        throw new BadRequestError('Asset category not found or is inactive');
      }
    }

    // Validate supplier if provided
    if (data.supplierId) {
      const supplier = await Supplier.findOne({
        where: { id: data.supplierId, tenantId },
      });
      if (!supplier) {
        throw new BadRequestError('Supplier not found');
      }
    }

    // Prevent changing cost after depreciation started
    if (data.purchaseCost && parseFloat(data.purchaseCost) !== parseFloat(asset.purchaseCost)) {
      if (parseFloat(asset.accumulatedDepreciation) > 0) {
        throw new BadRequestError('Cannot change purchase cost after depreciation has been posted');
      }
    }

    // Recalculate book value if cost changed
    if (data.purchaseCost) {
      data.currentBookValue = parseFloat(data.purchaseCost) - parseFloat(asset.accumulatedDepreciation || 0);
    }

    const updated = await assetRepository.update(id, data, tenantId, userId);
    if (!updated) throw new NotFoundError('Asset not found after update');
    logger.info(`Asset updated: ${updated.assetCode} - ${updated.assetName} in tenant ${tenantId}`);
    return await assetRepository.findById(id, tenantId);
  }

  async updateStatus(id, status, tenantId, userId) {
    const asset = await assetRepository.findById(id, tenantId);
    if (!asset) throw new NotFoundError('Asset not found');

    const validTransitions = {
      draft: ['active'],
      active: ['disposed', 'sold', 'transferred', 'under_maintenance', 'retired', 'lost'],
      under_maintenance: ['active', 'disposed', 'retired'],
      transferred: ['active'],
      disposed: [],
      sold: [],
      retired: [],
      lost: [],
    };

    const allowed = validTransitions[asset.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestError(`Cannot transition asset from "${asset.status}" to "${status}". Allowed transitions: ${allowed.join(', ') || 'none'}`);
    }

    await assetRepository.update(id, { status }, tenantId, userId);
    logger.info(`Asset ${asset.assetCode} status changed from ${asset.status} to ${status}`);
    return await assetRepository.findById(id, tenantId);
  }

  async deleteAsset(id, tenantId) {
    const asset = await assetRepository.findById(id, tenantId);
    if (!asset) throw new NotFoundError('Asset not found');

    if (asset.status !== 'draft') {
      throw new BadRequestError('Only draft assets can be deleted. Active assets must be disposed or retired.');
    }

    await assetRepository.delete(id, tenantId);
    logger.info(`Asset deleted: ${asset.assetCode} - ${asset.assetName} in tenant ${tenantId}`);
  }
}

module.exports = new AssetService();
