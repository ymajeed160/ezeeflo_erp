const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BankTransaction = sequelize.define('BankTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  bankAccountId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  transactionNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  transactionDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  valueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  transactionType: {
    type: DataTypes.ENUM(
      'Deposit', 'Withdrawal', 'Transfer In', 'Transfer Out',
      'Bank Charge', 'Interest Income', 'Interest Expense',
      'Cheque Deposit', 'Cheque Payment', 'Direct Debit', 'Direct Credit',
      'Adjustment', 'Opening Balance', 'Imported Statement'
    ),
    allowNull: false,
  },
  direction: {
    type: DataTypes.ENUM('In', 'Out'),
    allowNull: false,
  },
  referenceNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  externalReference: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  debitAmount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  creditAmount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  runningBalance: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Posted', 'Reversed', 'Cancelled'),
    allowNull: false,
    defaultValue: 'Draft',
  },
  sourceType: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  sourceId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  offsetAccountId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  isReconciled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  reconciledAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  reconciledBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  journalEntryId: {
    type: DataTypes.UUID,
    allowNull: true,
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
  tableName: 'bank_transactions',
  underscored: true,
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['transaction_number', 'tenant_id'],
      name: 'unique_bank_txn_number_tenant',
    },
    {
      fields: ['tenant_id'],
      name: 'idx_bank_txn_tenant',
    },
    {
      fields: ['bank_account_id'],
      name: 'idx_bank_txn_account',
    },
    {
      fields: ['status'],
      name: 'idx_bank_txn_status',
    },
    {
      fields: ['transaction_date'],
      name: 'idx_bank_txn_date',
    },
    {
      fields: ['is_reconciled'],
      name: 'idx_bank_txn_reconciled',
    },
  ],
  defaultScope: {
    where: {},
    order: [['transactionDate', 'DESC'], ['createdAt', 'DESC']],
  },
  scopes: {
    byTenant: (tenantId) => ({
      where: { tenantId },
    }),
    byBankAccount: (bankAccountId) => ({
      where: { bankAccountId },
    }),
    posted: {
      where: { status: 'Posted' },
    },
    draft: {
      where: { status: 'Draft' },
    },
  },
});

module.exports = BankTransaction;
