'use strict';
const { InventoryTransaction, InventoryBalance } = require('../models');

/**
 * InventoryTransactionService
 * Provides helper methods for creating inventory transactions
 * and updating inventory balances.
 */
class InventoryTransactionService {
  /**
   * Record an inventory movement (IN or OUT).
   * @param {Object} params
   * @param {number} params.tenantId
   * @param {number} params.itemId
   * @param {number} params.warehouseId
   * @param {string} params.transactionType - e.g. 'purchase', 'sale', 'adjustment', 'transfer', 'return'
   * @param {number} params.referenceId
   * @param {string} params.referenceType - e.g. 'PurchaseInvoice', 'SalesInvoice'
   * @param {string} params.referenceNumber
   * @param {number} params.quantity - positive for IN, negative for OUT
   * @param {number} params.unitCost
   * @param {number} params.totalCost
   * @param {Object} [transaction] - sequelize transaction
   */
  static async recordTransaction({ tenantId, itemId, warehouseId, transactionType,
    referenceId, referenceType, referenceNumber, quantity, unitCost, totalCost }, transaction) {
    
    // Get current balance
    let balance = await InventoryBalance.findOne({
      where: { tenantId, itemId, warehouseId },
      transaction,
    });

    const currentQty = balance ? parseFloat(balance.quantityOnHand) : 0;
    const newQty = currentQty + quantity;

    if (!balance) {
      balance = await InventoryBalance.create({
        tenantId,
        itemId,
        warehouseId,
        quantityOnHand: Math.max(0, newQty),
        lastUpdated: new Date(),
      }, { transaction });
    } else {
      await balance.update({
        quantityOnHand: Math.max(0, newQty),
        lastUpdated: new Date(),
      }, { transaction });
    }

    const record = await InventoryTransaction.create({
      tenantId,
      itemId,
      warehouseId,
      transactionType,
      referenceId,
      referenceType,
      referenceNumber,
      quantity,
      unitCost: unitCost || 0,
      totalCost: totalCost || 0,
      balanceAfter: Math.max(0, newQty),
      createdAt: new Date(),
    }, { transaction });

    return record;
  }

  /**
   * Reverse a previous inventory transaction.
   */
  static async reverseTransaction({ tenantId, itemId, warehouseId, transactionType,
    referenceId, referenceType, referenceNumber, quantity, unitCost, totalCost }, transaction) {
    return InventoryTransactionService.recordTransaction({
      tenantId,
      itemId,
      warehouseId,
      transactionType: transactionType + '_reversal',
      referenceId,
      referenceType,
      referenceNumber,
      quantity: -quantity,
      unitCost: unitCost || 0,
      totalCost: -(totalCost || 0),
    }, transaction);
  }
}

module.exports = InventoryTransactionService;