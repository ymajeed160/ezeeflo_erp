'use strict';
const { sequelize } = require('../models');
const CustomerPaymentRepository = require('../repositories/CustomerPaymentRepository');
const CustomerPaymentDTO = require('../dto/CustomerPaymentDTO');
const AuditService = require('./AuditService');
const { Op } = require('sequelize');

class CustomerPaymentService {
  /**
   * List customer payments with pagination, filtering, sorting, searching
   */
  static async list(tenantId, query = {}) {
    const { data, count, page, limit, totalPages } = await CustomerPaymentRepository.findAll(tenantId, query);
    return {
      data: data.map(CustomerPaymentDTO.toList),
      count,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get customer payment by ID
   */
  static async getById(tenantId, id) {
    const payment = await CustomerPaymentRepository.findById(tenantId, id);
    if (!payment) {
      const error = new Error('Customer Payment not found');
      error.status = 404;
      throw error;
    }
    return CustomerPaymentDTO.toDetail(payment);
  }

  /**
   * Create customer payment with allocations, generate payment number
   */
  static async create(tenantId, body, userId) {
    const t = await sequelize.transaction();
    try {
      if (!body.paymentNumber) {
        body.paymentNumber = await CustomerPaymentService.generatePaymentNumber(tenantId);
      }

      const data = CustomerPaymentDTO.toCreate(body, tenantId, userId);
      const payment = await CustomerPaymentRepository.create(data, t);

      await AuditService.log({
        tenantId,
        userId,
        action: 'CREATE',
        entity: 'CustomerPayment',
        entityId: payment.id,
        newValues: { paymentNumber: payment.paymentNumber, amount: payment.amount },
      }, t);

      await t.commit();
      return CustomerPaymentDTO.toDetail(payment);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Update customer payment (only draft payments can be updated)
   */
  static async update(tenantId, id, body, userId) {
    const existing = await CustomerPaymentRepository.findById(tenantId, id);
    if (!existing) {
      const error = new Error('Customer Payment not found');
      error.status = 404;
      throw error;
    }
    if (existing.status !== 'draft') {
      const error = new Error('Only draft payments can be updated');
      error.status = 400;
      throw error;
    }

    const t = await sequelize.transaction();
    try {
      const data = CustomerPaymentDTO.toUpdate(body, userId);
      const updated = await CustomerPaymentRepository.update(tenantId, id, data, t);

      await AuditService.log({
        tenantId,
        userId,
        action: 'UPDATE',
        entity: 'CustomerPayment',
        entityId: id,
        oldValues: { amount: existing.amount },
        newValues: { amount: updated.amount },
      }, t);

      await t.commit();
      return CustomerPaymentDTO.toDetail(updated);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Delete customer payment (only draft)
   */
  static async delete(tenantId, id) {
    const existing = await CustomerPaymentRepository.findById(tenantId, id);
    if (!existing) {
      const error = new Error('Customer Payment not found');
      error.status = 404;
      throw error;
    }
    if (existing.status !== 'draft') {
      const error = new Error('Only draft payments can be deleted');
      error.status = 400;
      throw error;
    }
    const t = await sequelize.transaction();
    try {
      await CustomerPaymentRepository.delete(tenantId, id, t);
      await t.commit();
      return { message: 'Customer Payment deleted successfully' };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Post customer payment: Create journal entry
   * DR Payment Account (Bank/Cash) - Amount
   * CR Customer Account (Accounts Receivable) - Amount
   */
  static async post(tenantId, id, userId, body = {}) {
    const existing = await CustomerPaymentRepository.findById(tenantId, id);
    if (!existing) {
      const error = new Error('Customer Payment not found');
      error.status = 404;
      throw error;
    }
    if (existing.status !== 'draft') {
      const error = new Error('Only draft payments can be posted');
      error.status = 400;
      throw error;
    }

    const t = await sequelize.transaction();
    try {
      // Resolve posting accounts (customer A/R + cash/bank COA) from DB relationships
      await CustomerPaymentService._resolveAccounts(tenantId, id, existing, body, t);

      const payment = existing;

      // Validate allocations do not exceed invoice outstanding (backend authority)
      await CustomerPaymentService.validateAllocations(tenantId, payment, t);

      // Validate accounts before posting
      await CustomerPaymentService.validatePostingAccounts(tenantId, payment);

      const JournalEntryService = require('./JournalEntryService');
      const journalLines = await CustomerPaymentService.buildJournalLines(tenantId, payment);

      const journalEntry = await JournalEntryService.createEntry({
        tenantId,
        entryDate: payment.paymentDate,
        reference: `PMT-${payment.paymentNumber}`,
        description: `Customer Payment #${payment.paymentNumber} - Customer: ${payment.customer ? payment.customer.name : ''}`,
        lines: journalLines,
      }, tenantId, userId, t);

      await CustomerPaymentRepository.setJournalEntry(tenantId, id, journalEntry.id, t);
      await CustomerPaymentRepository.updateStatus(tenantId, id, 'posted', userId, t);

      await AuditService.log({
        tenantId,
        userId,
        action: 'POST',
        entity: 'CustomerPayment',
        entityId: id,
        newValues: { status: 'posted', journalEntryId: journalEntry.id },
      }, t);

      await t.commit();

      const updated = await CustomerPaymentRepository.findById(tenantId, id);
      return CustomerPaymentDTO.toDetail(updated);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Validate posting accounts for customer payment
   */
  static async validatePostingAccounts(tenantId, payment) {
    const { Account } = require('../models');

    if (!payment.paymentAccountId) {
      throw new Error('Payment Account (Bank/Cash) is required for posting');
    }
    const payAccount = await Account.findOne({
      where: { id: payment.paymentAccountId, tenantId, isActive: true },
    });
    if (!payAccount) {
      throw new Error('Payment Account is invalid, inactive, or belongs to a different tenant');
    }

    if (!payment.customerAccountId) {
      throw new Error('Customer Account (Accounts Receivable) is required for posting');
    }
    const arAccount = await Account.findOne({
      where: { id: payment.customerAccountId, tenantId, isActive: true },
    });
    if (!arAccount) {
      throw new Error('Customer Account is invalid, inactive, or belongs to a different tenant');
    }
  }

  /**
   * Resolve the posting accounts for a payment:
   * - Debit  → Cash COA (cash) or selected Bank's linked COA (bank/cheque/online/card/other)
   * - Credit → Customer's A/R account (arAccountId)
   * The backend is the authority — bank COA is read from the BankAccount record.
   */
  static async _resolveAccounts(tenantId, id, payment, body, t) {
    const { Customer, Account, BankAccount } = require('../models');
    const resolved = {};

    // Credit side: Customer A/R from customer profile
    if (!payment.customerAccountId) {
      const customer = payment.customer || (await Customer.findOne({ where: { id: payment.customerId, tenantId }, transaction: t }));
      if (!customer) throw new Error('Customer not found');
      if (!customer.arAccountId) throw new Error('Customer is not linked to a Chart of Account.');
      resolved.customerAccountId = customer.arAccountId;
    }

    // Debit side: Cash COA or Bank COA
    if (!payment.paymentAccountId) {
      const method = String(payment.paymentMethod || '').toLowerCase();
      if (method === 'cash') {
        if (!payment.cashAccountId) throw new Error('Please select a Cash Account.');
        const cashAcc = await Account.findOne({ where: { id: payment.cashAccountId, tenantId }, transaction: t });
        if (!cashAcc) throw new Error('Selected Cash Account not found.');
        if (cashAcc.type !== 'asset') throw new Error('Selected account is not configured as a Cash Account.');
        resolved.paymentAccountId = cashAcc.id;
      } else {
        if (!payment.bankAccountRefId) throw new Error('Please select a Bank Account.');
        const bank = await BankAccount.findOne({ where: { id: payment.bankAccountRefId, tenantId }, transaction: t });
        if (!bank) throw new Error('Selected Bank Account not found.');
        if (!bank.chartOfAccountId) throw new Error('Selected bank account is not linked to a Chart of Account.');
        resolved.paymentAccountId = bank.chartOfAccountId;
      }
    }

    // Explicit overrides win
    if (body.paymentAccountId) resolved.paymentAccountId = body.paymentAccountId;
    if (body.customerAccountId) resolved.customerAccountId = body.customerAccountId;

    if (Object.keys(resolved).length) {
      await CustomerPaymentRepository.update(tenantId, id, resolved, t);
      Object.assign(payment, resolved);
    }
  }

  /**
   * Backend validation: each allocation must not exceed the invoice's
   * outstanding balance (grandTotal - amounts allocated by other payments).
   */
  static async validateAllocations(tenantId, payment, t) {
    const { CustomerPaymentAllocation, SalesInvoice } = require('../models');
    for (const alloc of payment.allocations || []) {
      if (!alloc.salesInvoiceId) continue;
      const invoice = await SalesInvoice.findOne({ where: { id: alloc.salesInvoiceId, tenantId }, transaction: t });
      if (!invoice) continue;

      const otherAllocated = await CustomerPaymentAllocation.sum('allocatedAmount', {
        where: { tenantId, salesInvoiceId: alloc.salesInvoiceId, customerPaymentId: { [Op.ne]: payment.id } },
        transaction: t,
      });

      const total = parseFloat(invoice.grandTotal) || 0;
      const already = parseFloat(otherAllocated || 0);
      const thisAmt = parseFloat(alloc.allocatedAmount || 0);
      if (already + thisAmt > total + 0.009) {
        throw new Error(`Payment amount cannot exceed the invoice outstanding amount for invoice ${invoice.invoiceNumber}.`);
      }
    }
  }

  /**
   * Preview the resolved posting accounts for a payment (for the confirm dialog).
   */
  static async getPostingPreview(tenantId, id) {
    const payment = await CustomerPaymentRepository.findById(tenantId, id);
    if (!payment) {
      const error = new Error('Customer Payment not found');
      error.status = 404;
      throw error;
    }

    const { Customer, Account, BankAccount } = require('../models');

    let customerAccountId = payment.customerAccountId;
    if (!customerAccountId && payment.customer && payment.customer.arAccountId) customerAccountId = payment.customer.arAccountId;
    if (!customerAccountId) {
      const c = await Customer.findOne({ where: { id: payment.customerId, tenantId } });
      if (c && c.arAccountId) customerAccountId = c.arAccountId;
    }

    let paymentAccountId = payment.paymentAccountId;
    if (!paymentAccountId) {
      const method = String(payment.paymentMethod || '').toLowerCase();
      if (method === 'cash') {
        paymentAccountId = payment.cashAccountId || null;
      } else if (payment.bankAccountRefId) {
        const bank = await BankAccount.findOne({ where: { id: payment.bankAccountRefId, tenantId } });
        if (bank) paymentAccountId = bank.chartOfAccountId || null;
      }
    }

    const ids = [customerAccountId, paymentAccountId].filter(Boolean);
    const accounts = await Account.findAll({ where: { id: { [Op.in]: ids }, tenantId } });
    const byId = {};
    accounts.forEach((a) => { byId[a.id] = a; });
    const fmt = (aid) => (byId[aid] ? { id: byId[aid].id, code: byId[aid].code, name: byId[aid].name } : null);

    return {
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      paymentMethod: payment.paymentMethod,
      amount: parseFloat(payment.amount),
      customer: payment.customer ? { id: payment.customer.id, name: payment.customer.name } : null,
      paymentAccount: fmt(paymentAccountId),
      customerAccount: fmt(customerAccountId),
    };
  }

  /**
   * Cancel customer payment
   */
  static async cancel(tenantId, id, userId) {
    const existing = await CustomerPaymentRepository.findById(tenantId, id);
    if (!existing) {
      const error = new Error('Customer Payment not found');
      error.status = 404;
      throw error;
    }
    if (existing.status !== 'draft') {
      const error = new Error('Only draft payments can be cancelled');
      error.status = 400;
      throw error;
    }

    const t = await sequelize.transaction();
    try {
      await CustomerPaymentRepository.updateStatus(tenantId, id, 'cancelled', userId, t);

      await AuditService.log({
        tenantId,
        userId,
        action: 'CANCEL',
        entity: 'CustomerPayment',
        entityId: id,
        newValues: { status: 'cancelled' },
      }, t);

      await t.commit();

      const updated = await CustomerPaymentRepository.findById(tenantId, id);
      return CustomerPaymentDTO.toDetail(updated);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Build journal entry lines for customer payment
   * DR Payment Account (Bank/Cash) - Amount
   * CR Customer Account (Accounts Receivable) - Amount
   */
  static async buildJournalLines(tenantId, payment) {
    const lines = [];

    // Use explicit accounts from the payment record
    if (!payment.paymentAccountId) {
      throw new Error('Payment Account (Bank/Cash) is not configured. Please select a payment account.');
    }
    if (!payment.customerAccountId) {
      throw new Error('Customer Account (Accounts Receivable) is not configured. Please select a customer account.');
    }

    // 1. DR Payment Account (Bank/Cash)
    lines.push({
      accountId: payment.paymentAccountId,
      debit: parseFloat(payment.amount),
      credit: 0,
      description: `Customer Payment #${payment.paymentNumber} - ${payment.customer ? payment.customer.name : ''}`,
    });

    // 2. CR Customer Account (Accounts Receivable)
    lines.push({
      accountId: payment.customerAccountId,
      debit: 0,
      credit: parseFloat(payment.amount),
      description: `Customer Payment #${payment.paymentNumber} - ${payment.customer ? payment.customer.name : ''}`,
    });

    return lines;
  }

  /**
   * Generate payment number: PMT-YYYY-NNNNN
   */
  static async generatePaymentNumber(tenantId) {
    const { CustomerPayment } = require('../models');
    const year = new Date().getFullYear();
    const lastPayment = await CustomerPayment.findOne({
      where: {
        tenantId,
        paymentNumber: { [Op.like]: `PMT-${year}-%` },
      },
      order: [['id', 'DESC']],
    });

    let nextNumber = 1;
    if (lastPayment && lastPayment.paymentNumber) {
      const parts = lastPayment.paymentNumber.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }

    return `PMT-${year}-${String(nextNumber).padStart(5, '0')}`;
  }
}

module.exports = CustomerPaymentService;