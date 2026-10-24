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
      const sourceRunning = new Map(); // key -> running qty in source warehouse
      const destRunning = new Map();   // key -> running qty in destination warehouse

      const FifoCostService = require('./FifoCostService');
      const { InventoryCostLayer } = require('../models');

      for (const detail of data.details) {
        const quantity = parseFloat(detail.quantity);
        const variantId = detail.variantId || null;

        // Validate item exists and is a product
        const item = await itemRepository.findById(detail.itemId, tenantId);
        if (!item) {
          throw new BadRequestError(`Item not found: ${detail.itemId}`);
        }
        if (item.itemType !== 'product') {
          throw new BadRequestError(`Stock transfer only allowed for product items. "${item.name}" is a service.`);
        }

        const sourceKey = `${tenantId}:${detail.itemId}:${data.fromWarehouseId}:${variantId}`;
        const destKey = `${tenantId}:${detail.itemId}:${data.toWarehouseId}:${variantId}`;

        const sourceBalance = await inventoryBalanceRepository.findByWarehouseAndItem(
          data.fromWarehouseId,
          detail.itemId,
          tenantId
        );
        const sourceQuantity = sourceBalance ? parseFloat(sourceBalance.quantityOnHand) : 0;
        if (sourceRunning.get(sourceKey) === undefined) sourceRunning.set(sourceKey, sourceQuantity);

        const destBalance = await inventoryBalanceRepository.findByWarehouseAndItem(
          data.toWarehouseId,
          detail.itemId,
          tenantId
        );
        const destQuantity = destBalance ? parseFloat(destBalance.quantityOnHand) : 0;
        if (destRunning.get(destKey) === undefined) destRunning.set(destKey, destQuantity);

        // FIFO cost layers are authoritative when present; otherwise fall back
        // to the legacy blended unit cost.
        const layerCount = await InventoryCostLayer.count({
          where: { tenantId, itemId: detail.itemId, warehouseId: data.fromWarehouseId, variantId },
          transaction,
        });

        let breakdown;
        let legacy = false;
        if (layerCount > 0) {
          breakdown = await FifoCostService.consumeLayers(
            tenantId, detail.itemId, data.fromWarehouseId, variantId, quantity, transaction
          );
          if (breakdown && breakdown.insufficient) {
            throw new BadRequestError(
              `Insufficient stock for "${item.name}". Available (FIFO): ${breakdown.available}, Requested: ${quantity}`
            );
          }
        } else {
          legacy = true;
          if (sourceQuantity < quantity) {
            throw new BadRequestError(
              `Insufficient stock for "${item.name}". Available: ${sourceQuantity}, Requested: ${quantity}`
            );
          }
          const unitCost = detail.unitCost !== undefined
            ? parseFloat(detail.unitCost)
            : (sourceBalance ? parseFloat(sourceBalance.averageCost) : parseFloat(item.costPrice || 0));
          breakdown = [{ layerId: null, quantity, unitCost, totalCost: quantity * unitCost }];
        }

        // Weighted-average unit cost for the transfer detail row (informational).
        const totalValue = breakdown.reduce((s, b) => s + (parseFloat(b.totalCost) || 0), 0);
        const blendedUnitCost = quantity > 0 ? totalValue / quantity : 0;

        processedDetails.push({
          itemId: detail.itemId,
          quantity,
          unitCost: parseFloat(blendedUnitCost.toFixed(6)),
        });

        for (const b of breakdown) {
          const bQty = parseFloat(b.quantity) || 0;
          const bUnit = parseFloat(b.unitCost) || 0;
          if (bQty <= 0) continue;

          // Source warehouse running balance (decrease)
          const srcRun = parseFloat(sourceRunning.get(sourceKey) || 0) - bQty;
          sourceRunning.set(sourceKey, srcRun);

          // Destination warehouse running balance (increase)
          const dstRun = parseFloat(destRunning.get(destKey) || 0) + bQty;
          destRunning.set(destKey, dstRun);

          inventoryTransactionRecords.push({
            tenantId,
            itemId: detail.itemId,
            variantId,
            warehouseId: data.fromWarehouseId,
            transactionType: 'transfer_out',
            referenceType: 'stock_transfer',
            referenceId: null,
            quantityIn: 0,
            quantityOut: bQty,
            runningBalance: srcRun,
            unitCost: bUnit,
            transactionDate: data.transferDate || new Date(),
            _transferInCost: bUnit,
            _transferInQty: bQty,
          });

          inventoryTransactionRecords.push({
            tenantId,
            itemId: detail.itemId,
            variantId,
            warehouseId: data.toWarehouseId,
            transactionType: 'transfer_in',
            referenceType: 'stock_transfer',
            referenceId: null,
            quantityIn: bQty,
            quantityOut: 0,
            runningBalance: dstRun,
            unitCost: bUnit,
            transactionDate: data.transferDate || new Date(),
            _transferInCost: bUnit,
            _transferInQty: bQty,
            _layer: b.layerId || null,
          });
        }

        if (legacy) {
          // Legacy path: update balances directly (weighted-average behaviour).
          await inventoryBalanceRepository.upsertBalance({
            tenantId,
            warehouseId: data.fromWarehouseId,
            itemId: detail.itemId,
            quantityOnHand: sourceRunning.get(sourceKey),
            averageCost: sourceBalance ? parseFloat(sourceBalance.averageCost) : 0,
          }, transaction);
          await inventoryBalanceRepository.upsertBalance({
            tenantId,
            warehouseId: data.toWarehouseId,
            itemId: detail.itemId,
            quantityOnHand: destRunning.get(destKey),
            averageCost: blendedUnitCost,
          }, transaction);
        }
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
      const cleanRecords = inventoryTransactionRecords.map(({ _transferInCost, _transferInQty, _layer, ...rest }) => rest);
      const createdTxs = await inventoryTransactionRepository.bulkCreate(cleanRecords, { transaction });

      // Establish FIFO cost layers in the destination warehouse for every
      // per-layer transfer-in, preserving the original layer costs.
      let idx = 0;
      for (const record of inventoryTransactionRecords) {
        const tx = createdTxs[idx];
        if (record.transactionType === 'transfer_in' && record._transferInQty > 0) {
          await FifoCostService.addLayer({
            tenantId,
            itemId: record.itemId,
            variantId: record.variantId || null,
            warehouseId: record.warehouseId,
            sourceType: 'transfer_in',
            sourceId: transfer.id,
            sourceLineId: null,
            stockInTransactionId: tx ? tx.id : null,
            quantity: record._transferInQty,
            unitCost: record._transferInCost,
            receiptDate: (record.transactionDate || new Date()).toISOString().split('T')[0],
          }, transaction);
        }
        idx += 1;
      }

      // Reconcile balances from layers for every affected (item, warehouse) scope.
      const scopes = new Set();
      for (const record of inventoryTransactionRecords) {
        scopes.add(`${record.itemId}:${record.warehouseId}:${record.variantId || null}`);
      }
      for (const scope of scopes) {
        const [itemId, warehouseId, variantId] = scope.split(':');
        await FifoCostService.recomputeBalance(
          tenantId, itemId, warehouseId, variantId === 'null' || !variantId ? null : variantId, transaction
        );
      }

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