'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('PurchaseReturns', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Tenants', key: 'id' }
      },
      returnNumber: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      returnDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      supplierId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Suppliers', key: 'id' }
      },
      purchaseInvoiceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'PurchaseInvoices', key: 'id' }
      },
      goodsReceiptId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'GoodsReceipts', key: 'id' }
      },
      warehouseId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Warehouses', key: 'id' }
      },
      referenceType: {
        type: Sequelize.ENUM('purchase_invoice', 'goods_receipt'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('Draft', 'Approved', 'Rejected'),
        defaultValue: 'Draft'
      },
      totalAmount: {
        type: Sequelize.DECIMAL(16, 2),
        defaultValue: 0
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('PurchaseReturns', ['tenantId', 'returnNumber'], { unique: true });
    await queryInterface.addIndex('PurchaseReturns', ['tenantId']);
    await queryInterface.addIndex('PurchaseReturns', ['supplierId']);
    await queryInterface.addIndex('PurchaseReturns', ['purchaseInvoiceId']);
    await queryInterface.addIndex('PurchaseReturns', ['status']);

    await queryInterface.createTable('PurchaseReturnDetails', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      purchaseReturnId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'PurchaseReturns', key: 'id', onDelete: 'CASCADE' }
      },
      itemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Items', key: 'id' }
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      quantity: {
        type: Sequelize.DECIMAL(14, 4),
        allowNull: false
      },
      unitCost: {
        type: Sequelize.DECIMAL(16, 4),
        allowNull: false
      },
      taxRate: {
        type: Sequelize.DECIMAL(6, 2),
        defaultValue: 0
      },
      discountAmount: {
        type: Sequelize.DECIMAL(16, 2),
        defaultValue: 0
      },
      lineTotal: {
        type: Sequelize.DECIMAL(16, 2),
        allowNull: false
      },
      warehouseId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Warehouses', key: 'id' }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('PurchaseReturnDetails', ['purchaseReturnId']);
    await queryInterface.addIndex('PurchaseReturnDetails', ['itemId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('PurchaseReturnDetails');
    await queryInterface.dropTable('PurchaseReturns');
  }
};