'use strict';

const { Op } = require('sequelize');
const db = require('../models');

class PurchaseInvoiceRepository {
  async findAll(tenantId, filters = {}) {
    const { page = 1, limit = 20, search, status, supplierId, sortField = 'createdAt', sortOrder = 'DESC' } = filters;
    const offset = (page - 1) * limit;

    const where = { tenantId, deletedAt: null };
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (search) {
      where[Op.or] = [
        { invoiceNumber: { [Op.like]: `%${search}%` } },
        { supplierInvoiceNumber: { [Op.like]: `%${search}%` } },
        { '$supplier.name$': { [Op.like]: `%${search}%` } },
        { '$supplier.code$': { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await db.PurchaseInvoice.findAndCountAll({
      where,
      include: [
        { model: db.Supplier, as: 'supplier', attributes: ['id', 'code', 'name', 'vatNumber'] },
        { model: db.Warehouse, as: 'warehouse', attributes: ['id', 'name'] },
        { model: db.User, as: 'creator', attributes: ['id', 'username'] },
      ],
      order: [[sortField, sortOrder]],
      limit,
      offset,
      distinct: true,
    });

    return { data: rows, total: count, page, limit };
  }

  async findById(id, tenantId) {
    return db.PurchaseInvoice.findOne({
      where: { id, tenantId, deletedAt: null },
      include: [
        { model: db.Supplier, as: 'supplier', attributes: ['id', 'code', 'name', 'vatNumber', 'phone', 'mobile', 'email'] },
        { model: db.Warehouse, as: 'warehouse', attributes: ['id', 'name'] },
        {
          model: db.PurchaseInvoiceDetail,
          as: 'details',
          include: [{ model: db.Item, as: 'item', attributes: ['id', 'name', 'itemCode', 'itemType'] }],
        },
        { model: db.JournalEntry, as: 'journalEntry', required: false },
        { model: db.User, as: 'creator', attributes: ['id', 'username'] },
      ],
    });
  }

  async findByInvoiceNumber(invoiceNumber, tenantId, excludeId = null) {
    const where = { invoiceNumber, tenantId };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    return db.PurchaseInvoice.findOne({ where });
  }

  async getNextSequence(tenantId) {
    const currentYear = new Date().getFullYear();
    const prefix = `PINV-${currentYear}-`;

    const lastInvoice = await db.PurchaseInvoice.findOne({
      where: {
        tenantId,
        invoiceNumber: { [Op.like]: `${prefix}%` },
      },
      order: [['invoiceNumber', 'DESC']],
      paranoid: false,
    });

    let nextNumber = 1;
    if (lastInvoice) {
      const lastNum = parseInt(lastInvoice.invoiceNumber.split('-').pop(), 10);
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }
    return `${prefix}${String(nextNumber).padStart(5, '0')}`;
  }

  async create(data, transaction) {
    const opts = transaction ? { transaction } : {};
    const invoice = await db.PurchaseInvoice.create(data, opts);
    return invoice;
  }

  async createDetails(details, transaction) {
    const opts = transaction ? { transaction } : {};
    return db.PurchaseInvoiceDetail.bulkCreate(details, opts);
  }

  async update(id, tenantId, data, transaction) {
    const opts = transaction ? { transaction } : {};
    const [affectedCount] = await db.PurchaseInvoice.update(data, {
      where: { id, tenantId },
      ...opts,
    });
    return affectedCount > 0 ? db.PurchaseInvoice.findByPk(id, opts) : null;
  }

  async deleteDetails(invoiceId, transaction) {
    const opts = transaction ? { transaction } : {};
    return db.PurchaseInvoiceDetail.destroy({ where: { purchaseInvoiceId: invoiceId }, ...opts });
  }

  async delete(id, tenantId, transaction) {
    const opts = transaction ? { transaction } : {};
    return db.PurchaseInvoice.destroy({ where: { id, tenantId }, ...opts });
  }
}

module.exports = new PurchaseInvoiceRepository();