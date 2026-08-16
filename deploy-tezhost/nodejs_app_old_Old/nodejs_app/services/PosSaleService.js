'use strict';
const { sequelize } = require('../models');
const {
  PosSale, PosSaleLine, PosPayment, PosSession, PosTerminal,
  PosHeldOrder, PosSubscriptionUsage, Item, Customer, Account,
  InventoryBalance, JournalEntry, JournalEntryLine, Warehouse,
} = require('../models');
const InventoryTransactionService = require('./InventoryTransactionService');
const AuditService = require('./AuditService');
const logger = require('../utils/logger');

class PosSaleService {
  /**
   * List POS sales with filters
   */
  static async list(tenantId, query = {}) {
    const { page = 1, limit = 50, status, terminalId, sessionId, userId, customerId, startDate, endDate } = query;
    const where = { tenantId };
    if (status) where.status = status;
    if (terminalId) where.terminalId = terminalId;
    if (sessionId) where.sessionId = sessionId;
    if (userId) where.userId = userId;
    if (customerId) where.customerId = customerId;
    if (startDate) where.invoiceDate = { ...where.invoiceDate, [require('sequelize').Op.gte]: startDate };
    if (endDate) where.invoiceDate = { ...where.invoiceDate, [require('sequelize').Op.lte]: endDate };

    const { rows, count } = await PosSale.findAndCountAll({
      where,
      include: [
        { model: PosTerminal, as: 'terminal' },
        { model: PosSession, as: 'session' },
        { model: require('../models').User, as: 'cashier' },
        { model: Customer, as: 'customer' },
        { model: PosSaleLine, as: 'lines' },
        { model: PosPayment, as: 'payments' },
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
   * Get single POS sale by ID
   */
  static async getById(tenantId, id) {
    const sale = await PosSale.findOne({
      where: { tenantId, id },
      include: [
        { model: PosTerminal, as: 'terminal' },
        { model: PosSession, as: 'session' },
        { model: require('../models').User, as: 'cashier' },
        { model: Customer, as: 'customer' },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'name', 'code'] },
        { model: PosSaleLine, as: 'lines', include: [{ model: Item, as: 'item', attributes: ['id', 'name', 'itemCode', 'itemType'] }] },
        { model: PosPayment, as: 'payments' },
        { model: JournalEntry, as: 'journalEntry' },
      ],
    });
    if (!sale) {
      const error = new Error('POS Sale not found');
      error.status = 404;
      throw error;
    }
    return sale;
  }

  /**
   * Get sale by invoice number
   */
  static async getByInvoiceNumber(tenantId, invoiceNumber) {
    const sale = await PosSale.findOne({
      where: { tenantId, invoiceNumber },
      include: [
        { model: PosSaleLine, as: 'lines' },
        { model: PosPayment, as: 'payments' },
        { model: Customer, as: 'customer' },
      ],
    });
    if (!sale) {
      const error = new Error('POS Sale not found');
      error.status = 404;
      throw error;
    }
    return sale;
  }

  /**
   * Generate POS invoice number
   */
  static async generateInvoiceNumber(tenantId) {
    const year = new Date().getFullYear();
    const prefix = `POS-${year}-`;

    const lastSale = await PosSale.findOne({
      where: { tenantId, invoiceNumber: { [require('sequelize').Op.like]: `${prefix}%` } },
      order: [['invoiceNumber', 'DESC']],
    });

    let seq = 1;
    if (lastSale) {
      const parts = lastSale.invoiceNumber.split('-');
      seq = parseInt(parts[parts.length - 1] || 0) + 1;
    }

    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  /**
   * Generate hold order number
   */
  static async generateHoldNumber(tenantId) {
    const prefix = 'HOLD-';
    const last = await PosHeldOrder.findOne({
      where: { tenantId, holdNumber: { [require('sequelize').Op.like]: `${prefix}%` } },
      order: [['holdNumber', 'DESC']],
    });
    let seq = 1;
    if (last) {
      const parts = last.holdNumber.split('-');
      seq = parseInt(parts[parts.length - 1] || 0) + 1;
    }
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  /**
   * CORE METHOD: Complete a POS sale in an atomic transaction
   *
   * Steps:
   * 1. Validate session is OPEN
   * 2. Validate items (active, available stock)
   * 3. Calculate totals
   * 4. Create PosSale
   * 5. Create PosSaleLines
   * 6. Create PosPayments
   * 7. Create Journal Entry (accounting)
   * 8. Reduce inventory (for products)
   * 9. Update session totals
   * 10. Update usage tracking
   * 11. Record audit trail
   */
  static async completeSale(tenantId, body, userId) {
    const t = await sequelize.transaction();
    try {
      const {
        terminalId, sessionId, customerId, warehouseId,
        lines = [], payments = [], notes,
        discountPercentage = 0, discountReason,
      } = body;

      // 1. Validate session
      const session = await PosSession.findOne({
        where: { tenantId, id: sessionId, status: 'open' },
        transaction: t,
      });
      if (!session) {
        throw Object.assign(new Error('POS Session not found or not open'), { status: 400 });
      }

      // Validate terminal
      const terminal = await PosTerminal.findOne({
        where: { tenantId, id: terminalId, isActive: true, status: 'active' },
        transaction: t,
      });
      if (!terminal) {
        throw Object.assign(new Error('POS Terminal not found or inactive'), { status: 400 });
      }

      // 2. Validate customer (auto-create walk-in if not provided and doesn't exist)
      let finalCustomerId = customerId;
      if (!finalCustomerId) {
        let walkIn = await Customer.findOne({
          where: { tenantId, code: 'WALK-IN' },
          transaction: t,
        });
        if (!walkIn) {
          // Auto-create Walk-In Customer
          const arAccount = await Account.findOne({
            where: { tenantId, type: 'asset', isActive: true },
            order: [['createdAt', 'ASC']],
            transaction: t,
          });
          const { v4: uuidv4 } = require('uuid');
          walkIn = await Customer.create({
            id: uuidv4(),
            tenantId,
            code: 'WALK-IN',
            name: 'Walk-In Customer',
            type: 'individual',
            group: 'retail',
            currency: 'AED',
            arAccountId: arAccount ? arAccount.id : null,
            isActive: true,
          }, { transaction: t });
        }
        finalCustomerId = walkIn.id;
      }

      // 3. Validate and process lines
      if (!lines || lines.length === 0) {
        throw Object.assign(new Error('At least one item is required'), { status: 400 });
      }

      const processedLines = [];
      let subTotal = 0;
      let totalTax = 0;
      let totalDiscount = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const item = await Item.findOne({
          where: { tenantId, id: line.itemId, isActive: true },
          include: [
            { model: require('../models').ItemCategory, as: 'category', attributes: ['id', 'name'] },
          ],
          transaction: t,
        });
        if (!item) {
          throw Object.assign(new Error(`Item not found or inactive: ${line.itemId}`), { status: 400 });
        }

        const quantity = parseFloat(line.quantity) || 1;
        const unitPrice = parseFloat(line.unitPrice) || parseFloat(item.sellingPrice) || 0;
        const lineDiscountPct = parseFloat(line.discountPercentage) || 0;
        const lineDiscountAmt = (unitPrice * quantity * lineDiscountPct) / 100;
        const lineTaxPct = parseFloat(line.taxPercentage) || parseFloat(item.taxPercentage) || 0;
        const lineBeforeTax = (unitPrice * quantity) - lineDiscountAmt;
        const lineTaxAmt = (lineBeforeTax * lineTaxPct) / 100;
        const lineTotal = lineBeforeTax + lineTaxAmt;

        // Stock validation for products
        let isService = item.itemType === 'service';
        if (!isService && item.isInventoryTracked) {
          const balance = await InventoryBalance.findOne({
            where: { tenantId, itemId: item.id, warehouseId: warehouseId || session.warehouseId },
            transaction: t,
          });
          const availableStock = balance ? parseFloat(balance.quantityOnHand) : 0;
          if (availableStock < quantity) {
            throw Object.assign(
              new Error(`Insufficient stock for ${item.name}. Available: ${availableStock}, requested: ${quantity}`),
              { status: 400 }
            );
          }
        }

        subTotal += unitPrice * quantity;
        totalTax += lineTaxAmt;
        totalDiscount += lineDiscountAmt;

        processedLines.push({
          itemId: item.id,
          itemName: item.name,
          sku: item.itemCode,
          quantity,
          unitPrice,
          costPrice: parseFloat(item.costPrice) || 0,
          discountPercentage: lineDiscountPct,
          discountAmount: lineDiscountAmt,
          taxPercentage: lineTaxPct,
          taxAmount: lineTaxAmt,
          lineTotal,
          isService,
          sortOrder: i + 1,
        });
      }

      // Apply invoice-level discount
      const invoiceDiscountPct = parseFloat(discountPercentage) || 0;
      const invoiceDiscountAmt = (subTotal * invoiceDiscountPct) / 100;
      const netSubTotal = subTotal - totalDiscount - invoiceDiscountAmt;
      const grandTotal = netSubTotal + totalTax;

      // 4. Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(tenantId);

      // 5. Create PosSale
      const sale = await PosSale.create({
        tenantId,
        terminalId,
        sessionId,
        userId,
        customerId: finalCustomerId,
        warehouseId: warehouseId || session.warehouseId,
        invoiceNumber,
        invoiceDate: new Date().toISOString().split('T')[0],
        subTotal: parseFloat(subTotal.toFixed(2)),
        discountTotal: parseFloat((totalDiscount + invoiceDiscountAmt).toFixed(2)),
        discountPercentage: invoiceDiscountPct,
        discountReason: discountReason || null,
        taxTotal: parseFloat(totalTax.toFixed(2)),
        grandTotal: parseFloat(grandTotal.toFixed(2)),
        status: 'completed',
        notes: notes || null,
        isInventoryImpact: true,
        createdBy: userId,
      }, { transaction: t });

      // 6. Create sale lines
      const saleLines = processedLines.map(pl => ({
        ...pl,
        posSaleId: sale.id,
      }));
      await PosSaleLine.bulkCreate(saleLines, { transaction: t });

      // 7. Create payments
      const paymentRecords = [];
      let totalPaid = 0;
      for (const pmt of payments) {
        const amount = parseFloat(pmt.amount) || 0;
        totalPaid += amount;

        // Determine account based on payment method
        let accountId = pmt.accountId;
        if (!accountId) {
          if (pmt.paymentMethod === 'cash') accountId = terminal.defaultCashAccountId;
          else if (pmt.paymentMethod === 'card' || pmt.paymentMethod === 'bank_transfer') accountId = terminal.defaultBankAccountId;
          else if (pmt.paymentMethod === 'credit') {
            const customer = await Customer.findByPk(finalCustomerId, { transaction: t });
            accountId = customer ? customer.arAccountId : null;
          }
        }

        const changeAmount = pmt.paymentMethod === 'cash' && amount > grandTotal
          ? parseFloat((amount - grandTotal).toFixed(2))
          : 0;

        paymentRecords.push({
          posSaleId: sale.id,
          paymentMethod: pmt.paymentMethod,
          amount: parseFloat(amount.toFixed(2)),
          reference: pmt.reference || null,
          accountId,
          changeAmount,
        });
      }
      await PosPayment.bulkCreate(paymentRecords, { transaction: t });

      // Validate payment total
      if (Math.abs(totalPaid - grandTotal) > 0.01) {
        // Allow cash overpayment (change will be given)
        // But don't allow underpayment unless it's credit
        const hasCreditPayment = payments.some(p => p.paymentMethod === 'credit');
        if (totalPaid < grandTotal && !hasCreditPayment) {
          throw Object.assign(
            new Error(`Payment total (${totalPaid.toFixed(2)}) does not match invoice total (${grandTotal.toFixed(2)})`),
            { status: 400 }
          );
        }
      }

      // 8. Create Journal Entry (Accounting)
      const journalLines = await this.buildJournalLines(tenantId, sale, processedLines, terminal, finalCustomerId, t);
      const JournalEntryService = require('./JournalEntryService');
      const journalEntry = await JournalEntryService.createEntry({
        tenantId,
        entryDate: sale.invoiceDate,
        reference: `POS-${invoiceNumber}`,
        description: `POS Sale #${invoiceNumber}`,
        lines: journalLines,
      }, tenantId, userId, t);

      // Link journal entry to sale
      await PosSale.update(
        { journalEntryId: journalEntry.id },
        { where: { id: sale.id }, transaction: t }
      );

      // 9. Reduce inventory for product items
      for (let i = 0; i < processedLines.length; i++) {
        const pl = processedLines[i];
        if (pl.isService) continue;

        const item = await Item.findByPk(pl.itemId, { transaction: t });
        if (item && item.isInventoryTracked) {
          await InventoryTransactionService.recordTransaction({
            tenantId,
            itemId: pl.itemId,
            warehouseId: warehouseId || session.warehouseId,
            transactionType: 'pos_sale',
            referenceId: sale.id,
            referenceType: 'PosSale',
            referenceNumber: invoiceNumber,
            quantity: -parseFloat(pl.quantity),
            unitCost: pl.costPrice,
            totalCost: parseFloat((pl.quantity * pl.costPrice).toFixed(2)),
          }, t);
        }
      }

      // 10. Update session totals
      const cashPayments = paymentRecords.filter(p => p.paymentMethod === 'cash');
      const cardPayments = paymentRecords.filter(p => p.paymentMethod === 'card');
      const bankPayments = paymentRecords.filter(p => p.paymentMethod === 'bank_transfer');
      const creditPayments = paymentRecords.filter(p => p.paymentMethod === 'credit');

      const cashTotal = cashPayments.reduce((s, p) => s + p.amount, 0);
      const cardTotal = cardPayments.reduce((s, p) => s + p.amount, 0);
      const bankTotal = bankPayments.reduce((s, p) => s + p.amount, 0);
      const creditTotal = creditPayments.reduce((s, p) => s + p.amount, 0);

      await PosSession.increment({
        cashSalesTotal: parseFloat(cashTotal.toFixed(2)),
        cardSalesTotal: parseFloat(cardTotal.toFixed(2)),
        bankSalesTotal: parseFloat(bankTotal.toFixed(2)),
        creditSalesTotal: parseFloat(creditTotal.toFixed(2)),
        totalSalesCount: 1,
      }, { where: { id: sessionId }, transaction: t });

      // 11. Update subscription usage
      await this.updateSubscriptionUsage(tenantId, t);

      // 12. Record audit trail
      await AuditService._record({
        tenantId,
        userId,
        action: 'POS_SALE_CREATED',
        module: 'POS',
        entity: 'PosSale',
        entityId: sale.id,
        newValues: {
          invoiceNumber,
          grandTotal,
          paymentMethods: paymentRecords.map(p => p.paymentMethod),
          itemCount: processedLines.length,
        },
        description: `POS Sale #${invoiceNumber} - ${grandTotal} ${terminal.defaultCurrency || 'AED'}`,
      });

      await t.commit();

      return this.getById(tenantId, sale.id);
    } catch (error) {
      await t.rollback();
      logger.error('POS Sale transaction failed:', { error: error.message });
      throw error;
    }
  }

  /**
   * Build journal entry lines for POS sale
   */
  static async buildJournalLines(tenantId, sale, processedLines, terminal, customerId, transaction = null) {
    const lines = [];
    const grandTotal = parseFloat(sale.grandTotal);
    const subTotal = parseFloat(sale.subTotal || 0);
    const discountTotal = parseFloat(sale.discountTotal || 0);
    const taxTotal = parseFloat(sale.taxTotal || 0);
    const netRevenue = subTotal - discountTotal;

    // For each payment method, DR the corresponding account
    const payments = await PosPayment.findAll({ where: { posSaleId: sale.id }, transaction });

    for (const pmt of payments) {
      const amount = parseFloat(pmt.amount);
      const changeAmount = parseFloat(pmt.changeAmount || 0);
      const netAmount = amount - changeAmount;
      if (netAmount <= 0) continue;

      // Resolve account if null (fallback for terminals without configured accounts)
      let accountId = pmt.accountId;
      if (!accountId) {
        if (pmt.paymentMethod === 'cash') {
          const cashAcct = await Account.findOne({
            where: { tenantId, name: { [require('sequelize').Op.like]: '%Cash%' }, isActive: true },
            transaction,
          });
          accountId = cashAcct ? cashAcct.id : null;
        } else if (pmt.paymentMethod === 'card' || pmt.paymentMethod === 'bank_transfer') {
          const bankAcct = await Account.findOne({
            where: { tenantId, name: { [require('sequelize').Op.like]: '%Bank%' }, isActive: true },
            transaction,
          });
          accountId = bankAcct ? bankAcct.id : null;
        }
      }
      if (!accountId) continue; // Skip if no account could be resolved

      lines.push({
        accountId,
        debit: parseFloat(netAmount.toFixed(2)),
        credit: 0,
        description: `POS ${pmt.paymentMethod} - Invoice #${sale.invoiceNumber}`,
      });
    }

    // CR Revenue (net of discounts)
    if (netRevenue > 0) {
      // Use income account from the first product item
      let revenueAccountId = null;
      if (processedLines.length > 0) {
        const firstItem = await Item.findByPk(processedLines[0].itemId, { transaction });
        if (firstItem && firstItem.incomeAccountId) {
          revenueAccountId = firstItem.incomeAccountId;
        }
      }
      // Fallback to any revenue account for the tenant
      if (!revenueAccountId) {
        const revAcct = await Account.findOne({
          where: { tenantId, type: 'revenue', isActive: true },
          order: [['createdAt', 'ASC']],
          transaction,
        });
        revenueAccountId = revAcct ? revAcct.id : null;
      }
      if (!revenueAccountId) return lines; // Can't create revenue line without account

      lines.push({
        accountId: revenueAccountId,
        debit: 0,
        credit: parseFloat(netRevenue.toFixed(2)),
        description: `POS Sales Revenue - Invoice #${sale.invoiceNumber}`,
      });
    }

    // CR VAT Payable
    if (taxTotal > 0) {
      const taxAccount = await Account.findOne({
        where: { tenantId, type: 'liability', name: { [require('sequelize').Op.like]: '%VAT%' }, isActive: true },
        transaction,
      });

      if (taxAccount) {
        lines.push({
          accountId: taxAccount.id,
          debit: 0,
          credit: parseFloat(taxTotal.toFixed(2)),
          description: `VAT on POS Sale #${sale.invoiceNumber}`,
        });
      }
    }

    // COGS + Inventory for product items
    for (const pl of processedLines) {
      if (pl.isService) continue;
      const item = await Item.findByPk(pl.itemId, { transaction });
      if (!item || !item.isInventoryTracked || !item.expenseAccountId || !item.inventoryAccountId) continue;

      const totalCost = parseFloat((pl.quantity * pl.costPrice).toFixed(2));
      if (totalCost <= 0) continue;

      // DR Cost of Goods Sold
      lines.push({
        accountId: item.expenseAccountId,
        debit: parseFloat(totalCost.toFixed(2)),
        credit: 0,
        description: `COGS - ${item.name} for POS #${sale.invoiceNumber}`,
      });

      // CR Inventory Asset
      lines.push({
        accountId: item.inventoryAccountId,
        debit: 0,
        credit: parseFloat(totalCost.toFixed(2)),
        description: `Inventory - ${item.name} for POS #${sale.invoiceNumber}`,
      });
    }

    return lines;
  }

  /**
   * Cancel a POS sale (reversal)
   */
  static async cancelSale(tenantId, id, body, userId) {
    const t = await sequelize.transaction();
    try {
      const sale = await PosSale.findOne({
        where: { tenantId, id, status: 'completed' },
        include: [{ model: PosSaleLine, as: 'lines' }],
        transaction: t,
      });
      if (!sale) {
        throw Object.assign(new Error('POS Sale not found or already cancelled'), { status: 404 });
      }

      const { reason } = body;
      if (!reason) {
        throw Object.assign(new Error('Cancel reason is required'), { status: 400 });
      }

      // Reverse inventory
      const session = await PosSession.findByPk(sale.sessionId, { transaction: t });
      for (const line of sale.lines) {
        if (line.isService) continue;
        const item = await Item.findByPk(line.itemId, { transaction: t });
        if (item && item.isInventoryTracked) {
          await InventoryTransactionService.recordTransaction({
            tenantId,
            itemId: line.itemId,
            warehouseId: sale.warehouseId,
            transactionType: 'pos_sale_reversal',
            referenceId: sale.id,
            referenceType: 'PosSale',
            referenceNumber: sale.invoiceNumber,
            quantity: parseFloat(line.quantity),
            unitCost: parseFloat(line.costPrice),
            totalCost: parseFloat((line.quantity * line.costPrice).toFixed(2)),
          }, t);
        }
      }

      // Update status
      await PosSale.update({
        status: 'cancelled',
        cancelledBy: userId,
        cancelledAt: new Date(),
        cancelReason: reason,
      }, { where: { id }, transaction: t });

      // Update session totals (decrement)
      await PosSession.decrement({
        totalSalesCount: 1,
        cashSalesTotal: parseFloat(sale.grandTotal) || 0,
      }, { where: { id: sale.sessionId }, transaction: t });

      await AuditService._record({
        tenantId,
        userId,
        action: 'POS_SALE_CANCELLED',
        module: 'POS',
        entity: 'PosSale',
        entityId: id,
        oldValues: { status: 'completed' },
        newValues: { status: 'cancelled', reason },
        description: `POS Sale #${sale.invoiceNumber} cancelled: ${reason}`,
      });

      await t.commit();
      return { message: 'POS Sale cancelled successfully', invoiceNumber: sale.invoiceNumber };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Hold an order (save cart for later)
   */
  static async holdOrder(tenantId, body, userId) {
    const { terminalId, sessionId, customerId, cartData, notes } = body;

    // Validate session
    const session = await PosSession.findOne({
      where: { tenantId, id: sessionId, status: 'open' },
    });
    if (!session) {
      throw Object.assign(new Error('POS Session not found or not open'), { status: 400 });
    }

    const holdNumber = await this.generateHoldNumber(tenantId);

    const heldOrder = await PosHeldOrder.create({
      tenantId,
      terminalId,
      sessionId,
      userId,
      customerId: customerId || null,
      holdNumber,
      cartData: cartData || null,
      notes: notes || null,
      status: 'held',
      heldAt: new Date(),
    });

    return heldOrder;
  }

  /**
   * Retrieve a held order
   */
  static async retrieveHeldOrder(tenantId, id, userId) {
    const order = await PosHeldOrder.findOne({
      where: { tenantId, id, status: 'held' },
    });
    if (!order) {
      const error = new Error('Held order not found');
      error.status = 404;
      throw error;
    }

    await PosHeldOrder.update({
      status: 'retrieved',
      retrievedAt: new Date(),
    }, { where: { id } });

    return order;
  }

  /**
   * List held orders
   */
  static async listHeldOrders(tenantId, query = {}) {
    const { page = 1, limit = 50, terminalId, sessionId } = query;
    const where = { tenantId, status: 'held' };
    if (terminalId) where.terminalId = terminalId;
    if (sessionId) where.sessionId = sessionId;

    const { rows, count } = await PosHeldOrder.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer' },
        { model: require('../models').User, as: 'cashier' },
      ],
      order: [['heldAt', 'DESC']],
      offset: (page - 1) * limit,
      limit: parseInt(limit),
      subQuery: false,
    });

    return { data: rows, count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) };
  }

  /**
   * Update POS subscription usage tracking
   */
  static async updateSubscriptionUsage(tenantId, t) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [usage, created] = await PosSubscriptionUsage.findOrCreate({
        where: { tenantId, usageDate: today },
        defaults: { tenantId, usageDate: today, totalTransactions: 0, activeTerminals: 0, activeUsers: 0, activeSessions: 0 },
        transaction: t,
      });

      await PosSubscriptionUsage.increment(
        { totalTransactions: 1 },
        { where: { tenantId, usageDate: today }, transaction: t }
      );
    } catch (err) {
      // Non-critical - don't break the transaction
      logger.warn('Failed to update POS subscription usage:', err.message);
    }
  }
}

module.exports = PosSaleService;
