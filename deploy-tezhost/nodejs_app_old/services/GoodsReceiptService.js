'use strict';
const { GoodsReceipt, GoodsReceiptDetail, PurchaseOrder, PurchaseOrderDetail, Item, InventoryBalance, InventoryTransaction, sequelize } = require('../models');
const goodsReceiptRepository = require('../repositories/GoodsReceiptRepository');
const journalEntryService = require('./JournalEntryService');
const { GoodsReceiptDTO } = require('../dto/GoodsReceiptDTO');
const { Op } = require('sequelize');

class GoodsReceiptService {
  async list(tenantId, query) {
    const { rows, count, page, limit } = await goodsReceiptRepository.findAll(tenantId, query);
    return {
      data: rows.map((r) => new GoodsReceiptDTO(r)),
      count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  async getById(tenantId, id) {
    const gr = await goodsReceiptRepository.findById(tenantId, id);
    if (!gr) {
      const err = new Error('Goods Receipt not found');
      err.statusCode = 404;
      throw err;
    }
    return new GoodsReceiptDTO(gr);
  }

  async generateGRNNumber(tenantId) {
    const lastGRN = await goodsReceiptRepository.getMaxGRNNumber(tenantId);
    const year = new Date().getFullYear();
    if (!lastGRN) {
      return `GRN-${year}-00001`;
    }
    const parts = lastGRN.split('-');
    if (parts.length >= 3 && parts[0] === 'GRN') {
      const lastYear = parseInt(parts[1]);
      const lastNum = parseInt(parts[2]);
      if (lastYear === year) {
        return `GRN-${year}-${String(lastNum + 1).padStart(5, '0')}`;
      }
    }
    return `GRN-${year}-00001`;
  }

  async create(tenantId, data, userId) {
    let gr;
    const t = await sequelize.transaction();
    try {
      if (!data.grnNumber) {
        data.grnNumber = await this.generateGRNNumber(tenantId);
      }

      let supplierId = data.supplierId;
      let po = null;

      // If purchaseOrderId provided, validate PO and use its supplier
      if (data.purchaseOrderId) {
        po = await PurchaseOrder.findOne({
          where: { id: data.purchaseOrderId, tenantId },
          include: [{ model: PurchaseOrderDetail, as: 'details' }],
        });
        if (!po) {
          throw Object.assign(new Error('Purchase Order not found'), { statusCode: 404 });
        }
        if (po.status === 'draft' || po.status === 'cancelled' || po.status === 'closed') {
          throw Object.assign(
            new Error(`Cannot receive against PO with status: ${po.status}`),
            { statusCode: 400 }
          );
        }
        supplierId = po.supplierId;
      }

      // Supplier is required for both modes
      if (!supplierId) {
        throw Object.assign(new Error('Supplier is required'), { statusCode: 400 });
      }

      let totalQuantity = 0;
      const detailItems = [];
      for (const d of data.details) {
        let orderedQty = parseFloat(d.orderedQuantity || 0);
        let unitPrice = parseFloat(d.unitPrice || 0);
        let taxPct = parseFloat(d.taxPercentage || 0);
        let discPct = parseFloat(d.discountPercentage || 0);
        let description = d.description || '';

        // If PO exists, get values from PO details
        if (po) {
          const pod = po.details.find((pd) => pd.itemId === d.itemId);
          if (pod) {
            orderedQty = parseFloat(pod.quantity);
            unitPrice = parseFloat(d.unitPrice || pod.unitPrice || 0);
            taxPct = parseFloat(d.taxPercentage || pod.taxPercentage || 0);
            discPct = parseFloat(d.discountPercentage || pod.discountPercentage || 0);
            description = d.description || pod.description || '';
          }
        }

        const item = await Item.findByPk(d.itemId);
        if (!item) {
          throw Object.assign(new Error(`Item ID ${d.itemId} not found`), { statusCode: 404 });
        }

        // For product items, warehouse is required
        if (item.itemType !== 'service' && !data.warehouseId) {
          throw Object.assign(new Error('Warehouse is required for product items'), { statusCode: 400 });
        }

        // Check already received quantity (only when linked to a PO)
        if (po) {
          const alreadyReceived = await goodsReceiptRepository.getAlreadyReceivedQty(
            tenantId, data.purchaseOrderId, d.itemId
          );
          const newTotal = alreadyReceived + parseFloat(d.receivedQuantity);
          if (orderedQty > 0 && newTotal > orderedQty) {
            throw Object.assign(
              new Error(`Cannot receive more than ordered. Item: ${d.itemId}, Ordered: ${orderedQty}, Already Received: ${alreadyReceived}, This: ${d.receivedQuantity}`),
              { statusCode: 400 }
            );
          }
        }

        const qty = parseFloat(d.receivedQuantity);
        const lineTotal = qty * unitPrice;
        const discountAmt = lineTotal * (discPct / 100);
        const afterDiscount = lineTotal - discountAmt;
        const taxAmt = afterDiscount * (taxPct / 100);
        const finalTotal = afterDiscount + taxAmt;

        detailItems.push({
          itemId: d.itemId,
          description,
          orderedQuantity: orderedQty,
          receivedQuantity: qty,
          unitPrice,
          taxPercentage: taxPct,
          discountPercentage: discPct,
          lineTotal: parseFloat(finalTotal.toFixed(4)),
        });
        totalQuantity += qty;
      }

      gr = await goodsReceiptRepository.create(tenantId, {
        grnNumber: data.grnNumber,
        receiptDate: data.receiptDate,
        purchaseOrderId: data.purchaseOrderId || null,
        supplierId,
        warehouseId: data.warehouseId || null,
        reference: data.reference || '',
        notes: data.notes || '',
        status: 'draft',
        totalQuantity,
        createdBy: userId,
      }, t);

      const detailRecords = detailItems.map((d) => ({ ...d, goodsReceiptId: gr.id }));
      await goodsReceiptRepository.createDetails(detailRecords, t);

      await t.commit();
    } catch (err) {
      try { await t.rollback(); } catch (e) { /* ignore rollback errors */ }
      throw err;
    }

    // Fetch and return the created GRN (outside the transaction try-catch to avoid rollback on post-commit errors)
    const created = await goodsReceiptRepository.findById(tenantId, gr.id);
    return new GoodsReceiptDTO(created);
  }

  async update(tenantId, id, data, userId) {
    const existing = await goodsReceiptRepository.findById(tenantId, id);
    if (!existing) {
      throw Object.assign(new Error('Goods Receipt not found'), { statusCode: 404 });
    }
    if (existing.status !== 'draft') {
      throw Object.assign(new Error('Only draft goods receipts can be edited'), { statusCode: 400 });
    }

    const t = await sequelize.transaction();
    try {
      const headerData = { ...data };
      delete headerData.details;

      await goodsReceiptRepository.update(tenantId, id, headerData, t);

      if (data.details && data.details.length > 0) {
        let totalQuantity = 0;
        const detailRecords = [];
        for (const d of data.details) {
          const qty = parseFloat(d.receivedQuantity);
          const price = parseFloat(d.unitPrice || 0);
          const taxPct = parseFloat(d.taxPercentage || 0);
          const discPct = parseFloat(d.discountPercentage || 0);
          const lineTotal = qty * price;
          const discountAmt = lineTotal * (discPct / 100);
          const afterDiscount = lineTotal - discountAmt;
          const taxAmt = afterDiscount * (taxPct / 100);
          const finalTotal = afterDiscount + taxAmt;

          detailRecords.push({
            ...d,
            goodsReceiptId: id,
            lineTotal: parseFloat(finalTotal.toFixed(4)),
          });
          totalQuantity += qty;
        }

        await goodsReceiptRepository.replaceDetails(id, detailRecords, t);
        await goodsReceiptRepository.update(tenantId, id, { totalQuantity }, t);
      }

      await t.commit();
      const updated = await goodsReceiptRepository.findById(tenantId, id);
      return new GoodsReceiptDTO(updated);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async delete(tenantId, id) {
    const existing = await goodsReceiptRepository.findById(tenantId, id);
    if (!existing) {
      throw Object.assign(new Error('Goods Receipt not found'), { statusCode: 404 });
    }
    if (existing.status !== 'draft') {
      throw Object.assign(new Error('Only draft goods receipts can be deleted'), { statusCode: 400 });
    }
    const t = await sequelize.transaction();
    try {
      await goodsReceiptRepository.delete(tenantId, id, t);
      await t.commit();
      return { message: 'Goods Receipt deleted' };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async approve(tenantId, id, userId) {
    const existing = await goodsReceiptRepository.findById(tenantId, id);
    if (!existing) {
      throw Object.assign(new Error('Goods Receipt not found'), { statusCode: 404 });
    }
    if (existing.status === 'received') {
      throw Object.assign(new Error('Goods Receipt is already received'), { statusCode: 400 });
    }
    if (existing.status === 'cancelled') {
      throw Object.assign(new Error('Cannot approve a cancelled goods receipt'), { statusCode: 400 });
    }

    const t = await sequelize.transaction();
    try {
      // Process inventory impact: increase inventory for product items
      for (const detail of existing.details) {
        const item = await Item.findByPk(detail.itemId, { transaction: t });
        if (!item) continue;

        if (item.itemType === 'service') {
          // Service items - no inventory impact
          continue;
        }

        if (!existing.warehouseId) {
          throw Object.assign(
            new Error('Warehouse is required for product items to process inventory'),
            { statusCode: 400 }
          );
        }

        // Find or create inventory balance
        let balance = await InventoryBalance.findOne({
          where: { itemId: detail.itemId, warehouseId: existing.warehouseId, tenantId },
          transaction: t,
        });

        if (!balance) {
          balance = await InventoryBalance.create({
            tenantId,
            itemId: detail.itemId,
            warehouseId: existing.warehouseId,
            quantity: 0,
            totalValue: 0,
          }, { transaction: t });
        }

        const receivedQty = parseFloat(detail.receivedQuantity);
        const unitCost = parseFloat(detail.unitPrice);
        const totalCost = receivedQty * unitCost;

        const newQty = parseFloat(balance.quantity) + receivedQty;
        const newValue = parseFloat(balance.totalValue) + totalCost;

        await InventoryBalance.update(
          { quantity: newQty, totalValue: parseFloat(newValue.toFixed(4)) },
          { where: { id: balance.id }, transaction: t }
        );

        // Create inventory transaction record
        await InventoryTransaction.create({
          tenantId,
          itemId: detail.itemId,
          warehouseId: existing.warehouseId,
          referenceId: existing.id,
          referenceType: 'GoodsReceipt',
          transactionType: 'receipt',
          quantityIn: receivedQty,
          unitCost,
          runningBalance: newQty,
          transactionDate: new Date(),
        }, { transaction: t });
      }

      // Update status
      await GoodsReceipt.update(
        { status: 'received' },
        { where: { id, tenantId }, transaction: t }
      );

      await t.commit();

      // Update PO status after commit
      await this._updatePOStatus(tenantId, existing.purchaseOrderId);

      const updated = await goodsReceiptRepository.findById(tenantId, id);
      return new GoodsReceiptDTO(updated);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async cancel(tenantId, id, userId) {
    const existing = await goodsReceiptRepository.findById(tenantId, id);
    if (!existing) {
      throw Object.assign(new Error('Goods Receipt not found'), { statusCode: 404 });
    }
    if (existing.status === 'cancelled') {
      throw Object.assign(new Error('Goods Receipt is already cancelled'), { statusCode: 400 });
    }

    const t = await sequelize.transaction();
    try {
      // If was received, reverse inventory impact
      if (existing.status === 'received') {
        for (const detail of existing.details) {
          const item = await Item.findByPk(detail.itemId, { transaction: t });
          if (!item || item.itemType === 'service') continue;
          if (!existing.warehouseId) continue;

          const balance = await InventoryBalance.findOne({
            where: { itemId: detail.itemId, warehouseId: existing.warehouseId, tenantId },
            transaction: t,
          });

          if (balance) {
            const receivedQty = parseFloat(detail.receivedQuantity);
            const unitCost = parseFloat(detail.unitPrice);
            const totalCost = receivedQty * unitCost;

            const newQty = Math.max(0, parseFloat(balance.quantity) - receivedQty);
            const newValue = Math.max(0, parseFloat(balance.totalValue) - totalCost);

            await InventoryBalance.update(
              { quantity: newQty, totalValue: parseFloat(newValue.toFixed(4)) },
              { where: { id: balance.id }, transaction: t }
            );

            // Create reversal transaction
            await InventoryTransaction.create({
              tenantId,
              itemId: detail.itemId,
              warehouseId: existing.warehouseId,
              referenceId: existing.id,
              referenceType: 'GoodsReceipt_Cancelled',
              transactionType: 'receipt_cancel',
              quantityOut: receivedQty,
              unitCost,
              runningBalance: newQty,
              transactionDate: new Date(),
            }, { transaction: t });
          }
        }
      }

      await GoodsReceipt.update(
        { status: 'cancelled' },
        { where: { id, tenantId }, transaction: t }
      );

      await t.commit();

      await this._updatePOStatus(tenantId, existing.purchaseOrderId);

      const updated = await goodsReceiptRepository.findById(tenantId, id);
      return new GoodsReceiptDTO(updated);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async _updatePOStatus(tenantId, purchaseOrderId) {
    const po = await PurchaseOrder.findOne({
      where: { id: purchaseOrderId, tenantId },
      include: [{ model: PurchaseOrderDetail, as: 'details' }],
    });
    if (!po) return;

    let fullyReceived = true;
    let partiallyReceived = false;

    for (const detail of po.details) {
      const alreadyReceived = await goodsReceiptRepository.getAlreadyReceivedQty(
        tenantId, purchaseOrderId, detail.itemId
      );
      const ordered = parseFloat(detail.quantity);

      if (alreadyReceived > 0 && alreadyReceived < ordered) {
        partiallyReceived = true;
        fullyReceived = false;
      } else if (alreadyReceived <= 0) {
        fullyReceived = false;
      }
    }

    let newStatus = po.status;
    if (fullyReceived) {
      newStatus = 'received';
    } else if (partiallyReceived) {
      newStatus = 'partially_received';
    }

    if (newStatus !== po.status) {
      await PurchaseOrder.update(
        { status: newStatus },
        { where: { id: purchaseOrderId, tenantId } }
      );
    }
  }
}

module.exports = new GoodsReceiptService();