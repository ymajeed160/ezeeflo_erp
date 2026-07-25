'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('item_categories', {
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
      name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      parent_category_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'item_categories',
          key: 'id',
        },
        onDelete: 'RESTRICT',
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

    // Unique composite index: name + tenantId
    await queryInterface.addIndex('item_categories', ['name', 'tenant_id'], {
      unique: true,
      name: 'unique_category_name_tenant',
    });

    await queryInterface.addIndex('item_categories', ['tenant_id'], {
      name: 'idx_category_tenant',
    });

    await queryInterface.addIndex('item_categories', ['parent_category_id'], {
      name: 'idx_category_parent',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('item_categories');
  },
};