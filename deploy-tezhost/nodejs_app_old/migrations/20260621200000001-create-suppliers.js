'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('suppliers', {
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
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      contact_person: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },
      mobile: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      tax_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      vat_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      postal_code: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      payment_terms: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      credit_limit: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0,
      },
      credit_days: {
        type: Sequelize.INTEGER,
        defaultValue: 30,
      },
      currency: {
        type: Sequelize.STRING(10),
        defaultValue: 'AED',
      },
      ap_account_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'accounts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'blocked'),
        defaultValue: 'active',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('suppliers', ['code', 'tenant_id'], {
      unique: true,
      name: 'unique_supplier_code_tenant',
    });
    await queryInterface.addIndex('suppliers', ['tenant_id', 'name'], {
      name: 'idx_suppliers_tenant_name',
    });
    await queryInterface.addIndex('suppliers', ['tenant_id', 'email'], {
      name: 'idx_suppliers_tenant_email',
    });
    await queryInterface.addIndex('suppliers', ['tenant_id', 'status'], {
      name: 'idx_suppliers_tenant_status',
    });
    await queryInterface.addIndex('suppliers', ['ap_account_id'], {
      name: 'idx_suppliers_ap_account',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('suppliers');
  },
};