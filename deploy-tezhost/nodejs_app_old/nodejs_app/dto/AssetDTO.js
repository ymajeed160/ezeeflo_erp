class AssetDTO {
  static toResponse(asset) {
    if (!asset) return null;
    const data = asset.toJSON ? asset.toJSON() : asset;
    return {
      id: data.id,
      tenantId: data.tenantId,
      assetCode: data.assetCode,
      assetName: data.assetName,
      categoryId: data.categoryId,
      category: data.category
        ? { id: data.category.id, categoryCode: data.category.categoryCode, categoryName: data.category.categoryName, depreciationMethod: data.category.depreciationMethod, usefulLifeYears: data.category.usefulLifeYears }
        : null,
      serialNumber: data.serialNumber,
      barcode: data.barcode,
      qrCode: data.qrCode,
      manufacturer: data.manufacturer,
      model: data.model,
      purchaseDate: data.purchaseDate,
      capitalizationDate: data.capitalizationDate,
      supplierId: data.supplierId,
      supplier: data.supplier
        ? { id: data.supplier.id, code: data.supplier.code, name: data.supplier.name }
        : null,
      purchaseInvoiceId: data.purchaseInvoiceId,
      purchaseInvoice: data.purchaseInvoice
        ? { id: data.purchaseInvoice.id, invoiceNumber: data.purchaseInvoice.invoiceNumber }
        : null,
      purchaseCost: parseFloat(data.purchaseCost || 0),
      residualValue: parseFloat(data.residualValue || 0),
      usefulLife: data.usefulLife,
      depreciationMethod: data.depreciationMethod,
      accumulatedDepreciation: parseFloat(data.accumulatedDepreciation || 0),
      currentBookValue: parseFloat(data.currentBookValue || 0),
      revaluationAmount: parseFloat(data.revaluationAmount || 0),
      impairmentAmount: parseFloat(data.impairmentAmount || 0),
      location: data.location,
      department: data.department,
      custodian: data.custodian,
      warrantyExpiry: data.warrantyExpiry,
      insurancePolicyNumber: data.insurancePolicyNumber,
      condition: data.condition,
      status: data.status,
      notes: data.notes,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  static toListResponse(assets) {
    return assets?.map((a) => AssetDTO.toResponse(a)) || [];
  }

  static toCompactResponse(asset) {
    if (!asset) return null;
    const data = asset.toJSON ? asset.toJSON() : asset;
    return {
      id: data.id,
      assetCode: data.assetCode,
      assetName: data.assetName,
      categoryId: data.categoryId,
      categoryName: data.category?.categoryName || null,
      purchaseCost: parseFloat(data.purchaseCost || 0),
      currentBookValue: parseFloat(data.currentBookValue || 0),
      status: data.status,
      condition: data.condition,
    };
  }

  static toCompactListResponse(assets) {
    return assets?.map((a) => AssetDTO.toCompactResponse(a)) || [];
  }
}

module.exports = AssetDTO;
