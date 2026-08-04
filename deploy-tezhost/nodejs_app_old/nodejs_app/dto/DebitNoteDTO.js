class DebitNoteDTO {
  constructor(data) {
    this.id = data.id || null;
    this.tenantId = data.tenant_id || data.tenantId || null;
    this.debitNoteNumber = data.debit_note_number || data.debitNoteNumber || null;
    this.debitNoteDate = data.debit_note_date || data.debitNoteDate || null;
    this.supplierId = data.supplier_id || data.supplierId || null;
    this.purchaseReturnId = data.purchase_return_id || data.purchaseReturnId || null;
    this.referenceType = data.reference_type || data.referenceType || 'Manual';
    this.referenceId = data.reference_id || data.referenceId || null;
    this.amount = parseFloat(data.amount) || 0.00;
    this.notes = data.notes || null;
    this.status = data.status || 'Draft';
    this.journalEntryId = data.journal_entry_id || data.journalEntryId || null;
    this.createdBy = data.created_by || data.createdBy || null;
    this.approvedBy = data.approved_by || data.approvedBy || null;
    this.approvedAt = data.approved_at || data.approvedAt || null;
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;

    // Associated objects
    this.supplier = data.supplier || null;
    this.purchaseReturn = data.purchaseReturn || null;
    this.journalEntry = data.journalEntry || null;
    this.creator = data.creator || null;
    this.approver = data.approver || null;
  }

  toJSON() {
    return {
      id: this.id,
      tenantId: this.tenantId,
      debitNoteNumber: this.debitNoteNumber,
      debitNoteDate: this.debitNoteDate,
      supplierId: this.supplierId,
      purchaseReturnId: this.purchaseReturnId,
      referenceType: this.referenceType,
      referenceId: this.referenceId,
      amount: this.amount,
      notes: this.notes,
      status: this.status,
      journalEntryId: this.journalEntryId,
      createdBy: this.createdBy,
      approvedBy: this.approvedBy,
      approvedAt: this.approvedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      supplier: this.supplier,
      purchaseReturn: this.purchaseReturn,
      journalEntry: this.journalEntry,
      creator: this.creator,
      approver: this.approver
    };
  }

  static toDTO(dbRecord) {
    if (!dbRecord) return null;
    return new DebitNoteDTO(dbRecord.toJSON ? dbRecord.toJSON() : dbRecord);
  }

  static toDTOList(dbRecords) {
    if (!dbRecords) return [];
    return dbRecords.map(record => DebitNoteDTO.toDTO(record));
  }
}

module.exports = DebitNoteDTO;