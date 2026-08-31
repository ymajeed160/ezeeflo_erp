'use strict';
const cpvRepo = require('../repositories/CashPaymentVoucherRepository');
const JournalEntryService = require('./JournalEntryService');
const AuditService = require('./AuditService');
const logger = require('../utils/logger');
const { BadRequestError, NotFoundError } = require('../utils/appError');
const { sequelize } = require('../models');
const { Account, SystemConfig, CashPaymentVoucher } = require('../models');

class CashPaymentVoucherService {
  async list(tenantId, filters) {
    return await cpvRepo.findAll(tenantId, filters);
  }

  async getById(id, tenantId) {
    const voucher = await cpvRepo.findById(id, tenantId);
    if (!voucher) throw new NotFoundError('Cash Payment Voucher not found');
    return voucher;
  }

  async create(tenantId, data, userId) {
    const t = await sequelize.transaction();
    try {
      const voucherNumber = await cpvRepo.generateVoucherNumber(tenantId);

      const voucherData = {
        tenantId,
        branchId: data.branchId || null,
        voucherNumber,
        voucherDate: data.voucherDate || new Date().toISOString().split('T')[0],
        cashAccountId: data.cashAccountId,
        payeeType: data.payeeType || 'other',
        payeeId: data.payeeId || null,
        payeeName: data.payeeName || null,
        referenceNumber: data.referenceNumber || null,
        paymentMethod: data.paymentMethod || 'cash',
        currency: data.currency || 'AED',
        exchangeRate: data.exchangeRate || 1,
        description: data.description || null,
        createdBy: userId,
        updatedBy: userId,
      };

      const lines = (data.lines || []).map(l => {
        const amount = parseFloat(l.amount || 0);
        const taxRate = parseFloat(l.taxRate || 0);
        const taxAmount = parseFloat(l.taxAmount || 0) || (amount * taxRate / 100);
        return {
          accountId: l.accountId,
          description: l.description || null,
          amount,
          taxId: l.taxId || null,
          taxRate,
          taxAmount,
          totalAmount: amount + taxAmount,
          costCenterId: l.costCenterId || null,
        };
      });

      // Calculate totals
      const subtotal = lines.reduce((s, l) => s + l.amount, 0);
      const taxAmount = lines.reduce((s, l) => s + l.taxAmount, 0);
      const totalAmount = subtotal + taxAmount;

      voucherData.subtotal = subtotal;
      voucherData.taxAmount = taxAmount;
      voucherData.totalAmount = totalAmount;

      const voucher = await cpvRepo.create(voucherData, lines, t);

      await AuditService.recordSystem('CPV_CREATED', 'Purchases', 'CashPaymentVoucher', voucher.id, {
        tenantId, userId,
        description: `CPV ${voucherNumber} created for ${totalAmount} ${voucherData.currency}`,
        newValues: { voucherNumber, totalAmount, status: 'draft' },
      });

      await t.commit();
      return voucher;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async update(id, tenantId, data, userId) {
    const existing = await this.getById(id, tenantId);
    if (existing.status !== 'draft') {
      throw new BadRequestError('Only draft vouchers can be edited');
    }

    const t = await sequelize.transaction();
    try {
      const voucherData = {
        branchId: data.branchId ?? existing.branchId,
        voucherDate: data.voucherDate || existing.voucherDate,
        cashAccountId: data.cashAccountId || existing.cashAccountId,
        payeeType: data.payeeType || existing.payeeType,
        payeeId: data.payeeId ?? existing.payeeId,
        payeeName: data.payeeName ?? existing.payeeName,
        referenceNumber: data.referenceNumber ?? existing.referenceNumber,
        paymentMethod: data.paymentMethod || existing.paymentMethod,
        currency: data.currency || existing.currency,
        exchangeRate: data.exchangeRate ?? existing.exchangeRate,
        description: data.description ?? existing.description,
        updatedBy: userId,
      };

      const lines = (data.lines || []).map(l => {
        const amount = parseFloat(l.amount || 0);
        const taxRate = parseFloat(l.taxRate || 0);
        const taxAmount = parseFloat(l.taxAmount || 0) || (amount * taxRate / 100);
        return {
          accountId: l.accountId,
          description: l.description || null,
          amount,
          taxId: l.taxId || null,
          taxRate,
          taxAmount,
          totalAmount: amount + taxAmount,
          costCenterId: l.costCenterId || null,
        };
      });

      voucherData.subtotal = lines.reduce((s, l) => s + l.amount, 0);
      voucherData.taxAmount = lines.reduce((s, l) => s + l.taxAmount, 0);
      voucherData.totalAmount = voucherData.subtotal + voucherData.taxAmount;

      const voucher = await cpvRepo.update(id, tenantId, voucherData, lines, t);
      await t.commit();
      return voucher;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async post(id, tenantId, userId) {
    const voucher = await this.getById(id, tenantId);
    if (voucher.status === 'posted') throw new BadRequestError('CPV is already posted');
    if (voucher.status === 'cancelled') throw new BadRequestError('Cannot post a cancelled CPV');
    if (voucher.status === 'reversed') throw new BadRequestError('Cannot post a reversed CPV');

    if (voucher.totalAmount <= 0) throw new BadRequestError('Total amount must be greater than zero');

    // Validate cash account
    const cashAccount = await Account.findOne({ where: { id: voucher.cashAccountId, tenantId } });
    if (!cashAccount) throw new BadRequestError('Cash account not found');

    const t = await sequelize.transaction();
    try {
      // Build journal entry lines
      const jeLines = [];

      // Look up VAT Receivable account from system config (tax on purchases)
      let vatReceivableId = null;
      const vatConfigs = await SystemConfig.findAll({
        where: { tenantId, category: 'accounting', configKey: 'vat_receivable' },
        attributes: ['configValue'],
      });
      if (vatConfigs.length > 0) vatReceivableId = vatConfigs[0].configValue;

      // Debit: expense accounts + tax
      const lines = voucher.lines || [];
      for (const line of lines) {
        const expenseAmount = parseFloat(line.amount);
        const taxAmt = parseFloat(line.taxAmount || 0);

        if (expenseAmount > 0) {
          jeLines.push({
            accountId: line.accountId,
            debit: expenseAmount,
            credit: 0,
            description: line.description || `CPV Line - ${voucher.voucherNumber}`,
          });
        }
        // Debit VAT Receivable for the tax portion
        if (taxAmt > 0 && vatReceivableId) {
          jeLines.push({
            accountId: vatReceivableId,
            debit: taxAmt,
            credit: 0,
            description: `VAT on CPV ${voucher.voucherNumber}`,
          });
        }
      }

      // Credit: cash account
      jeLines.push({
        accountId: voucher.cashAccountId,
        debit: 0,
        credit: voucher.totalAmount,
        description: `CPV ${voucher.voucherNumber} - ${voucher.description || 'Cash Payment'}`,
      });

      // Create journal entry
      const journalEntry = await JournalEntryService.createEntry({
        lines: jeLines,
        entryDate: voucher.voucherDate,
        reference: voucher.voucherNumber,
        description: voucher.description || `Cash Payment Voucher ${voucher.voucherNumber}`,
      }, tenantId, userId, t);

      // Update CPV status
      await cpvRepo.update(id, tenantId, {
        status: 'posted',
        journalEntryId: journalEntry.id,
        postedBy: userId,
        postedAt: new Date(),
      }, null, t);

      await AuditService.recordSystem('CPV_POSTED', 'Purchases', 'CashPaymentVoucher', id, {
        tenantId, userId,
        description: `CPV ${voucher.voucherNumber} posted. JE: ${journalEntry.entryNumber}`,
      });

      await t.commit();
      logger.info(`CPV ${voucher.voucherNumber} posted successfully`);
      return await this.getById(id, tenantId);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async reverse(id, tenantId, userId) {
    const voucher = await this.getById(id, tenantId);
    if (voucher.status !== 'posted') throw new BadRequestError('Only posted CPVs can be reversed');

    const t = await sequelize.transaction();
    try {
      const jeLines = [];

      // Look up VAT Receivable account from system config
      let vatReceivableId = null;
      const vatConfigs = await SystemConfig.findAll({
        where: { tenantId, category: 'accounting', configKey: 'vat_receivable' },
        attributes: ['configValue'],
      });
      if (vatConfigs.length > 0) vatReceivableId = vatConfigs[0].configValue;

      // Reverse: Credit expense accounts + VAT, Debit cash
      const lines = voucher.lines || [];
      for (const line of lines) {
        const taxAmt = parseFloat(line.taxAmount || 0);

        if (parseFloat(line.amount) > 0) {
          jeLines.push({
            accountId: line.accountId,
            debit: 0,
            credit: parseFloat(line.amount),
            description: `REVERSAL: CPV ${voucher.voucherNumber}`,
          });
        }
        if (taxAmt > 0 && vatReceivableId) {
          jeLines.push({
            accountId: vatReceivableId,
            debit: 0,
            credit: taxAmt,
            description: `REVERSAL: VAT on CPV ${voucher.voucherNumber}`,
          });
        }
      }

      jeLines.push({
        accountId: voucher.cashAccountId,
        debit: voucher.totalAmount,
        credit: 0,
        description: `REVERSAL: CPV ${voucher.voucherNumber}`,
      });

      const journalEntry = await JournalEntryService.createEntry({
        lines: jeLines,
        entryDate: new Date().toISOString().split('T')[0],
        reference: `REV-${voucher.voucherNumber}`,
        description: `Reversal of CPV ${voucher.voucherNumber}`,
      }, tenantId, userId, t);

      await cpvRepo.update(id, tenantId, {
        status: 'reversed',
        reversedBy: userId,
        reversedAt: new Date(),
      }, null, t);

      await AuditService.recordSystem('CPV_REVERSED', 'Purchases', 'CashPaymentVoucher', id, {
        tenantId, userId,
        description: `CPV ${voucher.voucherNumber} reversed. JE: ${journalEntry.entryNumber}`,
      });

      await t.commit();
      return await this.getById(id, tenantId);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async cancel(id, tenantId, userId, reason = null) {
    const voucher = await this.getById(id, tenantId);
    if (voucher.status === 'posted') throw new BadRequestError('Posted CPVs cannot be cancelled. Use reverse instead.');

    await cpvRepo.update(id, tenantId, { status: 'cancelled', updatedBy: userId, cancelReason: reason || null }, null);

    await AuditService.recordSystem('CPV_CANCELLED', 'Purchases', 'CashPaymentVoucher', id, {
      tenantId, userId,
      description: `CPV ${voucher.voucherNumber} cancelled`,
    });

    return await this.getById(id, tenantId);
  }

  async delete(id, tenantId, userId, reason = null) {
    const voucher = await this.getById(id, tenantId);
    if (voucher.journalEntryId) throw new BadRequestError('This Cash Payment Voucher is linked to a journal entry. Delete the journal entry first, then delete this voucher.');

    const t = await sequelize.transaction();
    try {
      await CashPaymentVoucher.update(
        { deletedBy: userId, deleteReason: reason || null },
        { where: { id, tenantId }, transaction: t }
      );
      await cpvRepo.destroy(id, tenantId, t);
      await t.commit();
      return true;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async restore(id, tenantId, userId) {
    const voucher = await cpvRepo.findById(id, tenantId, null, true);
    if (!voucher) throw new NotFoundError('Cash Payment Voucher not found');

    await cpvRepo.restore(id, tenantId);
    return await this.getById(id, tenantId);
  }
}

module.exports = new CashPaymentVoucherService();
