'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create stock_transfers table
    await queryInterface.createTable('stock_transfers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      transfer_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      from_warehouse_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'warehouses',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      to_warehouse_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'warehouses',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      transfer_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('draft', 'approved', 'in_transit', 'completed', 'cancelled'),
        defaultValue: 'draft',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
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
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('stock_transfers', ['transfer_number', 'tenant_id'], {
      unique: true,
      name: 'unique_transfer_number_tenant',
    });
    await queryInterface.addIndex('stock_transfers', ['tenant_id'], {
      name: 'idx_stock_transfers_tenant',
    });
    await queryInterface.addIndex('stock_transfers', ['from_warehouse_id'], {
      name: 'idx_stock_transfers_from',
    });
    await queryInterface.addIndex('stock_transfers', ['to_warehouse_id'], {
      name: 'idx_stock_transfers_to',
    });
    await queryInterface.addIndex('stock_transfers', ['status'], {
      name: 'idx_stock_transfers_status',
    });
    await queryInterface.addIndex('stock_transfers', ['transfer_date'], {
      name: 'idx_stock_transfers_date',
    });

    // Create stock_transfer_details table
    await queryInterface.createTable('stock_transfer_details', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      stock_transfer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'stock_transfers',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'items',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      quantity: {
        type: Sequelize.DECIMAL(18, 4),
        defaultValue: 0,
      },
      unit_cost: {
        type: Sequelize.DECIMAL(18, 4),
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('stock_transfer_details', ['tenant_id'], {
      name: 'idx_st_details_tenant',
    });
    await queryInterface.addIndex('stock_transfer_details', ['stock_transfer_id'], {
      name: 'idx_st_details_header',
    });
    await queryInterface.addIndex('stock_transfer_details', ['item_id'], {
      name: 'idx_st_details_item',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('stock_transfer_details');
    await queryInterface.dropTable('stock_transfers');
  },
};