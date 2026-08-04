'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Sales Returns Header
    await queryInterface.createTable('sales_returns', {
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
      returnNumber: {
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
      salesInvoiceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'sales_invoices', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      warehouseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'warehouses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      returnDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      journalEntryId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'journal_entries', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      reference: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      subTotal: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      taxTotal: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      discountTotal: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      grandTotal: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('draft', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'draft',
      },
      isInventoryImpact: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

    await queryInterface.addIndex('sales_returns', ['tenantId']);
    await queryInterface.addIndex('sales_returns', ['returnNumber']);
    await queryInterface.addIndex('sales_returns', ['customerId']);
    await queryInterface.addIndex('sales_returns', ['salesInvoiceId']);
    await queryInterface.addIndex('sales_returns', ['status']);

    // Sales Returns Details
    await queryInterface.createTable('sales_return_details', {
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
      salesReturnId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'sales_returns', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      itemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      salesInvoiceDetailId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'sales_invoice_details', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      quantity: {
        type: Sequelize.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0,
      },
      unitPrice: {
        type: Sequelize.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0,
      },
      taxPercent: {
        type: Sequelize.DECIMAL(8, 4),
        allowNull: false,
        defaultValue: 0,
      },
      discountPercent: {
        type: Sequelize.DECIMAL(8, 4),
        allowNull: false,
        defaultValue: 0,
      },
      lineTotal: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      returnReason: {
        type: Sequelize.STRING(255),
        allowNull: true,
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

    await queryInterface.addIndex('sales_return_details', ['tenantId']);
    await queryInterface.addIndex('sales_return_details', ['salesReturnId']);
    await queryInterface.addIndex('sales_return_details', ['itemId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('sales_return_details');
    await queryInterface.dropTable('sales_returns');
  },
};