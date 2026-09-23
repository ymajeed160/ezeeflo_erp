'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ============================================================
    // selling_resource_types — master data (soft-deletable)
    // ============================================================
    await queryInterface.createTable('selling_resource_types', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      type_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      type_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('selling_resource_types', ['type_code', 'tenant_id'], {
      unique: true,
      name: 'unique_srtype_code_tenant',
    });
    await queryInterface.addIndex('selling_resource_types', ['tenant_id', 'is_active'], {
      name: 'idx_srtype_tenant_active',
    });

    // ============================================================
    // selling_resources — master data (soft-deletable)
    // ============================================================
    await queryInterface.createTable('selling_resources', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      resource_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      resource_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      resource_type_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'selling_resource_types', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('selling_resources', ['resource_code', 'tenant_id'], {
      unique: true,
      name: 'unique_sellingresource_code_tenant',
    });
    await queryInterface.addIndex('selling_resources', ['resource_type_id'], {
      name: 'idx_sellingresource_type',
    });
    await queryInterface.addIndex('selling_resources', ['tenant_id', 'is_active'], {
      name: 'idx_sellingresource_tenant_active',
    });

    // ============================================================
    // resource_income — ANALYTICAL attribution records ONLY.
    // No accounting/ledger impact. Lifecycle-managed, not soft-deleted.
    // ============================================================
    await queryInterface.createTable('resource_income', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      sales_invoice_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'sales_invoices', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      resource_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'selling_resources', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      invoice_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      invoice_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      net_amount: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      tax_amount: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      gross_amount: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      income_amount: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('posted', 'cancelled'),
        allowNull: false,
        defaultValue: 'posted',
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
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('resource_income', ['sales_invoice_id', 'resource_id'], {
      unique: true,
      name: 'unique_resource_income_invoice_resource',
    });
    await queryInterface.addIndex('resource_income', ['resource_id'], {
      name: 'idx_resource_income_resource',
    });
    await queryInterface.addIndex('resource_income', ['tenant_id', 'invoice_date'], {
      name: 'idx_resource_income_tenant_date',
    });
    await queryInterface.addIndex('resource_income', ['tenant_id', 'status'], {
      name: 'idx_resource_income_tenant_status',
    });

    // ============================================================
    // Add selling_resource_id to sales_invoices (nullable, analytical)
    // ============================================================
    await queryInterface.addColumn('sales_invoices', 'selling_resource_id', {
      type: Sequelize.UUID,
      allowNull: true,
    });
    await queryInterface.addIndex('sales_invoices', ['selling_resource_id'], {
      name: 'idx_sales_invoices_selling_resource',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('sales_invoices', 'selling_resource_id');
    await queryInterface.dropTable('resource_income');
    await queryInterface.dropTable('selling_resources');
    await queryInterface.dropTable('selling_resource_types');
  },
};
