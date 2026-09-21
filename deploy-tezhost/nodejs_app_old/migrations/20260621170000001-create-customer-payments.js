'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Customer Payments Header
    await queryInterface.createTable('customer_payments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      paymentNumber: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      customerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'customers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      paymentDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      paymentMethod: {
        type: Sequelize.ENUM('cash', 'bank_transfer', 'cheque', 'credit_card', 'other'),
        allowNull: false,
        defaultValue: 'bank_transfer',
      },
      amount: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      reference: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      bankAccountId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'accounts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      journalEntryId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'journal_entries', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('draft', 'posted', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('customer_payments', ['tenantId']);
    await queryInterface.addIndex('customer_payments', ['paymentNumber']);
    await queryInterface.addIndex('customer_payments', ['customerId']);
    await queryInterface.addIndex('customer_payments', ['status']);
    await queryInterface.addIndex('customer_payments', ['paymentDate']);

    // Customer Payment Allocations (invoice allocation)
    await queryInterface.createTable('customer_payment_allocations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      customerPaymentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'customer_payments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      salesInvoiceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'sales_invoices', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      allocatedAmount: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('customer_payment_allocations', ['tenantId']);
    await queryInterface.addIndex('customer_payment_allocations', ['customerPaymentId']);
    await queryInterface.addIndex('customer_payment_allocations', ['salesInvoiceId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('customer_payment_allocations');
    await queryInterface.dropTable('customer_payments');
  },
};