class CustomerDTO {
  static toResponse(customer) {
    if (!customer) return null;

    const data = customer.toJSON ? customer.toJSON() : customer;

    return {
      id: data.id,
      tenantId: data.tenantId,
      code: data.code,
      name: data.name,
      legalName: data.legalName,
      group: data.group,
      type: data.type,
      email: data.email,
      phone: data.phone,
      mobile: data.mobile,
      website: data.website,
      taxNumber: data.taxNumber,
      vatNumber: data.vatNumber,
      registrationNumber: data.registrationNumber,
      currency: data.currency,
      paymentTerms: data.paymentTerms,
      creditLimit: data.creditLimit,
      creditDays: data.creditDays,
      arAccountId: data.arAccountId,
      billingAddress: data.billingAddress,
      shippingAddress: data.shippingAddress,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postalCode,
      contactPerson: data.contactPerson,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      notes: data.notes,
      status: data.status,
      isActive: data.isActive,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      // Populated relations
      arAccount: data.arAccount
        ? { id: data.arAccount.id, code: data.arAccount.code, name: data.arAccount.name }
        : null,
      creator: data.creator
        ? { id: data.creator.id, username: data.creator.username, fullName: `${data.creator.firstName || ''} ${data.creator.lastName || ''}`.trim() }
        : null,
      updater: data.updater
        ? { id: data.updater.id, username: data.updater.username, fullName: `${data.updater.firstName || ''} ${data.updater.lastName || ''}`.trim() }
        : null,
    };
  }

  static toListResponse(customers) {
    if (!customers) return [];
    return customers.map(c => CustomerDTO.toResponse(c));
  }

  static toCompactResponse(customer) {
    if (!customer) return null;

    const data = customer.toJSON ? customer.toJSON() : customer;

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
      status: data.status,
      isActive: data.isActive,
      group: data.group,
      type: data.type,
      currency: data.currency,
    };
  }

  static toCompactListResponse(customers) {
    if (!customers) return [];
    return customers.map(c => CustomerDTO.toCompactResponse(c));
  }
}

module.exports = CustomerDTO;