const DebitNoteRepository = require('../repositories/DebitNoteRepository');
const DebitNoteDTO = require('../dto/DebitNoteDTO');
const { sequelize } = require('../models');

class DebitNoteService {
  async generateNumber(tenantId) {
    const last = await DebitNoteRepository.findLastNumber(tenantId);
    const year = new Date().getFullYear();
    let seq = 1;
    if (last && last.debitNoteNumber) {
      const parts = last.debitNoteNumber.split('-');
      if (parts.length === 3) {
        const lastYear = parseInt(parts[1]);
        const lastSeq = parseInt(parts[2]);
        if (lastYear === year) {
          seq = lastSeq + 1;
        }
      }
    }
    return `DBN-${year}-${String(seq).padStart(5, '0')}`;
  }

  async findAll(tenantId, options) {
    const result = await DebitNoteRepository.findAll(tenantId, options);
    return {
      ...result,
      rows: DebitNoteDTO.toDTOList(result.rows)
    };
  }

  async findById(tenantId, id) {
    const record = await DebitNoteRepository.findById(tenantId, id);
    if (!record) return null;
    return DebitNoteDTO.toDTO(record);
  }

  async create(tenantId, userId, data) {
    const number = await this.generateNumber(tenantId);
    const record = await DebitNoteRepository.create({
      tenantId,
      debitNoteNumber: number,
      debitNoteDate: data.debitNoteDate,
      supplierId: data.supplierId,
      purchaseReturnId: data.purchaseReturnId || null,
      referenceType: data.purchaseReturnId ? 'PurchaseReturn' : (data.referenceType || 'Manual'),
      amount: data.amount,
      notes: data.notes || null,
      status: 'draft',
      createdBy: userId
    });
    return DebitNoteDTO.toDTO(record);
  }

  async update(tenantId, id, data) {
    const record = await DebitNoteRepository.findById(tenantId, id);
    if (!record) throw new Error('Debit Note not found');
    if (record.status !== 'draft') throw new Error('Only Draft debit notes can be edited');

    const updateData = {};
    if (data.debitNoteDate) updateData.debitNoteDate = data.debitNoteDate;
    if (data.supplierId) updateData.supplierId = data.supplierId;
    if (data.purchaseReturnId !== undefined) updateData.purchaseReturnId = data.purchaseReturnId;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updated = await DebitNoteRepository.update(tenantId, id, updateData);
    return DebitNoteDTO.toDTO(updated);
  }

  async delete(tenantId, id) {
    const record = await DebitNoteRepository.findById(tenantId, id);
    if (!record) throw new Error('Debit Note not found');
    if (record.status !== 'draft') throw new Error('Only Draft debit notes can be deleted');
    return DebitNoteRepository.delete(tenantId, id);
  }

  async approve(tenantId, userId, id, accountData = {}) {
    const { sequelize } = require('../models');
    const JournalEntryService = require('./JournalEntryService');
    const { Supplier, Account } = require('../models');
    const { Op } = require('sequelize');

    const record = await DebitNoteRepository.findById(tenantId, id);
    if (!record) throw new Error('Debit Note not found');
    if (record.status !== 'draft') throw new Error('Only Draft debit notes can be approved');

    const t = await sequelize.transaction();
    try {
      // Get supplier + AP account (dialog selection > supplier default > COA fallback)
      const supplier = await Supplier.findOne({ where: { id: record.supplierId, tenantId }, transaction: t });
      let apAccountId = accountData.apAccountId || (supplier ? supplier.apAccountId : null);
      if (!apAccountId) {
        const apAcct = await Account.findOne({
          where: { tenantId, type: 'liability', name: { [Op.like]: '%Accounts Payable%' }, isActive: true },
          transaction: t
        });
        apAccountId = apAcct ? apAcct.id : null;
      }
      if (!apAccountId) {
        throw new Error('Accounts Payable account is required. Select one in the posting dialog.');
      }

      // Build journal lines: DR Accounts Payable, CR Inventory/Expense depending on reference type
      const journalLines = [];
      const totalAmount = parseFloat(record.amount || 0);

      if (record.referenceType === 'PurchaseReturn' && record.purchaseReturnId) {
        // For return-linked debit notes, get the return details for precise accounts
        const { PurchaseReturn, PurchaseReturnDetail, Item } = require('../models');
        const purchaseReturn = await PurchaseReturn.findOne({
          where: { id: record.purchaseReturnId, tenantId },
          include: [{ model: PurchaseReturnDetail, as: 'details', include: [{ model: Item, as: 'item' }] }],
          transaction: t
        });

        if (purchaseReturn && purchaseReturn.details) {
          for (const detail of purchaseReturn.details) {
            const item = detail.item;
            const lineTotal = (parseFloat(detail.quantity) || 0) * (parseFloat(detail.unitCost) || 0);
            const taxAmount = parseFloat(detail.taxAmount || 0);
            const netAmount = lineTotal - (parseFloat(detail.discountAmount) || 0);

            if (item && item.itemType === 'product') {
              // Credit Inventory account
              const invAccountId = accountData.inventoryAccountId || item.inventoryAccountId;
              if (invAccountId && netAmount > 0) {
                journalLines.push({
                  accountId: invAccountId,
                  debit: 0,
                  credit: parseFloat(netAmount.toFixed(2)),
                  description: `Debit Note #${record.debitNoteNumber} - ${item.name || 'Item'}`,
                });
              }
            } else {
              // Credit Expense account
              const expAccountId = accountData.expenseAccountId || (item ? (item.expenseAccountId || item.purchaseAccountId) : null);
              if (expAccountId && netAmount > 0) {
                journalLines.push({
                  accountId: expAccountId,
                  debit: 0,
                  credit: parseFloat(netAmount.toFixed(2)),
                  description: `Debit Note #${record.debitNoteNumber} - ${item ? (item.name || 'Service') : 'Service'}`,
                });
              }
            }

            // Credit VAT Input (reverse VAT)
            if (taxAmount > 0) {
              const vatAccountId = accountData.vatAccountId || (item ? (item.inputTaxAccountId || item.taxInputAccountId) : null);
              const vatAccount = vatAccountId
                ? await Account.findByPk(vatAccountId, { transaction: t })
                : await Account.findOne({
                    where: {
                      tenantId,
                      isActive: true,
                      [Op.or]: [
                        { name: { [Op.like]: '%VAT%' } },
                        { name: { [Op.like]: '%Input Tax%' } },
                        { name: { [Op.like]: '%Taxes Payable%' } },
                      ],
                    },
                    transaction: t
                  });
              if (vatAccount) {
                journalLines.push({
                  accountId: vatAccount.id,
                  debit: 0,
                  credit: parseFloat(taxAmount.toFixed(2)),
                  description: `VAT reversal on Debit Note #${record.debitNoteNumber}`,
                });
              }
            }
          }
        }
      } else {
        // Manual debit note - use selected expense account or default
        const defaultExpenseAccount = accountData.expenseAccountId
          ? await Account.findByPk(accountData.expenseAccountId, { transaction: t })
          : await Account.findOne({
              where: { tenantId, type: 'expense', isActive: true },
              order: [['createdAt', 'ASC']],
              transaction: t
            });
        if (defaultExpenseAccount && totalAmount > 0) {
          journalLines.push({
            accountId: defaultExpenseAccount.id,
            debit: 0,
            credit: parseFloat(totalAmount.toFixed(2)),
            description: `Debit Note #${record.debitNoteNumber}`,
          });
        }
      }

      // DR Accounts Payable (reduce what we owe the supplier)
      if (apAccountId && totalAmount > 0) {
        journalLines.push({
          accountId: apAccountId,
          debit: parseFloat(totalAmount.toFixed(2)),
          credit: 0,
          description: `Debit Note #${record.debitNoteNumber} - ${supplier ? (supplier.name || supplier.supplierName) : ''}`,
        });
      }

      // Validate that the credit side (Expense/Inventory) is present
      const totalCredit = journalLines.reduce((sum, l) => sum + (l.credit || 0), 0);
      if (totalAmount > 0 && totalCredit === 0) {
        throw new Error('Cannot post: an Expense/Inventory account is required for the credit side. Select one in the posting dialog.');
      }

      // Create journal entry if we have lines
      let journalEntryId = null;
      if (journalLines.length > 0) {
        const journalEntry = await JournalEntryService.createEntry({
          tenantId,
          entryDate: record.debitNoteDate || new Date().toISOString().split('T')[0],
          reference: record.debitNoteNumber,
          description: `Debit Note #${record.debitNoteNumber}${supplier ? ' - ' + (supplier.name || supplier.supplierName) : ''}`,
          lines: journalLines,
        }, tenantId, userId, t);
        journalEntryId = journalEntry.id;
      }

      const updated = await DebitNoteRepository.update(tenantId, id, {
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
        journalEntryId
      }, t);

      await t.commit();
      return DebitNoteDTO.toDTO(updated);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async generateFromPurchaseReturn(tenantId, userId, purchaseReturnId) {
    const { PurchaseReturn, PurchaseReturnDetail, Item, DebitNote } = require('../models');

    const pr = await PurchaseReturn.findOne({
      where: { id: purchaseReturnId, tenantId },
      include: [
        { model: PurchaseReturnDetail, as: 'details', include: [{ model: Item, as: 'item' }] }
      ]
    });

    if (!pr) throw new Error('Purchase Return not found');
    if (pr.status !== 'approved') throw new Error('Purchase Return must be Approved');

    // Check if debit note already exists for this return
    const allDns = await DebitNote.findAll({
      where: { tenantId, purchaseReturnId }
    });
    if (allDns.length > 0) {
      throw new Error('A debit note already exists for this purchase return');
    }

    // Calculate amount from return lines
    const totalAmount = pr.details.reduce((sum, d) => sum + (parseFloat(d.lineTotal) || 0), 0);

    const number = await this.generateNumber(tenantId);
    const record = await DebitNoteRepository.create({
      tenantId,
      debitNoteNumber: number,
      debitNoteDate: new Date().toISOString().split('T')[0],
      supplierId: pr.supplierId,
      purchaseReturnId,
      referenceType: 'PurchaseReturn',
      amount: parseFloat(totalAmount.toFixed(2)),
      notes: `Generated from Purchase Return ${pr.returnNumber}`,
      status: 'draft',
      createdBy: userId
    });

    return DebitNoteDTO.toDTO(record);
  }
}

module.exports = new DebitNoteService();