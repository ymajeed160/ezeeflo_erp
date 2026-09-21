'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('PurchaseInvoices', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      tenantId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Tenants', key: 'id' }, onDelete: 'CASCADE' },
      invoiceNumber: { type: Sequelize.STRING(50), allowNull: false },
      supplierInvoiceNumber: { type: Sequelize.STRING(100), allowNull: true },
      supplierId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Suppliers', key: 'id' } },
      invoiceDate: { type: Sequelize.DATEONLY, allowNull: false },
      dueDate: { type: Sequelize.DATEONLY, allowNull: true },
      warehouseId: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Warehouses', key: 'id' } },
      status: { type: Sequelize.ENUM('draft', 'posted', 'paid', 'cancelled'), defaultValue: 'draft' },
      notes: { type: Sequelize.TEXT, allowNull: true },
      subtotal: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      taxAmount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      discountAmount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      totalAmount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      journalEntryId: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'JournalEntries', key: 'id' } },
      createdBy: { type: Sequelize.INTEGER, allowNull: true },
      updatedBy: { type: Sequelize.INTEGER, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deletedAt: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('PurchaseInvoices', ['tenantId', 'invoiceNumber'], { unique: true });
    await queryInterface.addIndex('PurchaseInvoices', ['tenantId']);
    await queryInterface.addIndex('PurchaseInvoices', ['supplierId']);
    await queryInterface.addIndex('PurchaseInvoices', ['status']);

    await queryInterface.createTable('PurchaseInvoiceDetails', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      purchaseInvoiceId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'PurchaseInvoices', key: 'id' }, onDelete: 'CASCADE' },
      itemId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Items', key: 'id' } },
      description: { type: Sequelize.STRING(255), allowNull: true },
      quantity: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      unitCost: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      taxPercent: { type: Sequelize.DECIMAL(8, 2), defaultValue: 0 },
      taxAmount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      discountPercent: { type: Sequelize.DECIMAL(8, 2), defaultValue: 0 },
      discountAmount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      lineTotal: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('PurchaseInvoiceDetails', ['purchaseInvoiceId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('PurchaseInvoiceDetails');
    await queryInterface.dropTable('PurchaseInvoices');
  },
};