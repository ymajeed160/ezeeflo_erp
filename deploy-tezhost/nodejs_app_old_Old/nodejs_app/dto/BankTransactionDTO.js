class BankTransactionDTO {
  static toResponse(txn) {
    if (!txn) return null;
    const data = txn.toJSON ? txn.toJSON() : txn;
    return {
      id: data.id,
      tenantId: data.tenantId,
      bankAccountId: data.bankAccountId,
      bankAccount: data.bankAccount
        ? { id: data.bankAccount.id, accountCode: data.bankAccount.accountCode, accountName: data.bankAccount.accountName, accountNumber: data.bankAccount.accountNumber }
        : null,
      transactionNumber: data.transactionNumber,
      transactionDate: data.transactionDate,
      valueDate: data.valueDate,
      transactionType: data.transactionType,
      direction: data.direction,
      referenceNumber: data.referenceNumber,
      externalReference: data.externalReference,
      description: data.description,
      debitAmount: parseFloat(data.debitAmount || 0),
      creditAmount: parseFloat(data.creditAmount || 0),
      runningBalance: parseFloat(data.runningBalance || 0),
      status: data.status,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      offsetAccountId: data.offsetAccountId,
      offsetAccount: data.offsetAccount
        ? { id: data.offsetAccount.id, code: data.offsetAccount.code, name: data.offsetAccount.name }
        : null,
      isReconciled: data.isReconciled,
      reconciledAt: data.reconciledAt,
      reconciledBy: data.reconciledBy,
      journalEntryId: data.journalEntryId,
      journalEntry: data.journalEntry
        ? { id: data.journalEntry.id, entryNumber: data.journalEntry.entryNumber }
        : null,
      notes: data.notes,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  static toListResponse(transactions) {
    return transactions?.map((t) => BankTransactionDTO.toResponse(t)) || [];
  }

  static toCompactResponse(txn) {
    if (!txn) return null;
    const data = txn.toJSON ? txn.toJSON() : txn;
    return {
      id: data.id,
      transactionNumber: data.transactionNumber,
      transactionDate: data.transactionDate,
      transactionType: data.transactionType,
      direction: data.direction,
      debitAmount: parseFloat(data.debitAmount || 0),
      creditAmount: parseFloat(data.creditAmount || 0),
      runningBalance: parseFloat(data.runningBalance || 0),
      status: data.status,
      isReconciled: data.isReconciled,
    };
  }

  static toCompactListResponse(transactions) {
    return transactions?.map((t) => BankTransactionDTO.toCompactResponse(t)) || [];
  }
}

module.exports = BankTransactionDTO;
