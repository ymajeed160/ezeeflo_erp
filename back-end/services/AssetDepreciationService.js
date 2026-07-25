const deprRepo = require('../repositories/AssetDepreciationRepository');
const assetRepo = require('../repositories/AssetRepository');
const { Asset, AssetCategory, sequelize } = require('../models');
const JournalEntryService = require('./JournalEntryService');
const { ConflictError, NotFoundError, BadRequestError } = require('../utils/appError');
const logger = require('../utils/logger');

class DepreciationCalculator {
  /**
   * Calculate depreciation for one period
   */
  static calculate(asset, frequency = 'monthly', unitsProduced = null) {
    const cost = parseFloat(asset.purchaseCost || 0);
    const residual = parseFloat(asset.residualValue || 0);
    const life = asset.usefulLife || 5;
    const accumDepr = parseFloat(asset.accumulatedDepreciation || 0);
    const bookValue = cost - accumDepr;
    const method = asset.depreciationMethod || 'straight_line';
    const depreciableBase = cost - residual;

    let amount = 0;
    let monthsInPeriod = 1;

    switch (frequency) {
      case 'monthly': monthsInPeriod = 1; break;
      case 'quarterly': monthsInPeriod = 3; break;
      case 'yearly': monthsInPeriod = 12; break;
    }

    if (depreciableBase <= 0 || bookValue <= residual) {
      amount = 0;
    } else {
      switch (method) {
        case 'straight_line': {
          const monthly = depreciableBase / (life * 12);
          amount = monthly * monthsInPeriod;
          break;
        }
        case 'declining_balance': {
          const rate = (1 / life) * 1.5; // 150% declining balance
          const monthlyRate = rate / 12;
          amount = bookValue * monthlyRate * monthsInPeriod;
          break;
        }
        case 'double_declining_balance': {
          const rate = 2 / life;
          const monthlyRate = rate / 12;
          amount = bookValue * monthlyRate * monthsInPeriod;
          break;
        }
        case 'units_of_production': {
          const totalUnits = parseFloat(asset.totalEstimatedUnits || unitsProduced || 1000);
          if (totalUnits > 0 && unitsProduced) {
            amount = (depreciableBase / totalUnits) * unitsProduced;
          } else if (totalUnits > 0) {
            amount = depreciableBase / totalUnits * (totalUnits / (life * 12) * monthsInPeriod);
          }
          break;
        }
        case 'manual':
          amount = 0; // Manual requires explicit entry
          break;
      }
    }

    // Ensure we don't depreciate below residual value
    if (accumDepr + amount > depreciableBase) {
      amount = Math.max(0, depreciableBase - accumDepr);
    }

    return {
      depreciationAmount: Math.round(amount * 100) / 100,
      accumulatedDepreciationBefore: accumDepr,
      accumulatedDepreciationAfter: Math.round((accumDepr + amount) * 100) / 100,
      bookValueAfter: Math.round((cost - (accumDepr + amount)) * 100) / 100,
    };
  }

  /**
   * Generate a full depreciation schedule
   */
  static generateSchedule(asset, frequency = 'monthly', monthsAhead = 12) {
    const cost = parseFloat(asset.purchaseCost || 0);
    const residual = parseFloat(asset.residualValue || 0);
    const life = asset.usefulLife || 5;
    const accumDepr = parseFloat(asset.accumulatedDepreciation || 0);
    const depreciableBase = cost - residual;

    let monthsInPeriod = 1;
    let periodLabel = '';
    switch (frequency) {
      case 'monthly': monthsInPeriod = 1; periodLabel = 'Month'; break;
      case 'quarterly': monthsInPeriod = 3; periodLabel = 'Quarter'; break;
      case 'yearly': monthsInPeriod = 12; periodLabel = 'Year'; break;
    }

    const totalPeriods = Math.min(monthsAhead / monthsInPeriod, Math.ceil((life * 12) / monthsInPeriod));
    const schedule = [];
    let runningAccum = accumDepr;
    let remaining = depreciableBase - runningAccum;

    for (let i = 0; i < totalPeriods && remaining > 0.01; i++) {
      const tempAsset = { ...asset.toJSON(), accumulatedDepreciation: runningAccum };
      const result = DepreciationCalculator.calculate(tempAsset, frequency);

      if (result.depreciationAmount <= 0) break;

      schedule.push({
        period: i + 1,
        periodLabel: `${periodLabel} ${i + 1}`,
        depreciationAmount: result.depreciationAmount,
        accumulatedDepreciation: result.accumulatedDepreciationAfter,
        bookValue: result.bookValueAfter,
      });

      runningAccum = result.accumulatedDepreciationAfter;
      remaining = depreciableBase - runningAccum;
    }

    return schedule;
  }
}

class AssetDepreciationService {
  async getDepreciations(tenantId, query = {}) {
    const { page = 1, limit = 20, isPosted, assetId, search } = query;
    const filters = {};
    if (isPosted !== undefined) filters.isPosted = isPosted === 'true' || isPosted === true;
    if (assetId) filters.assetId = assetId;
    return await deprRepo.findAndCountAll(tenantId, { page: parseInt(page, 10), limit: parseInt(limit, 10), filters, search });
  }

  async getDepreciationById(id, tenantId) {
    const d = await deprRepo.findById(id, tenantId);
    if (!d) throw new NotFoundError('Depreciation record not found');
    return d;
  }

  async getNextDepreciationNumber(tenantId) {
    return await deprRepo.getNextDepreciationNumber(tenantId);
  }

  async previewDepreciation(assetId, tenantId, { frequency = 'monthly' } = {}) {
    const asset = await Asset.findOne({ where: { id: assetId, tenantId } });
    if (!asset) throw new NotFoundError('Asset not found');
    if (asset.status !== 'active') throw new BadRequestError('Asset must be active to calculate depreciation');

    const calculation = DepreciationCalculator.calculate(asset, frequency);
    const schedule = DepreciationCalculator.generateSchedule(asset, frequency, 60);

    const monthlyAmount = DepreciationCalculator.calculate(asset, 'monthly').depreciationAmount;
    const quarterlyAmount = DepreciationCalculator.calculate(asset, 'quarterly').depreciationAmount;
    const yearlyAmount = DepreciationCalculator.calculate(asset, 'yearly').depreciationAmount;
    const lifeMonths = asset.usefulLife * 12;
    const elapsedMonths = lifeMonths - (asset.currentBookValue > 0 ? (parseFloat(asset.purchaseCost) - parseFloat(asset.residualValue)) / (parseFloat(asset.purchaseCost) / lifeMonths) : 0);

    return {
      assetId: asset.id,
      assetCode: asset.assetCode,
      assetName: asset.assetName,
      assetCost: parseFloat(asset.purchaseCost),
      residualValue: parseFloat(asset.residualValue),
      usefulLife: asset.usefulLife,
      accumulatedDepreciation: parseFloat(asset.accumulatedDepreciation),
      currentBookValue: parseFloat(asset.currentBookValue),
      depreciationMethod: asset.depreciationMethod,
      frequency,
      monthlyAmount,
      quarterlyAmount,
      yearlyAmount,
      remainingLifeMonths: Math.max(0, Math.round(lifeMonths - elapsedMonths)),
      schedule,
    };
  }

  async postDepreciation(data, tenantId, userId) {
    const { assetId, depreciationDate, frequency = 'monthly', notes, unitsProduced } = data;

    const asset = await Asset.findOne({ where: { id: assetId, tenantId } });
    if (!asset) throw new NotFoundError('Asset not found');
    if (asset.status !== 'active') throw new BadRequestError('Asset must be active to post depreciation');

    // Get the asset category for account mapping
    const category = await AssetCategory.findOne({
      where: { id: asset.categoryId, tenantId },
    });

    const deprNumber = await deprRepo.getNextDepreciationNumber(tenantId);
    const calc = DepreciationCalculator.calculate(asset, frequency, unitsProduced);

    if (calc.depreciationAmount <= 0) {
      throw new BadRequestError('Depreciation amount is zero or negative. Asset may be fully depreciated.');
    }

    const result = await sequelize.transaction(async (transaction) => {
      // Create journal entry
      const journalLines = [];

      // Find accounts from category
      const categoryWithAccounts = await AssetCategory.findOne({
        where: { id: asset.categoryId, tenantId },
      });

      if (!categoryWithAccounts || !categoryWithAccounts.depreciationExpenseAccountId || !categoryWithAccounts.accumulatedDepreciationAccountId) {
        throw new BadRequestError('Asset category must have Depreciation Expense and Accumulated Depreciation accounts configured');
      }

      journalLines.push({
        accountId: categoryWithAccounts.depreciationExpenseAccountId,
        debit: calc.depreciationAmount,
        credit: 0,
        description: `Depreciation: ${asset.assetCode} - ${deprNumber}`,
      });

      journalLines.push({
        accountId: categoryWithAccounts.accumulatedDepreciationAccountId,
        debit: 0,
        credit: calc.depreciationAmount,
        description: `Accumulated Depreciation: ${asset.assetCode} - ${deprNumber}`,
      });

      const entryData = {
        lines: journalLines,
        entryDate: depreciationDate || new Date().toISOString().split('T')[0],
        reference: deprNumber,
        description: `Asset Depreciation - ${deprNumber}: ${asset.assetName}`,
      };

      const journalEntry = await JournalEntryService.createEntry(entryData, tenantId, userId, transaction);

      // Create depreciation record
      const deprRecord = await deprRepo.create({
        depreciationNumber: deprNumber,
        assetId,
        depreciationDate: depreciationDate || new Date().toISOString().split('T')[0],
        frequency,
        depreciationMethod: asset.depreciationMethod,
        assetCost: parseFloat(asset.purchaseCost),
        residualValue: parseFloat(asset.residualValue),
        usefulLife: asset.usefulLife,
        accumulatedDepreciationBefore: calc.accumulatedDepreciationBefore,
        depreciationAmount: calc.depreciationAmount,
        accumulatedDepreciationAfter: calc.accumulatedDepreciationAfter,
        bookValueAfter: calc.bookValueAfter,
        unitsProduced: unitsProduced || null,
        isPosted: true,
        journalEntryId: journalEntry.id,
        notes: notes || null,
      }, tenantId, userId);

      // Update asset accumulated depreciation and book value
      await assetRepo.update(asset.id, {
        accumulatedDepreciation: calc.accumulatedDepreciationAfter,
        currentBookValue: calc.bookValueAfter,
      }, tenantId, userId);

      logger.info(`Depreciation ${deprNumber} posted for asset ${asset.assetCode}: ${calc.depreciationAmount}`);
      return deprRecord;
    });

    return await deprRepo.findById(result.id, tenantId);
  }

  async reverseDepreciation(id, tenantId, userId) {
    const depr = await deprRepo.findById(id, tenantId);
    if (!depr) throw new NotFoundError('Depreciation not found');
    if (!depr.isPosted) throw new BadRequestError('Depreciation is not posted');

    const result = await sequelize.transaction(async (transaction) => {
      // Reverse journal entry
      if (depr.journalEntryId) {
        const journalEntry = await JournalEntryService.getEntryById(depr.journalEntryId, tenantId);
        if (journalEntry) {
          const reversalLines = journalEntry.lines.map((line) => ({
            accountId: line.accountId,
            debit: line.credit,
            credit: line.debit,
            description: `Reversal: ${line.description}`,
          }));

          const entryData = {
            lines: reversalLines,
            entryDate: new Date().toISOString().split('T')[0],
            reference: `REV-${depr.depreciationNumber}`,
            description: `Reversal of Depreciation - ${depr.depreciationNumber}`,
          };

          await JournalEntryService.createEntry(entryData, tenantId, userId, transaction);
        }
      }

      // Update the depr record
      await deprRepo.update(depr.id, { isPosted: false, journalEntryId: null }, tenantId, userId);

      // Restore asset accumulated depreciation and book value
      const asset = await Asset.findOne({ where: { id: depr.assetId, tenantId } });
      if (asset) {
        await assetRepo.update(asset.id, {
          accumulatedDepreciation: depr.accumulatedDepreciationBefore,
          currentBookValue: parseFloat(depr.assetCost) - depr.accumulatedDepreciationBefore,
        }, tenantId, userId);
      }

      logger.info(`Depreciation ${depr.depreciationNumber} reversed`);
      return depr;
    });

    return await deprRepo.findById(depr.id, tenantId);
  }

  async deleteDepreciation(id, tenantId) {
    const depr = await deprRepo.findById(id, tenantId);
    if (!depr) throw new NotFoundError('Depreciation not found');
    if (depr.isPosted) throw new BadRequestError('Cannot delete a posted depreciation. Reverse it first.');
    await deprRepo.delete(id, tenantId);
  }
}

module.exports = new AssetDepreciationService();
