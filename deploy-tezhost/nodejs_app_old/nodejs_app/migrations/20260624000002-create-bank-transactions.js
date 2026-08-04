'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('bank_transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      bank_account_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'bank_accounts', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      transaction_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      transaction_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      value_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      transaction_type: {
        type: Sequelize.ENUM(
          'Deposit', 'Withdrawal', 'Transfer In', 'Transfer Out',
          'Bank Charge', 'Interest Income', 'Interest Expense',
          'Cheque Deposit', 'Cheque Payment', 'Direct Debit', 'Direct Credit',
          'Adjustment', 'Opening Balance', 'Imported Statement'
        ),
        allowNull: false,
      },
      direction: {
        type: Sequelize.ENUM('In', 'Out'),
        allowNull: false,
      },
      reference_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      external_reference: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      debit_amount: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      credit_amount: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      running_balance: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      status: {
        type: Sequelize.ENUM('Draft', 'Posted', 'Reversed', 'Cancelled'),
        allowNull: false,
        defaultValue: 'Draft',
      },
      source_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      source_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      offset_account_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'accounts', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      is_reconciled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      reconciled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      reconciled_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      journal_entry_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'journal_entries', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('bank_transactions', ['transaction_number', 'tenant_id'], {
      unique: true,
      name: 'unique_bank_txn_number_tenant',
    });

    await queryInterface.addIndex('bank_transactions', ['tenant_id'], {
      name: 'idx_bank_txn_tenant',
    });

    await queryInterface.addIndex('bank_transactions', ['bank_account_id'], {
      name: 'idx_bank_txn_account',
    });

    await queryInterface.addIndex('bank_transactions', ['status'], {
      name: 'idx_bank_txn_status',
    });

    await queryInterface.addIndex('bank_transactions', ['transaction_date'], {
      name: 'idx_bank_txn_date',
    });

    await queryInterface.addIndex('bank_transactions', ['is_reconciled'], {
      name: 'idx_bank_txn_reconciled',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('bank_transactions');
  },
};
