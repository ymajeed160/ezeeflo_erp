'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('GoodsReceipts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      grnNumber: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      receiptDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      purchaseOrderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'PurchaseOrders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      supplierId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Suppliers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      warehouseId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Warehouses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      reference: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('draft', 'received', 'cancelled'),
        defaultValue: 'draft',
        allowNull: false,
      },
      totalQuantity: {
        type: Sequelize.DECIMAL(18, 4),
        defaultValue: 0,
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('GoodsReceipts', ['tenantId', 'grnNumber'], { unique: true });
    await queryInterface.addIndex('GoodsReceipts', ['tenantId']);
    await queryInterface.addIndex('GoodsReceipts', ['purchaseOrderId']);
    await queryInterface.addIndex('GoodsReceipts', ['supplierId']);

    // Goods Receipt Detail
    await queryInterface.createTable('GoodsReceiptDetails', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      goodsReceiptId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'GoodsReceipts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      itemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      orderedQuantity: {
        type: Sequelize.DECIMAL(18, 4),
        defaultValue: 0,
      },
      receivedQuantity: {
        type: Sequelize.DECIMAL(18, 4),
        defaultValue: 0,
      },
      unitPrice: {
        type: Sequelize.DECIMAL(18, 4),
        defaultValue: 0,
      },
      taxPercentage: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
      },
      discountPercentage: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
      },
      lineTotal: {
        type: Sequelize.DECIMAL(18, 4),
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

    await queryInterface.addIndex('GoodsReceiptDetails', ['goodsReceiptId']);
    await queryInterface.addIndex('GoodsReceiptDetails', ['itemId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('GoodsReceiptDetails');
    await queryInterface.dropTable('GoodsReceipts');
  },
};