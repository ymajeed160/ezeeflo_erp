class AccountDTO {
  static toResponse(account) {
    if (!account) return null;

    const data = account.toJSON ? account.toJSON() : account;

    return {
      id: data.id,
      tenantId: data.tenantId,
      name: data.name,
      code: data.code,
      type: data.type,
      description: data.description,
      parentAccountId: data.parentAccountId,
      isActive: data.isActive,
      openingBalance: data.openingBalance,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
    };
  }

  static toListResponse(accounts) {
    if (!accounts) return [];
    return accounts.map(account => AccountDTO.toResponse(account));
  }

  static toTreeResponse(accounts, parentId = null) {
    if (!accounts) return [];

    return accounts
      .filter(a => {
        const acc = a.toJSON ? a.toJSON() : a;
        return acc.parentAccountId === parentId;
      })
      .map(account => {
        const plain = account.toJSON ? account.toJSON() : account;
        const children = AccountDTO.toTreeResponse(accounts, plain.id);
        return {
          ...AccountDTO.toResponse(plain),
          children: children.length > 0 ? children : [],
        };
      });
  }
}

module.exports = AccountDTO;