'use strict';
const { InventoryBalance, InventoryTransaction, Item } = require('../models');

/**
 * InventoryService
 * Provides inventory-related helper methods for procurement / sales modules.
 */
class InventoryService {
  /**
   * Increase inventory (e.g. from Goods Receipt or Purchase Return reversal).
   */
  static async addStock(tenantId, itemId, warehouseId, quantity, unitCost, referenceInfo, transaction) {
    const totalCost = quantity * unitCost;
    const InventoryTransactionService = require('./InventoryTransactionService');
    return InventoryTransactionService.recordTransaction({
      tenantId,
      itemId,
      warehouseId,
      transactionType: 'purchase',
      referenceId: referenceInfo.id,
      referenceType: referenceInfo.type,
      referenceNumber: referenceInfo.number,
      quantity,
      unitCost,
      totalCost,
    }, transaction);
  }

  /**
   * Decrease inventory (e.g. from Sales Delivery or Purchase Return).
   */
  static async reduceStock(tenantId, itemId, warehouseId, quantity, unitCost, referenceInfo, transaction) {
    const totalCost = quantity * unitCost;
    const InventoryTransactionService = require('./InventoryTransactionService');
    return InventoryTransactionService.recordTransaction({
      tenantId,
      itemId,
      warehouseId,
      transactionType: 'sale',
      referenceId: referenceInfo.id,
      referenceType: referenceInfo.type,
      referenceNumber: referenceInfo.number,
      quantity: -quantity,
      unitCost,
      totalCost,
    }, transaction);
  }

  /**
   * Get current stock for an item in a warehouse.
   */
  static async getStock(tenantId, itemId, warehouseId) {
    const balance = await InventoryBalance.findOne({
      where: { tenantId, itemId, warehouseId },
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