'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PosReturnLine = sequelize.define('PosReturnLine', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  posReturnId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'pos_return_id',
  },
  originalSaleLineId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'original_sale_line_id',
  },
  itemId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'item_id',
  },
  quantity: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
  },
  unitPrice: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'unit_price',
  },
  lineTotal: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'line_total',
  },
  taxAmount: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'tax_amount',
  },
}, {
  tableName: 'pos_return_lines',
  timestamps: { createdAt: true, updatedAt: false },
  underscored: true,
});

module.exports = PosReturnLine;
