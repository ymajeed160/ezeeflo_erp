const paymentReceiptRepository = require('../repositories/PaymentReceiptRepository');
const bankAccountRepository = require('../repositories/BankAccountRepository');
const { BankAccount, Account, JournalEntry, Customer, sequelize } = require('../models');
const { BadRequestError, NotFoundError } = require('../utils/appError');
const logger = require('../utils/logger');
const journalEntryService = require('./JournalEntryService');

class PaymentReceiptService {
  async getReceipts(tenantId, query = {}) {
    const { page = 1, limit = 20, search, customerId, bankAccountId, status, startDate, endDate } = query;
    return await paymentReceiptRepository.findAndCountAll(tenantId, {
      page: parseInt(page, 10), limit: parseInt(limit, 10), search,
      customerId, bankAccountId, status, startDate, endDate,
    });
  }

  async getReceiptById(id, tenantId) {
    const receipt = await paymentReceiptRepository.findById(id, tenantId);
    if (!receipt) throw new NotFoundError('Payment receipt not found');
    return receipt;
  }

  async getInvoicesForAllocation(tenantId, customerId, excludeReceiptId = null) {
    return await paymentReceiptRepository.findPostedInvoicesForAllocation(tenantId, customerId, excludeReceiptId);
  }

  async createReceipt(data, tenantId, userId) {
    const bankAccount = await bankAccountRepository.findById(data.bankAccountId, tenantId);
    if (!bankAccount) throw new NotFoundError('Bank account not found');
    if (!bankAccount.isActive) throw new BadRequestError('Bank account is inactive');

    const amount = parseFloat(data.amount);
    const allocations = data.allocations || [];

    // Validate allocations
    if (allocations.length > 0) {
      const totalAllocated = allocations.reduce((sum, a) => sum + parseFloat(a.allocatedAmount || 0), 0);
      if (totalAllocated > amount) {
        throw new BadRequestError(`Total allocation (${totalAllocated}) cannot exceed receipt amount (${amount})`);
      }

      // Validate each invoice exists and is posted
      for (const alloc of allocations) {
        const invoice = await sequelize.query(
          `SELECT id, grand_total, status FROM SalesInvoices WHERE id = :id AND tenant_id = :tenantId`,
          { replacements: { id: alloc.salesInvoiceId, tenantId }, type: sequelize.QueryTypes.SELECT }
        );
        if (!invoice || invoice.length === 0) {
          throw new NotFoundError(`Sales invoice ${alloc.salesInvoiceId} not found`);
        }
        if (invoice[0].status !== 'posted') {
          throw new BadRequestError(`Invoice ${invoice[0].id} is not posted`);
        }
      }
    }

    // Determine receivedFrom
    let receivedFrom = data.receivedFrom;
    if (!receivedFrom && data.customerId) {
      const customer = await Customer.findByPk(data.customerId);
      if (customer) receivedFrom = customer.name;
    }

    // Generate receipt number
    const receiptNumber = await paymentReceiptRepository.generateReceiptNumber(tenantId);

    const receiptData = {
      receiptNumber,
      receiptDate: data.receiptDate,
      customerId: data.customerId || null,
      bankAccountId: data.bankAccountId,
      paymentMethod: data.paymentMethod || 'Bank Transfer',
      referenceNumber: data.referenceNumber || null,
      amount,
      currencyCode: data.currencyCode || bankAccount.currencyCode || 'USD',
      exchangeRate: data.exchangeRate || 1.0,
      receivedFrom: receivedFrom || null,
      depositReference: data.depositReference || null,
      status: 'Draft',
      notes: data.notes || null,
    };

    const receipt = await paymentReceiptRepository.createWithAllocations(receiptData, allocations, tenantId, userId);
    logger.info(`Payment receipt ${receiptNumber} created by user ${userId}`);
    return await paymentReceiptRepository.findById(receipt.id, tenantId);
  }

  async updateReceipt(id, data, tenantId, userId) {
    const receipt = await paymentReceiptRepository.findById(id, tenantId);
    if (!receipt) throw new NotFoundError('Payment receipt not found');
    if (receipt.status !== 'Draft') throw new BadRequestError('Only draft receipts can be edited');

    const updateData = { ...data };
    delete updateData.allocations;
    const allocations = data.allocations;

    const updated = await paymentReceiptRepository.updateWithAllocations(id, updateData, allocations, tenantId, userId);
    if (!updated) throw new NotFoundError('Payment receipt not found after update');
    return updated;
  }

  async postReceipt(id, tenantId, userId) {
    const receipt = await paymentReceiptRepository.findById(id, tenantId);
    if (!receipt) throw new NotFoundError('Payment receipt not found');
    if (receipt.status !== 'Draft') throw new BadRequestError(`Cannot post receipt with status "${receipt.status}"`);

    return await sequelize.transaction(async (transaction) => {
      const bankAccount = await BankAccount.findOne({
        where: { id: receipt.bankAccountId, tenantId },
        include: [{ model: Account, as: 'chartOfAccount' }],
        transaction,
      });
      if (!bankAccount || !bankAccount.chartOfAccount) {
        throw new BadRequestError('Bank account chart of account not configured');
      }

      // Find customer AR account
      let customerAccountId = null;
      if (receipt.customerId) {
        const customer = await Customer.findByPk(receipt.customerId, { transaction });
        if (customer && customer.customerAccountId) {
          customerAccountId = customer.customerAccountId;
        }
      }

      if (!customerAccountId) {
        throw new BadRequestError('Customer or customer account receivable account not found');
      }

      const amount = parseFloat(receipt.amount);
      const bankCoaId = bankAccount.chartOfAccount.id;

      // Journal Entry: Bank Account DR, Accounts Receivable CR
      const journalData = {
        lines: [
          { accountId: bankCoaId, debit: amount, credit: 0 },
          { accountId: customerAccountId, debit: 0, credit: amount },
        ],
        entryDate: receipt.receiptDate,
        reference: receipt.receiptNumber,
        description: `Payment receipt ${receipt.receiptNumber} - ${receipt.receivedFrom || ''}`,
      };

      const journalEntry = await journalEntryService.createEntry(journalData, tenantId, userId, transaction);

      // Create bank transaction record
      const bankTransactionRepo = require('../repositories/BankTransactionRepository');
      const currentBalance = await bankTransactionRepo.getRunningBalance(receipt.bankAccountId, tenantId);
      const txnNumber = await bankTransactionRepo.generateTransactionNumber(tenantId);

      await bankTransactionRepo.create({
        bankAccountId: receipt.bankAccountId,
        transactionNumber: txnNumber,
        transactionDate: receipt.receiptDate,
        valueDate: receipt.receiptDate,
        transactionType: 'Deposit',
        direction: 'In',
        referenceNumber: receipt.receiptNumber,
        description: `Payment receipt ${receipt.receiptNumber}`,
        debitAmount: 0,
        creditAmount: amount,
        runningBalance: currentBalance + amount,
        status: 'Posted',
        sourceType: 'payment_receipt',
        sourceId: receipt.id,
        offsetAccountId: customerAccountId,
        journalEntryId: journalEntry.id,
      }, tenantId, userId);

      // Update receipt
      await paymentReceiptRepository.update(id, {
        status: 'Posted',
        journalEntryId: journalEntry.id,
      }, tenantId, userId);

      logger.info(`Payment receipt ${receipt.receiptNumber} posted by user ${userId}`);
      return await paymentReceiptRepository.findById(receipt.id, tenantId);
    });
  }

  async reverseReceipt(id, tenantId, userId) {
    const receipt = await paymentReceiptRepository.findById(id, tenantId);
    if (!receipt) throw new NotFoundError('Payment receipt not found');
    if (receipt.status !== 'Posted') throw new BadRequestError(`Cannot reverse receipt with status "${receipt.status}"`);

    return await sequelize.transaction(async (transaction) => {
      const bankAccount = await BankAccount.findOne({
        where: { id: receipt.bankAccountId, tenantId },
        include: [{ model: Account, as: 'chartOfAccount' }],
        transaction,
      });
      if (!bankAccount || !bankAccount.chartOfAccount) {
        throw new BadRequestError('Bank account chart of account not configured');
      }

      let customerAccountId = null;
      if (receipt.customerId) {
        const customer = await Customer.findByPk(receipt.customerId, { transaction });
        if (customer && customer.customerAccountId) {
          customerAccountId = customer.customerAccountId;
        }
      }
      if (!customerAccountId) {
        throw new BadRequestError('Customer account receivable account not found');
      }

      const amount = parseFloat(receipt.amount);
      const bankCoaId = bankAccount.chartOfAccount.id;

      // Reversal Journal Entry: AR DR, Bank CR
      const journalData = {
        lines: [
          { accountId: customerAccountId, debit: amount, credit: 0 },
          { accountId: bankCoaId, debit: 0, credit: amount },
        ],
        entryDate: new Date().toISOString().split('T')[0],
        reference: `REV-${receipt.receiptNumber}`,
        description: `Reversal of payment receipt ${receipt.receiptNumber}`,
      };

      const journalEntry = await journalEntryService.createEntry(journalData, tenantId, userId, transaction);

      // Create reversal bank transaction
      const bankTransactionRepo = require('../repositories/BankTransactionRepository');
      const currentBalance = await bankTransactionRepo.getRunningBalance(receipt.bankAccountId, tenantId);
      const txnNumber = await bankTransactionRepo.generateTransactionNumber(tenantId);

      await bankTransactionRepo.create({
        bankAccountId: receipt.bankAccountId,
        transactionNumber: txnNumber,
        transactionDate: new Date().toISOString().split('T')[0],
        valueDate: new Date().toISOString().split('T')[0],
        transactionType: 'Adjustment',
        direction: 'Out',
        referenceNumber: receipt.receiptNumber,
        description: `Reversal of payment receipt ${receipt.receiptNumber}`,
        debitAmount: amount,
        creditAmount: 0,
        runningBalance: currentBalance - amount,
        status: 'Posted',
        sourceType: 'payment_receipt_reversal',
        sourceId: receipt.id,
        offsetAccountId: customerAccountId,
        journalEntryId: journalEntry.id,
      }, tenantId, userId);

      await paymentReceiptRepository.update(id, { status: 'Reversed' }, tenantId, userId);
      logger.info(`Payment receipt ${receipt.receiptNumber} reversed by user ${userId}`);
      return await paymentReceiptRepository.findById(receipt.id, tenantId);
    });
  }

  async deleteReceipt(id, tenantId) {
    const receipt = await paymentReceiptRepository.findById(id, tenantId);
    if (!receipt) throw new NotFoundError('Payment receipt not found');
    if (receipt.status !== 'Draft') throw new BadRequestError('Only draft receipts can be deleted');
    await paymentReceiptRepository.delete(id, tenantId, false);
    logger.info(`Payment receipt ${receipt.receiptNumber} deleted`);
    return true;
  }
}

module.exports = new PaymentReceiptService();
