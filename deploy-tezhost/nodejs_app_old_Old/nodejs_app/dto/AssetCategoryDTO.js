class AssetCategoryDTO {
  static toResponse(category) {
    if (!category) return null;
    const data = category.toJSON ? category.toJSON() : category;
    return {
      id: data.id,
      tenantId: data.tenantId,
      categoryCode: data.categoryCode,
      categoryName: data.categoryName,
      usefulLifeYears: data.usefulLifeYears,
      depreciationMethod: data.depreciationMethod,
      defaultAssetAccountId: data.defaultAssetAccountId,
      defaultAssetAccount: data.defaultAssetAccount
        ? { id: data.defaultAssetAccount.id, code: data.defaultAssetAccount.code, name: data.defaultAssetAccount.name }
        : null,
      accumulatedDepreciationAccountId: data.accumulatedDepreciationAccountId,
      accumulatedDepreciationAccount: data.accumulatedDepreciationAccount
        ? { id: data.accumulatedDepreciationAccount.id, code: data.accumulatedDepreciationAccount.code, name: data.accumulatedDepreciationAccount.name }
        : null,
      depreciationExpenseAccountId: data.depreciationExpenseAccountId,
      depreciationExpenseAccount: data.depreciationExpenseAccount
        ? { id: data.depreciationExpenseAccount.id, code: data.depreciationExpenseAccount.code, name: data.depreciationExpenseAccount.name }
        : null,
      gainOnDisposalAccountId: data.gainOnDisposalAccountId,
      gainOnDisposalAccount: data.gainOnDisposalAccount
        ? { id: data.gainOnDisposalAccount.id, code: data.gainOnDisposalAccount.code, name: data.gainOnDisposalAccount.name }
        : null,
      lossOnDisposalAccountId: data.lossOnDisposalAccountId,
      lossOnDisposalAccount: data.lossOnDisposalAccount
        ? { id: data.lossOnDisposalAccount.id, code: data.lossOnDisposalAccount.code, name: data.lossOnDisposalAccount.name }
        : null,
      defaultTaxAccountId: data.defaultTaxAccountId,
      defaultTaxAccount: data.defaultTaxAccount
        ? { id: data.defaultTaxAccount.id, code: data.defaultTaxAccount.code, name: data.defaultTaxAccount.name }
        : null,
      residualValuePercentage: parseFloat(data.residualValuePercentage || 0),
      description: data.description,
      isActive: data.isActive,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  static toListResponse(categories) {
    return categories?.map((cat) => AssetCategoryDTO.toResponse(cat)) || [];
  }

  static toCompactResponse(category) {
    if (!category) return null;
    const data = category.toJSON ? category.toJSON() : category;
    return {
      id: data.id,
      categoryCode: data.categoryCode,
      categoryName: data.categoryName,
      usefulLifeYears: data.usefulLifeYears,
      depreciationMethod: data.depreciationMethod,
      residualValuePercentage: parseFloat(data.residualValuePercentage || 0),
      isActive: data.isActive,
    };
  }

  static toCompactListResponse(categories) {
    return categories?.map((cat) => AssetCategoryDTO.toCompactResponse(cat)) || [];
  }
}

module.exports = AssetCategoryDTO;
