'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PosReturn = sequelize.define('PosReturn', {
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
  terminalId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'terminal_id',
  },
  sessionId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'session_id',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'customer_id',
  },
  originalSaleId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'original_sale_id',
  },
  originalInvoiceNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'original_invoice_number',
  },
  returnNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'return_number',
  },
  returnDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'return_date',
  },
  subTotal: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'sub_total',
  },
  taxTotal: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'tax_total',
  },
  grandTotal: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'grand_total',
  },
  refundAmount: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'refund_amount',
  },
  refundMethod: {
    type: DataTypes.ENUM('cash', 'card', 'account_credit'),
    allowNull: true,
    field: 'refund_method',
  },
  status: {
    type: DataTypes.ENUM('completed', 'cancelled'),
    defaultValue: 'completed',
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  journalEntryId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'journal_entry_id',
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'created_by',
  },
}, {
  tableName: 'pos_returns',
  timestamps: true,
  underscored: true,
});

module.exports = PosReturn;
