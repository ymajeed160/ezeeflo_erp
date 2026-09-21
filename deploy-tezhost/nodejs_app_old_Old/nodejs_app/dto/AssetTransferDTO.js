class AssetTransferDTO {
  static toResponse(t) {
    if (!t) return null;
    const d = t.toJSON ? t.toJSON() : t;
    return {
      id: d.id, tenantId: d.tenantId, transferNumber: d.transferNumber, transferDate: d.transferDate,
      assetId: d.assetId,
      asset: d.asset ? { id: d.asset.id, assetCode: d.asset.assetCode, assetName: d.asset.assetName, assetCode: d.asset.assetCode } : null,
      fromLocation: d.fromLocation, toLocation: d.toLocation,
      fromDepartment: d.fromDepartment, toDepartment: d.toDepartment,
      fromCustodian: d.fromCustodian, toCustodian: d.toCustodian,
      fromWarehouse: d.fromWarehouse, toWarehouse: d.toWarehouse,
      fromBranch: d.fromBranch, toBranch: d.toBranch,
      reason: d.reason, isCompleted: d.isCompleted,
      createdBy: d.createdBy, updatedBy: d.updatedBy, createdAt: d.createdAt, updatedAt: d.updatedAt,
    };
  }
  static toListResponse(items) { return items?.map((i) => AssetTransferDTO.toResponse(i)) || []; }
}

module.exports = AssetTransferDTO;
