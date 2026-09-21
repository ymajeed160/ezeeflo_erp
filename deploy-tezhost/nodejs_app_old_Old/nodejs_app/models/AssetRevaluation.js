const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssetRevaluation = sequelize.define('AssetRevaluation', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  revaluationNumber: { type: DataTypes.STRING(50), allowNull: false, field: 'revaluation_number' },
  assetId: { type: DataTypes.UUID, allowNull: false, field: 'asset_id' },
  revaluationDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'revaluation_date' },
  revaluationType: { type: DataTypes.ENUM('increase', 'decrease'), allowNull: false, field: 'revaluation_type' },
  previousValue: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0, field: 'previous_value' },
  revaluationAmount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0, field: 'revaluation_amount' },
  newValue: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0, field: 'new_value' },
  reason: { type: DataTypes.TEXT, allowNull: true },
  isPosted: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false, field: 'is_posted' },
  journalEntryId: { type: DataTypes.UUID, allowNull: true, field: 'journal_entry_id' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'asset_revaluations', underscored: true, timestamps: true, paranoid: false });

module.exports = AssetRevaluation;
