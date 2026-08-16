class StockAdjustmentDTO {
  static toResponse(adjustment) {
    if (!adjustment) return null;

    const data = adjustment.toJSON ? adjustment.toJSON() : adjustment;

    return {
      id: data.id,
      tenantId: data.tenantId,
      adjustmentNumber: data.adjustmentNumber,
      warehouseId: data.warehouseId,
      adjustmentDate: data.adjustmentDate,
      reason: data.reason,
      notes: data.notes,
      status: data.status,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      // Include populated relations
      warehouse: data.warehouse
        ? { id: data.warehouse.id, code: data.warehouse.code, name: data.warehouse.name }
        : null,
      creator: data.creator
        ? { id: data.creator.id, username: data.creator.username, fullName: `${data.creator.firstName || ''} ${data.creator.lastName || ''}`.trim() }
        : null,
      updater: data.updater
        ? { id: data.updater.id, username: data.updater.username, fullName: `${data.updater.firstName || ''} ${data.updater.lastName || ''}`.trim() }
        : null,
      // Include details if populated
      details: data.details ? StockAdjustmentDTO.toDetailListResponse(data.details) : [],
    };
  }

  static toListResponse(adjustments) {
    if (!adjustments) return [];
    return adjustments.map(adjustment => StockAdjustmentDTO.toResponse(adjustment));
  }

  static toCompactResponse(adjustment) {
    if (!adjustment) return null;

    const data = adjustment.toJSON ? adjustment.toJSON() : adjustment;

    return {
      id: data.id,
      adjustmentNumber: data.adjustmentNumber,
      adjustmentDate: data.adjustmentDate,
      reason: data.reason,
      status: data.status,
      warehouse: data.warehouse
        ? { id: data.warehouse.id, code: data.warehouse.code, name: data.warehouse.name }
        : null,
    };
  }

  static toCompactListResponse(adjustments) {
    if (!adjustments) return [];
    return adjustments.map(adjustment => StockAdjustmentDTO.toCompactResponse(adjustment));
  }

  static toDetailResponse(detail) {
    if (!detail) return null;

    const data = detail.toJSON ? detail.toJSON() : detail;

    return {
      id: data.id,
      stockAdjustmentId: data.stockAdjustmentId,
      itemId: data.itemId,
      currentQuantity: data.currentQuantity,
      adjustedQuantity: data.adjustedQuantity,
      differenceQuantity: data.differenceQuantity,
      unitCost: data.unitCost,
      item: data.item
        ? { id: data.item.id, itemCode: data.item.itemCode, name: data.item.name, unitOfMeasure: data.item.unitOfMeasure }
        : null,
    };
  }

  static toDetailListResponse(details) {
    if (!details) return [];
    return details.map(detail => StockAdjustmentDTO.toDetailResponse(detail));
  }
}

module.exports = StockAdjustmentDTO;