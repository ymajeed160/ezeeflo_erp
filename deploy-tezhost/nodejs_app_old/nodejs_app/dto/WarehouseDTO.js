class WarehouseDTO {
  static toResponse(warehouse) {
    if (!warehouse) return null;

    const data = warehouse.toJSON ? warehouse.toJSON() : warehouse;

    return {
      id: data.id,
      tenantId: data.tenantId,
      code: data.code,
      name: data.name,
      description: data.description,
      location: data.location,
      managerName: data.managerName,
      contactNumber: data.contactNumber,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
    };
  }

  static toListResponse(warehouses) {
    if (!warehouses) return [];
    return warehouses.map(warehouse => WarehouseDTO.toResponse(warehouse));
  }

  static toCompactResponse(warehouse) {
    if (!warehouse) return null;

    const data = warehouse.toJSON ? warehouse.toJSON() : warehouse;

    return {
      id: data.id,
      code: data.code,
      name: data.name,
      location: data.location,
      isActive: data.isActive,
    };
  }

  static toCompactListResponse(warehouses) {
    if (!warehouses) return [];
    return warehouses.map(warehouse => WarehouseDTO.toCompactResponse(warehouse));
  }
}

module.exports = WarehouseDTO;