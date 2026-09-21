'use strict';

const db = require('../models');
const purchaseInvoiceRepository = require('../repositories/PurchaseInvoiceRepository');
const JournalEntryService = require('./JournalEntryService');
const inventoryService = require('./InventoryService');
const GenericAuditService = require('./GenericAuditService');
const { requireDeletionEnabled } = require('../utils/deletionSettings');
const PurchaseInvoiceDTO = require('../dto/PurchaseInvoiceDTO');

class PurchaseInvoiceService {
  async list(tenantId, filters) {
    if (filters) {
      filters.includeDeleted = filters.includeDeleted === 'true' || filters.includeDeleted === true;
    }
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
    if (!['draft', 'confirmed', 'posted'].includes(existing.status)) {
      throw new Error('This invoice cannot be edited in its current status');
    }

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

      const wasPosted = existing.status === 'posted';

      // If the invoice was already posted, reverse the inventory impact first.
      // The journal entry is updated in place below.
      if (wasPosted) {
        for (const detail of existing.details || existing.PurchaseInvoiceDetails || []) {
          const item = await db.Item.findByPk(detail.itemId, { transaction });
          if (item && (item.itemType === 'product' || item.itemType === 'inventory') && existing.warehouseId) {
            await inventoryService.reduceStock(
              tenantId,
              detail.itemId,
              existing.warehouseId,
              parseFloat(detail.quantity || 0),
              parseFloat(detail.unitCost || 0),
              { id: existing.id, type: 'PurchaseInvoiceEdit', number: existing.invoiceNumber },
              transaction
            );
          }
        }
      }

      await purchaseInvoiceRepository.update(id, tenantId, updateData, transaction);

      if (items && items.length > 0) {
        await purchaseInvoiceRepository.deleteDetails(id, transaction);
        const detailsToCreate = lineItems.map((li) => ({
          purchaseInvoiceId: id,
          ...li,
        }));
        await purchaseInvoiceRepository.createDetails(detailsToCreate, transaction);
      }

      // Re-apply inventory and update the existing journal entry in place so a
      // single journal entry per invoice always reflects the latest values.
      if (wasPosted) {
        const fresh = await db.PurchaseInvoice.findOne({
          where: { id, tenantId },
          include: [{ model: db.PurchaseInvoiceDetail, as: 'details' }],
          transaction,
        });
        const resolved = await this._resolvePosting(fresh, tenantId, transaction);

        const journalLines = [];
        for (const line of resolved.lines) {
          const isProduct = line.itemType === 'product';

          journalLines.push({
            accountId: line.accountId,
            debit: line.netAmount,
            credit: 0,
            description: `Purchase of ${line.itemName}${isProduct ? '' : ' (Service)'} - ${existing.invoiceNumber}`,
          });

          if (line.taxAmount > 0) {
            journalLines.push({
              accountId: resolved.vatReceivableId,
              debit: line.taxAmount,
              credit: 0,
              description: `VAT Input on ${line.itemName} - ${existing.invoiceNumber}`,
            });
          }

          if (isProduct) {
            await inventoryService.addStock(
              tenantId,
              line.itemId,
              fresh.warehouseId,
              line.quantity,
              line.unitCost,
              { id: existing.id, type: 'PurchaseInvoice', number: existing.invoiceNumber },
              transaction
            );
          }
        }

        journalLines.push({
          accountId: resolved.apAccountId,
          debit: 0,
          credit: resolved.totalAmount,
          description: `Accounts Payable - ${resolved.supplier.name} - ${existing.invoiceNumber}`,
        });

        // Update the existing journal entry lines in place (keeps the same entry).
        await db.JournalEntryLine.destroy({
          where: { journalEntryId: existing.journalEntryId, tenantId },
          transaction,
        });
        await db.JournalEntryLine.bulkCreate(journalLines.map((line, i) => ({
          accountId: line.accountId,
          description: line.description,
          debit: Number(line.debit || 0),
          credit: Number(line.credit || 0),
          tenantId,
          journalEntryId: existing.journalEntryId,
          lineNumber: i + 1,
        })), { transaction });
        await db.JournalEntry.update({
          entryDate: fresh.invoiceDate || new Date().toISOString().split('T')[0],
          reference: existing.invoiceNumber,
          description: `Purchase Invoice ${existing.invoiceNumber} - ${resolved.supplier.name}`,
          updatedBy: userId,
        }, { where: { id: existing.journalEntryId, tenantId }, transaction });
      }

      await GenericAuditService.log({
        tenantId,
        entityType: 'PurchaseInvoice',
        entityId: id,
        action: 'UPDATE',
        performedBy: userId,
        oldValues: {
          supplierId: existing.supplierId,
          invoiceDate: existing.invoiceDate,
          dueDate: existing.dueDate,
          supplierInvoiceNumber: existing.supplierInvoiceNumber,
          warehouseId: existing.warehouseId,
          notes: existing.notes,
          subtotal: existing.subtotal,
          taxAmount: existing.taxAmount,
          discountAmount: existing.discountAmount,
          totalAmount: existing.totalAmount,
        },
        newValues: updateData,
      }, transaction);

      await transaction.commit();
      return this.getById(id, tenantId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async delete(id, tenantId, userId, reason = null) {
    const existing = await purchaseInvoiceRepository.findById(id, tenantId);
    if (!existing) throw new Error('Purchase Invoice not found');
    await requireDeletionEnabled(tenantId, 'purchase_invoices');
    if (existing.journalEntryId) throw new Error('This Purchase Invoice is linked to a journal entry. Delete the journal entry first, then delete this invoice.');

    const transaction = await db.sequelize.transaction();
    try {
      // Record who deleted and why, then soft-delete the header (details are kept for restore)
      await db.PurchaseInvoice.update(
        { deletedBy: userId, deleteReason: reason || null },
        { where: { id, tenantId }, transaction }
      );
      await purchaseInvoiceRepository.delete(id, tenantId, transaction);

      await GenericAuditService.log({
        tenantId,
        entityType: 'PurchaseInvoice',
        entityId: id,
        action: 'SOFT_DELETE',
        performedBy: userId,
        newValues: { deletedBy: userId, deleteReason: reason || null },
      }, transaction);

      await transaction.commit();
      return { message: 'Purchase Invoice deleted successfully' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async restore(id, tenantId, userId) {
    const existing = await purchaseInvoiceRepository.findById(id, tenantId, true);
    if (!existing) throw new Error('Purchase Invoice not found');
    if (!existing.deletedAt) throw new Error('Purchase Invoice is not deleted');
    if (existing.status !== 'draft') throw new Error('Only draft invoices can be restored');

    const transaction = await db.sequelize.transaction();
    try {
      await purchaseInvoiceRepository.restore(id, tenantId, transaction);

      await GenericAuditService.log({
        tenantId,
        entityType: 'PurchaseInvoice',
        entityId: id,
        action: 'RESTORE',
        performedBy: userId,
        newValues: { restored: true },
      }, transaction);

      await transaction.commit();
      return this.getById(id, tenantId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async _resolvePosting(existing, tenantId, transaction = null) {
    const supplier = await db.Supplier.findOne({ where: { id: existing.supplierId, tenantId }, transaction });
    if (!supplier) throw new Error('Supplier not found');
    if (supplier.status !== 'active' || supplier.isActive === false) throw new Error('Supplier is not active');
    if (!supplier.apAccountId) throw new Error('Supplier Chart of Account is not configured.');

    // VAT Receivable account from System Configuration → Accounting
    const totalTax = parseFloat(existing.taxAmount || 0);
    let vatReceivableId = null;
    if (totalTax > 0) {
      const vatConfigs = await db.SystemConfig.findAll({
        where: { tenantId, category: 'accounting', configKey: 'vat_receivable' },
        attributes: ['configValue'],
        transaction,
      });
      if (vatConfigs.length > 0 && vatConfigs[0].configValue) {
        vatReceivableId = vatConfigs[0].configValue;
      } else {
        throw new Error('VAT Receivable Account is not configured in Accounting System Configuration.');
      }
    }

    const details = existing.details || existing.PurchaseInvoiceDetails || [];
    const lines = [];
    for (const detail of details) {
      const item = await db.Item.findOne({ where: { id: detail.itemId, tenantId }, transaction });
      if (!item) throw new Error(`Item ${detail.itemId} not found`);
      if (item.isActive === false) throw new Error(`Item "${item.name || item.itemName}" is not active`);

      const qty = parseFloat(detail.quantity || 0);
      if (qty <= 0) throw new Error(`Quantity must be greater than zero for item "${item.name || item.itemName}"`);
      const unitCost = parseFloat(detail.unitCost || 0);
      if (unitCost < 0) throw new Error(`Unit price must not be negative for item "${item.name || item.itemName}"`);

      // lineTotal is stored net of discount and EXCLUDES VAT; taxAmount is the VAT portion.
      const lineTotal = parseFloat(detail.lineTotal || 0);
      const taxAmount = parseFloat(detail.taxAmount || 0);
      const itemName = item.name || item.itemName || 'Item';
      const isProduct = item.itemType === 'product';
      const accountId = isProduct ? item.inventoryAccountId : item.expenseAccountId;
      if (!accountId) throw new Error(`Chart of Account is not configured for Item: ${itemName}.`);
      if (isProduct && !existing.warehouseId) throw new Error(`Warehouse is required for inventory item: ${itemName}.`);

      lines.push({
        itemId: detail.itemId,
        itemName,
        itemType: item.itemType,
        accountId,
        netAmount: lineTotal,
        taxAmount,
        quantity: qty,
        unitCost,
      });
    }

    return {
      supplier,
      apAccountId: supplier.apAccountId,
      vatReceivableId,
      totalTax,
      totalAmount: parseFloat(existing.totalAmount || 0),
      lines,
    };
  }

  async getPostingPreview(id, tenantId) {
    const existing = await purchaseInvoiceRepository.findById(id, tenantId);
    if (!existing) throw new Error('Purchase Invoice not found');
    const resolved = await this._resolvePosting(existing, tenantId);

    const accountIds = [...new Set([
      resolved.apAccountId,
      resolved.vatReceivableId,
      ...resolved.lines.map((l) => l.accountId),
    ].filter(Boolean))];

    const accounts = accountIds.length
      ? await db.Account.findAll({ where: { id: accountIds, tenantId } })
      : [];
    const accountMap = {};
    accounts.forEach((a) => {
      accountMap[a.id] = { id: a.id, code: a.code, name: a.name, type: a.type };
    });

    return {
      id: existing.id,
      invoiceNumber: existing.invoiceNumber,
      invoiceDate: existing.invoiceDate,
      totalAmount: resolved.totalAmount,
      taxAmount: resolved.totalTax,
      supplier: {
        id: resolved.supplier.id,
        name: resolved.supplier.name,
        account: accountMap[resolved.apAccountId] || null,
      },
      vatAccount: resolved.vatReceivableId ? (accountMap[resolved.vatReceivableId] || null) : null,
      lines: resolved.lines.map((l) => ({
        itemId: l.itemId,
        itemName: l.itemName,
        itemType: l.itemType,
        account: accountMap[l.accountId] || null,
        netAmount: l.netAmount,
        taxAmount: l.taxAmount,
      })),
    };
  }

  async confirm(id, tenantId, userId) {
    const existing = await purchaseInvoiceRepository.findById(id, tenantId);
    if (!existing) throw new Error('Purchase Invoice not found');
    if (existing.status === 'posted' || existing.journalEntryId) throw new Error('This Purchase Invoice has already been posted.');
    if (existing.status !== 'draft') throw new Error('Only draft invoices can be confirmed');

    const details = existing.details || existing.PurchaseInvoiceDetails || [];
    if (!details || details.length === 0) {
      throw new Error('Invoice must have at least one item to post');
    }

    const resolved = await this._resolvePosting(existing, tenantId);

    const transaction = await db.sequelize.transaction();
    try {
      const journalLines = [];

      for (const line of resolved.lines) {
        const isProduct = line.itemType === 'product';

        journalLines.push({
          accountId: line.accountId,
          debit: line.netAmount,
          credit: 0,
          description: `Purchase of ${line.itemName}${isProduct ? '' : ' (Service)'} - ${existing.invoiceNumber}`,
        });

        if (line.taxAmount > 0) {
          journalLines.push({
            accountId: resolved.vatReceivableId,
            debit: line.taxAmount,
            credit: 0,
            description: `VAT Input on ${line.itemName} - ${existing.invoiceNumber}`,
          });
        }

        if (isProduct) {
          await inventoryService.addStock(
            tenantId,
            line.itemId,
            existing.warehouseId,
            line.quantity,
            line.unitCost,
            { id: existing.id, type: 'PurchaseInvoice', number: existing.invoiceNumber },
            transaction
          );
        }
      }

      // Credit the supplier's Accounts Payable account (total including VAT)
      journalLines.push({
        accountId: resolved.apAccountId,
        debit: 0,
        credit: resolved.totalAmount,
        description: `Accounts Payable - ${resolved.supplier.name} - ${existing.invoiceNumber}`,
      });

      // Create the journal entry (validates balanced debits/credits)
      const journalEntry = await JournalEntryService.createEntry(
        {
          lines: journalLines,
          entryDate: existing.invoiceDate || new Date().toISOString().split('T')[0],
          reference: existing.invoiceNumber,
          description: `Purchase Invoice ${existing.invoiceNumber} - ${resolved.supplier.name}`,
          source: 'PURCHASE_INVOICE',
          sourceId: existing.id,
          isAutoGenerated: true,
        },
        tenantId,
        userId,
        transaction
      );

      // Automatically post the journal entry (no manual confirmation required)
      await JournalEntryService.postEntry(journalEntry.id, tenantId, userId, transaction);

      await purchaseInvoiceRepository.update(id, tenantId, {
        status: 'posted',
        journalEntryId: journalEntry.id,
        updatedBy: userId,
      }, transaction);

      await GenericAuditService.log({
        tenantId,
        entityType: 'PurchaseInvoice',
        entityId: id,
        action: 'CONFIRM',
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
          source: 'PURCHASE_INVOICE',
          sourceId: existing.id,
          isAutoGenerated: true,
        },
        tenantId,
        userId,
        transaction
      );

      // Automatically post the journal entry so it appears in the General Ledger
      await JournalEntryService.postEntry(journalEntry.id, tenantId, userId, transaction);

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

  async cancel(id, tenantId, userId, reason = null) {
    const existing = await purchaseInvoiceRepository.findById(id, tenantId);
    if (!existing) throw new Error('Purchase Invoice not found');
    if (!['draft', 'posted'].includes(existing.status)) throw new Error('Only draft or posted invoices can be cancelled');

    const transaction = await db.sequelize.transaction();
    try {
      // If invoice was posted: reverse inventory AND reverse the posted journal entry
      if (existing.status === 'posted') {
        // Reverse inventory for product/inventory items
        for (const detail of existing.details || []) {
          const item = await db.Item.findByPk(detail.itemId, { transaction });
          if (item && (item.itemType === 'product' || item.itemType === 'inventory') && existing.warehouseId) {
            await inventoryService.reduceStock(
              tenantId,
              detail.itemId,
              existing.warehouseId,
              parseFloat(detail.quantity || 0),
              parseFloat(detail.unitCost || 0),
              { id: existing.id, type: 'PurchaseInvoiceCancel', number: existing.invoiceNumber },
              transaction
            );
          }
        }

        // Reverse the journal entry
        if (existing.journalEntryId) {
          const originalJE = await db.JournalEntry.findByPk(existing.journalEntryId, {
            include: [{ model: db.JournalEntryLine, as: 'lines' }],
            transaction,
          });

          if (originalJE && originalJE.lines && originalJE.lines.length > 0) {
            const reversalLines = originalJE.lines.map((line) => ({
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
              source: 'PURCHASE_INVOICE_CANCEL',
              sourceId: existing.id,
              isAutoGenerated: true,
            }, tenantId, userId, transaction);

            await JournalEntryService.postEntry(reversalJE.id, tenantId, userId, transaction);
          }
        }
      }

      await purchaseInvoiceRepository.update(id, tenantId, {
        status: 'cancelled',
        cancelReason: reason || null,
        updatedBy: userId,
      }, transaction);

      await GenericAuditService.log({
        tenantId,
        entityType: 'PurchaseInvoice',
        entityId: id,
        action: 'CANCEL',
        performedBy: userId,
        newValues: { status: 'cancelled', cancelReason: reason || null },
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

    // Prevent duplicate invoice generation from the same GRN
    const existingInvoice = await db.PurchaseInvoice.findOne({
      where: { goodsReceiptId: grn.id, tenantId },
      paranoid: false,
    });
    if (existingInvoice) {
      throw Object.assign(
        new Error(`Goods Receipt ${grn.grnNumber} is already converted to invoice ${existingInvoice.invoiceNumber}`),
        { statusCode: 400, isOperational: true }
      );
    }

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

      // Use the GRN line's own price/tax/discount as the source of truth,
      // falling back to the PO, then to the item master.
      let unitPrice = parseFloat(detail.unitPrice || 0);
      let taxPct = parseFloat(detail.taxPercentage || 0);
      let discPct = parseFloat(detail.discountPercentage || 0);
      if (po) {
        const poDetail = po.details.find((pd) => pd.itemId === detail.itemId);
        if (poDetail) {
          if (!unitPrice) unitPrice = parseFloat(poDetail.unitPrice);
          if (!taxPct) taxPct = parseFloat(poDetail.taxPercent || 0);
          if (!discPct) discPct = parseFloat(poDetail.discountPercent || 0);
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
        goodsReceiptId: grn.id,
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