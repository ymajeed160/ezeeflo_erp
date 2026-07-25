'use strict';
const { SalesReturn, SalesReturnDetail, Customer, Warehouse, Item, SalesInvoice, User, Account } = require('../models');

class SalesReturnRepository {
  /**
   * Find all returns with filtering, searching, sorting, pagination
   */
  static async findAll(tenantId, filters = {}) {
    const where = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.salesInvoiceId) where.salesInvoiceId = filters.salesInvoiceId;

    // Date range filter
    if (filters.startDate || filters.endDate) {
      where.returnDate = {};
      if (filters.startDate) where.returnDate[Op.gte] = filters.startDate;
      if (filters.endDate) where.returnDate[Op.lte] = filters.endDate;
    }

    // Search across returnNumber, customer name
    if (filters.search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { returnNumber: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 25;
    const offset = (page - 1) * limit;
    const order = filters.order
      ? [[filters.order, filters.dir || 'DESC']]
      : [['createdAt', 'DESC']];

    const { Op } = require('sequelize');
    const customerWhere = filters.search ? { name: { [Op.like]: `%${filters.search}%` } } : undefined;

    const { count, rows } = await SalesReturn.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'code'], where: customerWhere, required: !!customerWhere },
        { model: SalesInvoice, as: 'salesInvoice', attributes: ['id', 'invoiceNumber'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'name'], required: false },
        { model: User, as: 'creator', attributes: ['id', 'username'] },
        { model: Account, as: 'customerAccount', attributes: ['id', 'code', 'name'], required: false },
        { model: Account, as: 'revenueAccount', attributes: ['id', 'code', 'name'], required: false },
        { model: Account, as: 'taxAccount', attributes: ['id', 'code', 'name'], required: false },
      ],
      order,
      limit,
      offset,
      distinct: true,
    });

    return {
      count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      data: rows,
    };
  }

  /**
   * Find return by ID with all associations
   */
  static async findById(tenantId, id) {
    return SalesReturn.findOne({
      where: { tenantId, id },
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'code', 'email', 'phone', 'mobile', 'taxNumber', 'arAccountId'], required: false },
        { model: SalesInvoice, as: 'salesInvoice', attributes: ['id', 'invoiceNumber'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'name', 'code'], required: false },
        { model: User, as: 'creator', attributes: ['id', 'username'] },
        { model: User, as: 'updater', attributes: ['id', 'username'] },
        { model: Account, as: 'customerAccount', attributes: ['id', 'code', 'name'], required: false },
        { model: Account, as: 'revenueAccount', attributes: ['id', 'code', 'name'], required: false },
        { model: Account, as: 'taxAccount', attributes: ['id', 'code', 'name'], required: false },
        {
          model: SalesReturnDetail,
          as: 'details',
          include: [
            { model: Item, as: 'item', attributes: ['id', 'name', 'itemCode', 'unitOfMeasure', 'costPrice', 'incomeAccountId', 'inventoryAccountId', 'expenseAccountId'], required: false },
          ],
        },
      ],
    });
  }

  /**
   * Create return with details in a transaction
   */
  static async create(data, transaction) {
    const { details, ...headerData } = data;
    const salesReturn = await SalesReturn.create(headerData, { transaction });

    if (details && details.length > 0) {
      const detailRecords = details.map((d) => ({
        tenantId: headerData.tenantId,
        salesReturnId: salesReturn.id,
        ...d,
      }));
      await SalesReturnDetail.bulkCreate(detailRecords, { transaction });
    }

    return SalesReturn.findByPk(salesReturn.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'code'], required: false },
        { model: SalesInvoice, as: 'salesInvoice', attributes: ['id', 'invoiceNumber'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'name'], required: false },
        { model: Account, as: 'customerAccount', attributes: ['id', 'code', 'name'], required: false },
        { model: Account, as: 'revenueAccount', attributes: ['id', 'code', 'name'], required: false },
        { model: Account, as: 'taxAccount', attributes: ['id', 'code', 'name'], required: false },
        {
          model: SalesReturnDetail,
          as: 'details',
          include: [
            { model: Item, as: 'item', attributes: ['id', 'name', 'itemCode', 'costPrice', 'incomeAccountId', 'inventoryAccountId', 'expenseAccountId'], required: false },
          ],
        },
      ],
      transaction,
    });
  }

  /**
   * Update return header and details in a transaction
   */
  static async update(tenantId, id, data, transaction) {
    const { details, ...headerData } = data;

    // Update header
    await SalesReturn.update(headerData, {
      where: { tenantId, id },
      transaction,
    });

    if (details && details.length > 0) {
      // Remove existing details not in the new list
      const newIds = details.filter((d) => d.id).map((d) => d.id);
      await SalesReturnDetail.destroy({
        where: {
          tenantId,
          salesReturnId: id,
          ...(newIds.length > 0 ? { id: { [require('sequelize').Op.notIn]: newIds } } : {}),
        },
        transaction,
      });

      // Upsert details
      for (const line of details) {
        if (line.id) {
          await SalesReturnDetail.update(
            {
              itemId: line.itemId,
              salesInvoiceDetailId: line.salesInvoiceDetailId,
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              taxPercent: line.taxPercent,
              discountPercent: line.discountPercent,
              lineTotal: line.lineTotal,
              returnReason: line.returnReason,
            },
            { where: { id: line.id, tenantId, salesReturnId: id }, transaction }
          );
        } else {
          await SalesReturnDetail.create(
            {
              tenantId,
              salesReturnId: id,
              itemId: line.itemId,
              salesInvoiceDetailId: line.salesInvoiceDetailId,
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              taxPercent: line.taxPercent,
              discountPercent: line.discountPercent,
              lineTotal: line.lineTotal,
              returnReason: line.returnReason,
            },
            { transaction }
          );
        }
      }
    }

    return SalesReturnRepository.findById(tenantId, id);
  }

  /**
   * Delete return and its details in a transaction
   */
  static async delete(tenantId, id, transaction) {
    await SalesReturnDetail.destroy({
      where: { tenantId, salesReturnId: id },
      transaction,
    });
    return SalesReturn.destroy({
      where: { tenantId, id },
      transaction,
    });
  }

  /**
   * Update return status
   */
  static async updateStatus(tenantId, id, status, userId, transaction) {
    return SalesReturn.update(
      { status, updatedBy: userId },
      { where: { tenantId, id }, transaction }
    );
  }

  /**
   * Set journalEntryId on return
   */
  static async setJournalEntry(tenantId, id, journalEntryId, transaction) {
    return SalesReturn.update(
      { journalEntryId },
      { where: { tenantId, id }, transaction }
    );
  }

  /**
   * Get return details lines only
   */
  static async getDetailsOnly(tenantId, id) {
    return SalesReturnDetail.findAll({
      where: { tenantId, salesReturnId: id },
      include: [{ model: Item, as: 'item', attributes: ['id', 'name', 'itemCode'], required: false }],
    });
  }
}

module.exports = SalesReturnRepository;