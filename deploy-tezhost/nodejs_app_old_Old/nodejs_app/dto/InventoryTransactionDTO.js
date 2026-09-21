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
      warehouseId: data.warehouseId,
      transactionType: data.transactionType,
      referenceType: data.referenceType,
      quantityIn: data.quantityIn,
      quantityOut: data.quantityOut,
      runningBalance: data.runningBalance,
      unitCost: data.unitCost,
      transactionDate: data.transactionDate,
      item: data.item
        ? { id: data.item.id, itemCode: data.item.itemCode, name: data.item.name }
        : null,
      warehouse: data.warehouse
        ? { id: data.warehouse.id, code: data.warehouse.code, name: data.warehouse.name }
        : null,
    };
  }

  static toCompactListResponse(transactions) {
    if (!transactions) return [];
    return transactions.map(transaction => InventoryTransactionDTO.toCompactResponse(transaction));
  }
}

module.exports = InventoryTransactionDTO;