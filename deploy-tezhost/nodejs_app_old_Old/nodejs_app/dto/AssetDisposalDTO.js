class AssetDisposalDTO {
  static toResponse(d) {
    if (!d) return null;
    const data = d.toJSON ? d.toJSON() : d;
    return {
      id: data.id, tenantId: data.tenantId, disposalNumber: data.disposalNumber,
      assetId: data.assetId,
      asset: data.asset ? { id: data.asset.id, assetCode: data.asset.assetCode, assetName: data.asset.assetName } : null,
      disposalDate: data.disposalDate, disposalType: data.disposalType,
      saleAmount: parseFloat(data.saleAmount || 0),
      accumulatedDepreciation: parseFloat(data.accumulatedDepreciation || 0),
      netBookValue: parseFloat(data.netBookValue || 0),
      gainOnDisposal: parseFloat(data.gainOnDisposal || 0),
      lossOnDisposal: parseFloat(data.lossOnDisposal || 0),
      reference: data.reference, notes: data.notes,
      isPosted: data.isPosted, journalEntryId: data.journalEntryId,
      createdBy: data.createdBy, updatedBy: data.updatedBy, createdAt: data.createdAt, updatedAt: data.updatedAt,
    };
  }
  static toListResponse(items) { return items?.map((i) => AssetDisposalDTO.toResponse(i)) || []; }
}

module.exports = AssetDisposalDTO;
