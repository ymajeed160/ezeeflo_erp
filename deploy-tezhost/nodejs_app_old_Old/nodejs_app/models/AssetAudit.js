const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const AssetAudit = sequelize.define('AssetAudit', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  auditNumber: { type: DataTypes.STRING(50), allowNull: false, field: 'audit_number' },
  auditDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'audit_date' },
  assetId: { type: DataTypes.UUID, allowNull: false, field: 'asset_id' },
  verifiedLocation: { type: DataTypes.STRING(300), allowNull: true, field: 'verified_location' },
  verifiedCondition: { type: DataTypes.ENUM('new', 'good', 'fair', 'poor', 'damaged', 'obsolete'), allowNull: true, field: 'verified_condition' },
  verifiedCustodian: { type: DataTypes.STRING(200), allowNull: true, field: 'verified_custodian' },
  barcodeScanned: { type: DataTypes.STRING(200), allowNull: true, field: 'barcode_scanned' },
  qrScanned: { type: DataTypes.TEXT, allowNull: true, field: 'qr_scanned' },
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_verified' },
  isMissing: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_missing' },
  isFound: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_found' },
  remarks: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'asset_audits', underscored: true, timestamps: true, paranoid: false });
module.exports = AssetAudit;
