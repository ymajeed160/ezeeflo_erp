class BankReconciliationDTO {
  static toResponse(rec) {
    if (!rec) return null;
    const d = rec.toJSON ? rec.toJSON() : rec;
    return {
      id: d.id, tenantId: d.tenantId, reconciliationNumber: d.reconciliationNumber,
      bankAccountId: d.bankAccountId,
      bankAccount: d.bankAccount ? { id: d.bankAccount.id, accountCode: d.bankAccount.accountCode, accountName: d.bankAccount.accountName, accountNumber: d.bankAccount.accountNumber, currencyCode: d.bankAccount.currencyCode } : null,
      statementDateFrom: d.statementDateFrom, statementDateTo: d.statementDateTo,
      statementOpeningBalance: parseFloat(d.statementOpeningBalance || 0),
      statementClosingBalance: parseFloat(d.statementClosingBalance || 0),
      systemClosingBalance: parseFloat(d.systemClosingBalance || 0),
      differenceAmount: parseFloat(d.differenceAmount || 0),
      status: d.status, reconciledAt: d.reconciledAt, reconciledBy: d.reconciledBy, notes: d.notes,
      lines: d.lines ? d.lines.map((l) => ({
        id: l.id, bankTransactionId: l.bankTransactionId,
        statementTransactionDate: l.statementTransactionDate, statementReference: l.statementReference,
        statementDescription: l.statementDescription,
        statementDebitAmount: parseFloat(l.statementDebitAmount || 0),
        statementCreditAmount: parseFloat(l.statementCreditAmount || 0),
        matchStatus: l.matchStatus, matchType: l.matchType, notes: l.notes,
        bankTransaction: l.bankTransaction ? {
          id: l.bankTransaction.id, transactionNumber: l.bankTransaction.transactionNumber,
          transactionDate: l.bankTransaction.transactionDate, transactionType: l.bankTransaction.transactionType,
          direction: l.bankTransaction.direction, debitAmount: parseFloat(l.bankTransaction.debitAmount || 0),
          creditAmount: parseFloat(l.bankTransaction.creditAmount || 0), description: l.bankTransaction.description,
        } : null,
      })) : [],
      createdBy: d.createdBy, updatedBy: d.updatedBy, createdAt: d.createdAt, updatedAt: d.updatedAt,
    };
  }
  static toListResponse(recs) { return recs?.map((r) => BankReconciliationDTO.toResponse(r)) || []; }
}
module.exports = BankReconciliationDTO;
