'use strict';
const { CreditNote, CreditNoteDetail, Customer, Warehouse, Item, SalesReturn, SalesInvoice, User } = require('../models');

class CreditNoteRepository {
  /**
   * Find all credit notes with filtering, searching, sorting, pagination
   */
  static async findAll(tenantId, filters = {}) {
    const where = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.salesReturnId) where.salesReturnId = filters.salesReturnId;

    // Date range filter
    if (filters.startDate || filters.endDate) {
      where.creditNoteDate = {};
      if (filters.startDate) where.creditNoteDate[Op.gte] = filters.startDate;
      if (filters.endDate) where.creditNoteDate[Op.lte] = filters.endDate;
    }

    // Search across creditNoteNumber, customer name
    if (filters.search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { creditNoteNumber: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 25;
    const offset = (page - 1) * limit;
    const order = filters.order
      ? [[filters.order, filters.dir || 'DESC']]
      : [['createdAt', 'DESC']];

    const { Op } = require('sequelize');
    const customerWhere = filters.search ? { customerName: { [Op.like]: `%${filters.search}%` } } : undefined;

    const { count, rows } = await CreditNote.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'customerName', 'customerCode'], where: customerWhere, required: !!customerWhere },
        { model: SalesReturn, as: 'salesReturn', attributes: ['id', 'returnNumber'] },
        { model: SalesInvoice, as: 'salesInvoice', attributes: ['id', 'invoiceNumber'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'warehouseName'] },
        { model: User, as: 'creator', attributes: ['id', 'username'] },
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
   * Find credit note by ID with all associations
   */
  static async findById(tenantId, id) {
    return CreditNote.findOne({
      where: { tenantId, id },
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'customerName', 'customerCode', 'email', 'phone', 'mobile', 'trnNumber'] },
        { model: SalesReturn, as: 'salesReturn', attributes: ['id', 'returnNumber'] },
        { model: SalesInvoice, as: 'salesInvoice', attributes: ['id', 'invoiceNumber'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'warehouseName', 'warehouseCode'] },
        { model: User, as: 'creator', attributes: ['id', 'username'] },
        { model: User, as: 'updater', attributes: ['id', 'username'] },
        {
          model: CreditNoteDetail,
          as: 'details',
          include: [
            { model: Item, as: 'item', attributes: ['id', 'itemName', 'itemCode', 'unitOfMeasure'] },
          ],
        },
      ],
    });
  }

  /**
   * Create credit note with details in a transaction
   */
  static async create(data, transaction) {
    const { details, ...headerData } = data;
    const creditNote = await CreditNote.create(headerData, { transaction });

    if (details && details.length > 0) {
      const detailRecords = details.map((d) => ({
        tenantId: headerData.tenantId,
        creditNoteId: creditNote.id,
        ...d,
      }));
      await CreditNoteDetail.bulkCreate(detailRecords, { transaction });
    }

    return CreditNote.findByPk(creditNote.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'customerName', 'customerCode'] },
        { model: SalesReturn, as: 'salesReturn', attributes: ['id', 'returnNumber'] },
        { model: SalesInvoice, as: 'salesInvoice', attributes: ['id', 'invoiceNumber'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'warehouseName'] },
        {
          model: CreditNoteDetail,
          as: 'details',
          include: [
            { model: Item, as: 'item', attributes: ['id', 'itemName', 'itemCode'] },
          ],
        },
      ],
      transaction,
    });
  }

  /**
   * Update credit note header and details in a transaction
   */
  static async update(tenantId, id, data, transaction) {
    const { details, ...headerData } = data;

    // Update header
    await CreditNote.update(headerData, {
      where: { tenantId, id },
      transaction,
    });

    if (details && details.length > 0) {
      // Remove existing details not in the new list
      const newIds = details.filter((d) => d.id).map((d) => d.id);
      await CreditNoteDetail.destroy({
        where: {
          tenantId,
          creditNoteId: id,
          ...(newIds.length > 0 ? { id: { [require('sequelize').Op.notIn]: newIds } } : {}),
        },
        transaction,
      });

      // Upsert details
      for (const line of details) {
        if (line.id) {
          await CreditNoteDetail.update(
            {
              itemId: line.itemId,
              salesReturnDetailId: line.salesReturnDetailId,
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              taxPercent: line.taxPercent,
              discountPercent: line.discountPercent,
              lineTotal: line.lineTotal,
              costPrice: line.costPrice,
            },
            { where: { id: line.id, tenantId, creditNoteId: id }, transaction }
          );
        } else {
          await CreditNoteDetail.create(
            {
              tenantId,
              creditNoteId: id,
              itemId: line.itemId,
              salesReturnDetailId: line.salesReturnDetailId,
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              taxPercent: line.taxPercent,
              discountPercent: line.discountPercent,
              lineTotal: line.lineTotal,
              costPrice: line.costPrice,
            },
            { transaction }
          );
        }
      }
    }

    return CreditNoteRepository.findById(tenantId, id);
  }

  /**
   * Delete credit note and its details in a transaction
   */
  static async delete(tenantId, id, transaction) {
    await CreditNoteDetail.destroy({
      where: { tenantId, creditNoteId: id },
      transaction,
    });
    return CreditNote.destroy({
      where: { tenantId, id },
      transaction,
    });
  }

  /**
   * Update credit note status
   */
  static async updateStatus(tenantId, id, status, userId, transaction) {
    return CreditNote.update(
      { status, updatedBy: userId },
      { where: { tenantId, id }, transaction }
    );
  }

  /**
   * Set journalEntryId on credit note
   */
  static async setJournalEntry(tenantId, id, journalEntryId, transaction) {
    return CreditNote.update(
      { journalEntryId },
      { where: { tenantId, id }, transaction }
    );
  }

  /**
   * Get credit note details lines only
   */
  static async getDetailsOnly(tenantId, id) {
    return CreditNoteDetail.findAll({
      where: { tenantId, creditNoteId: id },
      include: [{ model: Item, as: 'item', attributes: ['id', 'itemName', 'itemCode'] }],
    });
  }
}

module.exports = CreditNoteRepository;