'use strict';
const { SalesOrder, SalesOrderDetail, Customer, Quotation, Warehouse, Item, User } = require('../models');
const { Op } = require('sequelize');

class SalesOrderRepository {
  async findAll({ tenantId, search, status, customerId, page = 1, limit = 20, includeDeleted }) {
    const where = { tenantId };
    const withDeleted = includeDeleted === 'true' || includeDeleted === true;
    if (!withDeleted) where.deletedAt = null;
    if (status) {
      where.status = status.includes(',') ? { [Op.in]: status.split(',').map(s => s.trim()) } : status;
    }
    if (customerId) where.customerId = customerId;
    if (search) {
      where[Op.or] = [
        { orderNumber: { [Op.like]: `%${search}%` } },
        { reference: { [Op.like]: `%${search}%` } },
      ];
    }
    const offset = (page - 1) * limit;
    const { count, rows } = await SalesOrder.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'code', 'name'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'name'], required: false },
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit,
      paranoid: !withDeleted,
    });
    return { list: rows, total: count, page, limit };
  }

  async findById(id, tenantId, includeDeleted = false) {
    return await SalesOrder.findOne({
      where: includeDeleted ? { id, tenantId } : { id, tenantId, deletedAt: null },
      paranoid: !includeDeleted,
      include: [
        { model: Customer, as: 'customer' },
        { model: Quotation, as: 'quotation' },
        { model: Warehouse, as: 'warehouse', required: false },
        { model: SalesOrderDetail, as: 'details', include: [{ model: Item, as: 'item' }] },
        { model: User, as: 'creator', attributes: ['id', 'username'] },
        { model: User, as: 'updater', attributes: ['id', 'username'] },
      ],
    });
  }

  async findByQuotationId(quotationId, tenantId) {
    return await SalesOrder.findOne({
      where: { quotationId, tenantId },
    });
  }

  async create(data, { transaction }) {
    return await SalesOrder.create(data, { transaction });
  }

  async bulkCreateDetails(details, { transaction }) {
    return await SalesOrderDetail.bulkCreate(details, { transaction });
  }

  async update(id, data, { transaction }) {
    const [updated] = await SalesOrder.update(data, {
      where: { id },
      transaction,
    });
    return updated > 0;
  }

  async deleteDetailsByOrderId(salesOrderId, { transaction }) {
    return await SalesOrderDetail.destroy({
      where: { salesOrderId },
      transaction,
    });
  }

  async delete(id, tenantId, { transaction } = {}) {
    return await SalesOrder.destroy({
      where: { id, tenantId },
      transaction,
    });
  }

  async restore(id, tenantId, { transaction } = {}) {
    return await SalesOrder.update(
      { deletedAt: null, deletedBy: null, deleteReason: null },
      { where: { id, tenantId }, paranoid: false, transaction }
    );
  }

  async getNextOrderNumber(tenantId, year) {
    const result = await SalesOrder.findOne({
      where: {
        tenantId,
        orderNumber: { [Op.like]: `SO-${year}-%` },
      },
      order: [['createdAt', 'DESC']],
      attributes: ['orderNumber'],
      paranoid: false,
    });
    if (!result) return 1;
    const parts = result.orderNumber.split('-');
    const num = parseInt(parts[2]) || 0;
    return num + 1;
  }
}

module.exports = new SalesOrderRepository();