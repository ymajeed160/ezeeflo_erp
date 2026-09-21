'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create asset_acquisitions table
    await queryInterface.createTable('asset_acquisitions', {
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
      acquisition_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      acquisition_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      acquisition_type: {
        type: Sequelize.ENUM('manual', 'purchase_invoice', 'goods_receipt', 'bulk'),
        allowNull: false,
        defaultValue: 'manual',
      },
      source_document_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      source_document_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      supplier_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'suppliers', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      total_cost: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_posted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      journal_entry_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'journal_entries', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
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

    // Create asset_acquisition_lines table
    await queryInterface.createTable('asset_acquisition_lines', {
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
      acquisition_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'asset_acquisitions', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      asset_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'assets', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
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
      serial_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      line_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
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

    // Add acquisition_id to assets table
    await queryInterface.addColumn('assets', 'acquisition_id', {
      type: Sequelize.UUID,
      allowNull: true,
      after: 'category_id',
      references: { model: 'asset_acquisitions', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // Indexes for asset_acquisitions
    await queryInterface.addIndex('asset_acquisitions', ['acquisition_number', 'tenant_id'], {
      unique: true,
      name: 'unique_acquisition_number_tenant',
    });

    await queryInterface.addIndex('asset_acquisitions', ['tenant_id'], {
      name: 'idx_acquisitions_tenant',
    });

    await queryInterface.addIndex('asset_acquisitions', ['supplier_id'], {
      name: 'idx_acquisitions_supplier',
    });

    await queryInterface.addIndex('asset_acquisitions', ['is_posted'], {
      name: 'idx_acquisitions_posted',
    });

    // Indexes for asset_acquisition_lines
    await queryInterface.addIndex('asset_acquisition_lines', ['acquisition_id'], {
      name: 'idx_acq_lines_acquisition',
    });

    await queryInterface.addIndex('asset_acquisition_lines', ['asset_id'], {
      name: 'idx_acq_lines_asset',
    });

    // Index for acquisition_id on assets
    await queryInterface.addIndex('assets', ['acquisition_id'], {
      name: 'idx_assets_acquisition',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('assets', 'acquisition_id');
    await queryInterface.dropTable('asset_acquisition_lines');
    await queryInterface.dropTable('asset_acquisitions');
  },
};
