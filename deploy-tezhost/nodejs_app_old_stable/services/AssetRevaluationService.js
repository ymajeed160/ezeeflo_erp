const revalRepo = require('../repositories/AssetRevaluationRepository');
const assetRepo = require('../repositories/AssetRepository');
const { Asset, AssetCategory, sequelize } = require('../models');
const JournalEntryService = require('./JournalEntryService');
const { ConflictError, NotFoundError, BadRequestError } = require('../utils/appError');
const logger = require('../utils/logger');

class AssetRevaluationService {
  async getRevaluations(tenantId, query = {}) {
    const { page = 1, limit = 20, assetId, revaluationType, search } = query;
    const filters = {};
    if (assetId) filters.assetId = assetId;
    if (revaluationType) filters.revaluationType = revaluationType;
    return await revalRepo.findAndCountAll(tenantId, { page: parseInt(page, 10), limit: parseInt(limit, 10), filters, search });
  }

  async getRevaluationById(id, tenantId) {
    const r = await revalRepo.findById(id, tenantId);
    if (!r) throw new NotFoundError('Revaluation not found');
    return r;
  }

  async getNextRevaluationNumber(tenantId) {
    return await revalRepo.getNextRevaluationNumber(tenantId);
  }

  async createRevaluation(data, tenantId, userId) {
    const { assetId, revaluationDate, revaluationType, revaluationAmount, reason } = data;

    const asset = await Asset.findOne({ where: { id: assetId, tenantId } });
    if (!asset) throw new NotFoundError('Asset not found');
    if (asset.status !== 'active') throw new BadRequestError('Asset must be active for revaluation');

    if (!data.revaluationNumber) {
      data.revaluationNumber = await revalRepo.getNextRevaluationNumber(tenantId);
    } else {
      const existing = await revalRepo.findByNumber(data.revaluationNumber, tenantId);
      if (existing) throw new ConflictError(`Revaluation number "${data.revaluationNumber}" already exists`);
    }

    const amount = parseFloat(revaluationAmount || 0);
    if (amount <= 0) throw new BadRequestError('Revaluation amount must be greater than zero');

    const currentBV = parseFloat(asset.currentBookValue || 0);
    const previousValue = currentBV;
    let newValue;

    if (revaluationType === 'increase') {
      newValue = currentBV + amount;
    } else {
      if (amount > currentBV) throw new BadRequestError('Decrease amount cannot exceed current book value');
      newValue = currentBV - amount;
    }

    const record = await revalRepo.create({
      revaluationNumber: data.revaluationNumber,
      assetId,
      revaluationDate: revaluationDate || new Date().toISOString().split('T')[0],
      revaluationType,
      previousValue,
      revaluationAmount: amount,
      newValue,
      reason: reason || null,
    }, tenantId, userId);

    // Update asset book value and revaluation amount
    const currentRevalAmount = parseFloat(asset.revaluationAmount || 0);
    const newRevalAmount = revaluationType === 'increase'
      ? currentRevalAmount + amount
      : currentRevalAmount - amount;

    await assetRepo.update(asset.id, {
      currentBookValue: newValue,
      revaluationAmount: newRevalAmount,
    }, tenantId, userId);

    logger.info(`Revaluation ${record.revaluationNumber}: ${asset.assetCode} ${revaluationType} by ${amount}`);
    return await revalRepo.findById(record.id, tenantId);
  }

  async postRevaluation(id, tenantId, userId) {
    const reval = await revalRepo.findById(id, tenantId);
    if (!reval) throw new NotFoundError('Revaluation not found');
    if (reval.isPosted) throw new BadRequestError('Revaluation already posted');

    const asset = await Asset.findOne({ where: { id: reval.assetId, tenantId } });
    if (!asset) throw new NotFoundError('Asset not found');

    const category = await AssetCategory.findOne({
      where: { id: asset.categoryId, tenantId },
    });
    if (!category || !category.defaultAssetAccountId) {
      throw new BadRequestError('Asset category must have a Default Asset Account configured');
    }

    const result = await sequelize.transaction(async (transaction) => {
      const journalLines = [];
      const amount = parseFloat(reval.revaluationAmount);

      if (reval.revaluationType === 'increase') {
        // Asset DR / Revaluation Reserve CR
        journalLines.push({
          accountId: category.defaultAssetAccountId,
          debit: amount,
          credit: 0,
          description: `Revaluation increase: ${asset.assetCode}`,
        });
        // Use gain on disposal as revaluation reserve proxy
        if (category.gainOnDisposalAccountId) {
          journalLines.push({
            accountId: category.gainOnDisposalAccountId,
            debit: 0,
            credit: amount,
            description: `Revaluation reserve: ${asset.assetCode}`,
          });
        } else {
          journalLines.push({
            accountId: category.defaultAssetAccountId,
            debit: 0,
            credit: amount,
            description: `Revaluation reserve (contra): ${asset.assetCode}`,
          });
        }
      } else {
        // Revaluation Reserve DR / Asset CR
        if (category.lossOnDisposalAccountId) {
          journalLines.push({
            accountId: category.lossOnDisposalAccountId,
            debit: amount,
            credit: 0,
            description: `Revaluation decrease: ${asset.assetCode}`,
          });
        } else {
          journalLines.push({
            accountId: category.defaultAssetAccountId,
            debit: amount,
            credit: 0,
            description: `Revaluation decrease: ${asset.assetCode}`,
          });
        }
        journalLines.push({
          accountId: category.defaultAssetAccountId,
          debit: 0,
          credit: amount,
          description: `Asset decrease: ${asset.assetCode}`,
        });
      }

      const entryData = {
        lines: journalLines,
        entryDate: reval.revaluationDate,
        reference: reval.revaluationNumber,
        description: `Asset Revaluation - ${reval.revaluationNumber}: ${asset.assetName} (${reval.revaluationType})`,
      };

      const journalEntry = await JournalEntryService.createEntry(entryData, tenantId, userId, transaction);
      await revalRepo.update(reval.id, { isPosted: true, journalEntryId: journalEntry.id }, tenantId, userId);

      logger.info(`Revaluation ${reval.revaluationNumber} posted`);
      return reval;
    });

    return await revalRepo.findById(reval.id, tenantId);
  }

  async deleteRevaluation(id, tenantId) {
    const r = await revalRepo.findById(id, tenantId);
    if (!r) throw new NotFoundError('Revaluation not found');
    if (r.isPosted) throw new BadRequestError('Cannot delete posted revaluation');
    // Restore asset book value
    const asset = await Asset.findOne({ where: { id: r.assetId, tenantId } });
    if (asset) {
      const currentRevalAmount = parseFloat(asset.revaluationAmount || 0);
      const revalAmount = parseFloat(r.revaluationAmount);
      const newRevalAmount = r.revaluationType === 'increase'
        ? currentRevalAmount - revalAmount
        : currentRevalAmount + revalAmount;

      await assetRepo.update(asset.id, {
        currentBookValue: r.previousValue,
        revaluationAmount: Math.max(0, newRevalAmount),
      }, tenantId);
    }
    await revalRepo.delete(id, tenantId);
  }
}

module.exports = new AssetRevaluationService();
