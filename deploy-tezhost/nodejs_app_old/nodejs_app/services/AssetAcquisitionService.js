const acqRepository = require('../repositories/AssetAcquisitionRepository');
const assetRepository = require('../repositories/AssetRepository');
const { AssetCategory, Supplier, Account, sequelize } = require('../models');
const JournalEntryService = require('./JournalEntryService');
const { ConflictError, NotFoundError, BadRequestError } = require('../utils/appError');
const logger = require('../utils/logger');

class AssetAcquisitionService {
  async getAcquisitions(tenantId, query = {}) {
    const { page = 1, limit = 20, isPosted, search } = query;
    const filters = {};
    if (isPosted !== undefined) filters.isPosted = isPosted === 'true' || isPosted === true;
    return await acqRepository.findAndCountAll(tenantId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      filters,
      search,
    });
  }

  async getAcquisitionById(id, tenantId) {
    const acq = await acqRepository.findById(id, tenantId);
    if (!acq) throw new NotFoundError('Acquisition not found');
    return acq;
  }

  async getNextAcquisitionNumber(tenantId) {
    return await acqRepository.getNextAcquisitionNumber(tenantId);
  }

  async createAcquisition(data, tenantId, userId) {
    const { lines, ...acqData } = data;

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      throw new BadRequestError('At least one asset line is required');
    }

    // Generate acquisition number
    if (!acqData.acquisitionNumber) {
      acqData.acquisitionNumber = await acqRepository.getNextAcquisitionNumber(tenantId);
    } else {
      const existing = await acqRepository.findByNumber(acqData.acquisitionNumber, tenantId);
      if (existing) throw new ConflictError(`Acquisition number "${acqData.acquisitionNumber}" already exists`);
    }

    // Validate supplier if provided
    if (acqData.supplierId) {
      const supplier = await Supplier.findOne({ where: { id: acqData.supplierId, tenantId } });
      if (!supplier) throw new BadRequestError('Supplier not found');
    }

    // Validate all lines and compute totals
    let totalCost = 0;
    const validatedLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.assetName) throw new BadRequestError(`Line ${i + 1}: Asset name is required`);
      if (!line.categoryId) throw new BadRequestError(`Line ${i + 1}: Category is required`);

      const category = await AssetCategory.findOne({
        where: { id: line.categoryId, tenantId, isActive: true },
      });
      if (!category) throw new BadRequestError(`Line ${i + 1}: Asset category not found or is inactive`);

      const cost = parseFloat(line.purchaseCost || 0);
      totalCost += cost;

      validatedLines.push({
        assetName: line.assetName,
        categoryId: line.categoryId,
        purchaseCost: cost,
        residualValue: parseFloat(line.residualValue || (cost * parseFloat(category.residualValuePercentage || 0)) / 100),
        usefulLife: line.usefulLife || category.usefulLifeYears || 5,
        depreciationMethod: line.depreciationMethod || category.depreciationMethod || 'straight_line',
        serialNumber: line.serialNumber || null,
      });
    }

    // Create acquisition with lines in a transaction
    const result = await sequelize.transaction(async (transaction) => {
      // Create the acquisition record
      const { acquisition, lines: createdLines } = await acqRepository.createWithLines(
        {
          ...acqData,
          totalCost,
          acquisitionDate: acqData.acquisitionDate || new Date().toISOString().split('T')[0],
          acquisitionType: acqData.acquisitionType || 'manual',
        },
        validatedLines,
        tenantId,
        userId,
        transaction
      );

      // Create individual assets for each line
      const createdAssets = [];
      // Track asset codes within transaction to avoid duplicates
      let nextAssetNum = null;
      for (let i = 0; i < createdLines.length; i++) {
        const line = createdLines[i];
        let assetCode;
        if (i === 0) {
          assetCode = await assetRepository.getNextAssetCode(tenantId);
          nextAssetNum = parseInt(assetCode.replace('AST-', ''), 10);
        } else {
          nextAssetNum++;
          assetCode = `AST-${String(nextAssetNum).padStart(6, '0')}`;
        }

        const asset = await sequelize.models.Asset.create(
          {
            tenantId,
            assetCode,
            assetName: line.assetName,
            categoryId: line.categoryId,
            purchaseCost: line.purchaseCost,
            residualValue: line.residualValue,
            usefulLife: line.usefulLife,
            depreciationMethod: line.depreciationMethod,
            serialNumber: line.serialNumber,
            currentBookValue: line.purchaseCost,
            acquisitionId: acquisition.id,
            supplierId: acqData.supplierId || null,
            purchaseDate: acqData.acquisitionDate || null,
            capitalizationDate: acqData.acquisitionDate || null,
            status: 'active',
            condition: 'new',
            createdBy: userId,
            updatedBy: userId,
          },
          { transaction }
        );

        createdAssets.push(asset);

        // Link line to asset
        await line.update({ assetId: asset.id }, { transaction });
      }

      return { acquisition, lines: createdLines, assets: createdAssets };
    });

    logger.info(`Acquisition ${result.acquisition.acquisitionNumber} created with ${result.lines.length} asset(s) in tenant ${tenantId}`);
    return await acqRepository.findById(result.acquisition.id, tenantId);
  }

  async postAcquisition(id, tenantId, userId) {
    const acq = await acqRepository.findById(id, tenantId);
    if (!acq) throw new NotFoundError('Acquisition not found');
    if (acq.isPosted) throw new BadRequestError('Acquisition is already posted');

    if (!acq.lines || acq.lines.length === 0) {
      throw new BadRequestError('Cannot post acquisition with no asset lines');
    }

    // Get the first line's category for account mappings
    const firstLine = acq.lines[0];
    const category = await AssetCategory.findOne({
      where: { id: firstLine.categoryId, tenantId },
      include: [
        { model: Account, as: 'defaultAssetAccount', attributes: ['id', 'code', 'name'], required: false },
        { model: Account, as: 'defaultTaxAccount', attributes: ['id', 'code', 'name'], required: false },
      ],
    });

    if (!category || !category.defaultAssetAccount) {
      throw new BadRequestError('Asset category must have a Default Asset Account configured to post');
    }

    // Build journal entry lines
    const journalLines = [];

    // Debit: Fixed Asset account
    journalLines.push({
      accountId: category.defaultAssetAccountId,
      debit: parseFloat(acq.totalCost),
      credit: 0,
      description: `Asset acquisition: ${acq.acquisitionNumber}`,
    });

    // Credit: Accounts Payable or directly linked account
    // For manual acquisitions, we credit the default asset account's contra or use a suspense
    journalLines.push({
      accountId: category.defaultAssetAccountId,
      debit: 0,
      credit: parseFloat(acq.totalCost),
      description: `Asset acquisition contra: ${acq.acquisitionNumber}`,
    });

    // NOTE: In production, the credit side should go to Accounts Payable (supplier)
    // or to a specific funding account. The current implementation uses the asset
    // account as a placeholder. Integration with Purchase Invoices will handle
    // the proper AP credit.

    // Create journal entry
    const entryData = {
      lines: journalLines,
      entryDate: acq.acquisitionDate,
      reference: acq.acquisitionNumber,
      description: `Asset Acquisition - ${acq.acquisitionNumber}: ${acq.description || acq.lines.map(l => l.assetName).join(', ')}`,
    };

    const journalEntry = await JournalEntryService.createEntry(entryData, tenantId, userId);

    // Update acquisition as posted
    await acqRepository.update(id, { isPosted: true, journalEntryId: journalEntry.id }, tenantId, userId);

    logger.info(`Acquisition ${acq.acquisitionNumber} posted with journal entry ${journalEntry.entryNumber}`);
    return await acqRepository.findById(id, tenantId);
  }

  async reverseAcquisition(id, tenantId, userId) {
    const acq = await acqRepository.findById(id, tenantId);
    if (!acq) throw new NotFoundError('Acquisition not found');
    if (!acq.isPosted) throw new BadRequestError('Acquisition is not posted');

    // Create reversal journal entry
    if (acq.journalEntryId) {
      // Use the reverse entry functionality if available
      const journalEntry = await JournalEntryService.getEntryById(acq.journalEntryId, tenantId);
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
          reference: `REV-${acq.acquisitionNumber}`,
          description: `Reversal of Acquisition - ${acq.acquisitionNumber}`,
        };

        const reversal = await JournalEntryService.createEntry(entryData, tenantId, userId);

        await acqRepository.update(id, { isPosted: false, journalEntryId: null }, tenantId, userId);
        logger.info(`Acquisition ${acq.acquisitionNumber} reversed with journal entry ${reversal.entryNumber}`);
      }
    }

    return await acqRepository.findById(id, tenantId);
  }

  async deleteAcquisition(id, tenantId) {
    const acq = await acqRepository.findById(id, tenantId);
    if (!acq) throw new NotFoundError('Acquisition not found');
    if (acq.isPosted) throw new BadRequestError('Cannot delete a posted acquisition. Reverse it first.');

    await acqRepository.deleteWithLines(id, tenantId);
    logger.info(`Acquisition ${acq.acquisitionNumber} deleted from tenant ${tenantId}`);
  }
}

module.exports = new AssetAcquisitionService();
