class BankAccountDTO {
  static toResponse(bankAccount) {
    if (!bankAccount) return null;
    const data = bankAccount.toJSON ? bankAccount.toJSON() : bankAccount;
    return {
      id: data.id,
      tenantId: data.tenantId,
      accountCode: data.accountCode,
      accountName: data.accountName,
      bankName: data.bankName,
      branchName: data.branchName,
      accountNumber: data.accountNumber,
      iban: data.iban,
      swiftCode: data.swiftCode,
      currencyCode: data.currencyCode,
      openingBalance: parseFloat(data.openingBalance || 0),
      openingBalanceDate: data.openingBalanceDate,
      chartOfAccountId: data.chartOfAccountId,
      chartOfAccount: data.chartOfAccount
        ? { id: data.chartOfAccount.id, code: data.chartOfAccount.code, name: data.chartOfAccount.name, type: data.chartOfAccount.type }
        : null,
      isDefault: data.isDefault,
      isActive: data.isActive,
      notes: data.notes,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  static toListResponse(bankAccounts) {
    return bankAccounts?.map((ba) => BankAccountDTO.toResponse(ba)) || [];
  }

  static toCompactResponse(bankAccount) {
    if (!bankAccount) return null;
    const data = bankAccount.toJSON ? bankAccount.toJSON() : bankAccount;
    return {
      id: data.id,
      accountCode: data.accountCode,
      accountName: data.accountName,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      chartOfAccountId: data.chartOfAccountId,
      currencyCode: data.currencyCode,
      isDefault: data.isDefault,
      isActive: data.isActive,
    };
  }

  static toCompactListResponse(bankAccounts) {
    return bankAccounts?.map((ba) => BankAccountDTO.toCompactResponse(ba)) || [];
  }
}

module.exports = BankAccountDTO;
