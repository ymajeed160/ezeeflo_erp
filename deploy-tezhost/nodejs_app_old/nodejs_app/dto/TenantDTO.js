class TenantDTO {
  static toResponse(tenant) {
    if (!tenant) return null;

    const data = tenant.toJSON ? tenant.toJSON() : tenant;

    return {
      id: data.id,
      name: data.name,
      subdomain: data.subdomain,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postalCode,
      logo: data.logo,
      isActive: data.isActive,
      subscriptionPlan: data.subscriptionPlan,
      subscriptionExpiry: data.subscriptionExpiry,
      maxUsers: data.maxUsers,
      timezone: data.timezone,
      currencyCode: data.currencyCode,
      dateFormat: data.dateFormat,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}

module.exports = TenantDTO;