'use strict';

const salesOrderRepo = require('../repositories/SalesOrderRepository');
const quotationRepo = require('../repositories/QuotationRepository');
const SalesOrderDTO = require('../dto/SalesOrderDTO');
const AuditLogService = require('./AuditLogService');
const { sequelize, Quotation, QuotationDetail } = require('../models');

class SalesOrderService {
  async list(tenantId, query) {
    const result = await salesOrderRepo.findAll({ tenantId, ...query });
    return {
      data: SalesOrderDTO.toListDTO(result.list),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  async getById(tenantId, id) {
    const order = await salesOrderRepo.findById(id, tenantId);
    if (!order) return null;
    return SalesOrderDTO.toDTO(order);
  }

  async create(tenantId, data, userId) {
    this._validateLines(data.details);

    const t = await sequelize.transaction();
    try {
      const year = new Date().getFullYear();
      const nextNum = await salesOrderRepo.getNextOrderNumber(tenantId, year);
      const orderNumber = `SO-${year}-${String(nextNum).padStart(5, '0')}`;

      const totals = SalesOrderDTO.computeTotals(data.details);

      const orderData = {
        tenantId,
        customerId: data.customerId,
        quotationId: data.quotationId || null,
        warehouseId: data.warehouseId || null,
        orderNumber,
        orderDate: data.orderDate,
        deliveryDate: data.deliveryDate || null,
        reference: data.reference || null,
        notes: data.notes || null,
        termsConditions: data.termsConditions || null,
        subtotalAmount: totals.subtotalAmount,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        status: data.status || 'draft',
        createdBy: userId,
        updatedBy: userId,
      };

      const order = await salesOrderRepo.create(orderData, { transaction: t });

      const detailRecords = data.details.map((line) => ({
        tenantId,
        salesOrderId: order.id,
        quotationDetailId: line.quotationDetailId || null,
        itemId: line.itemId,
        description: line.description || null,
        quantity: line.quantity,
        deliveredQuantity: 0,
        invoicedQuantity: 0,
        unitPrice: line.unitPrice,
        taxPercentage: line.taxPercentage || 0,
        discountPercentage: line.discountPercentage || 0,
        lineTotal: line.lineTotal || 0,
      }));

      await salesOrderRepo.bulkCreateDetails(detailRecords, { transaction: t });

      // If created from quotation, track ordered quantities at line level and
      // compute quotation status (partially_ordered / fully_ordered)
      if (data.quotationId) {
        await this._syncQuotationOrderedQty(tenantId, data.quotationId, t);
      }

      await t.commit();

      const result = await salesOrderRepo.findById(order.id, tenantId);
      await AuditLogService.log(tenantId, userId, 'SalesOrder', order.id, 'Created', { orderNumber });

      return SalesOrderDTO.toDTO(result);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async update(tenantId, id, data, userId) {
    const existing = await salesOrderRepo.findById(id, tenantId);
    if (!existing) throw new Error('Sales Order not found');
    if (existing.status === 'closed') throw new Error('Cannot update a closed Sales Order');

    const t = await sequelize.transaction();
    try {
      const updateData = {
        customerId: data.customerId,
        quotationId: data.quotationId,
        warehouseId: data.warehouseId,
        orderDate: data.orderDate,
        deliveryDate: data.deliveryDate,
        reference: data.reference,
        notes: data.notes,
        termsConditions: data.termsConditions,
        status: data.status,
        updatedBy: userId,
      };

      // If details provided, recompute totals and replace details
      if (data.details && data.details.length > 0) {
        this._validateLines(data.details);
        const totals = SalesOrderDTO.computeTotals(data.details);
        updateData.subtotalAmount = totals.subtotalAmount;
        updateData.discountAmount = totals.discountAmount;
        updateData.taxAmount = totals.taxAmount;
        updateData.totalAmount = totals.totalAmount;

        await salesOrderRepo.deleteDetailsByOrderId(id, { transaction: t });

        const detailRecords = data.details.map((line) => ({
          salesOrderId: id,
          itemId: line.itemId,
          description: line.description || null,
          quantity: line.quantity,
          deliveredQuantity: line.deliveredQuantity || 0,
          unitPrice: line.unitPrice,
          taxPercentage: line.taxPercentage || 0,
          discountPercentage: line.discountPercentage || 0,
          lineTotal: line.lineTotal || 0,
        }));

        await salesOrderRepo.bulkCreateDetails(detailRecords, { transaction: t });
      }

      // Remove undefined values
      Object.keys(updateData).forEach((k) => {
        if (updateData[k] === undefined) delete updateData[k];
      });

      await salesOrderRepo.update(id, updateData, { transaction: t });

      await t.commit();

      const result = await salesOrderRepo.findById(id, tenantId);
      await AuditLogService.log(tenantId, userId, 'SalesOrder', id, 'Updated', data);

      return SalesOrderDTO.toDTO(result);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async delete(tenantId, id, userId) {
    const existing = await salesOrderRepo.findById(id, tenantId);
    if (!existing) throw new Error('Sales Order not found');
    if (existing.status !== 'draft') throw new Error('Only draft orders can be deleted');

    const deleted = await salesOrderRepo.delete(id, tenantId);
    if (deleted === 0) throw new Error('Sales Order not found');

    await AuditLogService.log(tenantId, userId, 'SalesOrder', id, 'Deleted');
    return true;
  }

  async updateStatus(tenantId, id, status, userId) {
    const existing = await salesOrderRepo.findById(id, tenantId);
    if (!existing) throw new Error('Sales Order not found');

    const validTransitions = {
      draft: ['approved'],
      approved: ['partially_delivered', 'delivered', 'closed'],
      partially_delivered: ['delivered', 'closed'],
      delivered: ['closed'],
    };

    const currentStatus = existing.status;
    if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(status)) {
      throw new Error(`Cannot change status from ${currentStatus} to ${status}`);
    }

    const updateData = {
      status,
      updatedBy: userId,
    };

    if (status === 'approved') {
      updateData.approvedBy = userId;
      updateData.approvedAt = new Date();
    }

    await salesOrderRepo.update(id, updateData, { transaction: null });

    await AuditLogService.log(tenantId, userId, 'SalesOrder', id, 'Status changed', {
      from: currentStatus,
      to: status,
    });

    return await this.getById(tenantId, id);
  }

  async approve(tenantId, id, userId) {
    return await this.updateStatus(tenantId, id, 'approved', userId);
  }

  async close(tenantId, id, userId) {
    return await this.updateStatus(tenantId, id, 'closed', userId);
  }

  /**
   * Recompute a quotation's ordered quantity and status from its sales orders.
   */
  async _syncQuotationOrderedQty(tenantId, quotationId, transaction = null) {
    const qd = await QuotationDetail.findAll({ where: { quotationId, tenantId }, transaction });
    if (!qd.length) return;

    const { SalesOrderDetail } = require('../models');
    const totals = await SalesOrderDetail.findAll({
      where: { tenantId, quotationDetailId: { [require('sequelize').Op.in]: qd.map((d) => d.id) } },
      attributes: ['quotationDetailId', [sequelize.fn('SUM', sequelize.col('quantity')), 'orderedQty']],
      group: ['quotationDetailId'],
      transaction,
    });

    const orderedByDetail = {};
    totals.forEach((t) => { orderedByDetail[t.quotationDetailId] = parseFloat(t.get('orderedQty') || 0); });

    let totalQuoted = 0;
    let totalOrdered = 0;
    for (const d of qd) {
      const ordered = orderedByDetail[d.id] || 0;
      totalQuoted += parseFloat(d.quantity);
      totalOrdered += ordered;
      if (parseFloat(d.orderedQuantity) !== ordered) {
        await d.update({ orderedQuantity: ordered }, { transaction });
      }
    }

    let status = 'approved';
    if (totalOrdered > 0 && totalOrdered < totalQuoted) status = 'partially_ordered';
    else if (totalOrdered >= totalQuoted) status = 'fully_ordered';

    await quotationRepo.updateStatus(tenantId, quotationId, status, null, { transaction });
  }

  /**
   * Returns per-line ordered / delivered / remaining quantities for a sales order.
   */
  async getDeliverableLines(tenantId, id) {
    const order = await salesOrderRepo.findById(id, tenantId);
    if (!order) throw new Error('Sales Order not found');

    const deliveryNoteRepository = require('../repositories/DeliveryNoteRepository');
    const lines = [];
    for (const d of order.details || []) {
      const ordered = parseFloat(d.quantity);
      const delivered = await deliveryNoteRepository.getDeliveredQtyForOrderLine(d.id, tenantId);
      lines.push({
        salesOrderDetailId: d.id,
        itemId: d.itemId,
        itemName: d.item ? (d.item.name || d.item.itemName || '') : '',
        description: d.description,
        orderedQuantity: ordered,
        deliveredQuantity: delivered,
        remainingQuantity: Math.max(0, ordered - delivered),
        unitPrice: parseFloat(d.unitPrice),
        taxPercentage: parseFloat(d.taxPercentage || 0),
        discountPercentage: parseFloat(d.discountPercentage || 0),
      });
    }
    return { id: order.id, orderNumber: order.orderNumber, customerId: order.customerId, warehouseId: order.warehouseId, reference: order.reference, status: order.status, lines };
  }

  /**
   * Returns per-line ordered / invoiced / remaining invoiceable quantities.
   */
  async getInvoiceableLines(tenantId, id) {
    const order = await salesOrderRepo.findById(id, tenantId);
    if (!order) throw new Error('Sales Order not found');

    const lines = [];
    for (const d of order.details || []) {
      const ordered = parseFloat(d.quantity);
      const invoiced = parseFloat(d.invoicedQuantity || 0);
      lines.push({
        salesOrderDetailId: d.id,
        itemId: d.itemId,
        itemName: d.item ? (d.item.name || d.item.itemName || '') : '',
        description: d.description,
        orderedQuantity: ordered,
        invoicedQuantity: invoiced,
        remainingQuantity: Math.max(0, ordered - invoiced),
        unitPrice: parseFloat(d.unitPrice),
        taxPercentage: parseFloat(d.taxPercentage || 0),
        discountPercentage: parseFloat(d.discountPercentage || 0),
      });
    }
    return { id: order.id, orderNumber: order.orderNumber, customerId: order.customerId, warehouseId: order.warehouseId, status: order.status, lines };
  }

  _validateLines(details) {
    if (!details || details.length === 0) {
      throw new Error('At least one line item is required');
    }
    for (const line of details) {
      if (!line.itemId) throw new Error('Item is required for each line');
      if (!line.quantity || parseFloat(line.quantity) <= 0) throw new Error('Quantity must be greater than 0');
      if (line.unitPrice === undefined || line.unitPrice === null || parseFloat(line.unitPrice) < 0)
        throw new Error('Unit price cannot be negative');
    }
  }
}

module.exports = new SalesOrderService();