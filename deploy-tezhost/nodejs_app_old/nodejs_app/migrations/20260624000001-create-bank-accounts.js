'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('bank_accounts', {
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
      account_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      account_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      bank_name: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      branch_name: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      account_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      iban: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      swift_code: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      currency_code: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'USD',
      },
      opening_balance: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      opening_balance_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      chart_of_account_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'accounts', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
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

    await queryInterface.addIndex('bank_accounts', ['account_code', 'tenant_id'], {
      unique: true,
      name: 'unique_bank_account_code_tenant',
    });

    await queryInterface.addIndex('bank_accounts', ['account_number', 'tenant_id'], {
      unique: true,
      name: 'unique_bank_account_number_tenant',
    });

    await queryInterface.addIndex('bank_accounts', ['tenant_id'], {
      name: 'idx_bank_account_tenant',
    });

    await queryInterface.addIndex('bank_accounts', ['chart_of_account_id'], {
      name: 'idx_bank_account_coa',
    });

    await queryInterface.addIndex('bank_accounts', ['is_default'], {
      name: 'idx_bank_account_default',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('bank_accounts');
  },
};
