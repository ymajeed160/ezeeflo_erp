'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('PurchaseOrders', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('NEWID()'),
      },
      tenantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Tenants', key: 'id' },
      },
      orderNumber: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      orderDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      expectedDeliveryDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      supplierId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'Suppliers', key: 'id' },
      },
      purchaseRequestId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'PurchaseRequests', key: 'id' },
      },
      status: {
        type: Sequelize.ENUM('draft', 'approved', 'partially_received', 'received', 'closed', 'cancelled'),
        defaultValue: 'draft',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      totalAmount: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0,
      },
      createdBy: { type: Sequelize.UUID, allowNull: true },
      updatedBy: { type: Sequelize.UUID, allowNull: true },
      approvedBy: { type: Sequelize.UUID, allowNull: true },
      approvedAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
      deletedAt: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('PurchaseOrders', ['tenantId', 'orderNumber'], { unique: true });

    await queryInterface.createTable('PurchaseOrderDetails', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('NEWID()'),
      },
      purchaseOrderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'PurchaseOrders', key: 'id', onDelete: 'CASCADE' },
      },
      itemId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Items', key: 'id' },
      },
      description: { type: Sequelize.STRING(500), allowNull: true },
      quantity: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      receivedQuantity: { type: Sequelize.DECIMAL(18, 4), defaultValue: 0 },
      unitPrice: { type: Sequelize.DECIMAL(18, 4), defaultValue: 0 },
      taxPercent: { type: Sequelize.DECIMAL(8, 2), defaultValue: 0 },
      discountPercent: { type: Sequelize.DECIMAL(8, 2), defaultValue: 0 },
      discountAmount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      taxAmount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      lineTotal: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      sortOrder: { type: Sequelize.INTEGER, defaultValue: 0 },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('PurchaseOrderDetails');
    await queryInterface.dropTable('PurchaseOrders');
  },
};