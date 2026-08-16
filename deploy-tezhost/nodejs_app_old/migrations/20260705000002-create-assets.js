'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('assets', {
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
      asset_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      asset_name: {
        type: Sequelize.STRING(300),
        allowNull: false,
      },
      category_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'asset_categories', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      serial_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      barcode: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      qr_code: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      manufacturer: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      model: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      purchase_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      capitalization_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      supplier_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'suppliers', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      purchase_invoice_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'PurchaseInvoices', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      purchase_cost: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      residual_value: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      useful_life: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      depreciation_method: {
        type: Sequelize.ENUM('straight_line', 'declining_balance', 'double_declining_balance', 'units_of_production', 'manual'),
        allowNull: false,
        defaultValue: 'straight_line',
      },
      accumulated_depreciation: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      current_book_value: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      revaluation_amount: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      impairment_amount: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      location: {
        type: Sequelize.STRING(300),
        allowNull: true,
      },
      department: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      custodian: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      warranty_expiry: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      insurance_policy_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      condition: {
        type: Sequelize.ENUM('new', 'good', 'fair', 'poor', 'damaged', 'obsolete'),
        allowNull: false,
        defaultValue: 'new',
      },
      status: {
        type: Sequelize.ENUM('draft', 'active', 'disposed', 'sold', 'transferred', 'under_maintenance', 'retired', 'lost'),
        allowNull: false,
        defaultValue: 'draft',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    await queryInterface.addIndex('assets', ['asset_code', 'tenant_id'], {
      unique: true,
      name: 'unique_asset_code_tenant',
    });

    await queryInterface.addIndex('assets', ['tenant_id'], {
      name: 'idx_assets_tenant',
    });

    await queryInterface.addIndex('assets', ['category_id'], {
      name: 'idx_assets_category',
    });

    await queryInterface.addIndex('assets', ['supplier_id'], {
      name: 'idx_assets_supplier',
    });

    await queryInterface.addIndex('assets', ['status'], {
      name: 'idx_assets_status',
    });

    await queryInterface.addIndex('assets', ['purchase_date'], {
      name: 'idx_assets_purchase_date',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('assets');
  },
};
