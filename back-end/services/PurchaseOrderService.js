'use strict';
const PurchaseOrderRepository = require('../repositories/PurchaseOrderRepository');
const PurchaseOrderDTO = require('../dto/PurchaseOrderDTO');
const ApiError = require('../utils/apiError');
const { requireDeletionEnabled } = require('../utils/deletionSettings');
const { PurchaseOrder, sequelize } = require('../models');

class PurchaseOrderService {
  async getAll(tenantId, filters) {
    const result = await PurchaseOrderRepository.findAll(tenantId, filters);
    return {
      ...result,
      rows: PurchaseOrderDTO.toListDTO(result.rows),
    };
  }

  async getById(id, tenantId) {
    const entity = await PurchaseOrderRepository.findById(id, tenantId);
    if (!entity) throw ApiError.notFound('Purchase Order not found');
    return PurchaseOrderDTO.toDTO(entity);
  }

  async create(data, userId, tenantId) {
    const { details, ...header } = data;
    const orderNumber = await this.generateNumber(tenantId);
    header.orderNumber = orderNumber;
    const entity = await PurchaseOrderRepository.create(header, details, userId, tenantId);
    return PurchaseOrderDTO.toDTO(entity);
  }

  async update(id, data, userId, tenantId) {
    const { details, ...header } = data;
    const entity = await PurchaseOrderRepository.update(id, header, details, userId, tenantId);
    if (!entity) throw ApiError.notFound('Purchase Order not found');
    return PurchaseOrderDTO.toDTO(entity);
  }

  async delete(id, tenantId, userId, reason = null) {
    const existing = await PurchaseOrderRepository.findById(id, tenantId);
    if (!existing) throw ApiError.notFound('Purchase Order not found');
    await requireDeletionEnabled(tenantId, 'purchase_orders');
    if (existing.status !== 'draft') throw ApiError.badRequest('Only draft purchase orders can be deleted');

    const t = await sequelize.transaction();
    try {
      await PurchaseOrder.update(
        { deletedBy: userId, deleteReason: reason || null },
        { where: { id, tenantId }, transaction: t }
      );
      const deleted = await PurchaseOrderRepository.delete(id, tenantId, { transaction: t });
      if (!deleted) throw ApiError.notFound('Purchase Order not found');
      await t.commit();
      return { message: 'Purchase Order deleted successfully' };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async restore(id, tenantId, userId) {
    const existing = await PurchaseOrderRepository.findById(id, tenantId, true);
    if (!existing) throw ApiError.notFound('Purchase Order not found');
    if (!existing.deletedAt) throw ApiError.badRequest('Purchase Order is not deleted');

    await PurchaseOrderRepository.restore(id, tenantId, {});
    return this.getById(id, tenantId);
  }

  async cancel(id, tenantId, userId, reason = null) {
    const existing = await PurchaseOrderRepository.findById(id, tenantId);
    if (!existing) throw ApiError.notFound('Purchase Order not found');
    if (['received', 'closed', 'cancelled'].includes(existing.status)) {
      throw ApiError.badRequest(`Purchase Order with status ${existing.status} cannot be cancelled`);
    }

    await PurchaseOrder.update(
      { status: 'cancelled', cancelReason: reason || null, updatedBy: userId },
      { where: { id, tenantId } }
    );
    return this.getById(id, tenantId);
  }

  async approve(id, decision, approvedBy, tenantId) {
    const entity = await PurchaseOrderRepository.approve(id, decision, approvedBy, tenantId);
    if (!entity) throw ApiError.notFound('Purchase Order not found');
    return PurchaseOrderDTO.toDTO(entity);
  }

  async getOutstandingPOs(tenantId, supplierId = null) {
    const entities = await PurchaseOrderRepository.getOutstandingPOs(tenantId, supplierId);
    return PurchaseOrderDTO.toListDTO(entities);
  }

  async generateFromPurchaseRequest(purchaseRequestId, userId, tenantId) {
    const { PurchaseRequest, PurchaseRequestDetail, Item } = require('../models');
    const pr = await PurchaseRequest.findOne({
      where: { id: purchaseRequestId, tenantId, status: 'approved' },
      include: [{ model: PurchaseRequestDetail, as: 'details', include: [{ model: Item, as: 'item' }] }],
    });
    if (!pr) throw ApiError.badRequest('Approved Purchase Request not found');
    if (pr.details.length === 0) throw ApiError.badRequest('Purchase Request has no items');

    const orderNumber = await this.generateNumber(tenantId);
    const header = {
      orderNumber,
      orderDate: new Date().toISOString().split('T')[0],
      supplierId: pr.supplierId || null,
      purchaseRequestId: pr.id,
      notes: `Generated from PR: ${pr.requestNumber}`,
    };

    // Here we need to provide unit prices; they could be 0 or fetched from item
    const details = pr.details.map(d => ({
      itemId: d.itemId,
      description: d.description,
      quantity: parseFloat(d.quantity || 0),
      unitPrice: d.item ? parseFloat(d.item.purchasePrice || 0) : 0,
      taxPercent: 0,
      discountPercent: 0,
      discountAmount: 0,
      sortOrder: d.sortOrder || 0,
    }));

    const entity = await PurchaseOrderRepository.create(header, details, userId, tenantId);

    // Mark PR as converted
    await pr.update({ status: 'converted' });

    return PurchaseOrderDTO.toDTO(entity);
  }

  async generateNumber(tenantId) {
    const { PurchaseOrder } = require('../models');
    const { Op } = require('sequelize');
    const year = new Date().getFullYear();
    const prefix = `PO-${year}-`;

    const last = await PurchaseOrder.findOne({
      where: { tenantId, orderNumber: { [Op.like]: `${prefix}%` } },
      order: [['orderNumber', 'DESC']],
    });

    let seq = 1;
    if (last && last.orderNumber) {
      const parts = last.orderNumber.split('-');
      seq = parseInt(parts[parts.length - 1]) + 1;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }
}

module.exports = new PurchaseOrderService();