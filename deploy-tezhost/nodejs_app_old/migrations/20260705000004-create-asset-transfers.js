'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('asset_transfers', {
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
      transfer_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      transfer_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      asset_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'assets', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      from_location: {
        type: Sequelize.STRING(300),
        allowNull: true,
      },
      to_location: {
        type: Sequelize.STRING(300),
        allowNull: true,
      },
      from_department: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      to_department: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      from_custodian: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      to_custodian: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      from_warehouse: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      to_warehouse: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      from_branch: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      to_branch: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_completed: {
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

    await queryInterface.addIndex('asset_transfers', ['transfer_number', 'tenant_id'], {
      unique: true,
      name: 'unique_transfer_number_tenant',
    });
    await queryInterface.addIndex('asset_transfers', ['tenant_id'], { name: 'idx_transfers_tenant' });
    await queryInterface.addIndex('asset_transfers', ['asset_id'], { name: 'idx_transfers_asset' });
    await queryInterface.addIndex('asset_transfers', ['transfer_date'], { name: 'idx_transfers_date' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('asset_transfers');
  },
};
