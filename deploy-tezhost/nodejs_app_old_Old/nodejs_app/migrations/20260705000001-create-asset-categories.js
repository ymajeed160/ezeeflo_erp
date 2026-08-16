'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('asset_categories', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      category_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      category_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      useful_life_years: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      depreciation_method: {
        type: Sequelize.ENUM('straight_line', 'declining_balance', 'double_declining_balance', 'units_of_production', 'manual'),
        allowNull: false,
        defaultValue: 'straight_line',
      },
      default_asset_account_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'accounts', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      accumulated_depreciation_account_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'accounts', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      depreciation_expense_account_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'accounts', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      gain_on_disposal_account_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'accounts', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      loss_on_disposal_account_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'accounts', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      default_tax_account_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'accounts', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      residual_value_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
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

    await queryInterface.addIndex('asset_categories', ['category_code', 'tenant_id'], {
      unique: true,
      name: 'unique_asset_category_code_tenant',
    });

    await queryInterface.addIndex('asset_categories', ['tenant_id'], {
      name: 'idx_asset_categories_tenant',
    });

    await queryInterface.addIndex('asset_categories', ['default_asset_account_id'], {
      name: 'idx_asset_categories_default_asset_account',
    });

    await queryInterface.addIndex('asset_categories', ['accumulated_depreciation_account_id'], {
      name: 'idx_asset_categories_accum_depr_account',
    });

    await queryInterface.addIndex('asset_categories', ['depreciation_expense_account_id'], {
      name: 'idx_asset_categories_depr_expense_account',
    });

    await queryInterface.addIndex('asset_categories', ['is_active'], {
      name: 'idx_asset_categories_active',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('asset_categories');
  },
};
