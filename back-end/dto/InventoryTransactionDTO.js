class InventoryTransactionDTO {
  static toResponse(transaction) {
    if (!transaction) return null;

    const data = transaction.toJSON ? transaction.toJSON() : transaction;

    return {
      id: data.id,
      tenantId: data.tenantId,
      itemId: data.itemId,
      warehouseId: data.warehouseId,
      transactionType: data.transactionType,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      quantityIn: data.quantityIn,
      quantityOut: data.quantityOut,
      runningBalance: data.runningBalance,
      unitCost: data.unitCost,
      transactionDate: data.transactionDate,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      // Include populated relations
      item: data.item
        ? { id: data.item.id, itemCode: data.item.itemCode, name: data.item.name, itemType: data.item.itemType, unitOfMeasure: data.item.unitOfMeasure }
        : null,
      warehouse: data.warehouse
        ? { id: data.warehouse.id, code: data.warehouse.code, name: data.warehouse.name }
        : null,
    };
  }

  static toListResponse(transactions) {
    if (!transactions) return [];
    return transactions.map(transaction => InventoryTransactionDTO.toResponse(transaction));
  }

  static toCompactResponse(transaction) {
    if (!transaction) return null;

    const data = transaction.toJSON ? transaction.toJSON() : transaction;

    return {
      id: data.id,
      itemId: data.itemId,
      variantId: data.variantId,
      warehouseId: data.warehouseId,
      transactionType: data.transactionType,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      quantityIn: data.quantityIn,
      quantityOut: data.quantityOut,
      runningBalance: data.runningBalance,
      unitCost: data.unitCost,
      transactionDate: data.transactionDate,
      item: data.item
        ? { id: data.item.id, itemCode: data.item.itemCode, name: data.item.name }
        : null,
      variant: InventoryTransactionDTO.toVariantResponse(data.variant),
      warehouse: data.warehouse
        ? { id: data.warehouse.id, code: data.warehouse.code, name: data.warehouse.name }
        : null,
    };
  }

  static toVariantResponse(variant) {
    if (!variant) return null;

    const data = variant.toJSON ? variant.toJSON() : variant;
    const attributeValues = Array.isArray(data.attributeValues) ? data.attributeValues : [];

    const attributes = attributeValues
      .map((av) => ({
        name: av.attribute ? av.attribute.name : null,
        code: av.attribute ? av.attribute.code : null,
        value: av.displayValue || av.value || (av.option ? av.option.value : null),
        displayOrder: av.attribute ? av.attribute.displayOrder || 0 : 0,
      }))
      .filter((a) => a.name && a.value !== null && a.value !== '')
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(({ name, code, value }) => ({ name, code, value }));

    return { id: data.id, sku: data.sku, attributes };
  }

  static toCompactListResponse(transactions) {
    if (!transactions) return [];
    return transactions.map(transaction => InventoryTransactionDTO.toCompactResponse(transaction));
  }
}

module.exports = InventoryTransactionDTO;