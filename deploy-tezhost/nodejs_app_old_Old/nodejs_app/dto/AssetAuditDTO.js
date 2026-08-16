class AssetAuditDTO {
  static toResponse(d) { if (!d) return null; const data = d.toJSON ? d.toJSON() : d; return { id: data.id, tenantId: data.tenantId, auditNumber: data.auditNumber, auditDate: data.auditDate, assetId: data.assetId, asset: data.asset ? { id: data.asset.id, assetCode: data.asset.assetCode, assetName: data.asset.assetName } : null, verifiedLocation: data.verifiedLocation, verifiedCondition: data.verifiedCondition, verifiedCustodian: data.verifiedCustodian, barcodeScanned: data.barcodeScanned, qrScanned: data.qrScanned, isVerified: data.isVerified, isMissing: data.isMissing, isFound: data.isFound, remarks: data.remarks, createdBy: data.createdBy, updatedBy: data.updatedBy, createdAt: data.createdAt, updatedAt: data.updatedAt }; }
  static toListResponse(items) { return items?.map((i) => AssetAuditDTO.toResponse(i)) || []; }
}
module.exports = AssetAuditDTO;
