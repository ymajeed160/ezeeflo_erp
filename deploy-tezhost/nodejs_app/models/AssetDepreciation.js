const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssetDepreciation = sequelize.define('AssetDepreciation', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  depreciationNumber: { type: DataTypes.STRING(50), allowNull: false, field: 'depreciation_number' },
  assetId: { type: DataTypes.UUID, allowNull: false, field: 'asset_id' },
  depreciationDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'depreciation_date' },
  periodStart: { type: DataTypes.DATEONLY, allowNull: true, field: 'period_start' },
  periodEnd: { type: DataTypes.DATEONLY, allowNull: true, field: 'period_end' },
  frequency: { type: DataTypes.ENUM('monthly', 'quarterly', 'yearly'), allowNull: false, defaultValue: 'monthly' },
  depreciationMethod: { type: DataTypes.ENUM('straight_line', 'declining_balance', 'double_declining_balance', 'units_of_production', 'manual'), allowNull: false, field: 'depreciation_method' },
  assetCost: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0, field: 'asset_cost' },
  residualValue: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0, field: 'residual_value' },
  usefulLife: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5, field: 'useful_life' },
  accumulatedDepreciationBefore: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0, field: 'accumulated_depreciation_before' },
  depreciationAmount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0, field: 'depreciation_amount' },
  accumulatedDepreciationAfter: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0, field: 'accumulated_depreciation_after' },
  bookValueAfter: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0, field: 'book_value_after' },
  unitsProduced: { type: DataTypes.DECIMAL(18, 2), allowNull: true, field: 'units_produced' },
  totalEstimatedUnits: { type: DataTypes.DECIMAL(18, 2), allowNull: true, field: 'total_estimated_units' },
  isPosted: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false, field: 'is_posted' },
  journalEntryId: { type: DataTypes.UUID, allowNull: true, field: 'journal_entry_id' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, {
  tableName: 'asset_depreciations', underscored: true, timestamps: true, paranoid: false,
  indexes: [
    { unique: true, fields: ['depreciation_number', 'tenant_id'], name: 'unique_depr_number_tenant' },
    { fields: ['tenant_id'], name: 'idx_depreciations_tenant' },
    { fields: ['asset_id'], name: 'idx_depreciations_asset' },
  ],
});

module.exports = AssetDepreciation;
