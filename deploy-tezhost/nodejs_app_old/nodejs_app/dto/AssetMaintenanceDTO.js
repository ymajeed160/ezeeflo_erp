class AssetMaintenanceDTO {
  static toResponse(d) {
    if (!d) return null;
    const data = d.toJSON ? d.toJSON() : d;
    return {
      id: data.id, tenantId: data.tenantId, maintenanceNumber: data.maintenanceNumber,
      assetId: data.assetId,
      asset: data.asset ? { id: data.asset.id, assetCode: data.asset.assetCode, assetName: data.asset.assetName } : null,
      maintenanceType: data.maintenanceType, title: data.title, description: data.description,
      serviceProvider: data.serviceProvider, maintenanceDate: data.maintenanceDate, nextDueDate: data.nextDueDate,
      cost: parseFloat(data.cost || 0), status: data.status, notes: data.notes,
      createdBy: data.createdBy, updatedBy: data.updatedBy, createdAt: data.createdAt, updatedAt: data.updatedAt,
    };
  }
  static toListResponse(items) { return items?.map((i) => AssetMaintenanceDTO.toResponse(i)) || []; }
}

module.exports = AssetMaintenanceDTO;
