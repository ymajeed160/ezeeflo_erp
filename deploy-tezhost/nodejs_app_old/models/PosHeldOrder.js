'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PosHeldOrder = sequelize.define('PosHeldOrder', {
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
    allowNull: true,
    field: 'customer_id',
  },
  holdNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'hold_number',
  },
  cartData: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'cart_data',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('held', 'retrieved', 'cancelled'),
    defaultValue: 'held',
  },
  heldAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'held_at',
  },
  retrievedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'retrieved_at',
  },
  posSaleId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'pos_sale_id',
  },
}, {
  tableName: 'pos_held_orders',
  timestamps: true,
  underscored: true,
});

module.exports = PosHeldOrder;
