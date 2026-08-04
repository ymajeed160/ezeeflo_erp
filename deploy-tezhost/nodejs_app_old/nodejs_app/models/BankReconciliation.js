const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BankReconciliation = sequelize.define('BankReconciliation', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  reconciliationNumber: { type: DataTypes.STRING(50), allowNull: false },
  bankAccountId: { type: DataTypes.UUID, allowNull: false },
  statementDateFrom: { type: DataTypes.DATEONLY, allowNull: false },
  statementDateTo: { type: DataTypes.DATEONLY, allowNull: false },
  statementOpeningBalance: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0.00 },
  statementClosingBalance: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0.00 },
  systemClosingBalance: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0.00 },
  differenceAmount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0.00 },
  status: { type: DataTypes.ENUM('Draft', 'InProgress', 'Reconciled', 'Closed', 'Reversed'), allowNull: false, defaultValue: 'Draft' },
  reconciledAt: { type: DataTypes.DATE, allowNull: true },
  reconciledBy: { type: DataTypes.UUID, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true },
  updatedBy: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'bank_reconciliations', underscored: true, timestamps: true, paranoid: false,
  indexes: [
    { unique: true, fields: ['reconciliation_number', 'tenant_id'], name: 'unique_recon_number_tenant' },
    { fields: ['tenant_id'], name: 'idx_recon_tenant' },
    { fields: ['bank_account_id'], name: 'idx_recon_bank_account' },
    { fields: ['status'], name: 'idx_recon_status' },
  ],
  defaultScope: { where: {}, order: [['createdAt', 'DESC']] },
});
module.exports = BankReconciliation;
