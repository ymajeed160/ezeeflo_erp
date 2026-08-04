'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('purchase_requests', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      request_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      request_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      requested_by: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      department: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('draft', 'submitted', 'approved', 'rejected', 'converted'),
        allowNull: false,
        defaultValue: 'draft',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('purchase_requests', {
      unique: true,
      fields: ['request_number', 'tenant_id'],
    });
    await queryInterface.addIndex('purchase_requests', ['tenant_id', 'status']);
    await queryInterface.addIndex('purchase_requests', ['tenant_id', 'request_date']);

    await queryInterface.createTable('purchase_request_details', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      purchase_request_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'purchase_requests',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'items',
          key: 'id',
        },
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
      required_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('purchase_request_details', ['purchase_request_id']);
    await queryInterface.addIndex('purchase_request_details', ['item_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('purchase_request_details');
    await queryInterface.dropTable('purchase_requests');
  },
};