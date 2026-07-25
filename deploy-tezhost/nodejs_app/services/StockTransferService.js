const { sequelize } = require('../models');
const stockTransferRepository = require('../repositories/StockTransferRepository');
const inventoryBalanceRepository = require('../repositories/InventoryBalanceRepository');
const inventoryTransactionRepository = require('../repositories/InventoryTransactionRepository');
const itemRepository = require('../repositories/ItemRepository');
const warehouseRepository = require('../repositories/WarehouseRepository');
const { BadRequestError, NotFoundError } = require('../utils/appError');
const logger = require('../utils/logger');

class StockTransferService {
  /**
   * Generate a unique transfer number
   */
  async generateTransferNumber(tenantId) {
    const prefix = 'TRF';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  }

  async getTransfers(tenantId, query = {}) {
    const { page = 1, limit = 20, status, fromWarehouseId, toWarehouseId, search } = query;
    const filters = {};

    if (status) filters.status = status;
    if (fromWarehouseId) filters.fromWarehouseId = fromWarehouseId;
    if (toWarehouseId) filters.toWarehouseId = toWarehouseId;

    return await stockTransferRepository.findAndCountAll(tenantId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      filters,
      search,
      order: [['createdAt', 'DESC']],
    });
  }

  async getTransferById(id, tenantId) {
    const transfer = await stockTransferRepository.findById(id, tenantId);
    if (!transfer) {
      throw new NotFoundError('Stock transfer not found');
    }
    return transfer;
  }

  async createTransfer(data, tenantId, userId) {
    // Hard guard: tenantId must be defined
    if (tenantId === undefined || tenantId === null) {
      logger.error('StockTransferService.createTransfer called without tenantId', {
        userId,
        hasData: !!data,
        caller: 'createTransfer',
      });
      throw new BadRequestError('Tenant context is missing. Cannot create stock transfer.');
    }

    const transaction = await sequelize.transaction();

    try {
      // Validate source and destination are different
      if (data.fromWarehouseId === data.toWarehouseId) {
        throw new BadRequestError('Source and destination cannot be the same warehouse');
      }

      // Validate source warehouse
      const fromWarehouse = await warehouseRepository.findById(data.fromWarehouseId, tenantId);
      if (!fromWarehouse) {
        throw new BadRequestError('Source warehouse not found');
      }

      // Validate destination warehouse
      const toWarehouse = await warehouseRepository.findById(data.toWarehouseId, tenantId);
      if (!toWarehouse) {
        throw new BadRequestError('Destination warehouse not found');
      }

      // Validate transfer number uniqueness
      let transferNumber = data.transferNumber;
      if (transferNumber) {
        const existing = await stockTransferRepository.findByTransferNumber(transferNumber, tenantId);
        if (existing) {
          throw new BadRequestError(`Transfer number "${transferNumber}" already exists`);
        }
      } else {
        transferNumber = await this.generateTransferNumber(tenantId);
      }

      // Process each detail line
      const processedDetails = [];
      const inventoryTransactionRecords = [];

      for (const detail of data.details) {
        const quantity = parseFloat(detail.quantity);

        // Validate item exists and is a product
        const item = await itemRepository.findById(detail.itemId, tenantId);
        if (!item) {
          throw new BadRequestError(`Item not found: ${detail.itemId}`);
        }
        if (item.itemType !== 'product') {
          throw new BadRequestError(`Stock transfer only allowed for product items. "${item.name}" is a service.`);
        }

        // Check stock in source warehouse
        const sourceBalance = await inventoryBalanceRepository.findByWarehouseAndItem(
          data.fromWarehouseId,
          detail.itemId,
          tenantId
        );

        const sourceQuantity = sourceBalance ? parseFloat(sourceBalance.quantityOnHand) : 0;
        if (sourceQuantity < quantity) {
          throw new BadRequestError(
            `Insufficient stock for "${item.name}". Available: ${sourceQuantity}, Requested: ${quantity}`
          );
        }

        const unitCost = detail.unitCost !== undefined
          ? parseFloat(detail.unitCost)
          : (sourceBalance ? parseFloat(sourceBalance.averageCost) : parseFloat(item.costPrice || 0));

        processedDetails.push({
          itemId: detail.itemId,
          quantity,
          unitCost,
        });

        // Update source warehouse balance (decrease)
        const newSourceQuantity = sourceQuantity - quantity;
        await inventoryBalanceRepository.upsertBalance({
          tenantId,
          warehouseId: data.fromWarehouseId,
          itemId: detail.itemId,
          quantityOnHand: newSourceQuantity,
          averageCost: unitCost,
        }, transaction);

        // Update destination warehouse balance (increase)
        const destBalance = await inventoryBalanceRepository.findByWarehouseAndItem(
          data.toWarehouseId,
          detail.itemId,
          tenantId
        );
        const destQuantity = destBalance ? parseFloat(destBalance.quantityOnHand) : 0;
        const newDestQuantity = destQuantity + quantity;

        await inventoryBalanceRepository.upsertBalance({
          tenantId,
          warehouseId: data.toWarehouseId,
          itemId: detail.itemId,
          quantityOnHand: newDestQuantity,
          averageCost: unitCost,
        }, transaction);

        // Transfer Out transaction
        inventoryTransactionRecords.push({
          tenantId,
          itemId: detail.itemId,
          warehouseId: data.fromWarehouseId,
          transactionType: 'transfer_out',
          referenceType: 'stock_transfer',
          referenceId: null,
          quantityIn: 0,
          quantityOut: quantity,
          runningBalance: newSourceQuantity,
          unitCost,
          transactionDate: data.transferDate || new Date(),
        });

        // Transfer In transaction
        inventoryTransactionRecords.push({
          tenantId,
          itemId: detail.itemId,
          warehouseId: data.toWarehouseId,
          transactionType: 'transfer_in',
          referenceType: 'stock_transfer',
          referenceId: null,
          quantityIn: quantity,
          quantityOut: 0,
          runningBalance: newDestQuantity,
          unitCost,
          transactionDate: data.transferDate || new Date(),
        });
      }

      // Create transfer with details
      const transferData = {
        tenantId,
        transferNumber,
        fromWarehouseId: data.fromWarehouseId,
        toWarehouseId: data.toWarehouseId,
        transferDate: data.transferDate || new Date(),
        status: 'completed',
        notes: data.notes || null,
        createdBy: userId,
        updatedBy: userId,
      };

      const transfer = await stockTransferRepository.createWithDetails(
        transferData,
        processedDetails,
        transaction,
        tenantId
      );

      // Set reference ID and save inventory transactions
      for (const record of inventoryTransactionRecords) {
        record.referenceId = transfer.id;
      }
      await inventoryTransactionRepository.bulkCreate(inventoryTransactionRecords, { transaction });

      await transaction.commit();
      logger.info(`Stock transfer created: ${transferNumber} by user ${userId}`);

      return await stockTransferRepository.findById(transfer.id, tenantId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateTransferStatus(id, status, tenantId, userId) {
    const transfer = await stockTransferRepository.findById(id, tenantId);
    if (!transfer) {
      throw new NotFoundError('Stock transfer not found');
    }

    const allowedTransitions = {
      draft: ['approved', 'cancelled'],
      approved: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    if (!allowedTransitions[transfer.status]?.includes(status)) {
      throw new BadRequestError(
        `Cannot change status from "${transfer.status}" to "${status}"`
      );
    }

    const updated = await stockTransferRepository.updateStatus(id, status, userId, tenantId);
    logger.info(`Stock transfer ${transfer.transferNumber} status changed to ${status} by user ${userId}`);
    return updated;
  }
}

module.exports = new StockTransferService();