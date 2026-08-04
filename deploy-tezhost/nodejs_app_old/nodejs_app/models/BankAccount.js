const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BankAccount = sequelize.define('BankAccount', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  accountCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  accountName: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  bankName: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  branchName: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  accountNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  iban: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  swiftCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  currencyCode: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'USD',
  },
  openingBalance: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  openingBalanceDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  chartOfAccountId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
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
  tableName: 'bank_accounts',
  underscored: true,
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['account_code', 'tenant_id'],
      name: 'unique_bank_account_code_tenant',
    },
    {
      unique: true,
      fields: ['account_number', 'tenant_id'],
      name: 'unique_bank_account_number_tenant',
    },
    {
      fields: ['tenant_id'],
      name: 'idx_bank_account_tenant',
    },
    {
      fields: ['chart_of_account_id'],
      name: 'idx_bank_account_coa',
    },
  ],
  defaultScope: {
    where: {},
  },
  scopes: {
    active: {
      where: { isActive: true },
    },
    byTenant: (tenantId) => ({
      where: { tenantId },
    }),
  },
});

module.exports = BankAccount;
