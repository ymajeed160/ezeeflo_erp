'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Sales Invoices Header Table
    await queryInterface.createTable('sales_invoices', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
      },
      invoiceNumber: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      customerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'customers', key: 'id' },
      },
      salesOrderId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'sales_orders', key: 'id' },
      },
      deliveryNoteId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'delivery_notes', key: 'id' },
      },
      warehouseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'warehouses', key: 'id' },
      },
      invoiceDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      dueDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      journalEntryId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'journal_entries', key: 'id' },
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
        type: Sequelize.ENUM('draft', 'posted', 'paid', 'partially_paid', 'overdue', 'cancelled'),
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
      },
      updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Sales Invoice Details Table
    await queryInterface.createTable('sales_invoice_details', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
      },
      salesInvoiceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'sales_invoices', key: 'id' },
        onDelete: 'CASCADE',
      },
      itemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'items', key: 'id' },
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
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      discountPercent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      lineTotal: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      costPrice: {
        type: Sequelize.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Add indexes
    await queryInterface.addIndex('sales_invoices', ['tenantId']);
    await queryInterface.addIndex('sales_invoices', ['invoiceNumber']);
    await queryInterface.addIndex('sales_invoices', ['customerId']);
    await queryInterface.addIndex('sales_invoices', ['status']);
    await queryInterface.addIndex('sales_invoice_details', ['salesInvoiceId']);
    await queryInterface.addIndex('sales_invoice_details', ['itemId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('sales_invoice_details');
    await queryInterface.dropTable('sales_invoices');
  },
};