'use strict';
const crvRepo = require('../repositories/CashReceiptVoucherRepository');
const JournalEntryService = require('./JournalEntryService');
const AuditService = require('./AuditService');
const logger = require('../utils/logger');
const { BadRequestError, NotFoundError } = require('../utils/appError');
const { sequelize } = require('../models');
const { Account, SystemConfig, CashReceiptVoucher } = require('../models');

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
    if (existing.status === 'cancelled') throw new BadRequestError('Cancelled CRVs cannot be edited');
    if (existing.status === 'reversed') throw new BadRequestError('Reversed CRVs cannot be edited');

    const oldValues = {
      voucherDate: existing.voucherDate,
      cashAccountId: existing.cashAccountId,
      payerType: existing.payerType,
      payerName: existing.payerName,
      referenceNumber: existing.referenceNumber,
      paymentMethod: existing.paymentMethod,
      currency: existing.currency,
      exchangeRate: parseFloat(existing.exchangeRate || 1),
      description: existing.description,
      subtotal: parseFloat(existing.subtotal || 0),
      taxAmount: parseFloat(existing.taxAmount || 0),
      totalAmount: parseFloat(existing.totalAmount || 0),
      lines: (existing.lines || []).map(l => ({
        accountId: l.accountId,
        description: l.description,
        amount: parseFloat(l.amount || 0),
        taxRate: parseFloat(l.taxRate || 0),
        taxAmount: parseFloat(l.taxAmount || 0),
      })),
    };

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
      voucherData.unallocatedAmount = voucherData.totalAmount - parseFloat(existing.allocatedAmount || 0);

      // If the CRV was posted and has accounting entries, reverse the old JE and
      // recreate a new one from the revised values.
      if (existing.status === 'posted' && existing.journalEntryId) {
        const vatPayableId = await this._getVatPayableId(tenantId);

        await this._createAndPostJournalEntry({
          lines: this._buildJeLines(existing, vatPayableId, true),
          entryDate: new Date().toISOString().split('T')[0],
          reference: `REV-${existing.voucherNumber}`,
          description: `Reversal of CRV ${existing.voucherNumber} (edited)`,
          source: 'cash-receipt-voucher-reversal',
          sourceId: existing.journalEntryId,
        }, tenantId, userId, t);

        const revisedForLines = {
          voucherNumber: existing.voucherNumber,
          cashAccountId: voucherData.cashAccountId,
          totalAmount: voucherData.totalAmount,
          description: voucherData.description,
          lines: lines.map(l => ({
            accountId: l.accountId,
            description: l.description,
            amount: l.amount,
            taxAmount: l.taxAmount,
          })),
        };

        const newJe = await this._createAndPostJournalEntry({
          lines: this._buildJeLines(revisedForLines, vatPayableId, false),
          entryDate: voucherData.voucherDate,
          reference: existing.voucherNumber,
          description: voucherData.description || `Cash Receipt Voucher ${existing.voucherNumber}`,
          source: 'cash-receipt-voucher',
          sourceId: id,
        }, tenantId, userId, t);

        voucherData.journalEntryId = newJe.id;
        voucherData.postedAt = new Date();
        voucherData.postedBy = existing.postedBy || userId;
      }

      const voucher = await crvRepo.update(id, tenantId, voucherData, lines, t);

      await AuditService.recordSystem('CRV_UPDATED', 'Sales', 'CashReceiptVoucher', id, {
        tenantId, userId,
        entityReferenceNumber: existing.voucherNumber,
        description: `CRV ${existing.voucherNumber} updated`,
        oldValues,
        newValues: {
          voucherDate: voucherData.voucherDate,
          cashAccountId: voucherData.cashAccountId,
          payerType: voucherData.payerType,
          payerName: voucherData.payerName,
          referenceNumber: voucherData.referenceNumber,
          paymentMethod: voucherData.paymentMethod,
          currency: voucherData.currency,
          exchangeRate: parseFloat(voucherData.exchangeRate || 1),
          description: voucherData.description,
          subtotal: voucherData.subtotal,
          taxAmount: voucherData.taxAmount,
          totalAmount: voucherData.totalAmount,
          lines: lines.map(l => ({ accountId: l.accountId, description: l.description, amount: l.amount, taxRate: l.taxRate, taxAmount: l.taxAmount })),
        },
      });

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

      // Create journal entry and post it so it appears in the General Ledger
      const journalEntry = await JournalEntryService.createEntry({
        lines: jeLines,
        entryDate: voucher.voucherDate,
        reference: voucher.voucherNumber,
        description: voucher.description || `Cash Receipt Voucher ${voucher.voucherNumber}`,
        source: 'cash-receipt-voucher',
        sourceId: id,
        isAutoGenerated: true,
      }, tenantId, userId, t);
      await JournalEntryService.postEntry(journalEntry.id, tenantId, userId, t);

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
        source: 'cash-receipt-voucher-reversal',
        sourceId: id,
        isAutoGenerated: true,
      }, tenantId, userId, t);
      await JournalEntryService.postEntry(journalEntry.id, tenantId, userId, t);

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

  async delete(id, tenantId, userId, reason = null) {
    const voucher = await this.getById(id, tenantId);

    const t = await sequelize.transaction();
    try {
      // Reverse the GL impact when deleting a posted CRV so no orphaned/active
      // journal entries are left behind.
      if (voucher.status === 'posted' && voucher.journalEntryId) {
        const vatPayableId = await this._getVatPayableId(tenantId);
        await this._createAndPostJournalEntry({
          lines: this._buildJeLines(voucher, vatPayableId, true),
          entryDate: new Date().toISOString().split('T')[0],
          reference: `REV-${voucher.voucherNumber}`,
          description: `Reversal of CRV ${voucher.voucherNumber} (deleted)`,
          source: 'cash-receipt-voucher-reversal',
          sourceId: voucher.journalEntryId,
        }, tenantId, userId, t);
      }

      // Soft delete
      await CashReceiptVoucher.update(
        { isDeleted: true, updatedBy: userId },
        { where: { id, tenantId }, transaction: t }
      );

      await AuditService.recordSystem('CRV_DELETED', 'Sales', 'CashReceiptVoucher', id, {
        tenantId, userId,
        entityReferenceNumber: voucher.voucherNumber,
        description: `CRV ${voucher.voucherNumber} deleted${reason ? `: ${reason}` : ''}`,
        oldValues: {
          voucherNumber: voucher.voucherNumber,
          status: voucher.status,
          totalAmount: parseFloat(voucher.totalAmount || 0),
          journalEntryId: voucher.journalEntryId || null,
          deleteReason: reason || null,
        },
      });

      await t.commit();
      return { message: 'CRV deleted successfully' };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async _getVatPayableId(tenantId) {
    const vatConfigs = await SystemConfig.findAll({
      where: { tenantId, category: 'accounting', configKey: 'vat_payable' },
      attributes: ['configValue'],
    });
    return vatConfigs.length > 0 ? vatConfigs[0].configValue : null;
  }

  _buildJeLines(voucher, vatPayableId, reversal = false) {
    const jeLines = [];
    const lines = voucher.lines || [];
    const total = parseFloat(voucher.totalAmount || 0);

    jeLines.push({
      accountId: voucher.cashAccountId,
      debit: reversal ? 0 : total,
      credit: reversal ? total : 0,
      description: `${reversal ? 'REVERSAL: ' : ''}CRV ${voucher.voucherNumber}${voucher.description ? ` - ${voucher.description}` : ''}`,
    });

    for (const line of lines) {
      const lineAmount = parseFloat(line.amount || 0);
      const taxAmt = parseFloat(line.taxAmount || 0);

      if (lineAmount > 0) {
        jeLines.push({
          accountId: line.accountId,
          debit: reversal ? lineAmount : 0,
          credit: reversal ? 0 : lineAmount,
          description: `${reversal ? 'REVERSAL: ' : ''}CRV ${voucher.voucherNumber}${line.description ? ` - ${line.description}` : ''}`,
        });
      }
      if (taxAmt > 0 && vatPayableId) {
        jeLines.push({
          accountId: vatPayableId,
          debit: reversal ? taxAmt : 0,
          credit: reversal ? 0 : taxAmt,
          description: `${reversal ? 'REVERSAL: ' : ''}VAT on CRV ${voucher.voucherNumber}`,
        });
      }
    }

    return jeLines;
  }

  async _createAndPostJournalEntry(data, tenantId, userId, transaction) {
    const journalEntry = await JournalEntryService.createEntry(data, tenantId, userId, transaction);
    await JournalEntryService.postEntry(journalEntry.id, tenantId, userId, transaction);
    return journalEntry;
  }
}

module.exports = new CashReceiptVoucherService();
