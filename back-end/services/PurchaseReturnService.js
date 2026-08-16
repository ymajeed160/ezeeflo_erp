'use strict';

const { 
  sequelize,
  GoodsReceipt,
  GoodsReceiptDetail,
  PurchaseInvoice,
  PurchaseInvoiceDetail,
  PurchaseReturn,
  PurchaseReturnDetail,
  Supplier,
  Item,
  Warehouse,
  Account,
  JournalEntry
} = require('../models');
const Sequelize = require('sequelize');
const repository = require('../repositories/PurchaseReturnRepository');
const journalEntryService = require('./JournalEntryService');
const inventoryService = require('./InventoryService');
const { PurchaseReturnDTO } = require('../dto/PurchaseReturnDTO');

class PurchaseReturnService {
  constructor() {
    this.repository = repository;
  }

  _isProductItem(item) {
    if (!item) return false;
    const type = item.itemType || item.type;
    return type === 'product' || type === 'inventory' || type === 'Product';
  }

  // Computes previously-returned quantities keyed by invoice line id and item id.
  async _getReturnedQuantities(invoiceId, tenantId, txn) {
    const returnIds = await PurchaseReturn.findAll({
      where: {
        tenantId,
        purchaseInvoiceId: invoiceId,
        status: { [Sequelize.Op.in]: ['approved', 'posted'] }
      },
      attributes: ['id'],
      transaction: txn,
      raw: true
    }).then(rows => rows.map(r => r.id));

    const result = { byLine: {}, byItem: {} };
    if (!returnIds.length) return result;

    const details = await PurchaseReturnDetail.findAll({
      where: { purchaseReturnId: { [Sequelize.Op.in]: returnIds } },
      attributes: ['purchaseInvoiceLineId', 'itemId', 'quantity'],
      transaction: txn,
      raw: true
    });

    for (const d of details) {
      const q = parseFloat(d.quantity || 0);
      if (d.purchaseInvoiceLineId) {
        result.byLine[d.purchaseInvoiceLineId] = (result.byLine[d.purchaseInvoiceLineId] || 0) + q;
      } else {
        // Legacy returns without a line reference still reduce availability by item.
        result.byItem[d.itemId] = (result.byItem[d.itemId] || 0) + q;
      }
    }
    return result;
  }

  // Returns invoice header + lines with invoiced/returned/available quantities.
  async getReturnableLines(invoiceId, tenantId) {
    const invoice = await PurchaseInvoice.findOne({
      where: { id: invoiceId, tenantId },
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'name', 'code'] },
        {
          model: PurchaseInvoiceDetail,
          as: 'details',
          include: [{ model: Item, as: 'item', attributes: ['id', 'name', 'itemCode', 'itemType'] }]
        }
      ]
    });
    if (!invoice) throw new Error('Purchase Invoice not found');

    const returned = await this._getReturnedQuantities(invoiceId, tenantId, null);

    const lines = (invoice.details || []).map(line => {
      const invoicedQty = parseFloat(line.quantity || 0);
      const returnedQty =
        parseFloat(returned.byLine[line.id] || 0) + parseFloat(returned.byItem[line.itemId] || 0);
      const availableQty = Math.max(0, parseFloat((invoicedQty - returnedQty).toFixed(4)));
      return {
        purchaseInvoiceLineId: line.id,
        itemId: line.itemId,
        itemName: line.item ? line.item.name : null,
        itemCode: line.item ? line.item.code : null,
        itemType: line.item ? line.item.itemType : null,
        description: line.description,
        invoicedQty,
        returnedQty: parseFloat(returnedQty.toFixed(4)),
        availableQty,
        unitCost: parseFloat(line.unitCost || 0),
        taxPercent: parseFloat(line.taxPercent || 0),
        taxAmount: parseFloat(line.taxAmount || 0),
        discountAmount: parseFloat(line.discountAmount || 0),
        lineTotal: parseFloat(line.lineTotal || 0)
      };
    });

    return {
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        supplierId: invoice.supplierId,
        supplierName: invoice.supplier ? invoice.supplier.name : null,
        warehouseId: invoice.warehouseId,
        status: invoice.status,
        totalAmount: parseFloat(invoice.totalAmount || 0)
      },
      lines
    };
  }

  async getAll(tenantId, filters = {}) {
    const result = await this.repository.findAll(tenantId, filters);
    return {
      ...result,
      data: PurchaseReturnDTO.toSummaryList(result.data)
    };
  }

  async getById(id, tenantId) {
    const record = await this.repository.findById(id, tenantId);
    if (!record) throw new Error('Purchase Return not found');
    return PurchaseReturnDTO.toDTO(record);
  }

  async create(tenantId, data, userId) {
    const txn = await sequelize.transaction();

    try {
      // Validate reference type checks
      if (data.referenceType === 'purchase_invoice' && !data.purchaseInvoiceId) {
        throw new Error('Purchase Invoice ID is required for invoice reference type');
      }
      if (data.referenceType === 'goods_receipt' && !data.goodsReceiptId) {
        throw new Error('Goods Receipt ID is required for goods receipt reference type');
      }

      let headerData = {
        tenantId,
        returnDate: data.returnDate,
        supplierId: data.supplierId || null,
        purchaseInvoiceId: data.purchaseInvoiceId || null,
        goodsReceiptId: data.goodsReceiptId || null,
        warehouseId: data.warehouseId || null,
        referenceType: data.referenceType,
        notes: data.notes || null,
        createdBy: userId
      };

      let details = [];

      if (data.referenceType === 'purchase_invoice') {
        const invoice = await PurchaseInvoice.findOne({
          where: { id: data.purchaseInvoiceId, tenantId },
          include: [
            {
              model: PurchaseInvoiceDetail,
              as: 'details',
              include: [{ model: Item, as: 'item' }]
            }
          ],
          transaction: txn
        });
        if (!invoice) throw new Error('Purchase Invoice not found');
        if (invoice.status !== 'posted') {
          throw new Error('Only posted purchase invoices can be returned');
        }

        // Derive supplier + warehouse from the invoice.
        headerData.supplierId = invoice.supplierId;
        headerData.warehouseId = data.warehouseId || invoice.warehouseId || null;

        const returned = await this._getReturnedQuantities(invoice.id, tenantId, txn);

        for (const d of data.details || []) {
          const invLine = invoice.details.find(l =>
            (d.purchaseInvoiceLineId && l.id === d.purchaseInvoiceLineId) ||
            (!d.purchaseInvoiceLineId && l.itemId === d.itemId)
          );
          if (!invLine) {
            throw new Error(`Invoice line not found for ${d.purchaseInvoiceLineId || d.itemId}`);
          }

          const qty = parseFloat(d.quantity || 0);
          const alreadyReturned =
            parseFloat(returned.byLine[invLine.id] || 0) + parseFloat(returned.byItem[invLine.itemId] || 0);
          const available = parseFloat((parseFloat(invLine.quantity || 0) - alreadyReturned).toFixed(4));
          if (qty > available) {
            const name = invLine.item ? invLine.item.name : invLine.itemId;
            throw new Error(`Cannot return ${qty} of "${name}". Only ${available} available for return.`);
          }

          const unitCost = parseFloat(invLine.unitCost || 0);
          const taxPercent = parseFloat(invLine.taxPercent || 0);
          const net = parseFloat((qty * unitCost).toFixed(2));
          const taxAmount = parseFloat((net * taxPercent / 100).toFixed(2));
          const lineTotal = parseFloat((net + taxAmount).toFixed(2));

          details.push({
            purchaseInvoiceLineId: invLine.id,
            itemId: invLine.itemId,
            description: invLine.description || (invLine.item ? invLine.item.name : null),
            quantity: qty,
            unitCost,
            taxPercent,
            taxAmount,
            discountAmount: 0,
            lineTotal,
            warehouseId: headerData.warehouseId
          });
        }
      } else {
        // goods_receipt reference: details are provided by the client.
        details = (data.details || []).map(d => {
          const unitCost = parseFloat(d.unitCost || 0);
          const qty = parseFloat(d.quantity || 0);
          const taxPercent = parseFloat(d.taxRate || d.taxPercent || 0);
          const discountAmount = parseFloat(d.discountAmount || 0);
          const net = parseFloat((qty * unitCost - discountAmount).toFixed(2));
          const taxAmount = parseFloat((net * taxPercent / 100).toFixed(2));
          const lineTotal = parseFloat((net + taxAmount).toFixed(2));
          return {
            itemId: d.itemId,
            description: d.description || null,
            quantity: qty,
            unitCost,
            taxPercent,
            taxAmount,
            discountAmount,
            lineTotal,
            warehouseId: d.warehouseId || headerData.warehouseId || null
          };
        });
      }

      if (!details.length) throw new Error('At least one return line is required');

      const returnNumber = await this.repository.getNextSequence(tenantId);
      const totalAmount = details.reduce((sum, d) => sum + (parseFloat(d.lineTotal) || 0), 0);

      const header = {
        ...headerData,
        returnNumber,
        status: 'draft',
        totalAmount: parseFloat(totalAmount.toFixed(2))
      };

      const record = await this.repository.create(header, details, { transaction: txn });
      await txn.commit();
      return PurchaseReturnDTO.toDTO(record);
    } catch (error) {
      await txn.rollback();
      throw error;
    }
  }

  async update(id, tenantId, data, userId) {
    const txn = await sequelize.transaction();

    try {
      const existing = await this.repository.findById(id, tenantId);
      if (!existing) throw new Error('Purchase Return not found');
      if (existing.status !== 'draft') throw new Error('Only Draft returns can be edited');

      let totalAmount = parseFloat(existing.totalAmount);
      if (data.details) {
        totalAmount = data.details.reduce((sum, d) => {
          const qty = parseFloat(d.quantity || 0);
          const unitCost = parseFloat(d.unitCost || 0);
          const taxPercent = parseFloat(d.taxRate || d.taxPercent || 0);
          const discountAmount = parseFloat(d.discountAmount || 0);
          const net = parseFloat((qty * unitCost - discountAmount).toFixed(2));
          const taxAmount = parseFloat((net * taxPercent / 100).toFixed(2));
          return sum + parseFloat((net + taxAmount).toFixed(2));
        }, 0);
      }

      const header = {
        returnDate: data.returnDate || existing.returnDate,
        supplierId: data.supplierId || existing.supplierId,
        purchaseInvoiceId: data.purchaseInvoiceId !== undefined ? data.purchaseInvoiceId : existing.purchaseInvoiceId,
        goodsReceiptId: data.goodsReceiptId !== undefined ? data.goodsReceiptId : existing.goodsReceiptId,
        warehouseId: data.warehouseId !== undefined ? data.warehouseId : existing.warehouseId,
        referenceType: data.referenceType || existing.referenceType,
        totalAmount,
        notes: data.notes !== undefined ? data.notes : existing.notes,
        updatedBy: userId
      };

      const record = await this.repository.update(id, tenantId, header, data.details || null, { transaction: txn });
      await txn.commit();
      return PurchaseReturnDTO.toDTO(record);
    } catch (error) {
      await txn.rollback();
      throw error;
    }
  }

  async approve(id, tenantId, userId) {
    const txn = await sequelize.transaction();

    try {
      const record = await this.repository.findById(id, tenantId);
      if (!record) throw new Error('Purchase Return not found');
      if (record.status !== 'draft') throw new Error('Only Draft returns can be approved');

      // Validate quantities - cannot return more than received
      for (const detail of record.details) {
        if (this._isProductItem(detail.item)) {
          await this.validateReturnQuantity(record, detail, tenantId, txn);
        }
      }

      // Update status
      await this.repository.updateStatus(id, tenantId, 'approved', { transaction: txn });

      // Inventory impact - reduce inventory (goods going back to supplier)
      for (const detail of record.details) {
        if (this._isProductItem(detail.item) && detail.warehouseId) {
          await inventoryService.reduceStock(
            tenantId,
            detail.itemId,
            detail.warehouseId,
            Math.abs(parseFloat(detail.quantity)),
            parseFloat(detail.unitCost),
            { id, type: 'PurchaseReturn', number: record.returnNumber },
            txn
          );
        }
      }

      // Accounting impact - reverse purchase entry
      await this.createAccountingEntries(record, tenantId, userId, txn);

      await txn.commit();
      const updated = await this.repository.findById(id, tenantId);
      return PurchaseReturnDTO.toDTO(updated);
    } catch (error) {
      await txn.rollback();
      throw error;
    }
  }

  async reverse(id, tenantId, userId) {
    const txn = await sequelize.transaction();

    try {
      const record = await this.repository.findById(id, tenantId);
      if (!record) throw new Error('Purchase Return not found');
      if (!['approved', 'posted'].includes(record.status)) {
        throw new Error('Only Approved/Posted returns can be reversed');
      }

      // Restore inventory (add back the returned quantity)
      for (const detail of record.details) {
        if (this._isProductItem(detail.item) && detail.warehouseId) {
          await inventoryService.addStock(
            tenantId,
            detail.itemId,
            detail.warehouseId,
            Math.abs(parseFloat(detail.quantity)),
            parseFloat(detail.unitCost),
            { id, type: 'PurchaseReturn', number: record.returnNumber },
            txn
          );
        }
      }

      // Reverse the accounting entry (opposite lines)
      await this.reverseAccountingEntries(record, tenantId, userId, txn);

      await this.repository.updateStatus(id, tenantId, 'reversed', { transaction: txn });

      await txn.commit();
      const updated = await this.repository.findById(id, tenantId);
      return PurchaseReturnDTO.toDTO(updated);
    } catch (error) {
      await txn.rollback();
      throw error;
    }
  }

  async reject(id, tenantId, userId, reason) {
    const record = await this.repository.findById(id, tenantId);
    if (!record) throw new Error('Purchase Return not found');
    if (record.status !== 'draft') throw new Error('Only Draft returns can be rejected');

    await this.repository.updateStatus(id, tenantId, 'rejected');
    const updated = await this.repository.findById(id, tenantId);
    return PurchaseReturnDTO.toDTO(updated);
  }

  async delete(id, tenantId) {
    const record = await this.repository.findById(id, tenantId);
    if (!record) throw new Error('Purchase Return not found');
    if (record.status !== 'draft') throw new Error('Only Draft returns can be deleted');
    return await this.repository.delete(id, tenantId);
  }

  async validateReturnQuantity(record, detail, tenantId, txn) {
    const referenceType = record.referenceType;
    let receivedQty = 0;

    if (referenceType === 'goods_receipt' && record.goodsReceiptId) {
      const goodsReceipt = await GoodsReceipt.findOne({
        where: { id: record.goodsReceiptId, tenantId },
        include: [{ model: GoodsReceiptDetail, as: 'details', where: { itemId: detail.itemId } }],
        transaction: txn
      });
      if (goodsReceipt && goodsReceipt.details) {
        receivedQty = goodsReceipt.details.reduce((sum, d) => sum + parseFloat(d.receivedQuantity || 0), 0);
      }
    } else if (referenceType === 'purchase_invoice' && record.purchaseInvoiceId) {
      const invoice = await PurchaseInvoice.findOne({
        where: { id: record.purchaseInvoiceId, tenantId },
        include: [{ model: PurchaseInvoiceDetail, as: 'details', where: { itemId: detail.itemId } }],
        transaction: txn
      });
      if (invoice && invoice.details) {
        receivedQty = invoice.details.reduce((sum, d) => sum + parseFloat(d.quantity || 0), 0);
      }
    }

    let alreadyReturned = 0;
    if (record.purchaseInvoiceId) {
      const returned = await this._getReturnedQuantities(record.purchaseInvoiceId, tenantId, txn);
      const invoiceLineId = detail.purchaseInvoiceLineId || null;
      alreadyReturned =
        parseFloat(returned.byLine[invoiceLineId] || 0) + parseFloat(returned.byItem[detail.itemId] || 0);
    } else {
      // goods_receipt reference: legacy item-based accounting
      const prevReturns = await PurchaseReturn.findAll({
        where: {
          tenantId,
          status: { [Sequelize.Op.in]: ['approved', 'posted'] },
          goodsReceiptId: record.goodsReceiptId,
          id: { [Sequelize.Op.ne]: record.id }
        },
        include: [{ model: PurchaseReturnDetail, as: 'details', where: { itemId: detail.itemId } }],
        transaction: txn
      });
      prevReturns.forEach(ret => {
        (ret.details || []).forEach(d => { alreadyReturned += parseFloat(d.quantity || 0); });
      });
    }

    const availableToReturn = receivedQty - alreadyReturned;
    if (parseFloat(detail.quantity || 0) > availableToReturn) {
      const itemName = detail.item ? (detail.item.name || detail.itemId) : detail.itemId;
      throw new Error(`Cannot return ${detail.quantity} of ${itemName}. Only ${availableToReturn} available for return.`);
    }
  }

  async _resolveApAccountId(supplier, tenantId, txn) {
    let apAccountId = supplier ? supplier.apAccountId : null;
    if (!apAccountId) {
      const apAcct = await Account.findOne({
        where: { tenantId, type: 'liability', name: { [Sequelize.Op.like]: '%Accounts Payable%' }, isActive: true },
        transaction: txn
      });
      apAccountId = apAcct ? apAcct.id : null;
    }
    if (!apAccountId) {
      throw new Error('Accounts Payable account is not configured for this supplier. Please set an AP account in supplier settings.');
    }
    return apAccountId;
  }

  // Builds journal lines for a purchase return (CR inventory/expense + VAT, DR AP).
  async _buildAccountingItems(record, tenantId, txn) {
    const items = [];
    const supplier = await Supplier.findOne({ where: { id: record.supplierId, tenantId }, transaction: txn });
    const apAccountId = await this._resolveApAccountId(supplier, tenantId, txn);

    const details = record.details || [];

    for (const detail of details) {
      const item = detail.item;
      const isProduct = this._isProductItem(item);
      const subtotal = (parseFloat(detail.quantity) || 0) * (parseFloat(detail.unitCost) || 0);
      const discount = parseFloat(detail.discountAmount) || 0;
      const netAmount = subtotal - discount;
      const taxAmount = parseFloat(detail.taxAmount || 0);

      if (netAmount <= 0) continue;

      if (isProduct) {
        const invAccountId = item ? item.inventoryAccountId : null;
        if (invAccountId) {
          items.push({
            accountId: invAccountId,
            debit: 0,
            credit: parseFloat(netAmount.toFixed(2)),
            description: `Return: ${item.name || 'Item'} inventory credit`
          });
        }
      } else {
        const expAccountId = item ? (item.expenseAccountId || item.purchaseAccountId) : null;
        if (expAccountId) {
          items.push({
            accountId: expAccountId,
            debit: 0,
            credit: parseFloat(netAmount.toFixed(2)),
            description: `Return: ${item ? (item.name || 'Service') : 'Service'}`
          });
        }
      }

      // CR VAT Input (reverse VAT)
      if (taxAmount > 0) {
        const vatAccountId = item ? (item.inputTaxAccountId || item.taxInputAccountId) : null;
        let vatAccount = vatAccountId ? await Account.findByPk(vatAccountId, { transaction: txn }) : null;
        if (!vatAccount) {
          vatAccount = await Account.findOne({
            where: {
              tenantId,
              [Sequelize.Op.or]: [
                { name: { [Sequelize.Op.like]: '%VAT Input%' } },
                { name: { [Sequelize.Op.like]: '%Input Tax%' } },
              ],
              isActive: true
            },
            transaction: txn
          });
        }
        if (vatAccount) {
          items.push({
            accountId: vatAccount.id,
            debit: 0,
            credit: parseFloat(taxAmount.toFixed(2)),
            description: `Return: VAT Input reversal - ${record.returnNumber}`
          });
        }
      }
    }

    // Calculate total credit amount (what we're returning)
    const totalCredit = items.reduce((sum, it) => sum + (it.credit || 0), 0);

    // DR AP (reducing payable) - only if we have credit entries to offset
    if (totalCredit > 0) {
      items.push({
        accountId: apAccountId,
        debit: parseFloat(totalCredit.toFixed(2)),
        credit: 0,
        description: `Purchase Return: ${record.returnNumber}`
      });
    }

    return items;
  }

  async createAccountingEntries(record, tenantId, userId, txn) {
    const items = await this._buildAccountingItems(record, tenantId, txn);
    if (items.length > 0) {
      const entry = await journalEntryService.createEntry({
        tenantId,
        entryDate: record.returnDate,
        reference: `PRET-${record.returnNumber}`,
        description: `Purchase Return ${record.returnNumber}`,
        lines: items,
      }, tenantId, userId, txn);
      await this.repository.update(record.id, tenantId, { journalEntryId: entry.id }, null, { transaction: txn });
    }
  }

  async reverseAccountingEntries(record, tenantId, userId, txn) {
    const items = await this._buildAccountingItems(record, tenantId, txn);
    if (!items.length) return;

    // Invert every line to reverse the original entry.
    const reversedLines = items.map(line => ({
      accountId: line.accountId,
      debit: parseFloat(line.credit || 0),
      credit: parseFloat(line.debit || 0),
      description: `Reversal of ${line.description}`
    }));

    await journalEntryService.createEntry({
      tenantId,
      entryDate: record.returnDate,
      reference: `PRET-REV-${record.returnNumber}`,
      description: `Purchase Return Reversal ${record.returnNumber}`,
      lines: reversedLines,
    }, tenantId, userId, txn);
  }
}

module.exports = new PurchaseReturnService();