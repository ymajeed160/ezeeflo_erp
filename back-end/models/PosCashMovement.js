'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PosCashMovement = sequelize.define('PosCashMovement', {
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
  movementType: {
    type: DataTypes.ENUM('cash_in', 'cash_out', 'adjustment', 'transfer'),
    allowNull: false,
    field: 'movement_type',
  },
  amount: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
  },
  referenceType: {
    type: DataTypes.ENUM('payment', 'refund', 'expense', 'transfer', 'other'),
    allowNull: true,
    field: 'reference_type',
  },
  reference: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Reason is required for cash movements' },
    },
  },
}, {
  tableName: 'pos_cash_movements',
  timestamps: { createdAt: true, updatedAt: false },
  underscored: true,
});

module.exports = PosCashMovement;
