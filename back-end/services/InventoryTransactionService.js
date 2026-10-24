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
  static async recordTransaction({ tenantId, itemId, variantId = null, warehouseId, transactionType,
    referenceId, referenceType, referenceNumber, referenceLineId = null, quantity, unitCost, totalCost }, transaction) {

    const qty = parseFloat(quantity) || 0;
    const unit = parseFloat(unitCost) || 0;
    const total = parseFloat(totalCost) || (qty > 0 ? qty * unit : 0);

    // Get current balance
    let balance = await InventoryBalance.findOne({
      where: { tenantId, itemId, variantId, warehouseId },
      transaction,
    });

    const currentQty = balance ? parseFloat(balance.quantityOnHand) || 0 : 0;
    const currentAvg = balance ? parseFloat(balance.averageCost) || 0 : 0;
    const newQty = Math.max(0, currentQty + qty);

    // Weighted average cost: stock inward recalculates the per-unit average;
    // stock outward is valued at the current average and leaves it unchanged.
    let averageCost = currentAvg;
    if (qty > 0) {
      const currentValue = currentQty * currentAvg;
      const incomingValue = total || qty * unit;
      if (newQty > 0) averageCost = (currentValue + incomingValue) / newQty;
    }

    if (!balance) {
      balance = await InventoryBalance.create({
        tenantId,
        itemId,
        variantId,
        warehouseId,
        quantityOnHand: newQty,
        averageCost,
      }, { transaction });
    } else {
      await balance.update({
        quantityOnHand: newQty,
        averageCost,
      }, { transaction });
    }

    const record = await InventoryTransaction.create({
      tenantId,
      itemId,
      variantId,
      warehouseId,
      transactionType,
      referenceId,
      referenceType,
      referenceLineId,
      quantityIn: qty > 0 ? qty : 0,
      quantityOut: qty < 0 ? Math.abs(qty) : 0,
      runningBalance: newQty,
      unitCost: unit,
      transactionDate: new Date(),
    }, { transaction });

    return record;
  }

  /**
   * Reverse a previous inventory transaction.
   */
  static async reverseTransaction({ tenantId, itemId, variantId = null, warehouseId, transactionType,
    referenceId, referenceType, referenceNumber, referenceLineId = null, quantity, unitCost, totalCost }, transaction) {
    return InventoryTransactionService.recordTransaction({
      tenantId,
      itemId,
      variantId,
      warehouseId,
      transactionType: transactionType + '_reversal',
      referenceId,
      referenceType,
      referenceNumber,
      referenceLineId,
      quantity: -quantity,
      unitCost: unitCost || 0,
      totalCost: -(totalCost || 0),
    }, transaction);
  }
}

module.exports = InventoryTransactionService;