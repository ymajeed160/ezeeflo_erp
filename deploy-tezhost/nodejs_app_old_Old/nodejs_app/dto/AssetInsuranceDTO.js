class AssetInsuranceDTO {
  static toResponse(d) { if (!d) return null; const data = d.toJSON ? d.toJSON() : d; return { id: data.id, tenantId: data.tenantId, insuranceNumber: data.insuranceNumber, assetId: data.assetId, asset: data.asset ? { id: data.asset.id, assetCode: data.asset.assetCode, assetName: data.asset.assetName } : null, insuranceCompany: data.insuranceCompany, policyNumber: data.policyNumber, premium: parseFloat(data.premium || 0), coverageAmount: parseFloat(data.coverageAmount || 0), startDate: data.startDate, expiryDate: data.expiryDate, renewalReminderDays: data.renewalReminderDays, notes: data.notes, status: data.status, createdBy: data.createdBy, updatedBy: data.updatedBy, createdAt: data.createdAt, updatedAt: data.updatedAt }; }
  static toListResponse(items) { return items?.map((i) => AssetInsuranceDTO.toResponse(i)) || []; }
}
module.exports = AssetInsuranceDTO;
