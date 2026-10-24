'use strict';
const { Op } = require('sequelize');
const {
  sequelize,
  InventoryCostLayer,
  InventoryCostAllocation,
  InventoryTransaction,
  InventoryBalance,
} = require('../models');
const { BadRequestError } = require('../utils/appError');

/**
 * FifoCostService
 *
 * Authoritative FIFO inventory costing engine.
 *
 * - `inventory_cost_layers` is the source of truth for what stock exists and
 *   what it cost. `InventoryBalance` (quantityOnHand / averageCost) remains a
 *   fast-lookup/reporting projection and is *derived* from the layers, never
 *   treated as authoritative for costing.
 *
 * - Every stock-inward movement creates a layer. Sales consume layers
 *   oldest-first (receipt_date ASC, fifo_seq ASC). Each consumption is
 *   persisted as an InventoryCostAllocation linked to its stock-out
 *   InventoryTransaction, so returns/cancellations restore the original cost.
 */
class FifoCostService {
  /**
   * Create a FIFO layer for a stock-inward movement.
   */
  static async addLayer(params, transaction = null) {
    const qty = this._round(parseFloat(params.quantity) || 0, 4);
    const unit = this._round(parseFloat(params.unitCost) || 0, 6);
    if (qty <= 0) return null;

    const value = this._round(qty * unit, 6);
    const receiptDate = params.receiptDate || new Date().toISOString().split('T')[0];

    const layer = await InventoryCostLayer.create({
      tenantId: params.tenantId,
      itemId: params.itemId,
      variantId: params.variantId || null,
      warehouseId: params.warehouseId,
      sourceType: params.sourceType,
      sourceId: params.sourceId || null,
      sourceLineId: params.sourceLineId || null,
      stockInTransactionId: params.stockInTransactionId || null,
      receivedQuantity: qty,
      remainingQuantity: qty,
      unitCost: unit,
      originalValue: value,
      remainingValue: value,
      receiptDate,
    }, { transaction });

    return layer;
  }

  /**
   * Total sellable quantity across remaining FIFO layers for the
   * (company, item, warehouse, variant) scope.
   */
  static async getAvailableQuantity(tenantId, itemId, warehouseId, variantId = null, transaction = null) {
    const sum = await InventoryCostLayer.sum('remainingQuantity', {
      where: { tenantId, itemId, warehouseId, variantId, remainingQuantity: { [Op.gt]: 0 } },
      transaction,
    });
    return this._round(parseFloat(sum) || 0, 4);
  }

  /**
   * Read-only FIFO cost + availability preview for a given quantity, without
   * locking or decrementing layers.
   * @returns { available, cost, hasLayers }
   */
  static async peekFifoCost(tenantId, itemId, warehouseId, variantId = null, quantity = 0, transaction = null) {
    const layers = await InventoryCostLayer.findAll({
      where: { tenantId, itemId, warehouseId, variantId, remainingQuantity: { [Op.gt]: 0 } },
      order: [['receiptDate', 'ASC'], ['fifoSeq', 'ASC']],
      transaction,
    });
    let available = 0;
    let remaining = this._round(parseFloat(quantity) || 0, 4);
    let cost = 0;
    for (const l of layers) {
      const layerRemaining = this._round(parseFloat(l.remainingQuantity) || 0, 4);
      available += layerRemaining;
      if (remaining <= 0) continue;
      const take = Math.min(layerRemaining, remaining);
      cost += this._round(take * this._round(parseFloat(l.unitCost) || 0, 6), 6);
      remaining = this._round(remaining - take, 4);
    }
    return { available: this._round(available, 4), cost: this._round(cost, 6), hasLayers: layers.length > 0 };
  }

  /**
   * Lock and return eligible layers (oldest first) for consumption.
   */
  static async _lockEligibleLayers(tenantId, itemId, warehouseId, variantId = null, transaction) {
    return InventoryCostLayer.findAll({
      where: { tenantId, itemId, warehouseId, variantId, remainingQuantity: { [Op.gt]: 0 } },
      order: [['receiptDate', 'ASC'], ['fifoSeq', 'ASC']],
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
  }

  /**
   * Consume stock FIFO for one sales invoice line.
   *
   * Locks the eligible layers, validates availability, decrements layer
   * quantities, persists one allocation per layer consumed and writes the
   * matching stock-out InventoryTransaction.
   *
   * @returns {Array} allocations [{ layerId, quantity, unitCost, totalCost }]
   */
  static async consumeForSale({ tenantId, detail, item, invoice, runningBalances, transaction }) {
    const quantity = this._round(parseFloat(detail.quantity) || 0, 4);
    const variantId = detail.variantId || null;
    const warehouseId = invoice.warehouseId;

    if (quantity <= 0) return [];

    const layers = await this._lockEligibleLayers(tenantId, detail.itemId, warehouseId, variantId, transaction);

    let available = 0;
    for (const l of layers) available += this._round(parseFloat(l.remainingQuantity) || 0, 4);
    available = this._round(available, 4);

    if (available < quantity) {
      const name = item ? item.name : detail.itemId;
      throw new BadRequestError(
        `Insufficient stock for "${name}". Available (FIFO): ${available}, requested: ${quantity}. ` +
        'Run the inventory cost-layer reconciliation if stock exists but no cost layers were found.'
      );
    }

    const balanceKey = `${tenantId}:${detail.itemId}:${warehouseId}:${variantId}`;
    let running = runningBalances.get(balanceKey);
    if (running === undefined) {
      // Seed the running balance from the FIFO layers (authoritative), not the
      // possibly-stale inventory_balances projection.
      running = await FifoCostService.getAvailableQuantity(tenantId, detail.itemId, warehouseId, variantId, transaction);
    }

    const allocations = [];
    let remaining = quantity;

    for (const layer of layers) {
      if (remaining <= 0) break;
      const layerRemaining = this._round(parseFloat(layer.remainingQuantity) || 0, 4);
      if (layerRemaining <= 0) continue;

      const take = Math.min(layerRemaining, remaining);
      const unitCost = this._round(parseFloat(layer.unitCost) || 0, 6);
      const totalCost = this._round(take * unitCost, 6);

      // Decrement the layer.
      const newRemainingQty = this._round(layerRemaining - take, 4);
      const newRemainingValue = this._round(parseFloat(layer.remainingValue || 0) - totalCost, 6);
      await layer.update({
        remainingQuantity: newRemainingQty,
        remainingValue: newRemainingValue < 0 ? 0 : newRemainingValue,
      }, { transaction });

      // Stock-out transaction (one per allocation — drives stock history UI).
      running = this._round(running - take, 4);
      const stockTx = await InventoryTransaction.create({
        tenantId,
        itemId: detail.itemId,
        variantId,
        warehouseId,
        transactionType: 'sale',
        referenceType: 'SalesInvoice',
        referenceId: invoice.id,
        referenceNumber: invoice.invoiceNumber,
        referenceLineId: detail.id,
        quantityIn: 0,
        quantityOut: take,
        runningBalance: running,
        unitCost,
        transactionDate: new Date(),
      }, { transaction });

      const allocation = await InventoryCostAllocation.create({
        tenantId,
        allocationType: 'sale',
        salesInvoiceId: invoice.id,
        salesInvoiceDetailId: detail.id,
        itemId: detail.itemId,
        variantId,
        warehouseId,
        costLayerId: layer.id,
        quantity: take,
        unitCost,
        totalCost,
        stockTransactionId: stockTx.id,
      }, { transaction });

      allocations.push({ layerId: layer.id, quantity: take, unitCost, totalCost, allocationId: allocation.id });
      remaining = this._round(remaining - take, 4);
    }

    runningBalances.set(balanceKey, running);
    return allocations;
  }

  /**
   * Consume stock for every inventory-tracked line of an invoice.
   * @returns {Map} detailId -> allocations
   */
  static async consumeInvoiceStock(tenantId, invoice, transaction) {
    const allocationsByDetail = new Map();
    const runningBalances = new Map();
    for (const detail of invoice.details || []) {
      if (!detail.itemId) continue;
      const item = detail.item;
      if (!item || item.itemType !== 'product' || item.isInventoryTracked === false) continue;
      if (!invoice.warehouseId) continue;
      const qty = parseFloat(detail.quantity) || 0;
      if (qty <= 0) continue;
      const allocations = await FifoCostService.consumeForSale({
        tenantId, detail, item, invoice, runningBalances, transaction,
      });
      allocationsByDetail.set(detail.id, allocations);
    }

    // Reconcile balances (quantity + value) from the layers after consumption.
    for (const key of runningBalances.keys()) {
      const [t, itemId, warehouseId, variantId] = key.split(':');
      await FifoCostService.recomputeBalance(t, itemId, warehouseId, variantId === 'null' || !variantId ? null : variantId, transaction);
    }

    return allocationsByDetail;
  }

  /**
   * Retrieve the persisted sale allocations for a sales invoice line.
   */
  static async getSaleAllocations(tenantId, salesInvoiceDetailId, transaction = null) {
    const rows = await InventoryCostAllocation.findAll({
      where: { tenantId, salesInvoiceDetailId, allocationType: 'sale' },
      include: [{ model: InventoryCostLayer, as: 'costLayer', attributes: ['receiptDate', 'fifoSeq'] }],
      order: [
        [{ model: InventoryCostLayer, as: 'costLayer' }, 'receiptDate', 'ASC'],
        [{ model: InventoryCostLayer, as: 'costLayer' }, 'fifoSeq', 'ASC'],
      ],
      transaction,
    });
    return rows;
  }

  /**
   * Quantity already restored against a set of sale allocations.
   * Considers BOTH sales-return and cancellation restorations so that a
   * cancellation after a partial return never restores the same stock twice.
   * @param {Array} saleAllocations - InventoryCostAllocation rows
   */
  static async _getAlreadyRestored(tenantId, saleAllocationIds, transaction) {
    if (!saleAllocationIds.length) return new Map();
    const rows = await InventoryCostAllocation.findAll({
      where: {
        tenantId,
        allocationType: { [Op.in]: ['return', 'cancel'] },
        reversesAllocationId: { [Op.in]: saleAllocationIds },
      },
      transaction,
    });
    const map = new Map();
    for (const r of rows) {
      map.set(r.reversesAllocationId, this._round((map.get(r.reversesAllocationId) || 0) + this._round(parseFloat(r.quantity) || 0, 4), 4));
    }
    return map;
  }

  /**
   * Restore stock to its original cost layers (for sales returns and invoice
   * cancellation/unpost).
   *
   * Deterministic policy: restore oldest allocation first (same FIFO order as
   * the original consumption).
   *
   * @param {Object} context
   *   allocationType: 'return' | 'cancel'
   *   referenceType / referenceId / referenceNumber / referenceLineId
   *   salesReturnId / salesReturnDetailId (optional, for returns)
   * @returns restored allocations [{ allocationId, quantity, unitCost, totalCost, layerId }]
   */
  static async restoreAllocations(tenantId, saleAllocations, quantityToRestore, context, transaction) {
    let remaining = this._round(parseFloat(quantityToRestore) || 0, 4);
    const restored = [];

    // Idempotency: never restore more than the original allocation's quantity.
    const already = await this._getAlreadyRestored(tenantId, saleAllocations.map((a) => a.id), transaction);

    let running = await this.getAvailableQuantity(tenantId, context.itemId, context.warehouseId, context.variantId || null, transaction);

    for (const alloc of saleAllocations) {
      if (remaining <= 0) break;
      const allocQty = this._round(parseFloat(alloc.quantity) || 0, 4);
      const alreadyRestored = this._round(already.get(alloc.id) || 0, 4);
      const restorable = this._round(allocQty - alreadyRestored, 4);
      if (restorable <= 0) continue;

      const take = Math.min(restorable, remaining);
      const unitCost = this._round(parseFloat(alloc.unitCost) || 0, 6);
      const totalCost = this._round(take * unitCost, 6);

      // Put quantity back onto the original layer.
      const layer = await InventoryCostLayer.findByPk(alloc.costLayerId, { transaction });
      if (layer) {
        await layer.update({
          remainingQuantity: this._round(this._round(parseFloat(layer.remainingQuantity) || 0, 4) + take, 4),
          remainingValue: this._round(this._round(parseFloat(layer.remainingValue) || 0, 6) + totalCost, 6),
        }, { transaction });
      }

      // Stock-in transaction for the restoration.
      running = this._round(running + take, 4);
      const stockTx = await InventoryTransaction.create({
        tenantId,
        itemId: context.itemId,
        variantId: context.variantId || null,
        warehouseId: context.warehouseId,
        transactionType: 'return',
        referenceType: context.referenceType,
        referenceId: context.referenceId,
        referenceNumber: context.referenceNumber,
        referenceLineId: context.referenceLineId || null,
        quantityIn: take,
        quantityOut: 0,
        runningBalance: running,
        unitCost,
        transactionDate: new Date(),
      }, { transaction });

      const row = await InventoryCostAllocation.create({
        tenantId,
        allocationType: context.allocationType,
        salesInvoiceId: context.salesInvoiceId || null,
        salesInvoiceDetailId: context.salesInvoiceDetailId || null,
        salesReturnId: context.salesReturnId || null,
        salesReturnDetailId: context.salesReturnDetailId || null,
        itemId: context.itemId,
        variantId: context.variantId || null,
        warehouseId: context.warehouseId,
        costLayerId: alloc.costLayerId,
        quantity: take,
        unitCost,
        totalCost,
        stockTransactionId: stockTx.id,
        reversesAllocationId: alloc.id,
      }, { transaction });

      restored.push({ allocationId: row.id, layerId: alloc.costLayerId, quantity: take, unitCost, totalCost });
      remaining = this._round(remaining - take, 4);
    }

    // Keep the InventoryBalance projection in sync with the restored layers so
    // stock-availability lookups (item picker, reports) immediately reflect the
    // restored quantity. Mirrors the reconciliation performed after
    // consumeInvoiceStock. Run even when nothing was restored this call so a
    // previously-stale projection self-heals on the next touch.
    await this.recomputeBalance(
      tenantId,
      context.itemId,
      context.warehouseId,
      context.variantId || null,
      transaction
    );

    return restored;
  }

  static async _currentBalance(tenantId, itemId, warehouseId, variantId, transaction) {
    const balance = await InventoryBalance.findOne({
      where: { tenantId, itemId, warehouseId, variantId },
      transaction,
    });
    return this._round(parseFloat(balance ? balance.quantityOnHand : 0) || 0, 4);
  }

  /**
   * Re-derive InventoryBalance (quantity + average cost) from the layers.
   */
  static async recomputeBalance(tenantId, itemId, warehouseId, variantId = null, transaction = null) {
    const rows = await InventoryCostLayer.findAll({
      where: { tenantId, itemId, warehouseId, variantId },
      transaction,
    });
    // If no FIFO layers exist for this scope, leave any legacy balance
    // untouched — never silently zero legacy data.
    if (!rows.length) return { quantityOnHand: null, averageCost: null };

    let qty = 0;
    let value = 0;
    for (const r of rows) {
      qty += this._round(parseFloat(r.remainingQuantity) || 0, 4);
      value += this._round(parseFloat(r.remainingValue) || 0, 6);
    }
    qty = this._round(qty, 4);
    value = this._round(value, 6);
    const averageCost = qty > 0 ? this._round(value / qty, 4) : 0;

    const balance = await InventoryBalance.findOne({
      where: { tenantId, itemId, warehouseId, variantId },
      transaction,
    });
    if (balance) {
      await balance.update({ quantityOnHand: qty, averageCost }, { transaction });
    } else {
      await InventoryBalance.create({
        tenantId, itemId, warehouseId, variantId,
        quantityOnHand: qty, averageCost,
      }, { transaction });
    }
    return { quantityOnHand: qty, averageCost };
  }

  /**
   * Sum the total cost of a list of allocation plain objects.
   */
  static sumAllocationCost(allocations) {
    return this._round((allocations || []).reduce((s, a) => s + (parseFloat(a.totalCost) || 0), 0), 2);
  }

  /**
   * Consume FIFO layers without creating sales allocations or stock
   * transactions (used by warehouse transfers and other non-sales stock-out
   * flows that must preserve per-layer costs).
   *
   * Locks the eligible layers, decrements them, and returns the per-layer
   * breakdown [{ layerId, quantity, unitCost, totalCost }].
   */
  static async consumeLayers(tenantId, itemId, warehouseId, variantId, quantity, transaction) {
    const qty = this._round(parseFloat(quantity) || 0, 4);
    if (qty <= 0) return [];

    const layers = await this._lockEligibleLayers(tenantId, itemId, warehouseId, variantId, transaction);
    let available = 0;
    for (const l of layers) available += this._round(parseFloat(l.remainingQuantity) || 0, 4);
    available = this._round(available, 4);

    if (available < qty) {
      return { insufficient: true, available };
    }

    const breakdown = [];
    let remaining = qty;
    for (const layer of layers) {
      if (remaining <= 0) break;
      const layerRemaining = this._round(parseFloat(layer.remainingQuantity) || 0, 4);
      if (layerRemaining <= 0) continue;
      const take = Math.min(layerRemaining, remaining);
      const unitCost = this._round(parseFloat(layer.unitCost) || 0, 6);
      const totalCost = this._round(take * unitCost, 6);
      await layer.update({
        remainingQuantity: this._round(layerRemaining - take, 4),
        remainingValue: Math.max(0, this._round(parseFloat(layer.remainingValue || 0) - totalCost, 6)),
      }, { transaction });
      breakdown.push({ layerId: layer.id, quantity: take, unitCost, totalCost });
      remaining = this._round(remaining - take, 4);
    }
    return breakdown;
  }

  static _round(value, decimals) {
    const f = Math.pow(10, decimals);
    return Math.round((parseFloat(value) || 0) * f) / f;
  }
}

module.exports = FifoCostService;
