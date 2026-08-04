const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssetTransfer = sequelize.define('AssetTransfer', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  transferNumber: { type: DataTypes.STRING(50), allowNull: false, field: 'transfer_number' },
  transferDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'transfer_date' },
  assetId: { type: DataTypes.UUID, allowNull: false, field: 'asset_id' },
  fromLocation: { type: DataTypes.STRING(300), allowNull: true, field: 'from_location' },
  toLocation: { type: DataTypes.STRING(300), allowNull: true, field: 'to_location' },
  fromDepartment: { type: DataTypes.STRING(200), allowNull: true, field: 'from_department' },
  toDepartment: { type: DataTypes.STRING(200), allowNull: true, field: 'to_department' },
  fromCustodian: { type: DataTypes.STRING(200), allowNull: true, field: 'from_custodian' },
  toCustodian: { type: DataTypes.STRING(200), allowNull: true, field: 'to_custodian' },
  fromWarehouse: { type: DataTypes.STRING(200), allowNull: true, field: 'from_warehouse' },
  toWarehouse: { type: DataTypes.STRING(200), allowNull: true, field: 'to_warehouse' },
  fromBranch: { type: DataTypes.STRING(200), allowNull: true, field: 'from_branch' },
  toBranch: { type: DataTypes.STRING(200), allowNull: true, field: 'to_branch' },
  reason: { type: DataTypes.TEXT, allowNull: true },
  isCompleted: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false, field: 'is_completed' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, {
  tableName: 'asset_transfers', underscored: true, timestamps: true, paranoid: false,
  indexes: [
    { unique: true, fields: ['transfer_number', 'tenant_id'], name: 'unique_transfer_number_tenant' },
    { fields: ['tenant_id'], name: 'idx_transfers_tenant' },
    { fields: ['asset_id'], name: 'idx_transfers_asset' },
  ],
});

module.exports = AssetTransfer;
