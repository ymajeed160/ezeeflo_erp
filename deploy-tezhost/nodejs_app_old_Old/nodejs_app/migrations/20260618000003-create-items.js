'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('items', {
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
      category_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'item_categories',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      item_code: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      item_type: {
        type: Sequelize.ENUM('product', 'service'),
        allowNull: false,
        defaultValue: 'product',
      },
      unit_of_measure: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'EA',
      },
      cost_price: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true,
        defaultValue: 0.00,
      },
      selling_price: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true,
        defaultValue: 0.00,
      },
      tax_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.00,
      },
      is_inventory_tracked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      income_account_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'accounts',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      expense_account_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'accounts',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      inventory_account_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'accounts',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
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

    // Unique composite index: item_code + tenantId
    await queryInterface.addIndex('items', ['item_code', 'tenant_id'], {
      unique: true,
      name: 'unique_item_code_tenant',
    });

    await queryInterface.addIndex('items', ['tenant_id'], {
      name: 'idx_item_tenant',
    });

    await queryInterface.addIndex('items', ['category_id'], {
      name: 'idx_item_category',
    });

    await queryInterface.addIndex('items', ['item_type'], {
      name: 'idx_item_type',
    });

    await queryInterface.addIndex('items', ['is_active'], {
      name: 'idx_item_status',
    });

    await queryInterface.addIndex('items', ['income_account_id'], {
      name: 'idx_item_income_account',
    });

    await queryInterface.addIndex('items', ['expense_account_id'], {
      name: 'idx_item_expense_account',
    });

    await queryInterface.addIndex('items', ['inventory_account_id'], {
      name: 'idx_item_inventory_account',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('items');
  },
};