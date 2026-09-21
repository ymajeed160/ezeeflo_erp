'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PosSession = sequelize.define('PosSession', {
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
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
  },
  warehouseId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'warehouse_id',
  },
  sessionNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'session_number',
  },
  openingDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'opening_date',
  },
  closingDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'closing_date',
  },
  openingCash: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'opening_cash',
  },
  closingCash: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'closing_cash',
  },
  expectedCash: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'expected_cash',
  },
  actualCash: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'actual_cash',
  },
  cashDifference: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'cash_difference',
  },
  cashSalesTotal: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'cash_sales_total',
  },
  cardSalesTotal: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'card_sales_total',
  },
  bankSalesTotal: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'bank_sales_total',
  },
  creditSalesTotal: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'credit_sales_total',
  },
  cashInTotal: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'cash_in_total',
  },
  cashOutTotal: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'cash_out_total',
  },
  refundTotal: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'refund_total',
  },
  totalSalesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_sales_count',
  },
  status: {
    type: DataTypes.ENUM('open', 'closed', 'suspended'),
    defaultValue: 'open',
  },
  openingNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'opening_notes',
  },
  closingNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'closing_notes',
  },
  managerApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'manager_approved',
  },
  managerApprovedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'manager_approved_by',
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'created_by',
  },
}, {
  tableName: 'pos_sessions',
  timestamps: true,
  underscored: true,
});

module.exports = PosSession;
