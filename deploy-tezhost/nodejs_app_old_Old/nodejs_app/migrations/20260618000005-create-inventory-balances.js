'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('inventory_balances', {
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
      quantity_on_hand: {
        type: Sequelize.DECIMAL(18, 4),
        defaultValue: 0,
      },
      average_cost: {
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

    // Unique constraint: one balance per warehouse+item combination
    await queryInterface.addIndex('inventory_balances', ['warehouse_id', 'item_id'], {
      unique: true,
      name: 'unique_warehouse_item',
    });
    await queryInterface.addIndex('inventory_balances', ['tenant_id'], {
      name: 'idx_inventory_balances_tenant',
    });
    await queryInterface.addIndex('inventory_balances', ['warehouse_id'], {
      name: 'idx_inventory_balances_warehouse',
    });
    await queryInterface.addIndex('inventory_balances', ['item_id'], {
      name: 'idx_inventory_balances_item',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('inventory_balances');
  },
};