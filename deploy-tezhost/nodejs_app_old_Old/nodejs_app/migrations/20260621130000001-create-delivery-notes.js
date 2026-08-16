'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Delivery Notes Header
    await queryInterface.createTable('delivery_notes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      deliveryNumber: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      salesOrderId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'sales_orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      customerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'customers', key: 'id' },
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
      deliveryDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      reference: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('draft', 'delivered', 'cancelled'),
        defaultValue: 'draft',
      },
      totalAmount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      updatedBy: {
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

    // Delivery Note Details (line items)
    await queryInterface.createTable('delivery_note_details', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      deliveryNoteId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'delivery_notes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      salesOrderDetailId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'sales_order_details', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      itemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      quantity: {
        type: Sequelize.DECIMAL(15, 3),
        allowNull: false,
        defaultValue: 0,
      },
      unitPrice: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
      },
      taxPercentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0,
      },
      discountPercentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0,
      },
      totalAmount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      updatedBy: {
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

    // Add indexes
    await queryInterface.addIndex('delivery_notes', ['tenantId']);
    await queryInterface.addIndex('delivery_notes', ['salesOrderId']);
    await queryInterface.addIndex('delivery_notes', ['customerId']);
    await queryInterface.addIndex('delivery_notes', ['status']);
    await queryInterface.addIndex('delivery_note_details', ['deliveryNoteId']);
    await queryInterface.addIndex('delivery_note_details', ['itemId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('delivery_note_details');
    await queryInterface.dropTable('delivery_notes');
  },
};