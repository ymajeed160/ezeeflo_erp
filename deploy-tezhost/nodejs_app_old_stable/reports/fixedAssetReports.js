const { Asset, AssetCategory, AssetDepreciation, AssetTransfer, AssetDisposal, AssetRevaluation, AssetMaintenance, AssetInsurance, AssetAudit, sequelize } = require('../models');
const { Op } = require('sequelize');

class FixedAssetReports {
  async assetRegister(tenantId, filters = {}) {
    const where = { tenantId };
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.assetId) where.id = filters.assetId;
    if (filters.status) where.status = filters.status;
    if (filters.department) where.department = { [Op.like]: `%${filters.department}%` };
    if (filters.location) where.location = { [Op.like]: `%${filters.location}%` };
    if (filters.custodian) where.custodian = { [Op.like]: `%${filters.custodian}%` };
    if (filters.purchaseDateFrom) where.purchaseDate = { ...(where.purchaseDate || {}), [Op.gte]: filters.purchaseDateFrom };
    if (filters.purchaseDateTo) where.purchaseDate = { ...(where.purchaseDate || {}), [Op.lte]: filters.purchaseDateTo };
    const assets = await Asset.findAll({ where, include: [{ model: AssetCategory, as: 'category', attributes: ['categoryCode', 'categoryName'], required: false }], order: [['assetCode', 'ASC']] });
    const rows = assets.map((a) => { const d = a.toJSON(); return { assetCode: d.assetCode, assetName: d.assetName, categoryCode: d.category?.categoryCode || '', categoryName: d.category?.categoryName || '', serialNumber: d.serialNumber || '', manufacturer: d.manufacturer || '', model: d.model || '', purchaseDate: d.purchaseDate || '', purchaseCost: parseFloat(d.purchaseCost || 0), residualValue: parseFloat(d.residualValue || 0), usefulLife: d.usefulLife || 0, depreciationMethod: d.depreciationMethod || '', accumulatedDepreciation: parseFloat(d.accumulatedDepreciation || 0), currentBookValue: parseFloat(d.currentBookValue || 0), location: d.location || '', department: d.department || '', custodian: d.custodian || '', status: d.status || '', condition: d.condition || '', warrantyExpiry: d.warrantyExpiry || '' }; });
    return { rows, summary: { totalAssets: rows.length, totalCost: rows.reduce((s, r) => s + r.purchaseCost, 0), totalAccumDepr: rows.reduce((s, r) => s + r.accumulatedDepreciation, 0), totalBookValue: rows.reduce((s, r) => s + r.currentBookValue, 0) } };
  }

  async depreciationSchedule(tenantId, filters = {}) {
    const where = { tenantId, isPosted: true };
    if (filters.assetId) where.assetId = filters.assetId;
    if (filters.fromDate) where.depreciationDate = { ...(where.depreciationDate || {}), [Op.gte]: filters.fromDate };
    if (filters.toDate) where.depreciationDate = { ...(where.depreciationDate || {}), [Op.lte]: filters.toDate };
    if (filters.depreciationMethod) where.depreciationMethod = filters.depreciationMethod;
    let records = await AssetDepreciation.findAll({ where, include: [{ model: Asset, as: 'asset', attributes: ['assetCode', 'assetName'], required: false, include: filters.categoryId ? [{ model: AssetCategory, as: 'category', where: { id: filters.categoryId }, required: true }] : [] }], order: [['depreciationDate', 'DESC']] });
    if (filters.categoryId) records = records.filter((r) => r.asset);
    const rows = records.map((d) => ({ depreciationNumber: d.depreciationNumber, depreciationDate: d.depreciationDate, assetCode: d.asset?.assetCode || '', assetName: d.asset?.assetName || '', frequency: d.frequency, depreciationMethod: d.depreciationMethod, assetCost: parseFloat(d.assetCost || 0), depreciationAmount: parseFloat(d.depreciationAmount || 0), accumulatedDepreciationBefore: parseFloat(d.accumulatedDepreciationBefore || 0), accumulatedDepreciationAfter: parseFloat(d.accumulatedDepreciationAfter || 0), bookValueAfter: parseFloat(d.bookValueAfter || 0) }));
    return { rows, summary: { totalEntries: rows.length, totalDepreciation: rows.reduce((s, r) => s + r.depreciationAmount, 0) } };
  }

  async movementReport(tenantId, filters = {}) {
    const where = { tenantId };
    if (filters.fromDate) where.createdAt = { ...(where.createdAt || {}), [Op.gte]: new Date(filters.fromDate) };
    if (filters.toDate) where.createdAt = { ...(where.createdAt || {}), [Op.lte]: new Date(filters.toDate + 'T23:59:59') };
    if (filters.fromLocation) where.fromLocation = { [Op.like]: `%${filters.fromLocation}%` };
    if (filters.toLocation) where.toLocation = { [Op.like]: `%${filters.toLocation}%` };
    if (filters.custodian) where.fromCustodian = { [Op.like]: `%${filters.custodian}%` };
    const records = await AssetTransfer.findAll({ where, include: [{ model: Asset, as: 'asset', attributes: ['assetCode', 'assetName'], required: false }], order: [['createdAt', 'DESC']] });
    const rows = records.map((t) => ({ transferNumber: t.transferNumber, transferDate: t.transferDate, assetCode: t.asset?.assetCode || '', assetName: t.asset?.assetName || '', fromLocation: t.fromLocation || '', toLocation: t.toLocation || '', fromDepartment: t.fromDepartment || '', toDepartment: t.toDepartment || '', fromCustodian: t.fromCustodian || '', toCustodian: t.toCustodian || '', reason: t.reason || '' }));
    return { rows, summary: { totalTransfers: rows.length } };
  }

  async disposalReport(tenantId, filters = {}) {
    const where = { tenantId };
    if (filters.disposalType) where.disposalType = filters.disposalType;
    if (filters.fromDate) where.disposalDate = { ...(where.disposalDate || {}), [Op.gte]: filters.fromDate };
    if (filters.toDate) where.disposalDate = { ...(where.disposalDate || {}), [Op.lte]: filters.toDate };
    if (filters.assetId) where.assetId = filters.assetId;
    let records = await AssetDisposal.findAll({ where, include: [{ model: Asset, as: 'asset', attributes: ['assetCode', 'assetName'], required: false, include: filters.categoryId ? [{ model: AssetCategory, as: 'category', where: { id: filters.categoryId }, required: true }] : [] }], order: [['disposalDate', 'DESC']] });
    if (filters.categoryId) records = records.filter((r) => r.asset);
    const rows = records.map((d) => ({ disposalNumber: d.disposalNumber, disposalDate: d.disposalDate, disposalType: d.disposalType, assetCode: d.asset?.assetCode || '', assetName: d.asset?.assetName || '', saleAmount: parseFloat(d.saleAmount || 0), accumulatedDepreciation: parseFloat(d.accumulatedDepreciation || 0), netBookValue: parseFloat(d.netBookValue || 0), gainOnDisposal: parseFloat(d.gainOnDisposal || 0), lossOnDisposal: parseFloat(d.lossOnDisposal || 0) }));
    return { rows, summary: { totalDisposals: rows.length, totalGain: rows.reduce((s, r) => s + r.gainOnDisposal, 0), totalLoss: rows.reduce((s, r) => s + r.lossOnDisposal, 0), totalSaleAmount: rows.reduce((s, r) => s + r.saleAmount, 0) } };
  }

  async revaluationReport(tenantId, filters = {}) {
    const where = { tenantId };
    if (filters.assetId) where.assetId = filters.assetId;
    if (filters.fromDate) where.revaluationDate = { ...(where.revaluationDate || {}), [Op.gte]: filters.fromDate };
    if (filters.toDate) where.revaluationDate = { ...(where.revaluationDate || {}), [Op.lte]: filters.toDate };
    const records = await AssetRevaluation.findAll({ where, include: [{ model: Asset, as: 'asset', attributes: ['assetCode', 'assetName'], required: false }], order: [['revaluationDate', 'DESC']] });
    const rows = records.map((r) => ({ revaluationNumber: r.revaluationNumber, revaluationDate: r.revaluationDate, revaluationType: r.revaluationType, assetCode: r.asset?.assetCode || '', assetName: r.asset?.assetName || '', previousValue: parseFloat(r.previousValue || 0), revaluationAmount: parseFloat(r.revaluationAmount || 0), newValue: parseFloat(r.newValue || 0), reason: r.reason || '' }));
    const totalIncrease = rows.filter((r) => r.revaluationType === 'increase').reduce((s, r) => s + r.revaluationAmount, 0);
    const totalDecrease = rows.filter((r) => r.revaluationType === 'decrease').reduce((s, r) => s + r.revaluationAmount, 0);
    return { rows, summary: { totalRevaluations: rows.length, totalIncrease, totalDecrease } };
  }

  async maintenanceReport(tenantId, filters = {}) {
    const where = { tenantId };
    if (filters.assetId) where.assetId = filters.assetId;
    if (filters.status) where.status = filters.status;
    if (filters.serviceProvider) where.serviceProvider = { [Op.like]: `%${filters.serviceProvider}%` };
    if (filters.fromDate) where.maintenanceDate = { ...(where.maintenanceDate || {}), [Op.gte]: filters.fromDate };
    if (filters.toDate) where.maintenanceDate = { ...(where.maintenanceDate || {}), [Op.lte]: filters.toDate };
    const records = await AssetMaintenance.findAll({ where, include: [{ model: Asset, as: 'asset', attributes: ['assetCode', 'assetName'], required: false }], order: [['maintenanceDate', 'DESC']] });
    const rows = records.map((m) => ({ maintenanceNumber: m.maintenanceNumber, maintenanceType: m.maintenanceType, title: m.title, assetCode: m.asset?.assetCode || '', assetName: m.asset?.assetName || '', serviceProvider: m.serviceProvider || '', maintenanceDate: m.maintenanceDate || '', nextDueDate: m.nextDueDate || '', cost: parseFloat(m.cost || 0), status: m.status }));
    return { rows, summary: { totalRecords: rows.length, totalCost: rows.reduce((s, r) => s + r.cost, 0), preventive: rows.filter((r) => r.maintenanceType === 'preventive').length, corrective: rows.filter((r) => r.maintenanceType === 'corrective').length } };
  }

  async insuranceReport(tenantId, filters = {}) {
    const where = { tenantId };
    if (filters.insuranceCompany) where.insuranceCompany = { [Op.like]: `%${filters.insuranceCompany}%` };
    if (filters.status) where.status = filters.status;
    if (filters.expiringDays) { const f = new Date(); f.setDate(f.getDate() + parseInt(filters.expiringDays)); where.expiryDate = { [Op.lte]: f.toISOString().split('T')[0] }; if (!filters.status) where.status = 'active'; }
    const records = await AssetInsurance.findAll({ where, include: [{ model: Asset, as: 'asset', attributes: ['assetCode', 'assetName'], required: false }], order: [['expiryDate', 'ASC']] });
    const rows = records.map((ins) => ({ insuranceNumber: ins.insuranceNumber, insuranceCompany: ins.insuranceCompany, policyNumber: ins.policyNumber, assetCode: ins.asset?.assetCode || '', assetName: ins.asset?.assetName || '', premium: parseFloat(ins.premium || 0), coverageAmount: parseFloat(ins.coverageAmount || 0), startDate: ins.startDate || '', expiryDate: ins.expiryDate || '', renewalReminderDays: ins.renewalReminderDays, status: ins.status }));
    return { rows, summary: { totalPolicies: rows.length, totalPremium: rows.reduce((s, r) => s + r.premium, 0), totalCoverage: rows.reduce((s, r) => s + r.coverageAmount, 0) } };
  }

  async warrantyExpiryReport(tenantId, filters = {}) {
    const where = { tenantId, status: 'active' };
    if (filters.expiringDays) { const f = new Date(); f.setDate(f.getDate() + parseInt(filters.expiringDays)); where.warrantyExpiry = { [Op.lte]: f.toISOString().split('T')[0] }; }
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.location) where.location = { [Op.like]: `%${filters.location}%` };
    const assets = await Asset.findAll({ where, include: [{ model: AssetCategory, as: 'category', attributes: ['categoryCode', 'categoryName'], required: false }], order: [['warrantyExpiry', 'ASC']] });
    const rows = assets.map((a) => { const d = a.toJSON(); return { assetCode: d.assetCode, assetName: d.assetName, categoryName: d.category?.categoryName || '', serialNumber: d.serialNumber || '', manufacturer: d.manufacturer || '', purchaseDate: d.purchaseDate || '', warrantyExpiry: d.warrantyExpiry || '', location: d.location || '', status: d.status }; });
    return { rows, summary: { totalExpiring: rows.length } };
  }

  async auditReport(tenantId, filters = {}) {
    const where = { tenantId };
    if (filters.auditStatus === 'verified') where.isVerified = true;
    if (filters.auditStatus === 'missing') where.isMissing = true;
    if (filters.fromDate) where.auditDate = { ...(where.auditDate || {}), [Op.gte]: filters.fromDate };
    if (filters.toDate) where.auditDate = { ...(where.auditDate || {}), [Op.lte]: filters.toDate };
    if (filters.verifiedLocation) where.verifiedLocation = { [Op.like]: `%${filters.verifiedLocation}%` };
    const records = await AssetAudit.findAll({ where, include: [{ model: Asset, as: 'asset', attributes: ['assetCode', 'assetName'], required: false }], order: [['auditDate', 'DESC']] });
    const rows = records.map((a) => ({ auditNumber: a.auditNumber, auditDate: a.auditDate, assetCode: a.asset?.assetCode || '', assetName: a.asset?.assetName || '', verifiedLocation: a.verifiedLocation || '', verifiedCondition: a.verifiedCondition || '', verifiedCustodian: a.verifiedCustodian || '', isVerified: a.isVerified, isMissing: a.isMissing, remarks: a.remarks || '' }));
    return { rows, summary: { totalAudits: rows.length, verified: rows.filter((r) => r.isVerified).length, missing: rows.filter((r) => r.isMissing).length } };
  }

  async fixedAssetLedger(tenantId, filters = {}) {
    const where = { tenantId };
    if (filters.assetId) where.id = filters.assetId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.status) where.status = filters.status;
    const assets = await Asset.findAll({ where, include: [{ model: AssetCategory, as: 'category', attributes: ['categoryCode', 'categoryName'], required: false }] });
    const ledger = [];
    for (const asset of assets) {
      const cost = parseFloat(asset.purchaseCost || 0);
      ledger.push({ date: asset.purchaseDate || asset.createdAt, assetCode: asset.assetCode, assetName: asset.assetName, type: 'Acquisition', debit: cost, credit: 0, balance: cost, description: 'Asset acquired' });
      const deprs = await AssetDepreciation.findAll({ where: { assetId: asset.id, tenantId, isPosted: true }, order: [['depreciationDate', 'ASC']] });
      let runningBalance = cost;
      for (const d of deprs) { const amt = parseFloat(d.depreciationAmount || 0); runningBalance -= amt; ledger.push({ date: d.depreciationDate, assetCode: asset.assetCode, assetName: asset.assetName, type: 'Depreciation', debit: 0, credit: amt, balance: runningBalance, description: `Depreciation: ${d.depreciationNumber}` }); }
      const revals = await AssetRevaluation.findAll({ where: { assetId: asset.id, tenantId }, order: [['revaluationDate', 'ASC']] });
      for (const r of revals) { const amt = parseFloat(r.revaluationAmount || 0); if (r.revaluationType === 'increase') { runningBalance += amt; ledger.push({ date: r.revaluationDate, assetCode: asset.assetCode, assetName: asset.assetName, type: 'Revaluation Increase', debit: amt, credit: 0, balance: runningBalance, description: `Revaluation: ${r.revaluationNumber}` }); } else { runningBalance -= amt; ledger.push({ date: r.revaluationDate, assetCode: asset.assetCode, assetName: asset.assetName, type: 'Revaluation Decrease', debit: 0, credit: amt, balance: runningBalance, description: `Revaluation: ${r.revaluationNumber}` }); } }
      const disposals = await AssetDisposal.findAll({ where: { assetId: asset.id, tenantId }, order: [['disposalDate', 'ASC']] });
      for (const d of disposals) { ledger.push({ date: d.disposalDate, assetCode: asset.assetCode, assetName: asset.assetName, type: 'Disposal', debit: 0, credit: runningBalance, balance: 0, description: `Disposed: ${d.disposalType}` }); runningBalance = 0; }
    }
    const sorted = ledger.sort((a, b) => new Date(a.date) - new Date(b.date));
    return { rows: sorted, summary: { totalEntries: sorted.length, totalDebit: sorted.reduce((s, r) => s + r.debit, 0), totalCredit: sorted.reduce((s, r) => s + r.credit, 0) } };
  }
}

module.exports = new FixedAssetReports();
