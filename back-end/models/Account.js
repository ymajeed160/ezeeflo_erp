const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Account = sequelize.define('Account', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Account name is required' },
      len: { args: [2, 200], msg: 'Account name must be between 2 and 200 characters' },
    },
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Account code is required' },
      len: { args: [2, 50], msg: 'Account code must be between 2 and 50 characters' },
    },
  },
  type: {
    type: DataTypes.ENUM('asset', 'liability', 'equity', 'revenue', 'expense'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['asset', 'liability', 'equity', 'revenue', 'expense']],
        msg: 'Type must be one of: asset, liability, equity, revenue, expense',
      },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  parentAccountId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  openingBalance: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      isDecimal: { msg: 'Opening balance must be a valid decimal' },
    },
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'accounts',
  underscored: true,
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['code', 'tenant_id'],
      name: 'unique_code_tenant',
    },
    {
      fields: ['tenant_id'],
      name: 'idx_account_tenant',
    },
    {
      fields: ['parent_account_id'],
      name: 'idx_account_parent',
    },
    {
      fields: ['type'],
      name: 'idx_account_type',
    },
  ],
  defaultScope: {
    where: {},
    include: [],
  },
  scopes: {
    active: {
      where: { isActive: true },
    },
    roots: {
      where: { parentAccountId: null },
    },
    byTenant: (tenantId) => ({
      where: { tenantId },
    }),
    byType: (type) => ({
      where: { type },
    }),
  },
});

module.exports = Account;