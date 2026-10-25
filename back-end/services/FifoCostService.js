'use strict';
const { Op } = require('sequelize');
const {
  sequelize,
  InventoryCostLayer,
  InventoryCostAllocation,
  InventoryTransaction,
  InventoryBalance,
  GoodsReceipt,
  PurchaseInvoice,
  SalesInvoice,
  SalesReturn,
  PurchaseReturn,
  StockAdjustment,
  StockTransfer,
  DeliveryNote,
  Supplier,
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

  static _normalizeManualAllocations(detail) {
    const raw = Array.isArray(detail?.manualAllocations)
      ? detail.manualAllocations
      : Array.isArray(detail?.costLayerAllocations)
        ? detail.costLayerAllocations
        : Array.isArray(detail?.selectedCostLayers)
          ? detail.selectedCostLayers
          : [];

    const byLayer = new Map();
    for (const entry of raw || []) {
      const costLayerId = entry?.costLayerId || entry?.layerId || entry?.id || entry?.costLayerID;
      const qty = this._round(parseFloat(entry?.quantity) || 0, 4);
      if (!costLayerId || qty <= 0) continue;
      const total = this._round((byLayer.get(costLayerId) || 0) + qty, 4);
      byLayer.set(costLayerId, total);
    }

    return Array.from(byLayer.entries()).map(([costLayerId, quantity]) => ({ costLayerId, quantity }));
  }

  /**
   * List the eligible stock cost layers available for manual source selection,
   * enriched with the source document (GRN / Purchase Invoice) and supplier so
   * the UI can display a human-readable stock receipt rather than a raw layer ID.
   *
   * Source semantics:
   * - sourceType 'receipt'  → stock received through a Goods Receipt (GRN).
   * - sourceType 'purchase' → stock inward created directly by a Purchase
   *   Invoice. When that Purchase Invoice is linked to a GRN
   *   (`goodsReceiptId`), the physical receipt is already represented by the
   *   GRN's 'receipt' layer, so the duplicate 'purchase' layer is skipped to
   *   avoid showing/allocating the same stock twice.
   */
  static async getEligibleCostLayers(tenantId, itemId, warehouseId, variantId = null, transaction = null) {
    const rows = await InventoryCostLayer.findAll({
      where: {
        tenantId,
        itemId,
        warehouseId,
        variantId: variantId || null,
        remainingQuantity: { [Op.gt]: 0 },
      },
      order: [['receiptDate', 'ASC'], ['fifoSeq', 'ASC']],
      transaction,
    });

    // Collect source document IDs so metadata can be resolved in bulk (avoids
    // an N+1 query per layer).
    const sourceIds = {
      receipt: new Set(),
      purchase: new Set(),
      sales_return: new Set(),
      purchase_return: new Set(),
      adjustment: new Set(),
      transfer_in: new Set(),
    };
    const stockTransactionIds = new Set();
    for (const layer of rows) {
      if (layer.sourceId && sourceIds[layer.sourceType]) {
        sourceIds[layer.sourceType].add(layer.sourceId);
      }
      if (layer.sourceType === 'return' && layer.stockInTransactionId) {
        stockTransactionIds.add(layer.stockInTransactionId);
      }
    }

    const [grns, pis, salesReturns, purchaseReturns, adjustments, transfers, stockTransactions] = await Promise.all([
      sourceIds.receipt.size
        ? GoodsReceipt.findAll({
            where: { id: { [Op.in]: [...sourceIds.receipt] }, tenantId },
            attributes: ['id', 'grnNumber', 'receiptDate', 'supplierId'],
            paranoid: false,
            transaction,
          })
        : [],
      sourceIds.purchase.size
        ? PurchaseInvoice.findAll({
            where: { id: { [Op.in]: [...sourceIds.purchase] }, tenantId },
            attributes: ['id', 'invoiceNumber', 'supplierId', 'invoiceDate', 'goodsReceiptId'],
            paranoid: false,
            transaction,
          })
        : [],
      sourceIds.sales_return.size
        ? SalesReturn.findAll({
            where: { id: { [Op.in]: [...sourceIds.sales_return] }, tenantId },
            attributes: ['id', 'returnNumber', 'returnDate', 'customerId'],
            paranoid: false,
            transaction,
          })
        : [],
      sourceIds.purchase_return.size
        ? PurchaseReturn.findAll({
            where: { id: { [Op.in]: [...sourceIds.purchase_return] }, tenantId },
            attributes: ['id', 'returnNumber', 'returnDate', 'supplierId'],
            paranoid: false,
            transaction,
          })
        : [],
      sourceIds.adjustment.size
        ? StockAdjustment.findAll({
            where: { id: { [Op.in]: [...sourceIds.adjustment] }, tenantId },
            attributes: ['id', 'adjustmentNumber', 'adjustmentDate'],
            transaction,
          })
        : [],
      sourceIds.transfer_in.size
        ? StockTransfer.findAll({
            where: { id: { [Op.in]: [...sourceIds.transfer_in] }, tenantId },
            attributes: ['id', 'transferNumber', 'transferDate'],
            transaction,
          })
        : [],
      stockTransactionIds.size
        ? InventoryTransaction.findAll({
            where: { id: { [Op.in]: [...stockTransactionIds] }, tenantId },
            attributes: ['id', 'referenceType', 'referenceId'],
            transaction,
          })
        : [],
    ]);

    const returnReferenceIds = {
      salesReturns: new Set(),
      salesInvoices: new Set(),
      deliveryNotes: new Set(),
      purchaseInvoices: new Set(),
    };
    for (const stockTransaction of stockTransactions) {
      if (!stockTransaction.referenceId) continue;
      const referenceType = String(stockTransaction.referenceType || '').toLowerCase().replace(/[^a-z]/g, '');
      if (referenceType === 'salesreturn') returnReferenceIds.salesReturns.add(stockTransaction.referenceId);
      else if (referenceType === 'salesinvoicecancel') returnReferenceIds.salesInvoices.add(stockTransaction.referenceId);
      else if (referenceType === 'deliverynotecancel') returnReferenceIds.deliveryNotes.add(stockTransaction.referenceId);
      else if (referenceType === 'purchaseinvoicecancel') returnReferenceIds.purchaseInvoices.add(stockTransaction.referenceId);
    }

    const [returnSalesDocs, returnInvoiceDocs, returnDeliveryDocs, returnPurchaseDocs] = await Promise.all([
      returnReferenceIds.salesReturns.size
        ? SalesReturn.findAll({
            where: { id: { [Op.in]: [...returnReferenceIds.salesReturns] }, tenantId },
            attributes: ['id', 'returnNumber', 'returnDate'],
            paranoid: false,
            transaction,
          })
        : [],
      returnReferenceIds.salesInvoices.size
        ? SalesInvoice.findAll({
            where: { id: { [Op.in]: [...returnReferenceIds.salesInvoices] }, tenantId },
            attributes: ['id', 'invoiceNumber'],
            paranoid: false,
            transaction,
          })
        : [],
      returnReferenceIds.deliveryNotes.size
        ? DeliveryNote.findAll({
            where: { id: { [Op.in]: [...returnReferenceIds.deliveryNotes] }, tenantId },
            attributes: ['id', 'deliveryNumber'],
            paranoid: false,
            transaction,
          })
        : [],
      returnReferenceIds.purchaseInvoices.size
        ? PurchaseInvoice.findAll({
            where: { id: { [Op.in]: [...returnReferenceIds.purchaseInvoices] }, tenantId },
            attributes: ['id', 'invoiceNumber'],
            paranoid: false,
            transaction,
          })
        : [],
    ]);

    const supplierIds = new Set();
    for (const grn of grns) if (grn.supplierId) supplierIds.add(grn.supplierId);
    for (const pi of pis) if (pi.supplierId) supplierIds.add(pi.supplierId);
    for (const purchaseReturn of purchaseReturns) if (purchaseReturn.supplierId) supplierIds.add(purchaseReturn.supplierId);
    const suppliers = supplierIds.size
      ? await Supplier.findAll({
          where: { id: { [Op.in]: [...supplierIds] }, tenantId },
          attributes: ['id', 'name', 'code'],
          paranoid: false,
          transaction,
        })
      : [];
    const supplierMap = new Map(suppliers.map((s) => [s.id, s]));

    const grnMap = new Map(grns.map((g) => [g.id, g]));
    const piMap = new Map([...pis, ...returnPurchaseDocs].map((p) => [p.id, p]));
    const salesReturnMap = new Map([...salesReturns, ...returnSalesDocs].map((r) => [r.id, r]));
    const salesInvoiceMap = new Map(returnInvoiceDocs.map((invoice) => [invoice.id, invoice]));
    const deliveryNoteMap = new Map(returnDeliveryDocs.map((delivery) => [delivery.id, delivery]));
    const purchaseReturnMap = new Map(purchaseReturns.map((r) => [r.id, r]));
    const adjustmentMap = new Map(adjustments.map((a) => [a.id, a]));
    const transferMap = new Map(transfers.map((t) => [t.id, t]));
    const stockTransactionMap = new Map(stockTransactions.map((t) => [t.id, t]));
    // Purchase invoices linked to a GRN: their physical receipt is the GRN.
    const piGrnLink = new Map();
    for (const pi of pis) {
      if (pi.goodsReceiptId) piGrnLink.set(pi.id, pi.goodsReceiptId);
    }
    // GRN ids that actually produced a receipt layer in this scope.
    const receiptLayerGrnIds = new Set(
      rows.filter((l) => l.sourceType === 'receipt' && l.sourceId).map((l) => l.sourceId)
    );

    const result = [];
    for (const layer of rows) {
      // Skip the duplicate layer created when a GRN-linked Purchase Invoice
      // was posted: the GRN layer already represents that stock. Only skip
      // when that GRN produced a receipt layer for this exact scope.
      if (
        layer.sourceType === 'purchase' &&
        piGrnLink.has(layer.sourceId) &&
        receiptLayerGrnIds.has(piGrnLink.get(layer.sourceId))
      ) {
        continue;
      }

      const entry = {
        id: layer.id,
        costLayerId: layer.id,
        itemId: layer.itemId,
        warehouseId: layer.warehouseId,
        variantId: layer.variantId,
        sourceType: layer.sourceType,
        sourceId: layer.sourceId,
        sourceLineId: layer.sourceLineId,
        remainingQuantity: this._round(parseFloat(layer.remainingQuantity) || 0, 4),
        receivedQuantity: this._round(parseFloat(layer.receivedQuantity) || 0, 4),
        unitCost: this._round(parseFloat(layer.unitCost) || 0, 6),
        remainingValue: this._round(parseFloat(layer.remainingValue) || 0, 6),
        receiptDate: layer.receiptDate,
      };

      entry.sourceLabel = 'Stock receipt';
      entry.sourceDocumentType = 'Stock';
      entry.sourceNumber = null;
      entry.documentDate = layer.receiptDate;

      if (layer.sourceType === 'receipt' && grnMap.has(layer.sourceId)) {
        const grn = grnMap.get(layer.sourceId);
        entry.sourceLabel = 'Goods received';
        entry.sourceDocumentType = 'GRN';
        entry.grnNumber = grn.grnNumber || null;
        entry.sourceNumber = grn.grnNumber || null;
        entry.documentDate = grn.receiptDate || layer.receiptDate;
        if (grn.supplierId && supplierMap.has(grn.supplierId)) {
          entry.supplierName = supplierMap.get(grn.supplierId).name || null;
        }
        const linkedPi = pis.find((p) => p.goodsReceiptId === layer.sourceId);
        entry.purchaseInvoiceNumber = linkedPi ? linkedPi.invoiceNumber : null;
      } else if (layer.sourceType === 'purchase' && piMap.has(layer.sourceId)) {
        const pi = piMap.get(layer.sourceId);
        entry.sourceLabel = 'Purchased';
        entry.sourceDocumentType = 'Purchase Invoice';
        entry.purchaseInvoiceNumber = pi.invoiceNumber || null;
        entry.sourceNumber = pi.invoiceNumber || null;
        entry.documentDate = pi.invoiceDate || layer.receiptDate;
        if (pi.supplierId && supplierMap.has(pi.supplierId)) {
          entry.supplierName = supplierMap.get(pi.supplierId).name || null;
        }
        const linkedGrn = pi.goodsReceiptId && grnMap.has(pi.goodsReceiptId)
          ? grnMap.get(pi.goodsReceiptId)
          : null;
        entry.grnNumber = linkedGrn ? linkedGrn.grnNumber : null;
      } else if (layer.sourceType === 'sales_return' && salesReturnMap.has(layer.sourceId)) {
        const salesReturn = salesReturnMap.get(layer.sourceId);
        entry.sourceLabel = 'Customer return';
        entry.sourceDocumentType = 'Sales return';
        entry.sourceNumber = salesReturn.returnNumber || null;
        entry.documentDate = salesReturn.returnDate || layer.receiptDate;
      } else if (layer.sourceType === 'purchase_return' && purchaseReturnMap.has(layer.sourceId)) {
        const purchaseReturn = purchaseReturnMap.get(layer.sourceId);
        entry.sourceLabel = 'Purchase return reversal';
        entry.sourceDocumentType = 'Purchase return';
        entry.sourceNumber = purchaseReturn.returnNumber || null;
        entry.documentDate = purchaseReturn.returnDate || layer.receiptDate;
        if (purchaseReturn.supplierId && supplierMap.has(purchaseReturn.supplierId)) {
          entry.supplierName = supplierMap.get(purchaseReturn.supplierId).name || null;
        }
      } else if (layer.sourceType === 'adjustment' && adjustmentMap.has(layer.sourceId)) {
        const adjustment = adjustmentMap.get(layer.sourceId);
        entry.sourceLabel = 'Stock adjustment';
        entry.sourceDocumentType = 'Stock adjustment';
        entry.sourceNumber = adjustment.adjustmentNumber || null;
        entry.documentDate = adjustment.adjustmentDate || layer.receiptDate;
      } else if (layer.sourceType === 'transfer_in' && transferMap.has(layer.sourceId)) {
        const transfer = transferMap.get(layer.sourceId);
        entry.sourceLabel = 'Warehouse transfer';
        entry.sourceDocumentType = 'Stock transfer';
        entry.sourceNumber = transfer.transferNumber || null;
        entry.documentDate = transfer.transferDate || layer.receiptDate;
      } else if (layer.sourceType === 'opening_balance') {
        entry.sourceLabel = 'Opening balance';
        entry.sourceDocumentType = 'Opening balance';
      } else if (layer.sourceType === 'return') {
        const stockTransaction = stockTransactionMap.get(layer.stockInTransactionId);
        const referenceType = stockTransaction?.referenceType;
        const referenceId = stockTransaction?.referenceId;
        const normalizedReference = String(referenceType || '').toLowerCase().replace(/[^a-z]/g, '');
        if (normalizedReference === 'salesreturn') {
          const salesReturn = salesReturnMap.get(referenceId);
          entry.sourceLabel = 'Customer return';
          entry.sourceDocumentType = 'Sales return';
          entry.sourceNumber = salesReturn?.returnNumber || null;
          entry.documentDate = salesReturn?.returnDate || layer.receiptDate;
        } else if (normalizedReference === 'salesinvoicecancel') {
          const invoice = salesInvoiceMap.get(referenceId);
          entry.sourceLabel = 'Sales invoice cancellation';
          entry.sourceDocumentType = 'Sales invoice cancellation';
          entry.sourceNumber = invoice?.invoiceNumber || null;
        } else if (normalizedReference === 'deliverynotecancel') {
          const deliveryNote = deliveryNoteMap.get(referenceId);
          entry.sourceLabel = 'Delivery note cancellation';
          entry.sourceDocumentType = 'Delivery note cancellation';
          entry.sourceNumber = deliveryNote?.deliveryNumber || null;
        } else if (normalizedReference === 'purchaseinvoicecancel') {
          const invoice = piMap.get(referenceId);
          entry.sourceLabel = 'Purchase invoice cancellation';
          entry.sourceDocumentType = 'Purchase invoice cancellation';
          entry.sourceNumber = invoice?.invoiceNumber || null;
        } else {
          entry.sourceLabel = 'Returned stock';
          entry.sourceDocumentType = 'Stock return';
        }
      }

      result.push(entry);
    }

    return result;
  }

  /**
   * Consume stock FIFO for one sales invoice line, or consume from a manually
   * chosen cost layer selection when provided.
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

    const manualAllocations = this._normalizeManualAllocations(detail);
    if (manualAllocations.length) {
      const batch = manualAllocations.map((entry) => ({
        costLayerId: entry.costLayerId,
        quantity: this._round(parseFloat(entry.quantity) || 0, 4),
      }));

      const totalSelected = this._round(batch.reduce((sum, entry) => sum + entry.quantity, 0), 4);
      if (this._round(totalSelected, 4) !== this._round(quantity, 4)) {
        throw new BadRequestError(`Selected stock allocations total ${totalSelected} but the line quantity is ${quantity}. The selected GRNs must exactly match the sales quantity.`);
      }

      const layerIds = batch.map((entry) => entry.costLayerId);
      const layers = await InventoryCostLayer.findAll({
        where: { id: { [Op.in]: layerIds }, tenantId, itemId: detail.itemId, warehouseId, variantId },
        order: [['receiptDate', 'ASC'], ['fifoSeq', 'ASC']],
        lock: transaction.LOCK.UPDATE,
        transaction,
      });
      const layerMap = new Map(layers.map((layer) => [layer.id, layer]));
      for (const entry of batch) {
        const layer = layerMap.get(entry.costLayerId);
        if (!layer) {
          throw new BadRequestError('Selected GRN no longer exists or belongs to a different warehouse/company for this item.');
        }
        const available = this._round(parseFloat(layer.remainingQuantity) || 0, 4);
        if (available < entry.quantity) {
          throw new BadRequestError(`Selected GRN has insufficient stock. Available: ${available}, requested: ${entry.quantity}.`);
        }
      }

      const balanceKey = `${tenantId}:${detail.itemId}:${warehouseId}:${variantId}`;
      let running = runningBalances.get(balanceKey);
      if (running === undefined) {
        running = await FifoCostService.getAvailableQuantity(tenantId, detail.itemId, warehouseId, variantId, transaction);
      }

      const allocations = [];
      for (const entry of batch) {
        const layer = layerMap.get(entry.costLayerId);
        const take = this._round(parseFloat(entry.quantity) || 0, 4);
        const unitCost = this._round(parseFloat(layer.unitCost) || 0, 6);
        const totalCost = this._round(take * unitCost, 6);
        const originalQty = this._round(parseFloat(layer.remainingQuantity) || 0, 4);
        const originalValue = this._round(parseFloat(layer.remainingValue || 0) || 0, 6);
        await layer.update({
          remainingQuantity: this._round(originalQty - take, 4),
          remainingValue: this._round(Math.max(0, originalValue - totalCost), 6),
        }, { transaction });

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
      }

      runningBalances.set(balanceKey, running);
      return allocations;
    }

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

      const newRemainingQty = this._round(layerRemaining - take, 4);
      const newRemainingValue = this._round(parseFloat(layer.remainingValue || 0) - totalCost, 6);
      await layer.update({
        remainingQuantity: newRemainingQty,
        remainingValue: newRemainingValue < 0 ? 0 : newRemainingValue,
      }, { transaction });

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
