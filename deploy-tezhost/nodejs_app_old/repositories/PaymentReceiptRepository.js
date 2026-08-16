const BaseRepository = require('./BaseRepository');
const { PaymentReceipt, PaymentReceiptAllocation, SalesInvoice, BankAccount, Customer, JournalEntry, User } = require('../models');
const { Op, literal } = require('sequelize');

class PaymentReceiptRepository extends BaseRepository {
  constructor() {
    super(PaymentReceipt);
  }

  async findByNumber(receiptNumber, tenantId) {
    return await this.model.findOne({ where: { receiptNumber, tenantId } });
  }

  async findById(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId },
      include: [
        { model: BankAccount, as: 'bankAccount', attributes: ['id', 'accountCode', 'accountName', 'accountNumber'] },
        { model: Customer, as: 'customer', attributes: ['id', 'code', 'name'] },
        { model: JournalEntry, as: 'journalEntry', attributes: ['id', 'entryNumber'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] },
        {
          model: PaymentReceiptAllocation, as: 'allocations',
          include: [{ model: SalesInvoice, as: 'invoice', attributes: ['id', 'invoiceNumber', 'grandTotal'] }],
        },
      ],
    });
  }

  async findAndCountAll(tenantId, { page = 1, limit = 20, filters = {}, order = [['createdAt', 'DESC']], search = '', customerId, bankAccountId, status, startDate, endDate } = {}) {
    const where = { tenantId, ...filters };
    if (customerId) where.customerId = customerId;
    if (bankAccountId) where.bankAccountId = bankAccountId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.receiptDate = {};
      if (startDate) where.receiptDate[Op.gte] = startDate;
      if (endDate) where.receiptDate[Op.lte] = endDate;
    }
    if (search) {
      where[Op.or] = [
        { receiptNumber: { [Op.like]: `%${search}%` } },
        { referenceNumber: { [Op.like]: `%${search}%` } },
        { receivedFrom: { [Op.like]: `%${search}%` } },
      ];
    }
    const offset = (page - 1) * limit;
    const result = await this.model.findAndCountAll({
      where, limit, offset, order, distinct: true,
      include: [
        { model: BankAccount, as: 'bankAccount', attributes: ['id', 'accountCode', 'accountName'] },
        { model: Customer, as: 'customer', attributes: ['id', 'code', 'name'] },
      ],
    });
    return {
      rows: result.rows, count: result.count,
      pagination: { page, limit, total: result.count, totalPages: Math.ceil(result.count / limit), hasNext: page * limit < result.count, hasPrev: page > 1 },
    };
  }

  async generateReceiptNumber(tenantId) {
    const year = new Date().getFullYear();
    const prefix = `PR-${year}-`;
    const last = await this.model.findOne({
      where: { tenantId, receiptNumber: { [Op.like]: `${prefix}%` } },
      order: [['receiptNumber', 'DESC']],
      attributes: ['receiptNumber'],
      paranoid: false,
    });
    let nextNum = 1;
    if (last) {
      const parts = last.receiptNumber.split('-');
      nextNum = parseInt(parts[parts.length - 1], 10) + 1;
    }
    return `${prefix}${String(nextNum).padStart(5, '0')}`;
  }

  async findPostedInvoicesForAllocation(tenantId, customerId, excludeReceiptId = null) {
    const { Op, literal } = require('sequelize');
    const paidAmountSubquery = `(
      SELECT COALESCE(SUM(all_alloc.allocated_amount), 0) FROM (
        SELECT allocated_amount FROM customer_payment_allocations
        WHERE sales_invoice_id = SalesInvoice.id
        UNION ALL
        SELECT allocated_amount FROM payment_receipt_allocations
        WHERE sales_invoice_id = SalesInvoice.id
          ${excludeReceiptId ? `AND payment_receipt_id != '${excludeReceiptId}'` : ''}
      ) AS all_alloc
    )`;

    const rows = await SalesInvoice.findAll({
      where: { tenantId, customerId, status: 'posted' },
      attributes: { include: [[literal(paidAmountSubquery), 'paidAmount']] },
      include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'code'], required: false }],
      order: [['invoiceDate', 'DESC']],
    });

    return rows
      .map((inv) => {
        const paid = parseFloat(inv.getDataValue('paidAmount') || 0);
        const total = parseFloat(inv.grandTotal || 0);
        const outstanding = Math.max(total - paid, 0);
        return { ...inv.toJSON(), paidAmount: paid, outstandingBalance: outstanding };
      })
      .filter((inv) => inv.outstandingBalance > 0);
  }

  async createWithAllocations(data, allocations, tenantId, userId) {
    const receipt = await this.model.create({
      ...data,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });

    if (allocations && allocations.length > 0) {
      const allocData = allocations.map((a) => ({
        paymentReceiptId: receipt.id,
        salesInvoiceId: a.salesInvoiceId,
        allocatedAmount: a.allocatedAmount,
        tenantId,
      }));
      await PaymentReceiptAllocation.bulkCreate(allocData);
    }

    return receipt;
  }

  async updateWithAllocations(id, data, allocations, tenantId, userId) {
    const where = { id, tenantId };
    const payload = { ...data, updatedBy: userId };
    await this.model.update(payload, { where });

    if (allocations !== undefined) {
      await PaymentReceiptAllocation.destroy({ where: { paymentReceiptId: id } });
      if (allocations.length > 0) {
        const allocData = allocations.map((a) => ({
          paymentReceiptId: id,
          salesInvoiceId: a.salesInvoiceId,
          allocatedAmount: a.allocatedAmount,
          tenantId,
        }));
        await PaymentReceiptAllocation.bulkCreate(allocData);
      }
    }

    return await this.findById(id, tenantId);
  }
}

module.exports = new PaymentReceiptRepository();
