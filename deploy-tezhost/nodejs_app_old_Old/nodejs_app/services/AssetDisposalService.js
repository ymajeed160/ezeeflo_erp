const disposalRepo = require('../repositories/AssetDisposalRepository');
const assetRepo = require('../repositories/AssetRepository');
const { Asset, AssetCategory, sequelize } = require('../models');
const JournalEntryService = require('./JournalEntryService');
const { ConflictError, NotFoundError, BadRequestError } = require('../utils/appError');
const logger = require('../utils/logger');

class AssetDisposalService {
  async getDisposals(tenantId, query = {}) {
    const { page = 1, limit = 20, disposalType, isPosted, assetId, search } = query;
    const filters = {};
    if (disposalType) filters.disposalType = disposalType;
    if (isPosted !== undefined) filters.isPosted = isPosted === 'true' || isPosted === true;
    if (assetId) filters.assetId = assetId;
    return await disposalRepo.findAndCountAll(tenantId, { page: parseInt(page, 10), limit: parseInt(limit, 10), filters, search });
  }

  async getDisposalById(id, tenantId) {
    const d = await disposalRepo.findById(id, tenantId);
    if (!d) throw new NotFoundError('Disposal not found');
    return d;
  }

  async getNextDisposalNumber(tenantId) {
    return await disposalRepo.getNextDisposalNumber(tenantId);
  }

  async createDisposal(data, tenantId, userId) {
    const { assetId, disposalDate, disposalType, saleAmount = 0, reference, notes } = data;

    const asset = await Asset.findOne({ where: { id: assetId, tenantId } });
    if (!asset) throw new NotFoundError('Asset not found');
    if (asset.status !== 'active') throw new BadRequestError('Asset must be active to dispose');

    const cost = parseFloat(asset.purchaseCost || 0);
    const accumDepr = parseFloat(asset.accumulatedDepreciation || 0);
    const nbv = cost - accumDepr;
    const saleAmt = parseFloat(saleAmount || 0);
    const gainLoss = saleAmt - nbv;
    const gain = gainLoss > 0 ? gainLoss : 0;
    const loss = gainLoss < 0 ? Math.abs(gainLoss) : 0;

    if (!data.disposalNumber) {
      data.disposalNumber = await disposalRepo.getNextDisposalNumber(tenantId);
    } else {
      const existing = await disposalRepo.findByNumber(data.disposalNumber, tenantId);
      if (existing) throw new ConflictError(`Disposal number "${data.disposalNumber}" already exists`);
    }

    const disposal = await sequelize.transaction(async (transaction) => {
      // 1. Create disposal record
      const record = await disposalRepo.create({
        disposalNumber: data.disposalNumber,
        assetId,
        disposalDate: disposalDate || new Date().toISOString().split('T')[0],
        disposalType,
        saleAmount: saleAmt,
        accumulatedDepreciation: accumDepr,
        netBookValue: nbv,
        gainOnDisposal: gain,
        lossOnDisposal: loss,
        reference: reference || null,
        notes: notes || null,
      }, tenantId, userId);

      // 2. Update asset status
      const assetStatus = disposalType === 'sale' ? 'sold' : 'disposed';
      await assetRepo.update(asset.id, {
        status: assetStatus,
        accumulatedDepreciation: accumDepr,
        currentBookValue: nbv,
      }, tenantId, userId);

      return record;
    });

    logger.info(`Disposal ${disposal.disposalNumber}: ${asset.assetCode} (${disposalType})`);
    return await disposalRepo.findById(disposal.id, tenantId);
  }

  async postDisposal(id, tenantId, userId) {
    const disposal = await disposalRepo.findById(id, tenantId);
    if (!disposal) throw new NotFoundError('Disposal not found');
    if (disposal.isPosted) throw new BadRequestError('Disposal already posted');

    const asset = await Asset.findOne({ where: { id: disposal.assetId, tenantId } });
    if (!asset) throw new NotFoundError('Asset not found');

    const category = await AssetCategory.findOne({
      where: { id: asset.categoryId, tenantId },
    });
    if (!category) throw new BadRequestError('Asset category not found');

    const result = await sequelize.transaction(async (transaction) => {
      const journalLines = [];

      const cost = parseFloat(disposal.netBookValue || 0);

      // Debit: Accumulated Depreciation (remove accumulated depr from books)
      if (parseFloat(disposal.accumulatedDepreciation) > 0 && category.accumulatedDepreciationAccountId) {
        journalLines.push({
          accountId: category.accumulatedDepreciationAccountId,
          debit: parseFloat(disposal.accumulatedDepreciation),
          credit: 0,
          description: `Disposal: Accumulated Depreciation - ${asset.assetCode}`,
        });
      }

      // If sale: Debit sale amount (Cash/AR) - use gain/loss accounts
      if (disposal.disposalType === 'sale' && parseFloat(disposal.saleAmount) > 0) {
        // Credit: Fixed Asset (remove from books)
        if (category.defaultAssetAccountId) {
          journalLines.push({
            accountId: category.defaultAssetAccountId,
            debit: 0,
            credit: cost,
            description: `Disposal: Asset derecognition - ${asset.assetCode}`,
          });
        }

        // Debit: Sale amount (use default asset account until cash account mapping is available)
        if (category.gainOnDisposalAccountId) {
          journalLines.push({
            accountId: category.gainOnDisposalAccountId,
            debit: parseFloat(disposal.saleAmount),
            credit: 0,
            description: `Disposal: Proceeds - ${asset.assetCode}`,
          });
        }

        // Gain/Loss
        if (parseFloat(disposal.gainOnDisposal) > 0 && category.gainOnDisposalAccountId) {
          journalLines.push({
            accountId: category.gainOnDisposalAccountId,
            debit: 0,
            credit: parseFloat(disposal.gainOnDisposal),
            description: `Disposal: Gain on disposal - ${asset.assetCode}`,
          });
        }

        if (parseFloat(disposal.lossOnDisposal) > 0 && category.lossOnDisposalAccountId) {
          journalLines.push({
            accountId: category.lossOnDisposalAccountId,
            debit: parseFloat(disposal.lossOnDisposal),
            credit: 0,
            description: `Disposal: Loss on disposal - ${asset.assetCode}`,
          });
        }
      } else {
        // Non-sale disposal (scrap, donation, write-off, lost)
        if (category.defaultAssetAccountId) {
          journalLines.push({
            accountId: category.defaultAssetAccountId,
            debit: 0,
            credit: cost,
            description: `Disposal: Asset derecognition - ${asset.assetCode} (${disposal.disposalType})`,
          });
        }

        // Loss on disposal for non-sale disposals
        if (cost > 0 && category.lossOnDisposalAccountId) {
          journalLines.push({
            accountId: category.lossOnDisposalAccountId,
            debit: cost,
            credit: 0,
            description: `Disposal: Loss on ${disposal.disposalType} - ${asset.assetCode}`,
          });
        }
      }

      if (journalLines.length < 2) {
        throw new BadRequestError('Asset category must have the required accounts configured (Asset, Accumulated Depreciation, Gain/Loss on Disposal)');
      }

      const entryData = {
        lines: journalLines,
        entryDate: disposal.disposalDate,
        reference: disposal.disposalNumber,
        description: `Asset Disposal - ${disposal.disposalNumber}: ${asset.assetName} (${disposal.disposalType})`,
      };

      const journalEntry = await JournalEntryService.createEntry(entryData, tenantId, userId, transaction);

      await disposalRepo.update(disposal.id, { isPosted: true, journalEntryId: journalEntry.id }, tenantId, userId);

      logger.info(`Disposal ${disposal.disposalNumber} posted with journal entry ${journalEntry.entryNumber}`);
      return disposal;
    });

    return await disposalRepo.findById(disposal.id, tenantId);
  }

  async reverseDisposal(id, tenantId, userId) {
    const disposal = await disposalRepo.findById(id, tenantId);
    if (!disposal) throw new NotFoundError('Disposal not found');
    if (!disposal.isPosted) throw new BadRequestError('Disposal is not posted');

    await sequelize.transaction(async (transaction) => {
      if (disposal.journalEntryId) {
        const journalEntry = await JournalEntryService.getEntryById(disposal.journalEntryId, tenantId);
        if (journalEntry) {
          const reversalLines = journalEntry.lines.map((line) => ({
            accountId: line.accountId,
            debit: line.credit,
            credit: line.debit,
            description: `Reversal: ${line.description}`,
          }));
          await JournalEntryService.createEntry({
            lines: reversalLines,
            entryDate: new Date().toISOString().split('T')[0],
            reference: `REV-${disposal.disposalNumber}`,
            description: `Reversal of Disposal - ${disposal.disposalNumber}`,
          }, tenantId, userId, transaction);
        }
      }

      await disposalRepo.update(disposal.id, { isPosted: false, journalEntryId: null }, tenantId, userId);
      await assetRepo.update(disposal.assetId, { status: 'active' }, tenantId, userId);
    });

    logger.info(`Disposal ${disposal.disposalNumber} reversed`);
    return await disposalRepo.findById(disposal.id, tenantId);
  }

  async deleteDisposal(id, tenantId) {
    const d = await disposalRepo.findById(id, tenantId);
    if (!d) throw new NotFoundError('Disposal not found');
    if (d.isPosted) throw new BadRequestError('Cannot delete posted disposal. Reverse it first.');
    // Restore asset status
    await assetRepo.update(d.assetId, { status: 'active' }, d.tenantId);
    await disposalRepo.delete(id, tenantId);
  }
}

module.exports = new AssetDisposalService();
