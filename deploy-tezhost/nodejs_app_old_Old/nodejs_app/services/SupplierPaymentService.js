const db = require('../models');
const SupplierPaymentRepository = require('../repositories/SupplierPaymentRepository');
const SupplierPaymentDTO = require('../dto/SupplierPaymentDTO');
const JournalEntryService = require('./JournalEntryService');
const AuditService = require('./AuditService');

class SupplierPaymentService {
  async findAll(tenantId, options) {
    const result = await SupplierPaymentRepository.findAll(tenantId, options);
    result.rows = SupplierPaymentDTO.toDTOList(result.rows);
    return result;
  }

  async findById(tenantId, id) {
    const record = await SupplierPaymentRepository.findById(tenantId, id);
    if (!record) throw new Error('Supplier Payment not found');
    return SupplierPaymentDTO.toDTO(record);
  }

  async create(tenantId, userId, data) {
    if (!data.paymentNumber) {
      data.paymentNumber = await SupplierPaymentRepository.getNextPaymentNumber(tenantId);
    }

    const existing = await SupplierPaymentRepository.findByNumber(tenantId, data.paymentNumber);
    if (existing) throw new Error('Payment number already exists');

    // Validate supplier exists
    const supplier = await db.Supplier.findOne({ where: { id: data.supplierId, tenant_id: tenantId } });
    if (!supplier) throw new Error('Supplier not found');

    // Validate allocations total matches amount
    if (data.allocations && data.allocations.length > 0) {
      const totalAllocated = data.allocations.reduce((sum, a) => sum + parseFloat(a.allocatedAmount || 0), 0);
      if (Math.abs(totalAllocated - parseFloat(data.amount)) > 0.01) {
        throw new Error('Allocated amounts must equal payment amount');
      }
    }

    data.status = 'draft';
    data.createdBy = userId;

    const record = await SupplierPaymentRepository.create(tenantId, data);
    await AuditService.log(tenantId, userId, 'supplier_payments', record.id, 'created', data);

    return await this.findById(tenantId, record.id);
  }

  async update(tenantId, id, data) {
    const existing = await SupplierPaymentRepository.findById(tenantId, id);
    if (!existing) throw new Error('Supplier Payment not found');

    if (existing.status === 'Approved') throw new Error('Cannot edit approved payment');

    const record = await SupplierPaymentRepository.update(tenantId, id, data);
    return await this.findById(tenantId, record.id);
  }

  async delete(tenantId, id) {
    const existing = await SupplierPaymentRepository.findById(tenantId, id);
    if (!existing) throw new Error('Supplier Payment not found');
    if (existing.status === 'Approved') throw new Error('Cannot delete approved payment');

    await SupplierPaymentRepository.delete(tenantId, id);
    return true;
  }

  async confirm(tenantId, userId, id) {
    const record = await SupplierPaymentRepository.findById(tenantId, id);
    if (!record) throw new Error('Supplier Payment not found');
    if (record.status !== 'draft') throw new Error('Only Draft payments can be confirmed');

    await SupplierPaymentRepository.update(tenantId, id, {
      status: 'confirmed',
      updatedBy: userId
    });

    await AuditService.log(tenantId, userId, 'supplier_payments', id, 'confirmed', { status: 'confirmed' });
    return await this.findById(tenantId, id);
  }

  async postToJournal(tenantId, userId, id) {
    const record = await SupplierPaymentRepository.findById(tenantId, id);
    if (!record) throw new Error('Supplier Payment not found');
    if (record.status !== 'confirmed') throw new Error('Only Confirmed payments can be posted to journal');

    // Get supplier for AP account
    const supplier = await db.Supplier.findOne({ where: { id: record.supplierId, tenantId } });
    if (!supplier) throw new Error('Supplier not found');

    // Get the Accounts Payable account from the supplier
    const accountsPayableAccountId = supplier.apAccountId;
    if (!accountsPayableAccountId) throw new Error('Supplier does not have an Accounts Payable account configured');

    // Get the cash/bank account from the payment's bankAccountId
    let cashAccountId = record.bankAccountId;
    if (!cashAccountId) {
      // Fallback: find first active asset account with 'Cash' or 'Bank' in name
      const fallbackAccount = await db.Account.findOne({
        where: {
          tenantId,
          type: 'asset',
          isActive: true,
          name: { [db.Sequelize.Op.like]: '%Cash%' }
        }
      });
      if (!fallbackAccount) throw new Error('Cash account not found. Please ensure Chart of Accounts has a cash account.');
      cashAccountId = fallbackAccount.id;
    }

    // Create Journal Entry: Accounts Payable DR, Cash/Bank CR
    const journalEntryData = {
      entryDate: record.paymentDate,
      reference: record.paymentNumber,
      description: `Supplier Payment: ${supplier.name} - ${record.paymentNumber}`,
      lines: [
        {
          accountId: accountsPayableAccountId,
          debit: parseFloat(record.amount),
          credit: 0,
          description: `Payment to ${supplier.name}`
        },
        {
          accountId: cashAccountId,
          debit: 0,
          credit: parseFloat(record.amount),
          description: `Payment via ${record.paymentMethod}`
        }
      ]
    };

    const journalEntry = await JournalEntryService.createEntry(journalEntryData, tenantId, userId);

    await SupplierPaymentRepository.update(tenantId, id, {
      status: 'Approved',
      journalEntryId: journalEntry.id,
      approvedBy: userId,
      approvedAt: new Date()
    });

    await AuditService.log(tenantId, userId, 'supplier_payments', id, 'approved', { status: 'Approved', journalEntryId: journalEntry.id });

    return await this.findById(tenantId, id);
  }
}

module.exports = new SupplierPaymentService();