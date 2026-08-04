const DebitNoteRepository = require('../repositories/DebitNoteRepository');
const DebitNoteDTO = require('../dto/DebitNoteDTO');
const { sequelize } = require('../models');

class DebitNoteService {
  async generateNumber(tenantId) {
    const last = await DebitNoteRepository.findLastNumber(tenantId);
    const year = new Date().getFullYear();
    let seq = 1;
    if (last && last.debit_note_number) {
      const parts = last.debit_note_number.split('-');
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
      tenant_id: tenantId,
      debit_note_number: number,
      debit_note_date: data.debitNoteDate,
      supplier_id: data.supplierId,
      purchase_return_id: data.purchaseReturnId || null,
      reference_type: data.referenceType || 'Manual',
      reference_id: data.referenceId || null,
      amount: data.amount,
      notes: data.notes || null,
      status: 'Draft',
      created_by: userId
    });
    return DebitNoteDTO.toDTO(record);
  }

  async update(tenantId, id, data) {
    const record = await DebitNoteRepository.findById(tenantId, id);
    if (!record) throw new Error('Debit Note not found');
    if (record.status !== 'Draft') throw new Error('Only Draft debit notes can be edited');

    const updateData = {};
    if (data.debitNoteDate) updateData.debit_note_date = data.debitNoteDate;
    if (data.supplierId) updateData.supplier_id = data.supplierId;
    if (data.purchaseReturnId !== undefined) updateData.purchase_return_id = data.purchaseReturnId;
    if (data.referenceType) updateData.reference_type = data.referenceType;
    if (data.referenceId !== undefined) updateData.reference_id = data.referenceId;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updated = await DebitNoteRepository.update(tenantId, id, updateData);
    return DebitNoteDTO.toDTO(updated);
  }

  async delete(tenantId, id) {
    const record = await DebitNoteRepository.findById(tenantId, id);
    if (!record) throw new Error('Debit Note not found');
    if (record.status !== 'Draft') throw new Error('Only Draft debit notes can be deleted');
    return DebitNoteRepository.delete(tenantId, id);
  }

  async approve(tenantId, userId, id) {
    const { sequelize } = require('../models');
    const JournalEntryService = require('./JournalEntryService');
    const { Supplier, Account } = require('../models');
    const { Op } = require('sequelize');

    const record = await DebitNoteRepository.findById(tenantId, id);
    if (!record) throw new Error('Debit Note not found');
    if (record.status !== 'Draft') throw new Error('Only Draft debit notes can be approved');

    const t = await sequelize.transaction();
    try {
      // Get supplier AP account
      const supplier = await Supplier.findOne({ where: { id: record.supplier_id, tenantId }, transaction: t });
      const apAccountId = supplier ? supplier.apAccountId : null;

      // Build journal lines: DR Accounts Payable, CR Inventory/Expense depending on reference type
      const journalLines = [];
      const totalAmount = parseFloat(record.amount || 0);

      if (record.reference_type === 'PurchaseReturn' && record.purchase_return_id) {
        // For return-linked debit notes, get the return details for precise accounts
        const { PurchaseReturn, PurchaseReturnDetail, Item } = require('../models');
        const purchaseReturn = await PurchaseReturn.findOne({
          where: { id: record.purchase_return_id, tenantId },
          include: [{ model: PurchaseReturnDetail, as: 'details', include: [{ model: Item }] }],
          transaction: t
        });

        if (purchaseReturn && purchaseReturn.details) {
          for (const detail of purchaseReturn.details) {
            const item = detail.item;
            const lineTotal = (parseFloat(detail.quantity) || 0) * (parseFloat(detail.unitCost) || 0);
            const taxAmount = parseFloat(detail.taxAmount || 0);
            const netAmount = lineTotal - (parseFloat(detail.discountAmount) || 0);

            if (item && (item.itemType === 'product' || item.type === 'Product')) {
              // Credit Inventory account
              const invAccountId = item.inventoryAccountId;
              if (invAccountId && netAmount > 0) {
                journalLines.push({
                  accountId: invAccountId,
                  debit: 0,
                  credit: parseFloat(netAmount.toFixed(2)),
                  description: `Debit Note #${record.debit_note_number} - ${item.name || 'Item'}`,
                });
              }
            } else {
              // Credit Expense account
              const expAccountId = item ? (item.expenseAccountId || item.purchaseAccountId) : null;
              if (expAccountId && netAmount > 0) {
                journalLines.push({
                  accountId: expAccountId,
                  debit: 0,
                  credit: parseFloat(netAmount.toFixed(2)),
                  description: `Debit Note #${record.debit_note_number} - ${item ? (item.name || 'Service') : 'Service'}`,
                });
              }
            }

            // Credit VAT Input (reverse VAT)
            if (taxAmount > 0) {
              const vatAccountId = item ? (item.inputTaxAccountId || item.taxInputAccountId) : null;
              const vatAccount = vatAccountId
                ? await Account.findByPk(vatAccountId, { transaction: t })
                : await Account.findOne({
                    where: { tenantId, name: { [Op.like]: '%VAT Input%' }, type: 'asset' },
                    transaction: t
                  });
              if (vatAccount) {
                journalLines.push({
                  accountId: vatAccount.id,
                  debit: 0,
                  credit: parseFloat(taxAmount.toFixed(2)),
                  description: `VAT reversal on Debit Note #${record.debit_note_number}`,
                });
              }
            }
          }
        }
      } else {
        // Manual debit note - use default expense account
        const defaultExpenseAccount = await Account.findOne({
          where: { tenantId, accountType: 'expense', isActive: true },
          order: [['createdAt', 'ASC']],
          transaction: t
        });
        if (defaultExpenseAccount && totalAmount > 0) {
          journalLines.push({
            accountId: defaultExpenseAccount.id,
            debit: 0,
            credit: parseFloat(totalAmount.toFixed(2)),
            description: `Debit Note #${record.debit_note_number}`,
          });
        }
      }

      // DR Accounts Payable (reduce what we owe the supplier)
      if (apAccountId && totalAmount > 0) {
        journalLines.push({
          accountId: apAccountId,
          debit: parseFloat(totalAmount.toFixed(2)),
          credit: 0,
          description: `Debit Note #${record.debit_note_number} - ${supplier ? (supplier.name || supplier.supplierName) : ''}`,
        });
      }

      // Create journal entry if we have lines
      let journalEntryId = null;
      if (journalLines.length > 0) {
        const journalEntry = await JournalEntryService.createEntry({
          tenantId,
          entryDate: record.debit_note_date || new Date().toISOString().split('T')[0],
          reference: `DBN-${record.debit_note_number}`,
          description: `Debit Note #${record.debit_note_number}${supplier ? ' - ' + (supplier.name || supplier.supplierName) : ''}`,
          lines: journalLines,
        }, tenantId, userId, t);
        journalEntryId = journalEntry.id;
      }

      const updated = await DebitNoteRepository.update(tenantId, id, {
        status: 'Approved',
        approved_by: userId,
        approved_at: new Date(),
        journalEntryId: journalEntryId
      }, t);

      await t.commit();
      return DebitNoteDTO.toDTO(updated);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async generateFromPurchaseReturn(tenantId, userId, purchaseReturnId) {
    const { PurchaseReturn, PurchaseReturnDetail, Item } = require('../models');

    const pr = await PurchaseReturn.findOne({
      where: { id: purchaseReturnId, tenant_id: tenantId },
      include: [
        { model: PurchaseReturnDetail, as: 'details', include: [{ model: Item, as: 'item' }] }
      ]
    });

    if (!pr) throw new Error('Purchase Return not found');
    if (pr.status !== 'Approved') throw new Error('Purchase Return must be Approved');

    // Check if debit note already exists for this return
    const existing = await DebitNoteRepository.findByNumber(tenantId, null);
    const allDns = await require('../models').DebitNote.findAll({
      where: { tenant_id: tenantId, purchase_return_id: purchaseReturnId }
    });
    if (allDns.length > 0) {
      throw new Error('A debit note already exists for this purchase return');
    }

    // Calculate amount from return
    const totalAmount = pr.details.reduce((sum, d) => {
      return sum + (parseFloat(d.return_quantity) * parseFloat(d.unit_price));
    }, 0);

    const number = await this.generateNumber(tenantId);
    const record = await DebitNoteRepository.create({
      tenant_id: tenantId,
      debit_note_number: number,
      debit_note_date: new Date(),
      supplier_id: pr.supplier_id,
      purchase_return_id: purchaseReturnId,
      reference_type: 'PurchaseReturn',
      reference_id: purchaseReturnId,
      amount: totalAmount,
      notes: `Generated from Purchase Return ${pr.return_number}`,
      status: 'Draft',
      created_by: userId
    });

    return DebitNoteDTO.toDTO(record);
  }
}

module.exports = new DebitNoteService();