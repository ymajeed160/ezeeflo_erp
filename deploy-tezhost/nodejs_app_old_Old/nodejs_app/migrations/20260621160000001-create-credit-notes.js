'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Credit Notes Header
    await queryInterface.createTable('credit_notes', {
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
      creditNoteNumber: {
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
      salesReturnId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'sales_returns', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      salesInvoiceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'sales_invoices', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      warehouseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'warehouses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      creditNoteDate: {
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
        type: Sequelize.ENUM('draft', 'posted', 'cancelled'),
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

    await queryInterface.addIndex('credit_notes', ['tenantId']);
    await queryInterface.addIndex('credit_notes', ['creditNoteNumber']);
    await queryInterface.addIndex('credit_notes', ['customerId']);
    await queryInterface.addIndex('credit_notes', ['salesReturnId']);
    await queryInterface.addIndex('credit_notes', ['status']);

    // Credit Notes Details
    await queryInterface.createTable('credit_note_details', {
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
      creditNoteId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'credit_notes', key: 'id' },
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
      salesReturnDetailId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'sales_return_details', key: 'id' },
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
      costPrice: {
        type: Sequelize.DECIMAL(18, 4),
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

    await queryInterface.addIndex('credit_note_details', ['tenantId']);
    await queryInterface.addIndex('credit_note_details', ['creditNoteId']);
    await queryInterface.addIndex('credit_note_details', ['itemId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('credit_note_details');
    await queryInterface.dropTable('credit_notes');
  },
};