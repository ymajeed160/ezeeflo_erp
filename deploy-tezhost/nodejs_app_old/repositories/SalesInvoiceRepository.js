'use strict';
const { SalesInvoice, SalesInvoiceDetail, Customer, Warehouse, Item, SalesOrder, DeliveryNote, User, Account } = require('../models');

class SalesInvoiceRepository {
  /**
   * Find all invoices with filtering, searching, sorting, pagination
   */
  static async findAll(tenantId, filters = {}) {
    const where = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;

    // Date range filter
    if (filters.startDate || filters.endDate) {
      where.invoiceDate = {};
      if (filters.startDate) where.invoiceDate[Op.gte] = filters.startDate;
      if (filters.endDate) where.invoiceDate[Op.lte] = filters.endDate;
    }

    // Search across invoiceNumber, customer name
    if (filters.search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { invoiceNumber: { [Op.like]: `%${filters.search}%` } },
      ];
      // We'll apply customer name search via include
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 25;
    const offset = (page - 1) * limit;
    const order = filters.order
      ? [[filters.order, filters.dir || 'DESC']]
      : [['createdAt', 'DESC']];

    const { Op } = require('sequelize');
    // If search includes customer name
    const customerWhere = filters.search ? { name: { [Op.like]: `%${filters.search}%` } } : undefined;

    const { count, rows } = await SalesInvoice.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'code'], where: customerWhere, required: !!customerWhere },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'name'], required: false },
        { model: Account, as: 'customerAccount', attributes: ['id', 'code', 'name'], required: false },
        { model: Account, as: 'revenueAccount', attributes: ['id', 'code', 'name'], required: false },
        { model: Account, as: 'taxAccount', attributes: ['id', 'code', 'name'], required: false },
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
   * Find posted invoices for customer payment allocation
   * Returns only invoices with outstanding balance > 0
   * Loads only required fields for performance
   */
  static async findAllForAllocation(tenantId, customerId, excludePaymentId = null) {
    const { Op, literal } = require('sequelize');

    // Exclude current payment's allocations from paid amount calculation
    // so invoices already allocated to this payment still appear
    // Note: Cannot use nested subquery as literal because MySQL can't reference outer query two levels deep
    const paidAmountSubquery = `(
      SELECT COALESCE(SUM(allocated_amount), 0) FROM customer_payment_allocations
      WHERE sales_invoice_id = SalesInvoice.id
        ${excludePaymentId ? `AND customer_payment_id != '${excludePaymentId}'` : ''}
    ) + (
      SELECT COALESCE(SUM(allocated_amount), 0) FROM payment_receipt_allocations
      WHERE sales_invoice_id = SalesInvoice.id
    )`;

    const rows = await SalesInvoice.findAll({
      where: { tenantId, customerId, status: 'posted' },
      attributes: {
        include: [
          [literal(paidAmountSubquery), 'paidAmount'],
        ],
      },
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'code'], required: false },
      ],
      order: [['invoiceDate', 'DESC']],
    });

    // Filter out fully paid invoices (excluding current payment's allocations)
    return rows
      .map((inv) => {
        const paid = parseFloat(inv.getDataValue('paidAmount') || 0);
        const total = parseFloat(inv.grandTotal || 0);
        const outstanding = Math.max(total - paid, 0);
        return { ...inv.toJSON(), paidAmount: paid, outstandingBalance: outstanding };
      })
      .filter((inv) => inv.outstandingBalance > 0);
  }

  /**
   * Find invoice by ID with all associations
   */
  static async findById(tenantId, id) {
    return SalesInvoice.findOne({
      where: { tenantId, id },
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'code', 'email', 'phone', 'mobile', 'taxNumber', 'arAccountId'], required: false },
        { model: SalesOrder, as: 'salesOrder', attributes: ['id', 'orderNumber'], required: false },
        { model: DeliveryNote, as: 'deliveryNote', attributes: ['id', 'deliveryNumber'], required: false },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'name', 'code'], required: false },
        { model: Account, as: 'customerAccount', attributes: ['id', 'code', 'name', 'type'], required: false },
        { model: Account, as: 'revenueAccount', attributes: ['id', 'code', 'name', 'type'], required: false },
        { model: Account, as: 'taxAccount', attributes: ['id', 'code', 'name', 'type'], required: false },
        { model: User, as: 'creator', attributes: ['id', 'username'] },
        { model: User, as: 'updater', attributes: ['id', 'username'] },
        {
          model: SalesInvoiceDetail,
          as: 'details',
          include: [
            { model: Item, as: 'item', attributes: ['id', 'name', 'itemCode', 'unitOfMeasure', 'incomeAccountId', 'inventoryAccountId', 'expenseAccountId', 'costPrice'], required: false },
          ],
        },
      ],
    });
  }

  /**
   * Create invoice with details in a transaction
   */
  static async create(data, transaction) {
    const { details, ...headerData } = data;
    const invoice = await SalesInvoice.create(headerData, { transaction });

    if (details && details.length > 0) {
      const detailRecords = details.map((d) => ({
        tenantId: headerData.tenantId,
        salesInvoiceId: invoice.id,
        ...d,
      }));
      await SalesInvoiceDetail.bulkCreate(detailRecords, { transaction });
    }

    // Return full invoice with associations
    return SalesInvoice.findByPk(invoice.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'code'], required: false },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'name'], required: false },
        { model: Account, as: 'customerAccount', attributes: ['id', 'code', 'name'], required: false },
        { model: Account, as: 'revenueAccount', attributes: ['id', 'code', 'name'], required: false },
        { model: Account, as: 'taxAccount', attributes: ['id', 'code', 'name'], required: false },
        {
          model: SalesInvoiceDetail,
          as: 'details',
          include: [
            { model: Item, as: 'item', attributes: ['id', 'name', 'itemCode'], required: false },
          ],
        },
      ],
      transaction,
    });
  }

  /**
   * Update invoice header and details in a transaction
   */
  static async update(tenantId, id, data, transaction) {
    const { details, ...headerData } = data;

    // Update header
    await SalesInvoice.update(headerData, {
      where: { tenantId, id },
      transaction,
    });

    if (details && details.length > 0) {
      // Remove existing details not in the new list
      const newIds = details.filter((d) => d.id).map((d) => d.id);
      await SalesInvoiceDetail.destroy({
        where: {
          tenantId,
          salesInvoiceId: id,
          ...(newIds.length > 0 ? { id: { [require('sequelize').Op.notIn]: newIds } } : {}),
        },
        transaction,
      });

      // Upsert details
      for (const line of details) {
        if (line.id) {
          await SalesInvoiceDetail.update(
            {
              itemId: line.itemId,
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              taxPercent: line.taxPercent,
              discountPercent: line.discountPercent,
              lineTotal: line.lineTotal,
              costPrice: line.costPrice,
            },
            { where: { id: line.id, tenantId, salesInvoiceId: id }, transaction }
          );
        } else {
          await SalesInvoiceDetail.create(
            {
              tenantId,
              salesInvoiceId: id,
              itemId: line.itemId,
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

    return SalesInvoiceRepository.findById(tenantId, id);
  }

  /**
   * Delete invoice and its details in a transaction
   */
  static async delete(tenantId, id, transaction) {
    await SalesInvoiceDetail.destroy({
      where: { tenantId, salesInvoiceId: id },
      transaction,
    });
    return SalesInvoice.destroy({
      where: { tenantId, id },
      transaction,
    });
  }

  /**
   * Update invoice status
   */
  static async updateStatus(tenantId, id, status, userId, transaction) {
    return SalesInvoice.update(
      { status, updatedBy: userId },
      { where: { tenantId, id }, transaction }
    );
  }

  /**
   * Set journalEntryId on invoice
   */
  static async setJournalEntry(tenantId, id, journalEntryId, transaction) {
    return SalesInvoice.update(
      { journalEntryId },
      { where: { tenantId, id }, transaction }
    );
  }

  /**
   * Get invoice details lines only
   */
  static async getDetailsOnly(tenantId, id) {
    return SalesInvoiceDetail.findAll({
      where: { tenantId, salesInvoiceId: id },
      include: [{ model: Item, as: 'item', attributes: ['id', 'name', 'itemCode'], required: false }],
    });
  }
}

module.exports = SalesInvoiceRepository;