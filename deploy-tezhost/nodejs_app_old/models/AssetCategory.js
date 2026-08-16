const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssetCategory = sequelize.define('AssetCategory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  categoryCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'category_code',
  },
  categoryName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'category_name',
  },
  usefulLifeYears: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    field: 'useful_life_years',
  },
  depreciationMethod: {
    type: DataTypes.ENUM('straight_line', 'declining_balance', 'double_declining_balance', 'units_of_production', 'manual'),
    allowNull: false,
    defaultValue: 'straight_line',
    field: 'depreciation_method',
  },
  defaultAssetAccountId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'default_asset_account_id',
  },
  accumulatedDepreciationAccountId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'accumulated_depreciation_account_id',
  },
  depreciationExpenseAccountId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'depreciation_expense_account_id',
  },
  gainOnDisposalAccountId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'gain_on_disposal_account_id',
  },
  lossOnDisposalAccountId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'loss_on_disposal_account_id',
  },
  defaultTaxAccountId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'default_tax_account_id',
  },
  residualValuePercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'residual_value_percentage',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    field: 'is_active',
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
  tableName: 'asset_categories',
  underscored: true,
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['category_code', 'tenant_id'],
      name: 'unique_asset_category_code_tenant',
    },
    {
      fields: ['tenant_id'],
      name: 'idx_asset_categories_tenant',
    },
    {
      fields: ['is_active'],
      name: 'idx_asset_categories_active',
    },
  ],
  defaultScope: {
    where: {},
  },
  scopes: {
    active: {
      where: { isActive: true },
    },
    byTenant: (tenantId) => ({
      where: { tenantId },
    }),
  },
});

module.exports = AssetCategory;
