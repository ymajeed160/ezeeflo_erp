'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('customers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      tenantId: {
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
      legalName: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      group: {
        type: Sequelize.ENUM('retail', 'wholesale', 'corporate', 'government'),
        defaultValue: 'retail',
      },
      type: {
        type: Sequelize.ENUM('individual', 'company'),
        defaultValue: 'individual',
      },
      email: {
        type: Sequelize.STRING(150),
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
      website: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      taxNumber: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      vatNumber: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      registrationNumber: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      currency: {
        type: Sequelize.STRING(10),
        defaultValue: 'AED',
      },
      paymentTerms: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      creditLimit: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0,
      },
      creditDays: {
        type: Sequelize.INTEGER,
        defaultValue: 30,
      },
      arAccountId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'accounts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      billingAddress: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      shippingAddress: {
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
      postalCode: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      contactPerson: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      contactEmail: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      contactPhone: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'blocked'),
        defaultValue: 'active',
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      updatedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('customers', ['tenantId', 'code'], {
      unique: true,
      name: 'unique_customer_code_tenant',
    });
    await queryInterface.addIndex('customers', ['tenantId', 'name'], {
      name: 'idx_customers_tenant_name',
    });
    await queryInterface.addIndex('customers', ['tenantId', 'email'], {
      name: 'idx_customers_tenant_email',
    });
    await queryInterface.addIndex('customers', ['tenantId', 'status'], {
      name: 'idx_customers_tenant_status',
    });
    await queryInterface.addIndex('customers', ['tenantId', 'isActive'], {
      name: 'idx_customers_tenant_active',
    });
    await queryInterface.addIndex('customers', ['arAccountId'], {
      name: 'idx_customers_ar_account',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('customers');
  },
};