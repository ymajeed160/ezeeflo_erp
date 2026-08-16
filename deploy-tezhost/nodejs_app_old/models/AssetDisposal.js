const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssetDisposal = sequelize.define('AssetDisposal', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  disposalNumber: { type: DataTypes.STRING(50), allowNull: false, field: 'disposal_number' },
  assetId: { type: DataTypes.UUID, allowNull: false, field: 'asset_id' },
  disposalDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'disposal_date' },
  disposalType: { type: DataTypes.ENUM('sale', 'scrap', 'donation', 'write_off', 'lost'), allowNull: false, field: 'disposal_type' },
  saleAmount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0, field: 'sale_amount' },
  accumulatedDepreciation: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0, field: 'accumulated_depreciation' },
  netBookValue: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0, field: 'net_book_value' },
  gainOnDisposal: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0, field: 'gain_on_disposal' },
  lossOnDisposal: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0, field: 'loss_on_disposal' },
  reference: { type: DataTypes.STRING(100), allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  isPosted: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false, field: 'is_posted' },
  journalEntryId: { type: DataTypes.UUID, allowNull: true, field: 'journal_entry_id' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, {
  tableName: 'asset_disposals', underscored: true, timestamps: true, paranoid: false,
});

module.exports = AssetDisposal;
