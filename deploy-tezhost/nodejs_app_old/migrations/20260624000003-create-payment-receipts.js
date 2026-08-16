'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payment_receipts', {
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
      receipt_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      receipt_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'customers', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      bank_account_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'bank_accounts', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      payment_method: {
        type: Sequelize.ENUM('Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Online Payment', 'Other'),
        allowNull: false,
        defaultValue: 'Bank Transfer',
      },
      reference_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      amount: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      currency_code: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'USD',
      },
      exchange_rate: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: true,
        defaultValue: 1.000000,
      },
      received_from: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      deposit_reference: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('Draft', 'Posted', 'Cancelled', 'Reversed'),
        allowNull: false,
        defaultValue: 'Draft',
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

    await queryInterface.addIndex('payment_receipts', ['receipt_number', 'tenant_id'], {
      unique: true,
      name: 'unique_receipt_number_tenant',
    });

    await queryInterface.addIndex('payment_receipts', ['tenant_id'], {
      name: 'idx_receipt_tenant',
    });

    await queryInterface.addIndex('payment_receipts', ['customer_id'], {
      name: 'idx_receipt_customer',
    });

    await queryInterface.addIndex('payment_receipts', ['bank_account_id'], {
      name: 'idx_receipt_bank_account',
    });

    await queryInterface.addIndex('payment_receipts', ['status'], {
      name: 'idx_receipt_status',
    });

    // Create payment_receipt_allocations table
    await queryInterface.createTable('payment_receipt_allocations', {
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
      payment_receipt_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'payment_receipts', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      sales_invoice_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'SalesInvoices', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      allocated_amount: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0.00,
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

    await queryInterface.addIndex('payment_receipt_allocations', ['payment_receipt_id'], {
      name: 'idx_receipt_alloc_receipt',
    });

    await queryInterface.addIndex('payment_receipt_allocations', ['sales_invoice_id'], {
      name: 'idx_receipt_alloc_invoice',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('payment_receipt_allocations');
    await queryInterface.dropTable('payment_receipts');
  },
};
