'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PosSaleLine = sequelize.define('PosSaleLine', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  posSaleId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'pos_sale_id',
  },
  itemId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'item_id',
  },
  itemName: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'item_name',
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  quantity: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 1.00,
  },
  unitPrice: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'unit_price',
  },
  costPrice: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'cost_price',
  },
  discountPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'discount_percentage',
  },
  discountAmount: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'discount_amount',
  },
  taxPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'tax_percentage',
  },
  taxAmount: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'tax_amount',
  },
  lineTotal: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'line_total',
  },
  isService: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_service',
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'sort_order',
  },
}, {
  tableName: 'pos_sale_lines',
  timestamps: { createdAt: true, updatedAt: false },
  underscored: true,
});

module.exports = PosSaleLine;
