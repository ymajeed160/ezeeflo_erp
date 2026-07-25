'use strict';

const salesOrderRepo = require('../repositories/SalesOrderRepository');
const quotationRepo = require('../repositories/QuotationRepository');
const SalesOrderDTO = require('../dto/SalesOrderDTO');
const AuditLogService = require('./AuditLogService');
const { sequelize } = require('../models');

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
        itemId: line.itemId,
        description: line.description || null,
        quantity: line.quantity,
        deliveredQuantity: 0,
        unitPrice: line.unitPrice,
        taxPercentage: line.taxPercentage || 0,
        discountPercentage: line.discountPercentage || 0,
        lineTotal: line.lineTotal || 0,
      }));

      await salesOrderRepo.bulkCreateDetails(detailRecords, { transaction: t });

      // If created from quotation, mark quotation as converted
      if (data.quotationId) {
        await quotationRepo.convert(tenantId, data.quotationId, 'sales_order', order.id, userId, { transaction: t });
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