'use strict';

const db = require('../models');
const purchaseInvoiceRepository = require('../repositories/PurchaseInvoiceRepository');
const JournalEntryService = require('./JournalEntryService');
const inventoryService = require('./InventoryService');
const GenericAuditService = require('./GenericAuditService');
const PurchaseInvoiceDTO = require('../dto/PurchaseInvoiceDTO');

class PurchaseInvoiceService {
  async list(tenantId, filters) {
    const result = await purchaseInvoiceRepository.findAll(tenantId, filters);
    return {
      ...result,
      data: PurchaseInvoiceDTO.toListDTO(result.data),
    };
  }

  async getById(id, tenantId) {
    const invoice = await purchaseInvoiceRepository.findById(id, tenantId);
    if (!invoice) throw new Error('Purchase Invoice not found');
    return PurchaseInvoiceDTO.toDTO(invoice);
  }

  async create(tenantId, data, userId) {
    const { supplierId, invoiceDate, dueDate, supplierInvoiceNumber, warehouseId, notes, items } = data;

    // Validate supplier exists
    const supplier = await db.Supplier.findOne({ where: { id: supplierId, tenantId } });
    if (!supplier) throw new Error('Supplier not found');

    // Generate invoice number
    const invoiceNumber = await purchaseInvoiceRepository.getNextSequence(tenantId);

    // Calculate line totals
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    const lineItems = [];

    for (const item of items) {
      const dbItem = await db.Item.findOne({ where: { id: item.itemId, tenantId } });
      if (!dbItem) throw new Error(`Item ${item.itemId} not found`);

      const qty = parseFloat(item.quantity);
      const unitCost = parseFloat(item.unitCost);
      const taxPct = parseFloat(item.taxPercent || 0);
      const discPct = parseFloat(item.discountPercent || 0);

      const lineTotal = qty * unitCost;
      const discount = lineTotal * (discPct / 100);
      const afterDiscount = lineTotal - discount;
      const tax = afterDiscount * (taxPct / 100);

      lineItems.push({
        itemId: item.itemId,
        description: item.description || dbItem.itemName,
        quantity: qty,
        unitCost,
        taxPercent: taxPct,
        taxAmount: tax,
        discountPercent: discPct,
        discountAmount: discount,
        lineTotal: afterDiscount,
      });

      subtotal += lineTotal;
      totalTax += tax;
      totalDiscount += discount;
    }

    const totalAmount = subtotal - totalDiscount + totalTax;

    const transaction = await db.sequelize.transaction();
    try {
      const invoice = await purchaseInvoiceRepository.create({
        tenantId,
        invoiceNumber,
        supplierInvoiceNumber: supplierInvoiceNumber || null,
        supplierId,
        invoiceDate,
        dueDate: dueDate || null,
        warehouseId: warehouseId || null,
        status: 'draft',
        notes: notes || null,
        subtotal,
        taxAmount: totalTax,
        discountAmount: totalDiscount,
        totalAmount,
        createdBy: userId,
      }, transaction);

      const detailsToCreate = lineItems.map((li) => ({
        purchaseInvoiceId: invoice.id,
        ...li,
      }));
      await purchaseInvoiceRepository.createDetails(detailsToCreate, transaction);

      await GenericAuditService.log({
        tenantId,
        entityType: 'PurchaseInvoice',
        entityId: invoice.id,
        action: 'CREATE',
        performedBy: userId,
        newValues: { invoiceNumber, supplierId, totalAmount },
      }, transaction);

      await transaction.commit();

      return this.getById(invoice.id, tenantId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(id, tenantId, data, userId) {
    const existing = await purchaseInvoiceRepository.findById(id, tenantId);
    if (!existing) throw new Error('Purchase Invoice not found');
    if (existing.status !== 'draft') throw new Error('Only draft invoices can be edited');

    const { supplierId, invoiceDate, dueDate, supplierInvoiceNumber, warehouseId, notes, items } = data;
    let subtotal = existing.subtotal;
    let totalTax = existing.taxAmount;
    let totalDiscount = existing.discountAmount;
    let lineItems = [];

    if (items && items.length > 0) {
      subtotal = 0;
      totalTax = 0;
      totalDiscount = 0;

      for (const item of items) {
        const dbItem = await db.Item.findOne({ where: { id: item.itemId, tenantId } });
        if (!dbItem) throw new Error(`Item ${item.itemId} not found`);

        const qty = parseFloat(item.quantity);
        const unitCost = parseFloat(item.unitCost);
        const taxPct = parseFloat(item.taxPercent || 0);
        const discPct = parseFloat(item.discountPercent || 0);

        const lineTotal = qty * unitCost;
        const discount = lineTotal * (discPct / 100);
        const afterDiscount = lineTotal - discount;
        const tax = afterDiscount * (taxPct / 100);

        lineItems.push({
          itemId: item.itemId,
          description: item.description || dbItem.itemName,
          quantity: qty,
          unitCost,
          taxPercent: taxPct,
          taxAmount: tax,
          discountPercent: discPct,
          discountAmount: discount,
          lineTotal: afterDiscount,
        });

        subtotal += lineTotal;
        totalTax += tax;
        totalDiscount += discount;
      }
    }

    const totalAmount = subtotal - totalDiscount + totalTax;

    const transaction = await db.sequelize.transaction();
    try {
      const updateData = {
        supplierId: supplierId || existing.supplierId,
        invoiceDate: invoiceDate || existing.invoiceDate,
        dueDate: dueDate !== undefined ? dueDate : existing.dueDate,
        supplierInvoiceNumber: supplierInvoiceNumber !== undefined ? supplierInvoiceNumber : existing.supplierInvoiceNumber,
        warehouseId: warehouseId !== undefined ? warehouseId : existing.warehouseId,
        notes: notes !== undefined ? notes : existing.notes,
        subtotal,
        taxAmount: totalTax,
        discountAmount: totalDiscount,
        totalAmount,
        updatedBy: userId,
      };

      await purchaseInvoiceRepository.update(id, tenantId, updateData, transaction);

      if (items && items.length > 0) {
        await purchaseInvoiceRepository.deleteDetails(id, transaction);
        const detailsToCreate = lineItems.map((li) => ({
          purchaseInvoiceId: id,
          ...li,
        }));
        await purchaseInvoiceRepository.createDetails(detailsToCreate, transaction);
      }

      await GenericAuditService.log({
        tenantId,
        entityType: 'PurchaseInvoice',
        entityId: id,
        action: 'UPDATE',
        performedBy: userId,
        newValues: updateData,
      }, transaction);

      await transaction.commit();
      return this.getById(id, tenantId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async delete(id, tenantId, userId) {
    const existing = await purchaseInvoiceRepository.findById(id, tenantId);
    if (!existing) throw new Error('Purchase Invoice not found');
    if (existing.status !== 'draft') throw new Error('Only draft invoices can be deleted');

    const transaction = await db.sequelize.transaction();
    try {
      await purchaseInvoiceRepository.deleteDetails(id, transaction);
      await purchaseInvoiceRepository.delete(id, tenantId, transaction);

      await GenericAuditService.log({
        tenantId,
        entityType: 'PurchaseInvoice',
        entityId: id,
        action: 'DELETE',
        performedBy: userId,
      }, transaction);

      await transaction.commit();
      return { message: 'Purchase Invoice deleted successfully' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async confirm(id, tenantId, userId) {
    const existing = await purchaseInvoiceRepository.findById(id, tenantId);
    if (!existing) throw new Error('Purchase Invoice not found');
    if (existing.status !== 'draft') throw new Error('Only draft invoices can be confirmed');

    await purchaseInvoiceRepository.update(id, tenantId, {
      status: 'confirmed',
      updatedBy: userId,
    });

    await GenericAuditService.log({
      tenantId,
      entityType: 'PurchaseInvoice',
      entityId: id,
      action: 'CONFIRM',
      performedBy: userId,
      newValues: { status: 'confirmed' },
    });

    return this.getById(id, tenantId);
  }

  async approve(id, tenantId, userId, accountData = {}) {
    const existing = await purchaseInvoiceRepository.findById(id, tenantId);
    if (!existing) throw new Error('Purchase Invoice not found');
    if (existing.status !== 'confirmed') throw new Error('Only confirmed invoices can be posted to journal');

    const details = existing.details || existing.PurchaseInvoiceDetails || [];
    if (!details || details.length === 0) {
      throw new Error('Invoice must have at least one item to post');
    }

    const supplier = await db.Supplier.findOne({ where: { id: existing.supplierId, tenantId } });
    if (!supplier) throw new Error('Supplier not found');

    const { Op } = require('sequelize');
    const totalAmount = parseFloat(existing.totalAmount || 0);

    // Use provided account IDs or fallback to defaults
    const apAccountId = accountData.apAccountId || supplier.apAccountId;
    if (!apAccountId) {
      throw new Error('Accounts Payable account is required. Select one from the posting dialog or set it in supplier settings.');
    }

    const transaction = await db.sequelize.transaction();
    try {
      // Build journal entry lines
      const journalLines = [];

      for (const detail of details) {
        const item = detail.item || await db.Item.findByPk(detail.itemId);
        if (!item) throw new Error(`Item ${detail.itemId} not found`);

        const lineTotal = parseFloat(detail.lineTotal || 0);
        const taxAmount = parseFloat(detail.taxAmount || 0);
        // lineTotal is stored as afterDiscount (qty × unitCost − discount) — this IS the cost before tax.
        // Do NOT subtract taxAmount from it; tax is handled as a separate VAT line.
        const costAmount = lineTotal;
        const itemName = item.name || item.itemName || 'Item';

        if (item.itemType === 'product' || item.itemType === 'inventory') {
          // Product: Debit Inventory Asset account (use provided or item default)
          const inventoryAccountId = accountData.assetAccountId || item.inventoryAccountId;
          if (!inventoryAccountId) {
            throw new Error(`Item "${itemName}" has no inventory account. Select one in the posting dialog.`);
          }
          journalLines.push({
            accountId: inventoryAccountId,
            description: `Purchase of ${itemName} - ${existing.invoiceNumber}`,
            debit: costAmount,
            credit: 0,
          });
        } else {
          // Service: Debit Expense account (use provided or item default)
          const expenseAccountId = accountData.expenseAccountId || item.expenseAccountId;
          if (!expenseAccountId) {
            throw new Error(`Item "${itemName}" has no expense account. Select one in the posting dialog.`);
          }
          journalLines.push({
            accountId: expenseAccountId,
            description: `Purchase of ${itemName} (Service) - ${existing.invoiceNumber}`,
            debit: costAmount,
            credit: 0,
          });
        }

        // VAT Input: Debit (if tax exists)
        if (taxAmount > 0) {
          const taxAccountId = accountData.vatAccountId || item.taxInputAccountId || item.inputTaxAccountId;
          if (taxAccountId) {
            journalLines.push({
              accountId: taxAccountId,
              description: `VAT Input on ${itemName} - ${existing.invoiceNumber}`,
              debit: taxAmount,
              credit: 0,
            });
          } else {
            // Find a default VAT Input account in COA
            const vatAccount = await db.Account.findOne({
              where: {
                tenantId,
                type: 'asset',
                [Op.or]: [
                  { name: { [Op.like]: '%VAT Input%' } },
                  { name: { [Op.like]: '%Input Tax%' } },
                  { name: { [Op.like]: '%VAT Receivable%' } },
                ],
              },
              transaction,
            });
            if (vatAccount) {
              journalLines.push({
                accountId: vatAccount.id,
                description: `VAT Input on ${itemName} - ${existing.invoiceNumber}`,
                debit: taxAmount,
                credit: 0,
              });
            }
          }
        }
      }

      // Accounts Payable: Credit
      journalLines.push({
        accountId: apAccountId,
        description: `Accounts Payable - ${supplier.name || supplier.supplierName} - ${existing.invoiceNumber}`,
        debit: 0,
        credit: totalAmount,
      });

      // Create the journal entry using the correct method signature
      const journalEntry = await JournalEntryService.createEntry(
        {
          lines: journalLines,
          entryDate: existing.invoiceDate || new Date().toISOString().split('T')[0],
          reference: existing.invoiceNumber,
          description: `Purchase Invoice ${existing.invoiceNumber} - ${supplier.name || supplier.supplierName}`,
        },
        tenantId,
        userId,
        transaction
      );

      // Update invoice with journal entry ID and status
      await purchaseInvoiceRepository.update(id, tenantId, {
        status: 'posted',
        journalEntryId: journalEntry.id,
        updatedBy: userId,
      }, transaction);

      await GenericAuditService.log({
        tenantId,
        entityType: 'PurchaseInvoice',
        entityId: id,
        action: 'APPROVE',
        performedBy: userId,
        newValues: { status: 'posted', journalEntryId: journalEntry.id },
      }, transaction);

      await transaction.commit();
      return this.getById(id, tenantId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async cancel(id, tenantId, userId) {
    const existing = await purchaseInvoiceRepository.findById(id, tenantId);
    if (!existing) throw new Error('Purchase Invoice not found');
    if (!['draft', 'posted'].includes(existing.status)) throw new Error('Only draft or posted invoices can be cancelled');

    const transaction = await db.sequelize.transaction();
    try {
      // If invoice was posted (has a journal entry), reverse it
      if (existing.status === 'posted' && existing.journalEntryId) {
        // Create reversal journal entry
        const { JournalEntry, Account } = db;
        const originalJE = await JournalEntry.findByPk(existing.journalEntryId, {
          include: [{ model: db.JournalEntryLine, as: 'lines' }],
          transaction
        });

        if (originalJE && originalJE.lines && originalJE.lines.length > 0) {
          const reversalLines = originalJE.lines.map(line => ({
            accountId: line.accountId,
            description: `Reversal: ${line.description}`,
            debit: line.credit,
            credit: line.debit,
          }));

          const JournalEntryService = require('./JournalEntryService');
          const reversalJE = await JournalEntryService.createEntry({
            tenantId,
            entryDate: new Date().toISOString().split('T')[0],
            reference: `VOID-${existing.invoiceNumber}`,
            description: `Cancellation of Purchase Invoice ${existing.invoiceNumber}`,
            lines: reversalLines,
          }, tenantId, userId, transaction);

          existing.journalEntryId = reversalJE.id;
        }
      }

      await purchaseInvoiceRepository.update(id, tenantId, {
        status: 'cancelled',
        updatedBy: userId,
      }, transaction);

      await GenericAuditService.log({
        tenantId,
        entityType: 'PurchaseInvoice',
        entityId: id,
        action: 'CANCEL',
        performedBy: userId,
        newValues: { status: 'cancelled' },
      }, transaction);

      await transaction.commit();
      return this.getById(id, tenantId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async generateFromPO(tenantId, poId, userId) {
    const po = await db.PurchaseOrder.findOne({
      where: { id: poId, tenantId },
      include: [{ model: db.PurchaseOrderDetail, as: 'details' }],
    });
    if (!po) throw new Error('Purchase Order not found');
    if (!['approved', 'partially_received', 'received'].includes(po.status)) {
      throw new Error('Purchase Order must be approved before generating invoice');
    }

    const invoiceNumber = await purchaseInvoiceRepository.getNextSequence(tenantId);
    const supplier = await db.Supplier.findOne({ where: { id: po.supplierId, tenantId } });

    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    const lineItems = [];

    for (const detail of po.details) {
      const item = await db.Item.findByPk(detail.itemId);
      const qty = parseFloat(detail.quantity);
      const unitPrice = parseFloat(detail.unitPrice);
      const taxPct = parseFloat(detail.taxPercent || 0);
      const discPct = parseFloat(detail.discountPercent || 0);

      const lineTotal = qty * unitPrice;
      const discount = lineTotal * (discPct / 100);
      const afterDiscount = lineTotal - discount;
      const tax = afterDiscount * (taxPct / 100);

      lineItems.push({
        itemId: detail.itemId,
        description: detail.description || (item ? item.itemName : ''),
        quantity: qty,
        unitCost: unitPrice,
        taxPercent: taxPct,
        taxAmount: tax,
        discountPercent: discPct,
        discountAmount: discount,
        lineTotal: afterDiscount,
      });

      subtotal += lineTotal;
      totalTax += tax;
      totalDiscount += discount;
    }

    const totalAmount = subtotal - totalDiscount + totalTax;

    const transaction = await db.sequelize.transaction();
    try {
      const invoice = await purchaseInvoiceRepository.create({
        tenantId,
        invoiceNumber,
        supplierInvoiceNumber: null,
        supplierId: po.supplierId,
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: po.expectedDeliveryDate || null,
        warehouseId: po.warehouseId,
        status: 'draft',
        notes: `Generated from Purchase Order ${po.poNumber}`,
        subtotal,
        taxAmount: totalTax,
        discountAmount: totalDiscount,
        totalAmount,
        createdBy: userId,
      }, transaction);

      const detailsToCreate = lineItems.map((li) => ({
        purchaseInvoiceId: invoice.id,
        ...li,
      }));
      await purchaseInvoiceRepository.createDetails(detailsToCreate, transaction);

      await GenericAuditService.log({
        tenantId,
        entityType: 'PurchaseInvoice',
        entityId: invoice.id,
        action: 'GENERATE_FROM_PO',
        performedBy: userId,
        newValues: { invoiceNumber, poId: po.id },
      }, transaction);

      await transaction.commit();
      return this.getById(invoice.id, tenantId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async generateFromGoodsReceipt(tenantId, grnId, userId) {
    const grn = await db.GoodsReceipt.findOne({
      where: { id: grnId, tenantId },
      include: [{ model: db.GoodsReceiptDetail, as: 'details' }],
    });
    if (!grn) throw new Error('Goods Receipt not found');
    if (grn.status !== 'received') throw new Error('Goods Receipt must be received before generating invoice');

    const invoiceNumber = await purchaseInvoiceRepository.getNextSequence(tenantId);
    const supplier = await db.Supplier.findOne({ where: { id: grn.supplierId, tenantId } });

    // Get PO for unit prices
    let po = null;
    if (grn.purchaseOrderId) {
      po = await db.PurchaseOrder.findOne({
        where: { id: grn.purchaseOrderId },
        include: [{ model: db.PurchaseOrderDetail, as: 'details' }],
      });
    }

    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    const lineItems = [];

    for (const detail of grn.details) {
      const item = await db.Item.findByPk(detail.itemId);
      const qty = parseFloat(detail.receivedQuantity);

      // Get unit price from PO if available, otherwise from item
      let unitPrice = 0;
      let taxPct = 0;
      let discPct = 0;
      if (po) {
        const poDetail = po.details.find((pd) => pd.itemId === detail.itemId);
        if (poDetail) {
          unitPrice = parseFloat(poDetail.unitPrice);
          taxPct = parseFloat(poDetail.taxPercent || 0);
          discPct = parseFloat(poDetail.discountPercent || 0);
        }
      }
      if (!unitPrice && item) unitPrice = parseFloat(item.purchaseCost || item.cost || 0);

      const lineTotal = qty * unitPrice;
      const discount = lineTotal * (discPct / 100);
      const afterDiscount = lineTotal - discount;
      const tax = afterDiscount * (taxPct / 100);

      lineItems.push({
        itemId: detail.itemId,
        description: detail.description || (item ? item.itemName : ''),
        quantity: qty,
        unitCost: unitPrice,
        taxPercent: taxPct,
        taxAmount: tax,
        discountPercent: discPct,
        discountAmount: discount,
        lineTotal: afterDiscount,
      });

      subtotal += lineTotal;
      totalTax += tax;
      totalDiscount += discount;
    }

    const totalAmount = subtotal - totalDiscount + totalTax;

    const transaction = await db.sequelize.transaction();
    try {
      const invoice = await purchaseInvoiceRepository.create({
        tenantId,
        invoiceNumber,
        supplierInvoiceNumber: null,
        supplierId: grn.supplierId,
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: null,
        warehouseId: grn.warehouseId,
        status: 'draft',
        notes: `Generated from Goods Receipt ${grn.grnNumber}`,
        subtotal,
        taxAmount: totalTax,
        discountAmount: totalDiscount,
        totalAmount,
        createdBy: userId,
      }, transaction);

      const detailsToCreate = lineItems.map((li) => ({
        purchaseInvoiceId: invoice.id,
        ...li,
      }));
      await purchaseInvoiceRepository.createDetails(detailsToCreate, transaction);

      await GenericAuditService.log({
        tenantId,
        entityType: 'PurchaseInvoice',
        entityId: invoice.id,
        action: 'GENERATE_FROM_GRN',
        performedBy: userId,
        newValues: { invoiceNumber, grnId: grn.id },
      }, transaction);

      await transaction.commit();
      return this.getById(invoice.id, tenantId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new PurchaseInvoiceService();