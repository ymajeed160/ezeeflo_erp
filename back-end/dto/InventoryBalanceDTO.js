class InventoryBalanceDTO {
  static toResponse(balance) {
    if (!balance) return null;

    const data = balance.toJSON ? balance.toJSON() : balance;

    return {
      id: data.id,
      tenantId: data.tenantId,
      warehouseId: data.warehouseId,
      itemId: data.itemId,
      quantityOnHand: data.quantityOnHand,
      averageCost: data.averageCost,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      // Include populated relations
      warehouse: data.warehouse
        ? { id: data.warehouse.id, code: data.warehouse.code, name: data.warehouse.name }
        : null,
      item: data.item
        ? { id: data.item.id, itemCode: data.item.itemCode, name: data.item.name, itemType: data.item.itemType, unitOfMeasure: data.item.unitOfMeasure }
        : null,
    };
  }

  static toListResponse(balances) {
    if (!balances) return [];
    return balances.map(balance => InventoryBalanceDTO.toResponse(balance));
  }

  static toCompactResponse(balance) {
    if (!balance) return null;

    const data = balance.toJSON ? balance.toJSON() : balance;

    return {
      id: data.id,
      warehouseId: data.warehouseId,
      itemId: data.itemId,
      quantityOnHand: data.quantityOnHand,
      averageCost: data.averageCost,
      warehouse: data.warehouse
        ? { id: data.warehouse.id, code: data.warehouse.code, name: data.warehouse.name }
        : null,
      item: data.item
        ? { id: data.item.id, itemCode: data.item.itemCode, name: data.item.name }
        : null,
    };
  }

  static toCompactListResponse(balances) {
    if (!balances) return [];
    return balances.map(balance => InventoryBalanceDTO.toCompactResponse(balance));
  }

  static toValuationResponse(balance) {
    if (!balance) return null;

    const data = balance.toJSON ? balance.toJSON() : balance;
    const value = parseFloat(data.quantityOnHand || 0) * parseFloat(data.averageCost || 0);

    return {
      ...InventoryBalanceDTO.toResponse(data),
      totalValue: parseFloat(value.toFixed(2)),
    };
  }

  static toValuationListResponse(balances) {
    if (!balances) return [];
    return balances.map(balance => InventoryBalanceDTO.toValuationResponse(balance));
  }
}

module.exports = InventoryBalanceDTO;