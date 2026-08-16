const paymentVoucherRepository = require('../repositories/PaymentVoucherRepository');
const bankAccountRepository = require('../repositories/BankAccountRepository');
const { BankAccount, Account, JournalEntry, Supplier, PurchaseInvoice, sequelize } = require('../models');
const { BadRequestError, NotFoundError } = require('../utils/appError');
const logger = require('../utils/logger');
const journalEntryService = require('./JournalEntryService');

class PaymentVoucherService {
  async getVouchers(tenantId, query = {}) {
    const { page = 1, limit = 20, search, supplierId, bankAccountId, status, paymentPurpose, startDate, endDate } = query;
    return await paymentVoucherRepository.findAndCountAll(tenantId, { page: parseInt(page, 10), limit: parseInt(limit, 10), search, supplierId, bankAccountId, status, paymentPurpose, startDate, endDate });
  }

  async getVoucherById(id, tenantId) {
    const voucher = await paymentVoucherRepository.findById(id, tenantId);
    if (!voucher) throw new NotFoundError('Payment voucher not found');
    return voucher;
  }

  async getInvoicesForAllocation(tenantId, supplierId, excludeVoucherId = null) {
    return await paymentVoucherRepository.findPostedInvoicesForAllocation(tenantId, supplierId, excludeVoucherId);
  }

  async createVoucher(data, tenantId, userId) {
    const bankAccount = await bankAccountRepository.findById(data.bankAccountId, tenantId);
    if (!bankAccount) throw new NotFoundError('Bank account not found');
    if (!bankAccount.isActive) throw new BadRequestError('Bank account is inactive');

    const amount = parseFloat(data.amount);
    const allocations = data.allocations || [];
    const lines = data.lines || [];
    const paymentPurpose = data.paymentPurpose || (data.supplierId ? 'Supplier Payment' : 'Direct Expense');

    // Validate allocations for supplier payments
    if (paymentPurpose === 'Supplier Payment' && allocations.length > 0) {
      const totalAllocated = allocations.reduce((sum, a) => sum + parseFloat(a.allocatedAmount || 0), 0);
      if (totalAllocated > amount) {
        throw new BadRequestError(`Total allocation (${totalAllocated}) cannot exceed voucher amount (${amount})`);
      }
    }

    // For direct expense, require at least one expense line
    if (paymentPurpose === 'Direct Expense' && lines.length === 0) {
      throw new BadRequestError('At least one expense/account line is required for direct expense payments');
    }

    // Validate supplier if provided
    let paidTo = data.paidTo;
    if (data.supplierId) {
      const supplier = await Supplier.findOne({ where: { id: data.supplierId, tenantId } });
      if (!supplier) throw new NotFoundError('Supplier not found');
      if (!paidTo) paidTo = supplier.name;
    }

    // Validate allocations reference valid posted invoices
    if (allocations.length > 0) {
      for (const alloc of allocations) {
        const invoice = await PurchaseInvoice.findOne({ where: { id: alloc.purchaseInvoiceId, tenantId, status: 'posted' } });
        if (!invoice) throw new BadRequestError(`Purchase invoice ${alloc.purchaseInvoiceId} not found or not posted`);
      }
    }

    const voucherNumber = await paymentVoucherRepository.generateVoucherNumber(tenantId);

    const voucherData = {
      voucherNumber, voucherDate: data.voucherDate,
      supplierId: data.supplierId || null, bankAccountId: data.bankAccountId,
      paymentMethod: data.paymentMethod || 'Bank Transfer',
      referenceNumber: data.referenceNumber || null,
      amount, currencyCode: data.currencyCode || bankAccount.currencyCode || 'USD',
      exchangeRate: data.exchangeRate || 1.0,
      paidTo: paidTo || null, paymentPurpose,
      status: 'Draft', notes: data.notes || null,
    };

    const voucher = await paymentVoucherRepository.createWithAllocationsAndLines(voucherData, allocations, lines, tenantId, userId);
    logger.info(`Payment voucher ${voucherNumber} created by user ${userId}`);
    return await paymentVoucherRepository.findById(voucher.id, tenantId);
  }

  async updateVoucher(id, data, tenantId, userId) {
    const voucher = await paymentVoucherRepository.findById(id, tenantId);
    if (!voucher) throw new NotFoundError('Payment voucher not found');
    if (voucher.status !== 'Draft') throw new BadRequestError('Only draft vouchers can be edited');

    const updateData = { ...data };
    delete updateData.allocations;
    delete updateData.lines;

    const updated = await paymentVoucherRepository.updateWithAllocationsAndLines(id, updateData, data.allocations, data.lines, tenantId, userId);
    if (!updated) throw new NotFoundError('Payment voucher not found after update');
    return updated;
  }

  async postVoucher(id, tenantId, userId) {
    const voucher = await paymentVoucherRepository.findById(id, tenantId);
    if (!voucher) throw new NotFoundError('Payment voucher not found');
    if (voucher.status !== 'Draft') throw new BadRequestError(`Cannot post voucher with status "${voucher.status}"`);

    return await sequelize.transaction(async (transaction) => {
      const bankAccount = await BankAccount.findOne({
        where: { id: voucher.bankAccountId, tenantId },
        include: [{ model: Account, as: 'chartOfAccount' }],
        transaction,
      });
      if (!bankAccount || !bankAccount.chartOfAccount) throw new BadRequestError('Bank account chart of account not configured');

      const amount = parseFloat(voucher.amount);
      const bankCoaId = bankAccount.chartOfAccount.id;
      const lines = [];

      if (voucher.paymentPurpose === 'Supplier Payment' || voucher.paymentPurpose === 'Advance Payment') {
        // Accounts Payable DR, Bank Account CR
        let apAccountId = null;
        if (voucher.supplierId) {
          const supplier = await Supplier.findByPk(voucher.supplierId, { transaction });
          if (supplier && supplier.apAccountId) apAccountId = supplier.apAccountId;
        }
        if (!apAccountId) throw new BadRequestError('Supplier AP account not configured');

        lines.push({ accountId: apAccountId, debit: amount, credit: 0 });
        lines.push({ accountId: bankCoaId, debit: 0, credit: amount });
      } else if (voucher.paymentPurpose === 'Direct Expense') {
        // Expense lines DR, Bank Account CR
        const voucherLines = voucher.lines || [];
        if (voucherLines.length === 0) throw new BadRequestError('No expense lines found');

        let totalExpense = 0;
        for (const line of voucherLines) {
          const lineAmount = parseFloat(line.amount || 0);
          totalExpense += lineAmount;
          lines.push({ accountId: line.accountId, debit: lineAmount, credit: 0 });

          // If tax applies, add tax line
          if (parseFloat(line.taxPercentage || 0) > 0 && line.taxAccountId) {
            const taxAmount = lineAmount * (parseFloat(line.taxPercentage) / 100);
            lines.push({ accountId: line.taxAccountId, debit: taxAmount, credit: 0 });
            totalExpense += taxAmount;
          }
        }

        if (Math.abs(totalExpense - amount) > 0.01) {
          throw new BadRequestError(`Total expense lines (${totalExpense}) must equal voucher amount (${amount})`);
        }

        lines.push({ accountId: bankCoaId, debit: 0, credit: amount });
      } else {
        // Other: use offset from lines or supplier AP
        let offsetAccountId = null;
        if (voucher.supplierId) {
          const supplier = await Supplier.findByPk(voucher.supplierId, { transaction });
          if (supplier && supplier.apAccountId) offsetAccountId = supplier.apAccountId;
        }
        if (!offsetAccountId) throw new BadRequestError('No offset account available');

        lines.push({ accountId: offsetAccountId, debit: amount, credit: 0 });
        lines.push({ accountId: bankCoaId, debit: 0, credit: amount });
      }

      const journalData = {
        lines,
        entryDate: voucher.voucherDate,
        reference: voucher.voucherNumber,
        description: `Payment voucher ${voucher.voucherNumber} - ${voucher.paidTo || voucher.paymentPurpose}`,
      };
      const journalEntry = await journalEntryService.createEntry(journalData, tenantId, userId, transaction);

      // Create bank transaction
      const bankTransactionRepo = require('../repositories/BankTransactionRepository');
      const currentBalance = await bankTransactionRepo.getRunningBalance(voucher.bankAccountId, tenantId);
      const txnNumber = await bankTransactionRepo.generateTransactionNumber(tenantId);

      await bankTransactionRepo.create({
        bankAccountId: voucher.bankAccountId, transactionNumber: txnNumber,
        transactionDate: voucher.voucherDate, valueDate: voucher.voucherDate,
        transactionType: 'Withdrawal', direction: 'Out',
        referenceNumber: voucher.voucherNumber,
        description: `Payment voucher ${voucher.voucherNumber}`,
        debitAmount: amount, creditAmount: 0,
        runningBalance: currentBalance - amount, status: 'Posted',
        sourceType: 'payment_voucher', sourceId: voucher.id,
        journalEntryId: journalEntry.id,
      }, tenantId, userId);

      await paymentVoucherRepository.update(id, { status: 'Posted', journalEntryId: journalEntry.id }, tenantId, userId);
      logger.info(`Payment voucher ${voucher.voucherNumber} posted by user ${userId}`);
      return await paymentVoucherRepository.findById(voucher.id, tenantId);
    });
  }

  async reverseVoucher(id, tenantId, userId) {
    const voucher = await paymentVoucherRepository.findById(id, tenantId);
    if (!voucher) throw new NotFoundError('Payment voucher not found');
    if (voucher.status !== 'Posted') throw new BadRequestError(`Cannot reverse voucher with status "${voucher.status}"`);

    return await sequelize.transaction(async (transaction) => {
      const bankAccount = await BankAccount.findOne({
        where: { id: voucher.bankAccountId, tenantId },
        include: [{ model: Account, as: 'chartOfAccount' }],
        transaction,
      });
      if (!bankAccount || !bankAccount.chartOfAccount) throw new BadRequestError('Bank account chart of account not configured');

      const amount = parseFloat(voucher.amount);
      const bankCoaId = bankAccount.chartOfAccount.id;

      // Reverse entries: Bank DR, Offset CR (opposite of posting)
      let offsetAccountId = null;
      if (voucher.supplierId) {
        const supplier = await Supplier.findByPk(voucher.supplierId, { transaction });
        if (supplier && supplier.apAccountId) offsetAccountId = supplier.apAccountId;
      }
      if (!offsetAccountId) throw new BadRequestError('Cannot determine offset account for reversal');

      const lines = [
        { accountId: bankCoaId, debit: amount, credit: 0 },
        { accountId: offsetAccountId, debit: 0, credit: amount },
      ];

      const journalData = {
        lines, entryDate: new Date().toISOString().split('T')[0],
        reference: `REV-${voucher.voucherNumber}`,
        description: `Reversal of payment voucher ${voucher.voucherNumber}`,
      };
      const journalEntry = await journalEntryService.createEntry(journalData, tenantId, userId, transaction);

      const bankTransactionRepo = require('../repositories/BankTransactionRepository');
      const currentBalance = await bankTransactionRepo.getRunningBalance(voucher.bankAccountId, tenantId);
      const txnNumber = await bankTransactionRepo.generateTransactionNumber(tenantId);

      await bankTransactionRepo.create({
        bankAccountId: voucher.bankAccountId, transactionNumber: txnNumber,
        transactionDate: new Date().toISOString().split('T')[0], valueDate: new Date().toISOString().split('T')[0],
        transactionType: 'Adjustment', direction: 'In',
        referenceNumber: voucher.voucherNumber,
        description: `Reversal of payment voucher ${voucher.voucherNumber}`,
        debitAmount: 0, creditAmount: amount,
        runningBalance: currentBalance + amount, status: 'Posted',
        sourceType: 'payment_voucher_reversal', sourceId: voucher.id,
        journalEntryId: journalEntry.id,
      }, tenantId, userId);

      await paymentVoucherRepository.update(id, { status: 'Reversed' }, tenantId, userId);
      logger.info(`Payment voucher ${voucher.voucherNumber} reversed by user ${userId}`);
      return await paymentVoucherRepository.findById(voucher.id, tenantId);
    });
  }

  async deleteVoucher(id, tenantId) {
    const voucher = await paymentVoucherRepository.findById(id, tenantId);
    if (!voucher) throw new NotFoundError('Payment voucher not found');
    if (voucher.status !== 'Draft') throw new BadRequestError('Only draft vouchers can be deleted');
    await paymentVoucherRepository.delete(id, tenantId, false);
    logger.info(`Payment voucher ${voucher.voucherNumber} deleted`);
    return true;
  }
}

module.exports = new PaymentVoucherService();
