class SupplierDTO {
  static toResponse(supplier) {
    if (!supplier) return null;
    const data = supplier.toJSON ? supplier.toJSON() : supplier;
    return {
      id: data.id,
      tenantId: data.tenantId,
      code: data.code,
      name: data.name,
      contactPerson: data.contactPerson,
      phone: data.phone,
      mobile: data.mobile,
      email: data.email,
      taxNumber: data.taxNumber,
      vatNumber: data.vatNumber,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postalCode,
      paymentTerms: data.paymentTerms,
      creditLimit: data.creditLimit,
      creditDays: data.creditDays,
      currency: data.currency,
      apAccountId: data.apAccountId,
      notes: data.notes,
      status: data.status,
      isActive: data.isActive,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      apAccount: data.apAccount
        ? { id: data.apAccount.id, code: data.apAccount.code, name: data.apAccount.name }
        : null,
      creator: data.creator
        ? { id: data.creator.id, username: data.creator.username, fullName: `${data.creator.firstName || ''} ${data.creator.lastName || ''}`.trim() }
        : null,
      updater: data.updater
        ? { id: data.updater.id, username: data.updater.username, fullName: `${data.updater.firstName || ''} ${data.updater.lastName || ''}`.trim() }
        : null,
    };
  }

  static toListResponse(suppliers) {
    if (!suppliers) return [];
    return suppliers.map((s) => SupplierDTO.toResponse(s));
  }

  static toCompactResponse(supplier) {
    if (!supplier) return null;
    const data = supplier.toJSON ? supplier.toJSON() : supplier;
    return {
      id: data.id,
      code: data.code,
      name: data.name,
      email: data.email,
      phone: data.phone,
      mobile: data.mobile,
      contactPerson: data.contactPerson,
      paymentTerms: data.paymentTerms,
      creditLimit: data.creditLimit,
      currency: data.currency,
      status: data.status,
      isActive: data.isActive,
    };
  }

  static toCompactListResponse(suppliers) {
    if (!suppliers) return [];
    return suppliers.map((s) => SupplierDTO.toCompactResponse(s));
  }
}

module.exports = SupplierDTO;