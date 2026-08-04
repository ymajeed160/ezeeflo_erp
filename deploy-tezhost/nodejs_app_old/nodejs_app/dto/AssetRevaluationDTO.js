class AssetRevaluationDTO {
  static toResponse(d) {
    if (!d) return null;
    const data = d.toJSON ? d.toJSON() : d;
    return {
      id: data.id, tenantId: data.tenantId, revaluationNumber: data.revaluationNumber,
      assetId: data.assetId,
      asset: data.asset ? { id: data.asset.id, assetCode: data.asset.assetCode, assetName: data.asset.assetName } : null,
      revaluationDate: data.revaluationDate, revaluationType: data.revaluationType,
      previousValue: parseFloat(data.previousValue || 0),
      revaluationAmount: parseFloat(data.revaluationAmount || 0),
      newValue: parseFloat(data.newValue || 0),
      reason: data.reason, isPosted: data.isPosted, journalEntryId: data.journalEntryId,
      createdBy: data.createdBy, updatedBy: data.updatedBy, createdAt: data.createdAt, updatedAt: data.updatedAt,
    };
  }
  static toListResponse(items) { return items?.map((i) => AssetRevaluationDTO.toResponse(i)) || []; }
}

module.exports = AssetRevaluationDTO;
