'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create stock_adjustments table
    await queryInterface.createTable('stock_adjustments', {
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
      adjustment_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      warehouse_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'warehouses',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      adjustment_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      reason: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('draft', 'approved', 'completed'),
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
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('stock_adjustments', ['adjustment_number', 'tenant_id'], {
      unique: true,
      name: 'unique_adjustment_number_tenant',
    });
    await queryInterface.addIndex('stock_adjustments', ['tenant_id'], {
      name: 'idx_stock_adjustments_tenant',
    });
    await queryInterface.addIndex('stock_adjustments', ['warehouse_id'], {
      name: 'idx_stock_adjustments_warehouse',
    });
    await queryInterface.addIndex('stock_adjustments', ['status'], {
      name: 'idx_stock_adjustments_status',
    });
    await queryInterface.addIndex('stock_adjustments', ['adjustment_date'], {
      name: 'idx_stock_adjustments_date',
    });

    // Create stock_adjustment_details table
    await queryInterface.createTable('stock_adjustment_details', {
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
      stock_adjustment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'stock_adjustments',
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
      current_quantity: {
        type: Sequelize.DECIMAL(18, 4),
        defaultValue: 0,
      },
      adjusted_quantity: {
        type: Sequelize.DECIMAL(18, 4),
        defaultValue: 0,
      },
      difference_quantity: {
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

    await queryInterface.addIndex('stock_adjustment_details', ['tenant_id'], {
      name: 'idx_sa_details_tenant',
    });
    await queryInterface.addIndex('stock_adjustment_details', ['stock_adjustment_id'], {
      name: 'idx_sa_details_header',
    });
    await queryInterface.addIndex('stock_adjustment_details', ['item_id'], {
      name: 'idx_sa_details_item',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('stock_adjustment_details');
    await queryInterface.dropTable('stock_adjustments');
  },
};