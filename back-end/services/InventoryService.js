'use strict';
const { InventoryBalance, InventoryTransaction, Item } = require('../models');

/**
 * InventoryService
 * Provides inventory-related helper methods for procurement / sales modules.
 */
class InventoryService {
  /**
   * Increase inventory (e.g. from Goods Receipt or Purchase Return reversal).
   * Also establishes the corresponding FIFO cost layer.
   */
  static async addStock(tenantId, itemId, warehouseId, quantity, unitCost, referenceInfo, transaction, variantId = null) {
    const totalCost = quantity * unitCost;
    const InventoryTransactionService = require('./InventoryTransactionService');
    const record = await InventoryTransactionService.recordTransaction({
      tenantId,
      itemId,
      variantId,
      warehouseId,
      transactionType: 'purchase',
      referenceId: referenceInfo.id,
      referenceType: referenceInfo.type,
      referenceNumber: referenceInfo.number,
      quantity,
      unitCost,
      totalCost,
    }, transaction);

    // Establish a FIFO cost layer for the inward movement.
    const FifoCostService = require('./FifoCostService');
    const sourceType = InventoryService._layerSourceType(referenceInfo.type);
    await FifoCostService.addLayer({
      tenantId,
      itemId,
      variantId,
      warehouseId,
      sourceType,
      sourceId: referenceInfo.id || null,
      sourceLineId: referenceInfo.lineId || null,
      stockInTransactionId: record ? record.id : null,
      quantity,
      unitCost,
      receiptDate: new Date().toISOString().split('T')[0],
    }, transaction);
    await FifoCostService.recomputeBalance(tenantId, itemId, warehouseId, variantId, transaction);

    return record;
  }

  static _layerSourceType(referenceType) {
    switch (referenceType) {
      case 'PurchaseInvoice': return 'purchase';
      case 'GoodsReceipt': return 'receipt';
      case 'PurchaseReturn': return 'purchase_return';
      case 'SalesReturn': return 'sales_return';
      case 'StockTransfer': return 'transfer_in';
      case 'StockAdjustment': return 'adjustment';
      case 'OpeningBalance': return 'opening_balance';
      default: return 'purchase';
    }
  }

  /**
   * Decrease inventory (e.g. from Sales Delivery or Purchase Return).
   */
  static async reduceStock(tenantId, itemId, warehouseId, quantity, unitCost, referenceInfo, transaction, variantId = null) {
    const totalCost = quantity * unitCost;
    const InventoryTransactionService = require('./InventoryTransactionService');
    const record = await InventoryTransactionService.recordTransaction({
      tenantId,
      itemId,
      variantId,
      warehouseId,
      transactionType: 'sale',
      referenceId: referenceInfo.id,
      referenceType: referenceInfo.type,
      referenceNumber: referenceInfo.number,
      quantity: -quantity,
      unitCost,
      totalCost,
    }, transaction);

    // Re-derive the balance from the FIFO layers when they exist so the
    // projection stays consistent with the authoritative layers.
    const FifoCostService = require('./FifoCostService');
    const { InventoryCostLayer } = require('../models');
    const layerCount = await InventoryCostLayer.count({
      where: { tenantId, itemId, warehouseId, variantId },
      transaction,
    });
    if (layerCount > 0) {
      await FifoCostService.recomputeBalance(tenantId, itemId, warehouseId, variantId, transaction);
    }

    return record;
  }

  /**
   * Reverse the stock received by a purchase invoice.
   *
   * Only the inward movements created by the invoice itself are reversed: the
   * FIFO layers are exhausted and a matching reversal movement is recorded so
   * the stock history stays traceable. Balances are re-derived from the layers
   * afterwards. Callers must verify the layers are untouched before calling.
   */
  static async reverseInvoiceInward(tenantId, invoice, transaction) {
    const { InventoryCostLayer } = require('../models');
    const InventoryTransactionService = require('./InventoryTransactionService');
    const FifoCostService = require('./FifoCostService');

    const layers = await InventoryCostLayer.findAll({
      where: { tenantId, sourceType: 'purchase', sourceId: invoice.id },
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined,
    });

    const reversed = [];
    for (const layer of layers) {
      const quantity = parseFloat(layer.remainingQuantity) || 0;
      const unitCost = parseFloat(layer.unitCost) || 0;

      if (quantity > 0) {
        // Mirrors the goods-receipt cancellation pattern: a stock-out movement
        // with the dedicated 'receipt_cancel' type, traceable to the invoice.
        await InventoryTransactionService.recordTransaction({
          tenantId,
          itemId: layer.itemId,
          variantId: layer.variantId,
          warehouseId: layer.warehouseId,
          transactionType: 'receipt_cancel',
          referenceId: invoice.id,
          referenceType: 'PurchaseInvoice_Deleted',
          referenceNumber: invoice.invoiceNumber,
          quantity: -quantity,
          unitCost,
          totalCost: -(quantity * unitCost),
        }, transaction);
      }

      await layer.update({ remainingQuantity: 0, remainingValue: 0 }, { transaction });
      const balance = await FifoCostService.recomputeBalance(
        tenantId, layer.itemId, layer.warehouseId, layer.variantId, transaction
      );

      reversed.push({
        itemId: layer.itemId,
        variantId: layer.variantId,
        warehouseId: layer.warehouseId,
        quantity,
        unitCost,
        quantityOnHand: balance.quantityOnHand,
      });
    }

    return reversed;
  }

  /**
   * Get current stock for an item in a warehouse.
   */
  static async getStock(tenantId, itemId, warehouseId, variantId = null) {
    const balance = await InventoryBalance.findOne({
      where: { tenantId, itemId, warehouseId, variantId },
    });
    return balance ? parseFloat(balance.quantityOnHand) : 0;
  }

  /**
   * Check if an item is an inventory item (product) or service.
   */
  static async isInventoryItem(tenantId, itemId) {
    const item = await Item.findOne({ where: { tenantId, id: itemId } });
    return item && item.itemType === 'product';
  }
}

module.exports = InventoryService;