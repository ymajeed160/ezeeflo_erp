class SupplierPaymentDTO {
  constructor(data) {
    this.id = data.id || null;
    this.tenantId = data.tenant_id || data.tenantId || null;
    this.paymentNumber = data.payment_number || data.paymentNumber || null;
    this.paymentDate = data.payment_date || data.paymentDate || null;
    this.supplierId = data.supplier_id || data.supplierId || null;
    this.paymentMethod = data.payment_method || data.paymentMethod || 'BankTransfer';
    this.amount = parseFloat(data.amount) || 0.00;
    this.referenceNumber = data.reference_number || data.referenceNumber || null;
    this.bankAccountId = data.bank_account_id || data.bankAccountId || null;
    this.bankAccount = data.bank_account || data.bankAccount || null;
    this.notes = data.notes || null;
    this.status = data.status || 'draft';
    this.journalEntryId = data.journal_entry_id || data.journalEntryId || null;
    this.createdBy = data.created_by || data.createdBy || null;
    this.approvedBy = data.approved_by || data.approvedBy || null;
    this.approvedAt = data.approved_at || data.approvedAt || null;
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;

    // Associated objects
    this.supplier = data.supplier || null;
    this.journalEntry = data.journalEntry || null;
    this.creator = data.creator || null;
    this.approver = data.approver || null;
    this.allocations = data.allocations ? data.allocations.map(a => a.toJSON ? a.toJSON() : a) : [];
  }

  toJSON() {
    return {
      id: this.id,
      tenantId: this.tenantId,
      paymentNumber: this.paymentNumber,
      paymentDate: this.paymentDate,
      supplierId: this.supplierId,
      paymentMethod: this.paymentMethod,
      amount: this.amount,
      referenceNumber: this.referenceNumber,
      bankAccountId: this.bankAccountId,
      bankAccount: this.bankAccount,
      notes: this.notes,
      status: this.status,
      journalEntryId: this.journalEntryId,
      createdBy: this.createdBy,
      approvedBy: this.approvedBy,
      approvedAt: this.approvedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      supplier: this.supplier,
      journalEntry: this.journalEntry,
      creator: this.creator,
      approver: this.approver,
      allocations: this.allocations
    };
  }

  static toDTO(dbRecord) {
    if (!dbRecord) return null;
    return new SupplierPaymentDTO(dbRecord.toJSON ? dbRecord.toJSON() : dbRecord);
  }

  static toDTOList(dbRecords) {
    if (!dbRecords) return [];
    return dbRecords.map(record => SupplierPaymentDTO.toDTO(record));
  }
}

module.exports = SupplierPaymentDTO;