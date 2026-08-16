const assetCategoryRepository = require('../repositories/AssetCategoryRepository');
const { Account } = require('../models');
const { ConflictError, NotFoundError, BadRequestError } = require('../utils/appError');
const logger = require('../utils/logger');

class AssetCategoryService {
  async getAssetCategories(tenantId, query = {}) {
    const { page = 1, limit = 20, isActive, search } = query;
    const filters = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true' || isActive === true;
    return await assetCategoryRepository.findAndCountAll(tenantId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      filters,
      search,
      order: [['categoryCode', 'ASC']],
    });
  }

  async getAssetCategoryById(id, tenantId) {
    const category = await assetCategoryRepository.findById(id, tenantId);
    if (!category) throw new NotFoundError('Asset category not found');
    return category;
  }

  async getActiveAssetCategories(tenantId) {
    return await assetCategoryRepository.findActive(tenantId);
  }

  async createAssetCategory(data, tenantId, userId) {
    // Check unique category code
    const existingByCode = await assetCategoryRepository.findByCode(data.categoryCode, tenantId);
    if (existingByCode) {
      throw new ConflictError(`Asset category code "${data.categoryCode}" already exists`);
    }

    // Validate default asset account if provided
    if (data.defaultAssetAccountId) {
      await this._validateAccount(data.defaultAssetAccountId, tenantId, 'asset', 'Default Asset Account');
    }

    // Validate accumulated depreciation account if provided
    if (data.accumulatedDepreciationAccountId) {
      await this._validateAccount(data.accumulatedDepreciationAccountId, tenantId, 'asset', 'Accumulated Depreciation Account');
    }

    // Validate depreciation expense account if provided
    if (data.depreciationExpenseAccountId) {
      await this._validateAccount(data.depreciationExpenseAccountId, tenantId, 'expense', 'Depreciation Expense Account');
    }

    // Validate gain on disposal account if provided
    if (data.gainOnDisposalAccountId) {
      await this._validateAccount(data.gainOnDisposalAccountId, tenantId, 'income', 'Gain on Disposal Account');
    }

    // Validate loss on disposal account if provided
    if (data.lossOnDisposalAccountId) {
      await this._validateAccount(data.lossOnDisposalAccountId, tenantId, 'expense', 'Loss on Disposal Account');
    }

    // Validate default tax account if provided
    if (data.defaultTaxAccountId) {
      await this._validateAccount(data.defaultTaxAccountId, tenantId, null, 'Default Tax Account');
    }

    const category = await assetCategoryRepository.create(data, tenantId, userId);
    logger.info(`Asset category created: ${category.categoryCode} - ${category.categoryName} in tenant ${tenantId}`);
    return await assetCategoryRepository.findById(category.id, tenantId);
  }

  async updateAssetCategory(id, data, tenantId, userId) {
    const category = await assetCategoryRepository.findById(id, tenantId);
    if (!category) throw new NotFoundError('Asset category not found');

    // Check unique category code if changing
    if (data.categoryCode && data.categoryCode !== category.categoryCode) {
      const existingByCode = await assetCategoryRepository.findByCode(data.categoryCode, tenantId);
      if (existingByCode && existingByCode.id !== id) {
        throw new ConflictError(`Asset category code "${data.categoryCode}" already exists`);
      }
    }

    // Validate accounts if changing
    if (data.defaultAssetAccountId && data.defaultAssetAccountId !== category.defaultAssetAccountId) {
      await this._validateAccount(data.defaultAssetAccountId, tenantId, 'asset', 'Default Asset Account');
    }
    if (data.accumulatedDepreciationAccountId && data.accumulatedDepreciationAccountId !== category.accumulatedDepreciationAccountId) {
      await this._validateAccount(data.accumulatedDepreciationAccountId, tenantId, 'asset', 'Accumulated Depreciation Account');
    }
    if (data.depreciationExpenseAccountId && data.depreciationExpenseAccountId !== category.depreciationExpenseAccountId) {
      await this._validateAccount(data.depreciationExpenseAccountId, tenantId, 'expense', 'Depreciation Expense Account');
    }
    if (data.gainOnDisposalAccountId && data.gainOnDisposalAccountId !== category.gainOnDisposalAccountId) {
      await this._validateAccount(data.gainOnDisposalAccountId, tenantId, 'income', 'Gain on Disposal Account');
    }
    if (data.lossOnDisposalAccountId && data.lossOnDisposalAccountId !== category.lossOnDisposalAccountId) {
      await this._validateAccount(data.lossOnDisposalAccountId, tenantId, 'expense', 'Loss on Disposal Account');
    }
    if (data.defaultTaxAccountId && data.defaultTaxAccountId !== category.defaultTaxAccountId) {
      await this._validateAccount(data.defaultTaxAccountId, tenantId, null, 'Default Tax Account');
    }

    const updated = await assetCategoryRepository.update(id, data, tenantId, userId);
    if (!updated) throw new NotFoundError('Asset category not found after update');
    logger.info(`Asset category updated: ${updated.categoryCode} - ${updated.categoryName} in tenant ${tenantId}`);
    return await assetCategoryRepository.findById(id, tenantId);
  }

  async toggleStatus(id, tenantId, userId) {
    const category = await assetCategoryRepository.findById(id, tenantId);
    if (!category) throw new NotFoundError('Asset category not found');
    const updated = await assetCategoryRepository.update(id, { isActive: !category.isActive }, tenantId, userId);
    return updated;
  }

  async deleteAssetCategory(id, tenantId) {
    const category = await assetCategoryRepository.findById(id, tenantId);
    if (!category) throw new NotFoundError('Asset category not found');
    await assetCategoryRepository.delete(id, tenantId);
    logger.info(`Asset category deleted: ${category.categoryCode} - ${category.categoryName} in tenant ${tenantId}`);
  }

  async _validateAccount(accountId, tenantId, expectedType, fieldName) {
    const account = await Account.findOne({
      where: { id: accountId, tenantId, isActive: true },
    });
    if (!account) {
      throw new BadRequestError(`${fieldName} not found or is inactive for this tenant`);
    }
    if (expectedType && account.type !== expectedType) {
      throw new BadRequestError(
        `${fieldName} type must be "${expectedType}". Selected account type is "${account.type}".`
      );
    }
  }
}

module.exports = new AssetCategoryService();
