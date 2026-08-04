class StockTransferDTO {
  static toResponse(transfer) {
    if (!transfer) return null;

    const data = transfer.toJSON ? transfer.toJSON() : transfer;

    return {
      id: data.id,
      tenantId: data.tenantId,
      transferNumber: data.transferNumber,
      fromWarehouseId: data.fromWarehouseId,
      toWarehouseId: data.toWarehouseId,
      transferDate: data.transferDate,
      status: data.status,
      notes: data.notes,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      // Include populated relations
      fromWarehouse: data.fromWarehouse
        ? { id: data.fromWarehouse.id, code: data.fromWarehouse.code, name: data.fromWarehouse.name }
        : null,
      toWarehouse: data.toWarehouse
        ? { id: data.toWarehouse.id, code: data.toWarehouse.code, name: data.toWarehouse.name }
        : null,
      creator: data.creator
        ? { id: data.creator.id, username: data.creator.username, fullName: `${data.creator.firstName || ''} ${data.creator.lastName || ''}`.trim() }
        : null,
      updater: data.updater
        ? { id: data.updater.id, username: data.updater.username, fullName: `${data.updater.firstName || ''} ${data.updater.lastName || ''}`.trim() }
        : null,
      // Include details if populated
      details: data.details ? StockTransferDTO.toDetailListResponse(data.details) : [],
    };
  }

  static toListResponse(transfers) {
    if (!transfers) return [];
    return transfers.map(transfer => StockTransferDTO.toResponse(transfer));
  }

  static toCompactResponse(transfer) {
    if (!transfer) return null;

    const data = transfer.toJSON ? transfer.toJSON() : transfer;

    return {
      id: data.id,
      transferNumber: data.transferNumber,
      transferDate: data.transferDate,
      status: data.status,
      fromWarehouse: data.fromWarehouse
        ? { id: data.fromWarehouse.id, code: data.fromWarehouse.code, name: data.fromWarehouse.name }
        : null,
      toWarehouse: data.toWarehouse
        ? { id: data.toWarehouse.id, code: data.toWarehouse.code, name: data.toWarehouse.name }
        : null,
    };
  }

  static toCompactListResponse(transfers) {
    if (!transfers) return [];
    return transfers.map(transfer => StockTransferDTO.toCompactResponse(transfer));
  }

  static toDetailResponse(detail) {
    if (!detail) return null;

    const data = detail.toJSON ? detail.toJSON() : detail;

    return {
      id: data.id,
      stockTransferId: data.stockTransferId,
      itemId: data.itemId,
      quantity: data.quantity,
      unitCost: data.unitCost,
      item: data.item
        ? { id: data.item.id, itemCode: data.item.itemCode, name: data.item.name, unitOfMeasure: data.item.unitOfMeasure }
        : null,
    };
  }

  static toDetailListResponse(details) {
    if (!details) return [];
    return details.map(detail => StockTransferDTO.toDetailResponse(detail));
  }
}

module.exports = StockTransferDTO;