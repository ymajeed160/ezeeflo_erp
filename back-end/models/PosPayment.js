'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PosPayment = sequelize.define('PosPayment', {
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
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'card', 'bank_transfer', 'credit'),
    allowNull: false,
    field: 'payment_method',
  },
  amount: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
  },
  reference: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  accountId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'account_id',
  },
  changeAmount: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'change_amount',
  },
}, {
  tableName: 'pos_payments',
  timestamps: { createdAt: true, updatedAt: false },
  underscored: true,
});

module.exports = PosPayment;
