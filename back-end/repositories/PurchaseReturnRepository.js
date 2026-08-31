'use strict';

const { PurchaseReturn, PurchaseReturnDetail, Supplier, PurchaseInvoice, GoodsReceipt, Warehouse, Item } = require('../models');
const { Op } = require('sequelize');

class PurchaseReturnRepository {
  constructor() {
    this.model = PurchaseReturn;
    this.detailModel = PurchaseReturnDetail;
  }

  async findAll(tenantId, filters = {}) {
    const {
      search,
      status,
      supplierId,
      referenceType,
      startDate,
      endDate,
      page = 1,
      limit = 25,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      includeDeleted
    } = filters;

    const withDeleted = includeDeleted === 'true' || includeDeleted === true;
    const where = { tenantId };

    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (referenceType) where.referenceType = referenceType;
    if (startDate && endDate) {
      where.returnDate = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.returnDate = { [Op.gte]: startDate };
    } else if (endDate) {
      where.returnDate = { [Op.lte]: endDate };
    }

    if (search) {
      where[Op.or] = [
        { returnNumber: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;
    const { rows, count } = await this.model.findAndCountAll({
      where,
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'name', 'code'] },
        { model: PurchaseInvoice, as: 'purchaseInvoice', attributes: ['id', 'invoiceNumber'] },
        { model: GoodsReceipt, as: 'goodsReceipt', attributes: ['id', 'grnNumber'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'name'] }
      ],
      order: [[sortBy, sortOrder]],
      offset,
      limit,
      distinct: true,
      paranoid: !withDeleted
    });

    return { data: rows, total: count, page, limit };
  }

  async findById(id, tenantId, transaction, includeDeleted = false) {
    return await this.model.findOne({
      where: includeDeleted ? { id, tenantId } : { id, tenantId, deletedAt: null },
      paranoid: !includeDeleted,
      transaction,
      include: [
        {
          model: this.detailModel,
          as: 'details',
          include: [
            { model: Item, as: 'item', attributes: ['id', 'name', 'itemCode', 'itemType', 'inventoryAccountId', 'expenseAccountId'] },
            { model: Warehouse, as: 'warehouse', attributes: ['id', 'name'] }
          ]
        },
        { model: Supplier, as: 'supplier', attributes: ['id', 'name', 'code', 'phone', 'mobile', 'email'] },
        { model: PurchaseInvoice, as: 'purchaseInvoice', attributes: ['id', 'invoiceNumber', 'totalAmount'] },
        { model: GoodsReceipt, as: 'goodsReceipt', attributes: ['id', 'grnNumber'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'name'] }
      ]
    });
  }

  async findByReturnNumber(returnNumber, tenantId) {
    return await this.model.findOne({ where: { returnNumber, tenantId } });
  }

  async getNextSequence(tenantId) {
    const year = new Date().getFullYear();
    const prefix = `PRET-${year}-`;

    const lastRecord = await this.model.findOne({
      where: {
        tenantId,
        returnNumber: { [Op.like]: `${prefix}%` }
      },
      order: [['returnNumber', 'DESC']],
      paranoid: false
    });

    if (!lastRecord) return `${prefix}00001`;

    const lastNumber = parseInt(lastRecord.returnNumber.replace(prefix, ''), 10);
    const nextNumber = (lastNumber + 1).toString().padStart(5, '0');
    return `${prefix}${nextNumber}`;
  }

  async create(data, details = [], options = {}) {
    const transaction = options.transaction;
    const record = await this.model.create(data, { transaction });

    if (details && details.length > 0) {
      const detailRecords = details.map(d => ({ ...d, purchaseReturnId: record.id }));
      await this.detailModel.bulkCreate(detailRecords, { transaction });
    }

    return await this.findById(record.id, data.tenantId, transaction);
  }

  async update(id, tenantId, data, details = null, options = {}) {
    const transaction = options.transaction;
    await this.model.update(data, { where: { id, tenantId }, transaction });

    if (details && Array.isArray(details)) {
      await this.detailModel.destroy({ where: { purchaseReturnId: id }, transaction });
      const detailRecords = details.map(d => ({ ...d, purchaseReturnId: id }));
      await this.detailModel.bulkCreate(detailRecords, { transaction });
    }

    return await this.findById(id, tenantId, transaction);
  }

  async updateStatus(id, tenantId, status, options = {}) {
    const transaction = options.transaction;
    await this.model.update({ status }, { where: { id, tenantId }, transaction });
    return await this.findById(id, tenantId, transaction);
  }

  async delete(id, tenantId, options = {}) {
    return await this.model.destroy({ where: { id, tenantId }, transaction: options.transaction });
  }

  async restore(id, tenantId, options = {}) {
    return await this.model.update(
      { deletedAt: null, deletedBy: null, deleteReason: null },
      { where: { id, tenantId }, paranoid: false, transaction: options.transaction }
    );
  }
}

module.exports = new PurchaseReturnRepository();