const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BankReconciliationLine = sequelize.define('BankReconciliationLine', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  bankReconciliationId: { type: DataTypes.UUID, allowNull: false },
  bankTransactionId: { type: DataTypes.UUID, allowNull: true },
  statementTransactionDate: { type: DataTypes.DATEONLY, allowNull: true },
  statementReference: { type: DataTypes.STRING(200), allowNull: true },
  statementDescription: { type: DataTypes.TEXT, allowNull: true },
  statementDebitAmount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0.00 },
  statementCreditAmount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0.00 },
  matchStatus: { type: DataTypes.ENUM('Matched', 'Unmatched', 'Ignored', 'AdjustmentRequired'), allowNull: false, defaultValue: 'Unmatched' },
  matchType: { type: DataTypes.ENUM('Automatic', 'Manual', 'None'), allowNull: false, defaultValue: 'None' },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'bank_reconciliation_lines', underscored: true, timestamps: true, paranoid: false,
  indexes: [
    { fields: ['bank_reconciliation_id'], name: 'idx_recon_lines_recon' },
    { fields: ['bank_transaction_id'], name: 'idx_recon_lines_txn' },
    { fields: ['match_status'], name: 'idx_recon_lines_status' },
  ],
});
module.exports = BankReconciliationLine;
