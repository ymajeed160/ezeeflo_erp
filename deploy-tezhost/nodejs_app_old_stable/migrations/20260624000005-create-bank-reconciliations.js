'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // bank_reconciliations table
    await queryInterface.createTable('bank_reconciliations', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'tenants', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      reconciliation_number: { type: Sequelize.STRING(50), allowNull: false },
      bank_account_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'bank_accounts', key: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
      statement_date_from: { type: Sequelize.DATEONLY, allowNull: false },
      statement_date_to: { type: Sequelize.DATEONLY, allowNull: false },
      statement_opening_balance: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0.00 },
      statement_closing_balance: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0.00 },
      system_closing_balance: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0.00 },
      difference_amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0.00 },
      status: { type: Sequelize.ENUM('Draft', 'InProgress', 'Reconciled', 'Closed', 'Reversed'), allowNull: false, defaultValue: 'Draft' },
      reconciled_at: { type: Sequelize.DATE, allowNull: true },
      reconciled_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      updated_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('bank_reconciliations', ['reconciliation_number', 'tenant_id'], { unique: true, name: 'unique_recon_number_tenant' });
    await queryInterface.addIndex('bank_reconciliations', ['tenant_id'], { name: 'idx_recon_tenant' });
    await queryInterface.addIndex('bank_reconciliations', ['bank_account_id'], { name: 'idx_recon_bank_account' });
    await queryInterface.addIndex('bank_reconciliations', ['status'], { name: 'idx_recon_status' });

    // bank_reconciliation_lines table
    await queryInterface.createTable('bank_reconciliation_lines', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'tenants', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      bank_reconciliation_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'bank_reconciliations', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      bank_transaction_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'bank_transactions', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      statement_transaction_date: { type: Sequelize.DATEONLY, allowNull: true },
      statement_reference: { type: Sequelize.STRING(200), allowNull: true },
      statement_description: { type: Sequelize.TEXT, allowNull: true },
      statement_debit_amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0.00 },
      statement_credit_amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0.00 },
      match_status: { type: Sequelize.ENUM('Matched', 'Unmatched', 'Ignored', 'AdjustmentRequired'), allowNull: false, defaultValue: 'Unmatched' },
      match_type: { type: Sequelize.ENUM('Automatic', 'Manual', 'None'), allowNull: false, defaultValue: 'None' },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('bank_reconciliation_lines', ['bank_reconciliation_id'], { name: 'idx_recon_lines_recon' });
    await queryInterface.addIndex('bank_reconciliation_lines', ['bank_transaction_id'], { name: 'idx_recon_lines_txn' });
    await queryInterface.addIndex('bank_reconciliation_lines', ['match_status'], { name: 'idx_recon_lines_status' });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('bank_reconciliation_lines');
    await queryInterface.dropTable('bank_reconciliations');
  },
};
