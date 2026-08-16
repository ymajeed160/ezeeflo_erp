const BaseRepository = require('./BaseRepository');
const { PaymentVoucher, PaymentVoucherAllocation, PaymentVoucherLine, PurchaseInvoice, Supplier, BankAccount, Account, JournalEntry, User } = require('../models');
const { Op, literal } = require('sequelize');

class PaymentVoucherRepository extends BaseRepository {
  constructor() { super(PaymentVoucher); }

  async findByNumber(voucherNumber, tenantId) {
    return await this.model.findOne({ where: { voucherNumber, tenantId } });
  }

  async findById(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId },
      include: [
        { model: BankAccount, as: 'bankAccount', attributes: ['id', 'accountCode', 'accountName', 'accountNumber'] },
        { model: Supplier, as: 'supplier', attributes: ['id', 'code', 'name'] },
        { model: JournalEntry, as: 'journalEntry', attributes: ['id', 'entryNumber'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: PaymentVoucherAllocation, as: 'allocations', include: [{ model: PurchaseInvoice, as: 'invoice', attributes: ['id', 'invoiceNumber', 'grandTotal'] }] },
        { model: PaymentVoucherLine, as: 'lines', include: [{ model: Account, as: 'account', attributes: ['id', 'code', 'name'] }] },
      ],
    });
  }

  async findAndCountAll(tenantId, { page = 1, limit = 20, filters = {}, order = [['createdAt', 'DESC']], search = '', supplierId, bankAccountId, status, paymentPurpose, startDate, endDate } = {}) {
    const where = { tenantId, ...filters };
    if (supplierId) where.supplierId = supplierId;
    if (bankAccountId) where.bankAccountId = bankAccountId;
    if (status) where.status = status;
    if (paymentPurpose) where.paymentPurpose = paymentPurpose;
    if (startDate || endDate) { where.voucherDate = {}; if (startDate) where.voucherDate[Op.gte] = startDate; if (endDate) where.voucherDate[Op.lte] = endDate; }
    if (search) {
      where[Op.or] = [
        { voucherNumber: { [Op.like]: `%${search}%` } },
        { referenceNumber: { [Op.like]: `%${search}%` } },
        { paidTo: { [Op.like]: `%${search}%` } },
      ];
    }
    const offset = (page - 1) * limit;
    const result = await this.model.findAndCountAll({
      where, limit, offset, order, distinct: true,
      include: [
        { model: BankAccount, as: 'bankAccount', attributes: ['id', 'accountCode', 'accountName'] },
        { model: Supplier, as: 'supplier', attributes: ['id', 'code', 'name'] },
      ],
    });
    return { rows: result.rows, count: result.count, pagination: { page, limit, total: result.count, totalPages: Math.ceil(result.count / limit), hasNext: page * limit < result.count, hasPrev: page > 1 } };
  }

  async generateVoucherNumber(tenantId) {
    const year = new Date().getFullYear();
    const prefix = `PV-${year}-`;
    const last = await this.model.findOne({
      where: { tenantId, voucherNumber: { [Op.like]: `${prefix}%` } },
      order: [['voucherNumber', 'DESC']], attributes: ['voucherNumber'], paranoid: false,
    });
    let nextNum = 1;
    if (last) { const parts = last.voucherNumber.split('-'); nextNum = parseInt(parts[parts.length - 1], 10) + 1; }
    return `${prefix}${String(nextNum).padStart(5, '0')}`;
  }

  async findPostedInvoicesForAllocation(tenantId, supplierId, excludeVoucherId = null) {
    const paidAmountSubquery = `(
      SELECT COALESCE(SUM(all_alloc.allocated_amount), 0) FROM (
        SELECT allocated_amount FROM supplier_payment_allocations
        WHERE purchase_invoice_id = PurchaseInvoice.id
        UNION ALL
        SELECT allocated_amount FROM payment_voucher_allocations
        WHERE purchase_invoice_id = PurchaseInvoice.id
          ${excludeVoucherId ? `AND payment_voucher_id != '${excludeVoucherId}'` : ''}
      ) AS all_alloc
    )`;

    const rows = await PurchaseInvoice.findAll({
      where: { tenantId, supplierId, status: 'posted' },
      attributes: { include: [[literal(paidAmountSubquery), 'paidAmount']] },
      include: [{ model: Supplier, as: 'supplier', attributes: ['id', 'name', 'code'], required: false }],
      order: [['createdAt', 'DESC']],
    });

    return rows.map((inv) => {
      const paid = parseFloat(inv.getDataValue('paidAmount') || 0);
      const total = parseFloat(inv.grandTotal || 0);
      const outstanding = Math.max(total - paid, 0);
      return { ...inv.toJSON(), paidAmount: paid, outstandingBalance: outstanding };
    }).filter((inv) => inv.outstandingBalance > 0);
  }

  async createWithAllocationsAndLines(data, allocations, lines, tenantId, userId) {
    const voucher = await this.model.create({ ...data, tenantId, createdBy: userId, updatedBy: userId });
    if (allocations && allocations.length > 0) {
      await PaymentVoucherAllocation.bulkCreate(allocations.map((a) => ({ paymentVoucherId: voucher.id, purchaseInvoiceId: a.purchaseInvoiceId, allocatedAmount: a.allocatedAmount, tenantId })));
    }
    if (lines && lines.length > 0) {
      await PaymentVoucherLine.bulkCreate(lines.map((l) => ({ paymentVoucherId: voucher.id, accountId: l.accountId, description: l.description || null, amount: l.amount, taxPercentage: l.taxPercentage || 0, taxAccountId: l.taxAccountId || null, tenantId })));
    }
    return voucher;
  }

  async updateWithAllocationsAndLines(id, data, allocations, lines, tenantId, userId) {
    await this.model.update({ ...data, updatedBy: userId }, { where: { id, tenantId } });
    if (allocations !== undefined) {
      await PaymentVoucherAllocation.destroy({ where: { paymentVoucherId: id } });
      if (allocations.length > 0) {
        await PaymentVoucherAllocation.bulkCreate(allocations.map((a) => ({ paymentVoucherId: id, purchaseInvoiceId: a.purchaseInvoiceId, allocatedAmount: a.allocatedAmount, tenantId })));
      }
    }
    if (lines !== undefined) {
      await PaymentVoucherLine.destroy({ where: { paymentVoucherId: id } });
      if (lines.length > 0) {
        await PaymentVoucherLine.bulkCreate(lines.map((l) => ({ paymentVoucherId: id, accountId: l.accountId, description: l.description || null, amount: l.amount, taxPercentage: l.taxPercentage || 0, taxAccountId: l.taxAccountId || null, tenantId })));
      }
    }
    return await this.findById(id, tenantId);
  }
}

module.exports = new PaymentVoucherRepository();
