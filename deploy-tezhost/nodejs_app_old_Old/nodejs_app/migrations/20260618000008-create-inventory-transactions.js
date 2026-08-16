'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('inventory_transactions', {
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
      transaction_type: {
        type: Sequelize.ENUM(
          'purchase',
          'sale',
          'adjustment',
          'transfer_in',
          'transfer_out',
          'opening_balance',
          'return'
        ),
        allowNull: false,
      },
      reference_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      reference_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      quantity_in: {
        type: Sequelize.DECIMAL(18, 4),
        defaultValue: 0,
      },
      quantity_out: {
        type: Sequelize.DECIMAL(18, 4),
        defaultValue: 0,
      },
      running_balance: {
        type: Sequelize.DECIMAL(18, 4),
        defaultValue: 0,
      },
      unit_cost: {
        type: Sequelize.DECIMAL(18, 4),
        defaultValue: 0,
      },
      transaction_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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

    await queryInterface.addIndex('inventory_transactions', ['tenant_id'], {
      name: 'idx_inv_trans_tenant',
    });
    await queryInterface.addIndex('inventory_transactions', ['item_id'], {
      name: 'idx_inv_trans_item',
    });
    await queryInterface.addIndex('inventory_transactions', ['warehouse_id'], {
      name: 'idx_inv_trans_warehouse',
    });
    await queryInterface.addIndex('inventory_transactions', ['transaction_type'], {
      name: 'idx_inv_trans_type',
    });
    await queryInterface.addIndex('inventory_transactions', ['transaction_date'], {
      name: 'idx_inv_trans_date',
    });
    await queryInterface.addIndex('inventory_transactions', ['reference_type', 'reference_id'], {
      name: 'idx_inv_trans_reference',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('inventory_transactions');
  },
};