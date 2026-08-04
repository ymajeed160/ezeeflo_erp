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

      // Get return number
      const returnNumber = await this.repository.getNextSequence(tenantId);

      // Calculate total amount from details
      const totalAmount = data.details.reduce((sum, d) => sum + (parseFloat(d.lineTotal) || 0), 0);

      const header = {
        tenantId,
        returnNumber,
        returnDate: data.returnDate,
        supplierId: data.supplierId,
        purchaseInvoiceId: data.purchaseInvoiceId || null,
        goodsReceiptId: data.goodsReceiptId || null,
        warehouseId: data.warehouseId || null,
        referenceType: data.referenceType,
        status: 'Draft',
        totalAmount,
        notes: data.notes,
        createdBy: userId
      };

      const record = await this.repository.create(header, data.details, { transaction: txn });
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
      if (existing.status !== 'Draft') throw new Error('Only Draft returns can be edited');

      let totalAmount = parseFloat(existing.totalAmount);
      if (data.details) {
        totalAmount = data.details.reduce((sum, d) => sum + (parseFloat(d.lineTotal) || 0), 0);
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
      if (record.status !== 'Draft') throw new Error('Only Draft returns can be approved');

      // Validate quantities - cannot return more than received
      for (const detail of record.details) {
        if (detail.item && detail.item.type === 'Product') {
          await this.validateReturnQuantity(record, detail, tenantId, txn);
        }
      }

      // Update status
      await this.repository.updateStatus(id, tenantId, 'Approved', { transaction: txn });

      // Inventory impact - reduce inventory
      for (const detail of record.details) {
        if (detail.item && detail.item.type === 'Product' && detail.warehouseId) {
          await inventoryService.addTransaction({
            tenantId,
            itemId: detail.itemId,
            warehouseId: detail.warehouseId,
            transactionType: 'purchase_return',
            referenceType: 'PurchaseReturn',
            referenceId: id,
            referenceNumber: record.returnNumber,
            quantity: -Math.abs(parseFloat(detail.quantity)),
            unitCost: parseFloat(detail.unitCost),
            transactionDate: record.returnDate,
            notes: `Purchase Return: ${record.returnNumber}`
          }, txn);
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

  async reject(id, tenantId, userId, reason) {
    const record = await this.repository.findById(id, tenantId);
    if (!record) throw new Error('Purchase Return not found');
    if (record.status !== 'Draft') throw new Error('Only Draft returns can be rejected');

    await this.repository.updateStatus(id, tenantId, 'Rejected');
    const updated = await this.repository.findById(id, tenantId);
    return PurchaseReturnDTO.toDTO(updated);
  }

  async delete(id, tenantId) {
    const record = await this.repository.findById(id, tenantId);
    if (!record) throw new Error('Purchase Return not found');
    if (record.status !== 'Draft') throw new Error('Only Draft returns can be deleted');
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

    // Check previously returned quantities
    const prevReturns = await PurchaseReturn.findAll({
      where: {
        tenantId,
        status: 'Approved',
        [Sequelize.Op.or]: [
          ...(record.purchaseInvoiceId ? [{ purchaseInvoiceId: record.purchaseInvoiceId }] : []),
          ...(record.goodsReceiptId ? [{ goodsReceiptId: record.goodsReceiptId }] : [])
        ],
        id: { [Sequelize.Op.ne]: record.id }
      },
      include: [{ model: PurchaseReturnDetail, as: 'details', where: { itemId: detail.itemId } }],
      transaction: txn
    });

    let alreadyReturned = 0;
    prevReturns.forEach(ret => {
      if (ret.details) {
        ret.details.forEach(d => {
          alreadyReturned += parseFloat(d.quantity || 0);
        });
      }
    });

    const availableToReturn = receivedQty - alreadyReturned;
    if (parseFloat(detail.quantity || 0) > availableToReturn) {
      const itemName = detail.item ? (detail.item.name || detail.itemId) : detail.itemId;
      throw new Error(`Cannot return ${detail.quantity} of ${itemName}. Only ${availableToReturn} available for return.`);
    }
  }

  async createAccountingEntries(record, tenantId, userId, txn) {
    const items = [];
    const supplier = await Supplier.findOne({ where: { id: record.supplierId, tenantId }, transaction: txn });
    const apAccount = supplier ? supplier.apAccountId : null;

    // Resolve AP account dynamically from supplier or chart of accounts
    let apAccountId = apAccount;
    if (!apAccountId) {
      const apAcct = await Account.findOne({
        where: { tenantId, accountType: 'liability', name: { [Sequelize.Op.like]: '%Accounts Payable%' }, isActive: true },
        transaction: txn
      });
      apAccountId = apAcct ? apAcct.id : null;
    }
    if (!apAccountId) throw new Error('Accounts Payable account is not configured for this supplier. Please set an AP account in supplier settings.');

    const details = record.details || [];

    for (const detail of details) {
      const item = detail.item;
      const isProduct = item && (item.itemType === 'product' || item.type === 'Product');
      const subtotal = (parseFloat(detail.quantity) || 0) * (parseFloat(detail.unitCost) || 0);
      const discount = parseFloat(detail.discountAmount) || 0;
      const netAmount = subtotal - discount;
      const taxAmount = parseFloat(detail.taxAmount || 0);

      if (netAmount <= 0) continue;

      if (isProduct) {
        // CR Inventory account from item configuration
        const invAccountId = item.inventoryAccountId;
        if (invAccountId) {
          items.push({
            accountId: invAccountId,
            debit: 0,
            credit: parseFloat(netAmount.toFixed(2)),
            description: `Return: ${item.name || 'Item'} inventory credit`
          });
        }
      } else {
        // CR Expense account from item configuration
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

    if (items.length > 0) {
      // Use standard JournalEntryService.createEntry for consistency
      const JournalEntryService = require('./JournalEntryService');
      await JournalEntryService.createEntry({
        tenantId,
        entryDate: record.returnDate,
        reference: `PRET-${record.returnNumber}`,
        description: `Purchase Return ${record.returnNumber}`,
        lines: items,
      }, tenantId, userId, txn);
    }
  }
}

module.exports = new PurchaseReturnService();