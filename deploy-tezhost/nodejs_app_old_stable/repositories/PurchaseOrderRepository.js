'use strict';
const { PurchaseOrder, PurchaseOrderDetail, Supplier, Warehouse, Item, sequelize } = require('../models');
const { Op } = require('sequelize');
const AuditTrailService = require('../services/AuditTrailService');

class PurchaseOrderRepository {
  async findAll(tenantId, filters = {}) {
    const where = { tenantId };
    if (filters.search) {
      where[Op.or] = [
        { orderNumber: { [Op.like]: `%${filters.search}%` } },
        { notes: { [Op.like]: `%${filters.search}%` } },
      ];
    }
    if (filters.status) where.status = filters.status;
    if (filters.supplierId) where.supplierId = filters.supplierId;
    if (filters.fromDate && filters.toDate) {
      where.orderDate = { [Op.between]: [filters.fromDate, filters.toDate] };
    } else if (filters.fromDate) {
      where.orderDate = { [Op.gte]: filters.fromDate };
    } else if (filters.toDate) {
      where.orderDate = { [Op.lte]: filters.toDate };
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;
    const sort = filters.sort || 'createdAt';
    const order = filters.order === 'asc' ? 'ASC' : 'DESC';

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where,
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'code', 'name'] },
        { model: Warehouse, as: 'warehouse', required: false, attributes: ['id', 'code', 'name'] },
        // Details included WITHOUT nested item join to avoid INNER JOIN subquery
        // that would hide POs with orphaned/missing item references
        { model: PurchaseOrderDetail, as: 'details', attributes: ['id'] },
      ],
      order: [[sort, order]],
      limit,
      offset,
      distinct: true,
    });

    return {
      rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }

  async findById(id, tenantId) {
    return await PurchaseOrder.findOne({
      where: { id, tenantId },
      include: [
        { model: Supplier, as: 'supplier' },
        { model: Warehouse, as: 'warehouse', required: false },
        { model: PurchaseOrderDetail, as: 'details', include: [{ model: Item, as: 'item' }] },
      ],
    });
  }

  async findByNumber(orderNumber, tenantId, excludeId = null) {
    const where = { tenantId, orderNumber };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    return await PurchaseOrder.findOne({ where });
  }

  async create(data, details, userId, tenantId) {
    const t = await sequelize.transaction();
    try {
      const order = await PurchaseOrder.create({ ...data, tenantId, createdBy: userId }, { transaction: t });
      const createdDetails = [];
      for (const d of details) {
        const qty = parseFloat(d.quantity) || 0;
        const price = parseFloat(d.unitPrice) || 0;
        // Accept both field naming conventions (front-end sends taxPercentage/discountPercentage)
        const taxPct = parseFloat(d.taxPercent ?? d.taxPercentage) || 0;
        const discPct = parseFloat(d.discountPercent ?? d.discountPercentage) || 0;
        const discAmt = parseFloat(d.discountAmount) || 0;
        const lineBeforeDiscount = qty * price;
        const discAmount = discAmt > 0 ? discAmt : (lineBeforeDiscount * discPct / 100);
        const taxBase = lineBeforeDiscount - discAmount;
        const taxAmt = taxBase * taxPct / 100;
        const lineTotal = taxBase + taxAmt;

        const detail = await PurchaseOrderDetail.create({
          purchaseOrderId: order.id,
          itemId: d.itemId,
          description: d.description || null,
          quantity: qty,
          receivedQuantity: 0,
          unitPrice: price,
          taxPercent: taxPct,
          discountPercent: discPct,
          discountAmount: discAmount,
          taxAmount: taxAmt,
          lineTotal,
          sortOrder: d.sortOrder || 0,
        }, { transaction: t });
        createdDetails.push(detail);
      }

      const totalAmount = createdDetails.reduce((sum, d) => sum + parseFloat(d.lineTotal || 0), 0);
      await order.update({ totalAmount }, { transaction: t });

      await t.commit();

      await AuditTrailService.log({
        tenantId,
        userId,
        action: 'CREATE',
        entity: 'PurchaseOrder',
        entityId: order.id,
        newValues: data,
      });

      return await this.findById(order.id, tenantId);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async update(id, data, details, userId, tenantId) {
    const t = await sequelize.transaction();
    try {
      const order = await PurchaseOrder.findOne({ where: { id, tenantId }, transaction: t });
      if (!order) { await t.rollback(); return null; }
      if (order.status !== 'draft') { await t.rollback(); throw new Error('Only draft purchase orders can be edited'); }

      await order.update(data, { transaction: t });

      if (details) {
        await PurchaseOrderDetail.destroy({ where: { purchaseOrderId: id }, transaction: t });
        const createdDetails = [];
        for (const d of details) {
          const qty = parseFloat(d.quantity) || 0;
          const price = parseFloat(d.unitPrice) || 0;
          // Accept both field naming conventions (front-end sends taxPercentage/discountPercentage)
          const taxPct = parseFloat(d.taxPercent ?? d.taxPercentage) || 0;
          const discPct = parseFloat(d.discountPercent ?? d.discountPercentage) || 0;
          const discAmt = parseFloat(d.discountAmount) || 0;
          const lineBeforeDiscount = qty * price;
          const discAmount = discAmt > 0 ? discAmt : (lineBeforeDiscount * discPct / 100);
          const taxBase = lineBeforeDiscount - discAmount;
          const taxAmt = taxBase * taxPct / 100;
          const lineTotal = taxBase + taxAmt;

          const detail = await PurchaseOrderDetail.create({
            purchaseOrderId: id,
            itemId: d.itemId,
            description: d.description || null,
            quantity: qty,
            receivedQuantity: 0,
            unitPrice: price,
            taxPercent: taxPct,
            discountPercent: discPct,
            discountAmount: discAmount,
            taxAmount: taxAmt,
            lineTotal,
            sortOrder: d.sortOrder || 0,
          }, { transaction: t });
          createdDetails.push(detail);
        }

        const totalAmount = createdDetails.reduce((sum, d) => sum + parseFloat(d.lineTotal || 0), 0);
        await order.update({ totalAmount }, { transaction: t });
      }

      await t.commit();
      return await this.findById(id, tenantId);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async delete(id, tenantId) {
    const order = await this.findOne({ where: { id, tenantId } });
    if (!order) return null;
    if (order.status !== 'draft') throw new Error('Only draft purchase orders can be deleted');
    return await order.destroy();
  }

  async approve(id, decision, approvedBy, tenantId) {
    const order = await PurchaseOrder.findOne({ where: { id, tenantId } });
    if (!order) return null;
    if (order.status !== 'draft') throw new Error('Only draft purchase orders can be approved/cancelled');

    const status = decision === 'approved' ? 'approved' : 'cancelled';
    await order.update({ status, approvedBy, approvedAt: new Date() });
    return await this.findById(id, tenantId);
  }

  async updateStatus(id, status, tenantId) {
    return await PurchaseOrder.update({ status }, { where: { id, tenantId } });
  }

  async getOutstandingPOs(tenantId, supplierId = null) {
    const where = { tenantId, status: { [Op.in]: ['approved', 'partially_received'] } };
    if (supplierId) where.supplierId = supplierId;
    return await PurchaseOrder.findAll({
      where,
      include: [
        { model: Supplier, as: 'supplier' },
        { model: PurchaseOrderDetail, as: 'details', include: [{ model: Item, as: 'item' }] },
      ],
    });
  }

  async addReceivedQuantity(orderId, detailId, receivedQty, tenantId) {
    const detail = await PurchaseOrderDetail.findOne({
      where: { id: detailId },
      include: [{ model: PurchaseOrder, as: 'purchaseOrder', where: { tenantId } }],
    });
    if (!detail) return null;
    const newReceived = parseFloat(detail.receivedQuantity || 0) + receivedQty;
    await detail.update({ receivedQuantity: newReceived });
    return detail;
  }
}

module.exports = new PurchaseOrderRepository();