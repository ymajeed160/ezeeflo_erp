class PurchaseRequestDTO {
  constructor(data) {
    this.id = data.id;
    this.tenantId = data.tenantId;
    this.requestNumber = data.requestNumber;
    this.requestDate = data.requestDate;
    this.requestedBy = data.requestedBy;
    this.department = data.department;
    this.notes = data.notes;
    this.status = data.status;
    this.createdBy = data.createdBy;
    this.updatedBy = data.updatedBy;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;

    this.requestor = data.requestor ? {
      id: data.requestor.id,
      username: data.requestor.username,
      firstName: data.requestor.firstName,
      lastName: data.requestor.lastName,
    } : null;

    this.creator = data.creator ? {
      id: data.creator.id,
      username: data.creator.username,
      firstName: data.creator.firstName,
      lastName: data.creator.lastName,
    } : null;

    this.details = data.details ? data.details.map(d => new PurchaseRequestDetailDTO(d)) : [];
  }

  static toList(rows) {
    return rows.map(r => new PurchaseRequestDTO(r));
  }

  static toDetail(data) {
    return new PurchaseRequestDTO(data);
  }
}

class PurchaseRequestDetailDTO {
  constructor(data) {
    this.id = data.id;
    this.tenantId = data.tenantId;
    this.purchaseRequestId = data.purchaseRequestId;
    this.itemId = data.itemId;
    this.description = data.description;
    this.quantity = data.quantity;
    this.requiredDate = data.requiredDate;
    this.sortOrder = data.sortOrder;

    this.item = data.item ? {
      id: data.item.id,
      code: data.item.itemCode,
      name: data.item.name,
      unitOfMeasure: data.item.unitOfMeasure,
      type: data.item.itemType,
      trackInventory: data.item.isInventoryTracked,
    } : null;
  }
}

module.exports = { PurchaseRequestDTO, PurchaseRequestDetailDTO };