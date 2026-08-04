'use strict';

class PurchaseOrderDTO {
  static toDTO(entity, includeDetails = true) {
    if (!entity) return null;
    const dto = {
      id: entity.id,
      tenantId: entity.tenantId,
      orderNumber: entity.orderNumber,
      orderDate: entity.orderDate,
      expectedDeliveryDate: entity.expectedDeliveryDate,
      supplierId: entity.supplierId,
      warehouseId: entity.warehouseId || null,
      purchaseRequestId: entity.purchaseRequestId,
      status: entity.status,
      notes: entity.notes,
      totalAmount: entity.totalAmount ? parseFloat(entity.totalAmount) : 0,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      approvedBy: entity.approvedBy,
      approvedAt: entity.approvedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };

    if (includeDetails && entity.details) {
      dto.details = entity.details.map(d => this.detailToDTO(d));
    }

    if (entity.supplier) {
      dto.supplier = {
        id: entity.supplier.id,
        code: entity.supplier.code,
        name: entity.supplier.name,
      };
    }

    if (entity.warehouse) {
      dto.warehouse = {
        id: entity.warehouse.id,
        code: entity.warehouse.code,
        name: entity.warehouse.name,
      };
    }

    if (entity.purchaseRequest) {
      dto.purchaseRequest = {
        id: entity.purchaseRequest.id,
        requestNumber: entity.purchaseRequest.requestNumber,
      };
    }

    return dto;
  }

  static detailToDTO(detail) {
    if (!detail) return null;
    const dto = {
      id: detail.id,
      purchaseOrderId: detail.purchaseOrderId,
      itemId: detail.itemId,
      description: detail.description,
      quantity: detail.quantity ? parseFloat(detail.quantity) : 0,
      receivedQuantity: detail.receivedQuantity ? parseFloat(detail.receivedQuantity) : 0,
      unitPrice: detail.unitPrice ? parseFloat(detail.unitPrice) : 0,
      taxPercent: detail.taxPercent ? parseFloat(detail.taxPercent) : 0,
      discountPercent: detail.discountPercent ? parseFloat(detail.discountPercent) : 0,
      discountAmount: detail.discountAmount ? parseFloat(detail.discountAmount) : 0,
      taxAmount: detail.taxAmount ? parseFloat(detail.taxAmount) : 0,
      lineTotal: detail.lineTotal ? parseFloat(detail.lineTotal) : 0,
      sortOrder: detail.sortOrder || 0,
    };

    if (detail.item) {
      dto.item = {
        id: detail.item.id,
        itemCode: detail.item.itemCode,
        name: detail.item.name,
        itemType: detail.item.itemType,
        unitOfMeasure: detail.item.unitOfMeasure,
      };
    }

    return dto;
  }

  static toListDTO(list) {
    if (!list) return [];
    return list.map(entity => this.toDTO(entity));
  }
}

module.exports = PurchaseOrderDTO;