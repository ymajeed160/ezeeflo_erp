'use strict';
const { sequelize } = require('../models');
const {
  PosReturn, PosReturnLine, PosSale, PosSaleLine,
  PosSession, PosTerminal, PosPayment, Item, Customer,
  InventoryBalance,
} = require('../models');
const InventoryTransactionService = require('./InventoryTransactionService');
const AuditService = require('./AuditService');
const logger = require('../utils/logger');

class PosReturnService {
  /**
   * List returns
   */
  static async list(tenantId, query = {}) {
    const { page = 1, limit = 50, terminalId, sessionId, startDate, endDate } = query;
    const where = { tenantId };
    if (terminalId) where.terminalId = terminalId;
    if (sessionId) where.sessionId = sessionId;
    if (startDate) where.returnDate = { ...where.returnDate, [require('sequelize').Op.gte]: startDate };
    if (endDate) where.returnDate = { ...where.returnDate, [require('sequelize').Op.lte]: endDate };

    const { rows, count } = await PosReturn.findAndCountAll({
      where,
      include: [
        { model: PosTerminal, as: 'terminal' },
        { model: Customer, as: 'customer' },
        { model: PosSale, as: 'originalSale' },
        { model: require('../models').User, as: 'cashier' },
      ],
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * limit,
      limit: parseInt(limit),
      subQuery: false,
    });

    return {
      data: rows,
      count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Get return by ID
   */
  static async getById(tenantId, id) {
    const ret = await PosReturn.findOne({
      where: { tenantId, id },
      include: [
        { model: PosTerminal, as: 'terminal' },
        { model: Customer, as: 'customer' },
        { model: PosSale, as: 'originalSale' },
        { model: require('../models').User, as: 'cashier' },
        { model: PosReturnLine, as: 'lines', include: [{ model: Item, as: 'item' }] },
      ],
    });
    if (!ret) {
      const error = new Error('POS Return not found');
      error.status = 404;
      throw error;
    }
    return ret;
  }

  /**
   * Generate return number
   */
  static async generateReturnNumber(tenantId) {
    const year = new Date().getFullYear();
    const prefix = `RET-POS-${year}-`;
    const last = await PosReturn.findOne({
      where: { tenantId, returnNumber: { [require('sequelize').Op.like]: `${prefix}%` } },
      order: [['returnNumber', 'DESC']],
    });
    let seq = 1;
    if (last) {
      const parts = last.returnNumber.split('-');
      seq = parseInt(parts[parts.length - 1] || 0) + 1;
    }
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  /**
   * Process a POS return (atomic transaction)
   */
  static async processReturn(tenantId, body, userId) {
    const t = await sequelize.transaction();
    try {
      const {
        originalSaleId, sessionId, terminalId, customerId,
        items = [], refundMethod = 'cash', reason,
      } = body;

      // Validate original sale
      const originalSale = await PosSale.findOne({
        where: { tenantId, id: originalSaleId, status: 'completed' },
        include: [{ model: PosSaleLine, as: 'lines' }],
        transaction: t,
      });
      if (!originalSale) {
        throw Object.assign(new Error('Original POS sale not found or not completed'), { status: 404 });
      }

      // Validate session
      const session = await PosSession.findOne({
        where: { tenantId, id: sessionId, status: 'open' },
        transaction: t,
      });
      if (!session) {
        throw Object.assign(new Error('POS Session not found or not open'), { status: 400 });
      }

      // Process return lines
      let subTotal = 0;
      let totalTax = 0;
      const returnLines = [];

      for (const item of items) {
        const { originalSaleLineId, quantity } = item;

        const originalLine = originalSale.lines.find(l => l.id === originalSaleLineId);
        if (!originalLine) {
          throw Object.assign(new Error(`Original sale line not found: ${originalSaleLineId}`), { status: 404 });
        }

        const returnQty = parseFloat(quantity);
        const soldQty = parseFloat(originalLine.quantity);

        if (returnQty <= 0 || returnQty > soldQty) {
          throw Object.assign(
            new Error(`Invalid return quantity for item. Max returnable: ${soldQty}`),
            { status: 400 }
          );
        }

        const lineSubTotal = parseFloat(originalLine.unitPrice) * returnQty;
        const lineTax = (lineSubTotal * parseFloat(originalLine.taxPercentage || 0)) / 100;

        subTotal += lineSubTotal;
        totalTax += lineTax;

        returnLines.push({
          originalSaleLineId: originalLine.id,
          itemId: originalLine.itemId,
          quantity: returnQty,
          unitPrice: parseFloat(originalLine.unitPrice),
          lineTotal: parseFloat(lineSubTotal.toFixed(2)),
          taxAmount: parseFloat(lineTax.toFixed(2)),
        });
      }

      const grandTotal = parseFloat((subTotal + totalTax).toFixed(2));
      const returnNumber = await this.generateReturnNumber(tenantId);

      // Create return
      const posReturn = await PosReturn.create({
        tenantId,
        terminalId: terminalId || session.terminalId,
        sessionId,
        userId,
        customerId: customerId || originalSale.customerId,
        originalSaleId: originalSale.id,
        originalInvoiceNumber: originalSale.invoiceNumber,
        returnNumber,
        returnDate: new Date().toISOString().split('T')[0],
        subTotal: parseFloat(subTotal.toFixed(2)),
        taxTotal: parseFloat(totalTax.toFixed(2)),
        grandTotal,
        refundAmount: grandTotal,
        refundMethod,
        status: 'completed',
        reason: reason || null,
        createdBy: userId,
      }, { transaction: t });

      // Create return lines
      const returnLineRecords = returnLines.map(rl => ({
        ...rl,
        posReturnId: posReturn.id,
      }));
      await PosReturnLine.bulkCreate(returnLineRecords, { transaction: t });

      // Increase inventory for returned products
      for (const rl of returnLines) {
        const item = await Item.findByPk(rl.itemId, { transaction: t });
        if (item && item.isInventoryTracked) {
          await InventoryTransactionService.recordTransaction({
            tenantId,
            itemId: rl.itemId,
            warehouseId: originalSale.warehouseId,
            transactionType: 'pos_return',
            referenceId: posReturn.id,
            referenceType: 'PosReturn',
            referenceNumber: returnNumber,
            quantity: parseFloat(rl.quantity),
            unitCost: 0,
            totalCost: 0,
          }, t);
        }
      }

      // Create reversal journal entry
      const JournalEntryService = require('./JournalEntryService');
      const reversalLines = await this.buildReversalJournalLines(tenantId, posReturn, originalSale);
      if (reversalLines.length > 0) {
        const journalEntry = await JournalEntryService.createEntry({
          tenantId,
          entryDate: posReturn.returnDate,
          reference: `RET-${returnNumber}`,
          description: `POS Return #${returnNumber} for Invoice #${originalSale.invoiceNumber}`,
          lines: reversalLines,
        }, tenantId, userId, t);

        await PosReturn.update(
          { journalEntryId: journalEntry.id },
          { where: { id: posReturn.id }, transaction: t }
        );
      }

      // Update original sale status
      await PosSale.update(
        { status: 'refunded' },
        { where: { id: originalSaleId }, transaction: t }
      );

      // Update session refund total
      await PosSession.increment(
        { refundTotal: grandTotal, totalSalesCount: -1 },
        { where: { id: sessionId }, transaction: t }
      );

      // Audit
      await AuditService.log({
        tenantId,
        userId,
        action: 'POS_RETURN_CREATED',
        module: 'POS',
        entity: 'PosReturn',
        entityId: posReturn.id,
        newValues: { returnNumber, originalInvoice: originalSale.invoiceNumber, refundAmount: grandTotal, refundMethod },
        description: `POS Return #${returnNumber} for Invoice #${originalSale.invoiceNumber} - ${grandTotal}`,
      });

      await t.commit();
      return this.getById(tenantId, posReturn.id);
    } catch (error) {
      await t.rollback();
      logger.error('POS Return transaction failed:', { error: error.message });
      throw error;
    }
  }

  /**
   * Build reversal journal lines for returns
   */
  static async buildReversalJournalLines(tenantId, posReturn, originalSale) {
    const lines = [];

    // DR Revenue (reversal of original CR)
    // CR Cash/Bank/AR (reversal of original DR)
    const netRevenue = posReturn.subTotal - 0; // discounts already accounted
    if (netRevenue > 0) {
      // Find revenue account
      const firstLine = originalSale.lines && originalSale.lines[0];
      if (firstLine) {
        const item = await Item.findByPk(firstLine.itemId);
        if (item && item.incomeAccountId) {
          // DR Revenue
          lines.push({
            accountId: item.incomeAccountId,
            debit: parseFloat(netRevenue.toFixed(2)),
            credit: 0,
            description: `Return reversal - Revenue for ${posReturn.returnNumber}`,
          });
        }
      }

      // CR Cash account (refund payment)
      const terminal = await PosTerminal.findByPk(originalSale.terminalId);
      if (terminal && terminal.defaultCashAccountId) {
        lines.push({
          accountId: terminal.defaultCashAccountId,
          debit: 0,
          credit: parseFloat(posReturn.refundAmount.toFixed(2)),
          description: `Return refund - ${posReturn.returnNumber}`,
        });
      }

      // Reverse VAT if applicable
      if (parseFloat(posReturn.taxTotal) > 0) {
        const taxAccount = await require('../models').Account.findOne({
          where: { tenantId, type: 'liability', name: { [require('sequelize').Op.like]: '%VAT%' }, isActive: true },
        });
        if (taxAccount) {
          // DR VAT Payable (reversal)
          lines.push({
            accountId: taxAccount.id,
            debit: parseFloat(posReturn.taxTotal.toFixed(2)),
            credit: 0,
            description: `VAT reversal for ${posReturn.returnNumber}`,
          });
        }
      }
    }

    return lines;
  }
}

module.exports = PosReturnService;
