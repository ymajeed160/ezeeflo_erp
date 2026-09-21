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
      // Apply account overrides from the post dialog if provided
      if (body.paymentAccountId || body.customerAccountId) {
        const updateData = {};
        if (body.paymentAccountId) updateData.paymentAccountId = body.paymentAccountId;
        if (body.customerAccountId) updateData.customerAccountId = body.customerAccountId;
        await CustomerPaymentRepository.update(tenantId, id, updateData, t);
        if (body.paymentAccountId) existing.paymentAccountId = body.paymentAccountId;
        if (body.customerAccountId) existing.customerAccountId = body.customerAccountId;
      }

      const payment = existing;

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