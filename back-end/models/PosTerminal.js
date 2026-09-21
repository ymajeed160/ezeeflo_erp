'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PosTerminal = sequelize.define('PosTerminal', {
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
  terminalName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'terminal_name',
    validate: {
      notEmpty: { msg: 'Terminal name is required' },
    },
  },
  terminalCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'terminal_code',
    validate: {
      notEmpty: { msg: 'Terminal code is required' },
    },
  },
  warehouseId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'warehouse_id',
  },
  defaultCashAccountId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'default_cash_account_id',
  },
  defaultBankAccountId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'default_bank_account_id',
  },
  defaultCurrency: {
    type: DataTypes.STRING(10),
    defaultValue: 'AED',
    field: 'default_currency',
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
    defaultValue: 'active',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
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
  tableName: 'pos_terminals',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['terminal_code', 'tenant_id'],
      name: 'uq_pos_terminal_code_tenant',
    },
  ],
});

module.exports = PosTerminal;
