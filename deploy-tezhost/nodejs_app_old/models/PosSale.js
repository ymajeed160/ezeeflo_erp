'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PosSale = sequelize.define('PosSale', {
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
  warehouseId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'warehouse_id',
  },
  invoiceNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'invoice_number',
  },
  invoiceDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'invoice_date',
  },
  subTotal: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'sub_total',
  },
  discountTotal: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'discount_total',
  },
  discountPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'discount_percentage',
  },
  discountReason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'discount_reason',
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
  status: {
    type: DataTypes.ENUM('completed', 'cancelled', 'refunded'),
    defaultValue: 'completed',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  journalEntryId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'journal_entry_id',
  },
  isInventoryImpact: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_inventory_impact',
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'created_by',
  },
  cancelledBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'cancelled_by',
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'cancelled_at',
  },
  cancelReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'cancel_reason',
  },
}, {
  tableName: 'pos_sales',
  timestamps: true,
  underscored: true,
});

module.exports = PosSale;
