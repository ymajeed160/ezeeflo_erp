class AssetCustodianDTO {
  static toResponse(d) { if (!d) return null; const data = d.toJSON ? d.toJSON() : d; return { id: data.id, tenantId: data.tenantId, custodianCode: data.custodianCode, custodianName: data.custodianName, custodianType: data.custodianType, email: data.email, phone: data.phone, department: data.department, isActive: data.isActive, createdBy: data.createdBy, updatedBy: data.updatedBy, createdAt: data.createdAt, updatedAt: data.updatedAt }; }
  static toListResponse(items) { return items?.map((i) => AssetCustodianDTO.toResponse(i)) || []; }
  static toCompactResponse(d) { if (!d) return null; const data = d.toJSON ? d.toJSON() : d; return { id: data.id, custodianCode: data.custodianCode, custodianName: data.custodianName, custodianType: data.custodianType }; }
  static toCompactListResponse(items) { return items?.map((i) => AssetCustodianDTO.toCompactResponse(i)) || []; }
}
module.exports = AssetCustodianDTO;
