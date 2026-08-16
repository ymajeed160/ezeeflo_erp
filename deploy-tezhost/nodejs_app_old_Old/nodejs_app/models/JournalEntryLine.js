const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const JournalEntryLine = sequelize.define('JournalEntryLine', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  journalEntryId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  accountId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  lineNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  debit: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
  },
  credit: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'journal_entry_lines',
  underscored: true,
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      fields: ['journal_entry_id'],
      name: 'idx_jel_entry',
    },
    {
      fields: ['account_id'],
      name: 'idx_jel_account',
    },
    {
      fields: ['tenant_id'],
      name: 'idx_jel_tenant',
    },
  ],
});

module.exports = JournalEntryLine;