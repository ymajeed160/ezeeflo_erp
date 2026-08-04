const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Asset = sequelize.define('Asset', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  assetCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'asset_code',
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
  acquisitionId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'acquisition_id',
  },
  serialNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'serial_number',
  },
  barcode: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  qrCode: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'qr_code',
  },
  manufacturer: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  model: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  purchaseDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'purchase_date',
  },
  capitalizationDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'capitalization_date',
  },
  supplierId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'supplier_id',
  },
  purchaseInvoiceId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'purchase_invoice_id',
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
  accumulatedDepreciation: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'accumulated_depreciation',
  },
  currentBookValue: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'current_book_value',
  },
  revaluationAmount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'revaluation_amount',
  },
  impairmentAmount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'impairment_amount',
  },
  location: {
    type: DataTypes.STRING(300),
    allowNull: true,
  },
  department: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  custodian: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  warrantyExpiry: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'warranty_expiry',
  },
  insurancePolicyNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'insurance_policy_number',
  },
  condition: {
    type: DataTypes.ENUM('new', 'good', 'fair', 'poor', 'damaged', 'obsolete'),
    allowNull: false,
    defaultValue: 'new',
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'disposed', 'sold', 'transferred', 'under_maintenance', 'retired', 'lost'),
    allowNull: false,
    defaultValue: 'draft',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
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
  tableName: 'assets',
  underscored: true,
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['asset_code', 'tenant_id'],
      name: 'unique_asset_code_tenant',
    },
    {
      fields: ['tenant_id'],
      name: 'idx_assets_tenant',
    },
    {
      fields: ['category_id'],
      name: 'idx_assets_category',
    },
    {
      fields: ['status'],
      name: 'idx_assets_status',
    },
  ],
  defaultScope: {
    where: {},
  },
  scopes: {
    active: {
      where: { status: 'active' },
    },
    byTenant: (tenantId) => ({
      where: { tenantId },
    }),
  },
});

module.exports = Asset;
