class AssetAcquisitionDTO {
  static toResponse(acq) {
    if (!acq) return null;
    const data = acq.toJSON ? acq.toJSON() : acq;
    return {
      id: data.id,
      tenantId: data.tenantId,
      acquisitionNumber: data.acquisitionNumber,
      acquisitionDate: data.acquisitionDate,
      acquisitionType: data.acquisitionType,
      sourceDocumentId: data.sourceDocumentId,
      sourceDocumentType: data.sourceDocumentType,
      supplierId: data.supplierId,
      supplier: data.supplier
        ? { id: data.supplier.id, code: data.supplier.code, name: data.supplier.name }
        : null,
      totalCost: parseFloat(data.totalCost || 0),
      description: data.description,
      notes: data.notes,
      isPosted: data.isPosted,
      journalEntryId: data.journalEntryId,
      lines: data.lines
        ? data.lines.map((line) => ({
            id: line.id,
            assetId: line.assetId,
            asset: line.asset
              ? { id: line.asset.id, assetCode: line.asset.assetCode, assetName: line.asset.assetName, status: line.asset.status }
              : null,
            assetName: line.assetName,
            categoryId: line.categoryId,
            category: line.category
              ? { id: line.category.id, categoryCode: line.category.categoryCode, categoryName: line.category.categoryName }
              : null,
            purchaseCost: parseFloat(line.purchaseCost || 0),
            residualValue: parseFloat(line.residualValue || 0),
            usefulLife: line.usefulLife,
            depreciationMethod: line.depreciationMethod,
            serialNumber: line.serialNumber,
            lineNumber: line.lineNumber,
          }))
        : [],
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  static toListResponse(acqs) {
    return acqs?.map((a) => AssetAcquisitionDTO.toResponse(a)) || [];
  }

  static toLineResponse(line) {
    if (!line) return null;
    const data = line.toJSON ? line.toJSON() : line;
    return {
      id: data.id,
      assetId: data.assetId,
      assetName: data.assetName,
      categoryId: data.categoryId,
      purchaseCost: parseFloat(data.purchaseCost || 0),
      residualValue: parseFloat(data.residualValue || 0),
      usefulLife: data.usefulLife,
      depreciationMethod: data.depreciationMethod,
      serialNumber: data.serialNumber,
      lineNumber: data.lineNumber,
    };
  }
}

module.exports = AssetAcquisitionDTO;
