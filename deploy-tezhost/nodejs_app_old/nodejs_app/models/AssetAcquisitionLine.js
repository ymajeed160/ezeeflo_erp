const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssetAcquisitionLine = sequelize.define('AssetAcquisitionLine', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  acquisitionId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'acquisition_id',
  },
  assetId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'asset_id',
  },
  assetName: {
    type: DataTypes.STRING(300),
    allowNull: false,
    field: 'asset_name',
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'category_id',
  },
  purchaseCost: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'purchase_cost',
  },
  residualValue: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'residual_value',
  },
  usefulLife: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    field: 'useful_life',
  },
  depreciationMethod: {
    type: DataTypes.ENUM('straight_line', 'declining_balance', 'double_declining_balance', 'units_of_production', 'manual'),
    allowNull: false,
    defaultValue: 'straight_line',
    field: 'depreciation_method',
  },
  serialNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'serial_number',
  },
  lineNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'line_number',
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'created_by',
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'updated_by',
  },
}, {
  tableName: 'asset_acquisition_lines',
  underscored: true,
  timestamps: true,
  paranoid: false,
});

module.exports = AssetAcquisitionLine;
