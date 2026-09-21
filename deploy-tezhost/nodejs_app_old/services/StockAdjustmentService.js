const { sequelize } = require('../models');
const stockAdjustmentRepository = require('../repositories/StockAdjustmentRepository');
const inventoryBalanceRepository = require('../repositories/InventoryBalanceRepository');
const inventoryTransactionRepository = require('../repositories/InventoryTransactionRepository');
const itemRepository = require('../repositories/ItemRepository');
const warehouseRepository = require('../repositories/WarehouseRepository');
const { BadRequestError, NotFoundError } = require('../utils/appError');
const logger = require('../utils/logger');

class StockAdjustmentService {
  /**
   * Generate a unique adjustment number
   */
  async generateAdjustmentNumber(tenantId) {
    const prefix = 'ADJ';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  }

  async getAdjustments(tenantId, query = {}) {
    const { page = 1, limit = 20, status, warehouseId, search } = query;
    const filters = {};

    if (status) filters.status = status;
    if (warehouseId) filters.warehouseId = warehouseId;

    return await stockAdjustmentRepository.findAndCountAll(tenantId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      filters,
      search,
      order: [['createdAt', 'DESC']],
    });
  }

  async getAdjustmentById(id, tenantId) {
    const adjustment = await stockAdjustmentRepository.findById(id, tenantId);
    if (!adjustment) {
      throw new NotFoundError('Stock adjustment not found');
    }
    return adjustment;
  }

  async createAdjustment(data, tenantId, userId) {
    // Hard guard: tenantId must be defined
    if (tenantId === undefined || tenantId === null) {
      logger.error('StockAdjustmentService.createAdjustment called without tenantId', {
        userId,
        hasData: !!data,
        caller: 'createAdjustment',
      });
      throw new BadRequestError('Tenant context is missing. Cannot create stock adjustment.');
    }

    const transaction = await sequelize.transaction();

    try {
      // Validate warehouse
      const warehouse = await warehouseRepository.findById(data.warehouseId, tenantId);
      if (!warehouse) {
        throw new BadRequestError('Warehouse not found');
      }

      // Validate adjustment number uniqueness
      let adjustmentNumber = data.adjustmentNumber;
      if (adjustmentNumber) {
        const existing = await stockAdjustmentRepository.findByAdjustmentNumber(adjustmentNumber, tenantId);
        if (existing) {
          throw new BadRequestError(`Adjustment number "${adjustmentNumber}" already exists`);
        }
      } else {
        adjustmentNumber = await this.generateAdjustmentNumber(tenantId);
      }

      // Process each detail line
      const processedDetails = [];
      const inventoryTransactionRecords = [];

      for (const detail of data.details) {
        // Validate item exists and is a product
        const item = await itemRepository.findById(detail.itemId, tenantId);
        if (!item) {
          throw new BadRequestError(`Item not found: ${detail.itemId}`);
        }
        if (item.itemType !== 'product') {
          throw new BadRequestError(`Stock adjustment only allowed for product items. "${item.name}" is a service.`);
        }

        // Get current inventory balance for this item in this warehouse
        let currentBalance = await inventoryBalanceRepository.findByWarehouseAndItem(
          data.warehouseId,
          detail.itemId,
          tenantId
        );

        const currentQuantity = currentBalance ? parseFloat(currentBalance.quantityOnHand) : 0;
        const adjustedQuantity = parseFloat(detail.adjustedQuantity);
        const differenceQuantity = adjustedQuantity - currentQuantity;

        // Prevent negative stock
        if (adjustedQuantity < 0) {
          throw new BadRequestError(`Quantity cannot become negative for item "${item.name}"`);
        }

        const unitCost = detail.unitCost !== undefined ? parseFloat(detail.unitCost) : parseFloat(item.costPrice || 0);
        const newAverageCost = adjustedQuantity > 0 ? unitCost : 0;

        processedDetails.push({
          itemId: detail.itemId,
          currentQuantity: currentQuantity,
          adjustedQuantity: adjustedQuantity,
          differenceQuantity: differenceQuantity,
          unitCost: unitCost,
        });

        // Upsert inventory balance
        await inventoryBalanceRepository.upsertBalance({
          tenantId,
          warehouseId: data.warehouseId,
          itemId: detail.itemId,
          quantityOnHand: adjustedQuantity,
          averageCost: newAverageCost,
        }, transaction);

        // Create inventory transaction record
        inventoryTransactionRecords.push({
          tenantId,
          itemId: detail.itemId,
          warehouseId: data.warehouseId,
          transactionType: 'adjustment',
          referenceType: 'stock_adjustment',
          referenceId: null, // Will be set after adjustment is created
          quantityIn: differenceQuantity > 0 ? differenceQuantity : 0,
          quantityOut: differenceQuantity < 0 ? Math.abs(differenceQuantity) : 0,
          runningBalance: adjustedQuantity,
          unitCost,
          transactionDate: data.adjustmentDate || new Date(),
        });
      }

      // Create adjustment with details
      const adjustmentData = {
        tenantId,
        adjustmentNumber,
        warehouseId: data.warehouseId,
        adjustmentDate: data.adjustmentDate || new Date(),
        reason: data.reason,
        notes: data.notes || null,
        status: 'approved',
        createdBy: userId,
        updatedBy: userId,
      };

      const adjustment = await stockAdjustmentRepository.createWithDetails(
        adjustmentData,
        processedDetails,
        transaction,
        tenantId
      );

      // Set reference ID and save inventory transactions
      for (const record of inventoryTransactionRecords) {
        record.referenceId = adjustment.id;
      }
      await inventoryTransactionRepository.bulkCreate(inventoryTransactionRecords, { transaction });

      await transaction.commit();
      logger.info(`Stock adjustment created: ${adjustmentNumber} by user ${userId}`);

      return await stockAdjustmentRepository.findById(adjustment.id, tenantId);
    } catch (error) {
      await transaction.rollback();
      logger.error('StockAdjustmentService.createAdjustment failed', {
        error: error.message,
        stack: error.stack,
        tenantId,
        userId,
        warehouseId: data.warehouseId,
        adjustmentDate: data.adjustmentDate,
        reason: data.reason,
        detailCount: data.details?.length,
      });
      throw error;
    }
  }

  async updateAdjustmentStatus(id, status, tenantId, userId) {
    const adjustment = await stockAdjustmentRepository.findById(id, tenantId);
    if (!adjustment) {
      throw new NotFoundError('Stock adjustment not found');
    }

    const updated = await stockAdjustmentRepository.updateStatus(id, status, userId, tenantId);
    logger.info(`Stock adjustment ${adjustment.adjustmentNumber} status changed to ${status} by user ${userId}`);
    return updated;
  }
}

module.exports = new StockAdjustmentService();