const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Quotation = sequelize.define('Quotation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  quotationNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'quotation_number',
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'customer_id',
  },
  quotationDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'quotation_date',
  },
  expiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'expiry_date',
  },
  warehouseId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'warehouse_id',
  },
  reference: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  subtotal: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
  },
  taxAmount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'tax_amount',
  },
  discountAmount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'discount_amount',
  },
  totalAmount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'total_amount',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  termsConditions: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'terms_conditions',
  },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'approved', 'rejected', 'converted'),
    allowNull: false,
    defaultValue: 'draft',
  },
  convertedToType: {
    type: DataTypes.ENUM('sales_order', 'sales_invoice'),
    allowNull: true,
    field: 'converted_to_type',
  },
  convertedToId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'converted_to_id',
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
  tableName: 'quotations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: true,
  deletedAt: 'deleted_at',
  indexes: [
    { unique: true, fields: ['quotation_number', 'tenant_id'] },
    { fields: ['tenant_id', 'customer_id'] },
    { fields: ['tenant_id', 'status'] },
    { fields: ['tenant_id', 'quotation_date'] },
    { fields: ['customer_id'] },
    { fields: ['warehouse_id'] },
  ],
});

const QuotationDetail = sequelize.define('QuotationDetail', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tenant_id',
  },
  quotationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'quotation_id',
  },
  itemId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'item_id',
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  quantity: {
    type: DataTypes.DECIMAL(18, 4),
    allowNull: false,
    defaultValue: 0,
  },
  unitPrice: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'unit_price',
  },
  taxPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'tax_percentage',
  },
  discountPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'discount_percentage',
  },
  taxAmount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'tax_amount',
  },
  discountAmount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'discount_amount',
  },
  lineTotal: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'line_total',
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'sort_order',
  },
}, {
  tableName: 'quotation_details',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['quotation_id'] },
    { fields: ['item_id'] },
  ],
});

module.exports = { Quotation, QuotationDetail };