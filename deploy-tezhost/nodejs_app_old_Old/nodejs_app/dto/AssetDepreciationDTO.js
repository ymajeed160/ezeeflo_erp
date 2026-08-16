class AssetDepreciationDTO {
  static toResponse(d) {
    if (!d) return null;
    const data = d.toJSON ? d.toJSON() : d;
    return {
      id: data.id, tenantId: data.tenantId, depreciationNumber: data.depreciationNumber,
      assetId: data.assetId,
      asset: data.asset ? { id: data.asset.id, assetCode: data.asset.assetCode, assetName: data.asset.assetName } : null,
      depreciationDate: data.depreciationDate, periodStart: data.periodStart, periodEnd: data.periodEnd,
      frequency: data.frequency, depreciationMethod: data.depreciationMethod,
      assetCost: parseFloat(data.assetCost || 0), residualValue: parseFloat(data.residualValue || 0),
      usefulLife: data.usefulLife,
      accumulatedDepreciationBefore: parseFloat(data.accumulatedDepreciationBefore || 0),
      depreciationAmount: parseFloat(data.depreciationAmount || 0),
      accumulatedDepreciationAfter: parseFloat(data.accumulatedDepreciationAfter || 0),
      bookValueAfter: parseFloat(data.bookValueAfter || 0),
      unitsProduced: data.unitsProduced ? parseFloat(data.unitsProduced) : null,
      totalEstimatedUnits: data.totalEstimatedUnits ? parseFloat(data.totalEstimatedUnits) : null,
      isPosted: data.isPosted, journalEntryId: data.journalEntryId, notes: data.notes,
      createdBy: data.createdBy, updatedBy: data.updatedBy, createdAt: data.createdAt, updatedAt: data.updatedAt,
    };
  }
  static toListResponse(items) { return items?.map((i) => AssetDepreciationDTO.toResponse(i)) || []; }
  static toPreviewResponse(calc) {
    return {
      assetId: calc.assetId,
      assetCode: calc.assetCode,
      assetName: calc.assetName,
      assetCost: calc.assetCost,
      residualValue: calc.residualValue,
      usefulLife: calc.usefulLife,
      accumulatedDepreciation: calc.accumulatedDepreciation,
      currentBookValue: calc.currentBookValue,
      depreciationMethod: calc.depreciationMethod,
      frequency: calc.frequency,
      monthlyAmount: calc.monthlyAmount,
      quarterlyAmount: calc.quarterlyAmount,
      yearlyAmount: calc.yearlyAmount,
      remainingLifeMonths: calc.remainingLifeMonths,
      schedule: calc.schedule || [],
    };
  }
}

module.exports = AssetDepreciationDTO;
