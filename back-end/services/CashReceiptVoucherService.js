'use strict';
const crvRepo = require('../repositories/CashReceiptVoucherRepository');
const JournalEntryService = require('./JournalEntryService');
const AuditService = require('./AuditService');
const logger = require('../utils/logger');
const { BadRequestError, NotFoundError } = require('../utils/appError');
const { sequelize } = require('../models');
const { Account, SystemConfig } = require('../models');

class CashReceiptVoucherService {
  async list(tenantId, filters) {
    return await crvRepo.findAll(tenantId, filters);
  }

  async getById(id, tenantId) {
    const voucher = await crvRepo.findById(id, tenantId);
    if (!voucher) throw new NotFoundError('Cash Receipt Voucher not found');
    return voucher;
  }

  async create(tenantId, data, userId) {
    const t = await sequelize.transaction();
    try {
      const voucherNumber = await crvRepo.generateVoucherNumber(tenantId);

      const voucherData = {
        tenantId,
        branchId: data.branchId || null,
        voucherNumber,
        voucherDate: data.voucherDate || new Date().toISOString().split('T')[0],
        cashAccountId: data.cashAccountId,
        payerType: data.payerType || 'other',
        payerId: data.payerId || null,
        payerName: data.payerName || null,
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
          partyId: l.partyId || null,
          description: l.description || null,
          amount,
          taxId: l.taxId || null,
          taxRate,
          taxAmount,
          totalAmount: amount + taxAmount,
          costCenterId: l.costCenterId || null,
        };
      });

      const subtotal = lines.reduce((s, l) => s + l.amount, 0);
      const taxAmount = lines.reduce((s, l) => s + l.taxAmount, 0);
      const totalAmount = subtotal + taxAmount;

      voucherData.subtotal = subtotal;
      voucherData.taxAmount = taxAmount;
      voucherData.totalAmount = totalAmount;
      voucherData.unallocatedAmount = totalAmount;

      const voucher = await crvRepo.create(voucherData, lines, t);

      await AuditService.recordSystem('CRV_CREATED', 'Sales', 'CashReceiptVoucher', voucher.id, {
        tenantId, userId,
        description: `CRV ${voucherNumber} created for ${totalAmount} ${voucherData.currency}`,
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
        payerType: data.payerType || existing.payerType,
        payerId: data.payerId ?? existing.payerId,
        payerName: data.payerName ?? existing.payerName,
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
          partyId: l.partyId || null,
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
      voucherData.unallocatedAmount = voucherData.totalAmount - parseFloat(voucherData.allocatedAmount || 0);

      const voucher = await crvRepo.update(id, tenantId, voucherData, lines, t);
      await t.commit();
      return voucher;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async post(id, tenantId, userId) {
    const voucher = await this.getById(id, tenantId);
    if (voucher.status === 'posted') throw new BadRequestError('CRV is already posted');
    if (voucher.status === 'cancelled') throw new BadRequestError('Cannot post a cancelled CRV');
    if (voucher.status === 'reversed') throw new BadRequestError('Cannot post a reversed CRV');

    if (voucher.totalAmount <= 0) throw new BadRequestError('Total amount must be greater than zero');

    // Validate cash account
    const cashAccount = await Account.findOne({ where: { id: voucher.cashAccountId, tenantId } });
    if (!cashAccount) throw new BadRequestError('Cash account not found');

    const t = await sequelize.transaction();
    try {
      const jeLines = [];
      const lines = voucher.lines || [];

      // Look up VAT Payable account from system config (tax on receipts)
      let vatPayableId = null;
      const vatConfigs = await SystemConfig.findAll({
        where: { tenantId, category: 'accounting', configKey: 'vat_payable' },
        attributes: ['configValue'],
      });
      if (vatConfigs.length > 0) vatPayableId = vatConfigs[0].configValue;

      // DEBIT: Cash account (money comes IN)
      jeLines.push({
        accountId: voucher.cashAccountId,
        debit: parseFloat(voucher.totalAmount),
        credit: 0,
        description: `CRV ${voucher.voucherNumber} - ${voucher.description || 'Cash Receipt'}`,
      });

      // CREDIT: Income accounts (base) + VAT Payable (tax)
      for (const line of lines) {
        const lineAmount = parseFloat(line.amount);
        const taxAmt = parseFloat(line.taxAmount || 0);

        // Credit the base amount to the selected income account
        if (lineAmount > 0) {
          jeLines.push({
            accountId: line.accountId,
            debit: 0,
            credit: lineAmount,
            description: line.description || `CRV Line - ${voucher.voucherNumber}`,
          });
        }
        // Credit VAT Payable for the tax portion
        if (taxAmt > 0 && vatPayableId) {
          jeLines.push({
            accountId: vatPayableId,
            debit: 0,
            credit: taxAmt,
            description: `VAT on CRV ${voucher.voucherNumber}`,
          });
        }
      }

      // Create journal entry
      const journalEntry = await JournalEntryService.createEntry({
        lines: jeLines,
        entryDate: voucher.voucherDate,
        reference: voucher.voucherNumber,
        description: voucher.description || `Cash Receipt Voucher ${voucher.voucherNumber}`,
      }, tenantId, userId, t);

      // Update CRV status
      await crvRepo.update(id, tenantId, {
        status: 'posted',
        journalEntryId: journalEntry.id,
        postedBy: userId,
        postedAt: new Date(),
      }, null, t);

      await AuditService.recordSystem('CRV_POSTED', 'Sales', 'CashReceiptVoucher', id, {
        tenantId, userId,
        description: `CRV ${voucher.voucherNumber} posted. JE: ${journalEntry.entryNumber}`,
      });

      await t.commit();
      logger.info(`CRV ${voucher.voucherNumber} posted successfully`);
      return await this.getById(id, tenantId);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async reverse(id, tenantId, userId) {
    const voucher = await this.getById(id, tenantId);
    if (voucher.status !== 'posted') throw new BadRequestError('Only posted CRVs can be reversed');

    const t = await sequelize.transaction();
    try {
      const jeLines = [];
      const lines = voucher.lines || [];

      // Look up VAT Payable account from system config
      let vatPayableId = null;
      const vatConfigs = await SystemConfig.findAll({
        where: { tenantId, category: 'accounting', configKey: 'vat_payable' },
        attributes: ['configValue'],
      });
      if (vatConfigs.length > 0) vatPayableId = vatConfigs[0].configValue;

      // Reverse: Credit Cash, Debit income accounts + VAT Payable
      jeLines.push({
        accountId: voucher.cashAccountId,
        debit: 0,
        credit: parseFloat(voucher.totalAmount),
        description: `REVERSAL: CRV ${voucher.voucherNumber}`,
      });

      for (const line of lines) {
        const lineAmount = parseFloat(line.amount);
        const taxAmt = parseFloat(line.taxAmount || 0);

        if (lineAmount > 0) {
          jeLines.push({
            accountId: line.accountId,
            debit: lineAmount,
            credit: 0,
            description: `REVERSAL: CRV ${voucher.voucherNumber}`,
          });
        }
        if (taxAmt > 0 && vatPayableId) {
          jeLines.push({
            accountId: vatPayableId,
            debit: taxAmt,
            credit: 0,
            description: `REVERSAL: VAT on CRV ${voucher.voucherNumber}`,
          });
        }
      }

      const journalEntry = await JournalEntryService.createEntry({
        lines: jeLines,
        entryDate: new Date().toISOString().split('T')[0],
        reference: `REV-${voucher.voucherNumber}`,
        description: `Reversal of CRV ${voucher.voucherNumber}`,
      }, tenantId, userId, t);

      await crvRepo.update(id, tenantId, {
        status: 'reversed',
        reversedBy: userId,
        reversedAt: new Date(),
      }, null, t);

      await AuditService.recordSystem('CRV_REVERSED', 'Sales', 'CashReceiptVoucher', id, {
        tenantId, userId,
        description: `CRV ${voucher.voucherNumber} reversed. JE: ${journalEntry.entryNumber}`,
      });

      await t.commit();
      logger.info(`CRV ${voucher.voucherNumber} reversed successfully`);
      return await this.getById(id, tenantId);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async cancel(id, tenantId, userId) {
    const voucher = await this.getById(id, tenantId);
    if (voucher.status === 'posted') throw new BadRequestError('Cannot cancel a posted CRV. Use reverse instead.');
    if (voucher.status === 'cancelled') throw new BadRequestError('CRV is already cancelled');
    if (voucher.status === 'reversed') throw new BadRequestError('CRV is already reversed');

    await crvRepo.update(id, tenantId, {
      status: 'cancelled',
      updatedBy: userId,
    }, null);

    await AuditService.recordSystem('CRV_CANCELLED', 'Sales', 'CashReceiptVoucher', id, {
      tenantId, userId,
      description: `CRV ${voucher.voucherNumber} cancelled`,
    });

    return await this.getById(id, tenantId);
  }

  async delete(id, tenantId, userId) {
    const voucher = await this.getById(id, tenantId);
    if (voucher.status !== 'draft' && voucher.status !== 'cancelled') {
      throw new BadRequestError('Only draft or cancelled CRVs can be deleted');
    }

    await crvRepo.softDelete(id, tenantId);

    await AuditService.recordSystem('CRV_DELETED', 'Sales', 'CashReceiptVoucher', id, {
      tenantId, userId,
      description: `CRV ${voucher.voucherNumber} deleted`,
    });

    return { message: 'CRV deleted successfully' };
  }
}

module.exports = new CashReceiptVoucherService();
