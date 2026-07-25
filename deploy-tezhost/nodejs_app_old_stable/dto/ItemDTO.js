class ItemDTO {
  static toResponse(item) {
    if (!item) return null;

    const data = item.toJSON ? item.toJSON() : item;

    return {
      id: data.id,
      tenantId: data.tenantId,
      categoryId: data.categoryId,
      itemCode: data.itemCode,
      name: data.name,
      description: data.description,
      itemType: data.itemType,
      unitOfMeasure: data.unitOfMeasure,
      costPrice: data.costPrice,
      sellingPrice: data.sellingPrice,
      taxPercentage: data.taxPercentage,
      isInventoryTracked: data.isInventoryTracked,
      incomeAccountId: data.incomeAccountId,
      expenseAccountId: data.expenseAccountId,
      inventoryAccountId: data.inventoryAccountId,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      // Include populated relations if present
      category: data.category
        ? { id: data.category.id, name: data.category.name }
        : null,
      incomeAccount: data.incomeAccount
        ? { id: data.incomeAccount.id, name: data.incomeAccount.name, code: data.incomeAccount.code }
        : null,
      expenseAccount: data.expenseAccount
        ? { id: data.expenseAccount.id, name: data.expenseAccount.name, code: data.expenseAccount.code }
        : null,
      inventoryAccount: data.inventoryAccount
        ? { id: data.inventoryAccount.id, name: data.inventoryAccount.name, code: data.inventoryAccount.code }
        : null,
    };
  }

  static toListResponse(items) {
    if (!items) return [];
    return items.map(item => ItemDTO.toResponse(item));
  }

  /**
   * Returns a compact response for list views (fewer fields for performance)
   */
  static toCompactResponse(item) {
    if (!item) return null;

    const data = item.toJSON ? item.toJSON() : item;

    return {
      id: data.id,
      itemCode: data.itemCode,
      name: data.name,
      itemType: data.itemType,
      unitOfMeasure: data.unitOfMeasure,
      costPrice: data.costPrice,
      sellingPrice: data.sellingPrice,
      taxPercentage: data.taxPercentage,
      isInventoryTracked: data.isInventoryTracked,
      isActive: data.isActive,
      category: data.category
        ? { id: data.category.id, name: data.category.name }
        : null,
    };
  }

  static toCompactListResponse(items) {
    if (!items) return [];
    return items.map(item => ItemDTO.toCompactResponse(item));
  }
}

module.exports = ItemDTO;