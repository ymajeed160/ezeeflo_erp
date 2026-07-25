'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('asset_maintenances', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'tenants', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      maintenance_number: { type: Sequelize.STRING(50), allowNull: false },
      asset_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'assets', key: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
      maintenance_type: { type: Sequelize.ENUM('preventive', 'corrective', 'amc'), allowNull: false },
      title: { type: Sequelize.STRING(300), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      service_provider: { type: Sequelize.STRING(200), allowNull: true },
      maintenance_date: { type: Sequelize.DATEONLY, allowNull: true },
      next_due_date: { type: Sequelize.DATEONLY, allowNull: true },
      cost: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      status: { type: Sequelize.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'), allowNull: false, defaultValue: 'scheduled' },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      updated_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('asset_maintenances', ['maintenance_number', 'tenant_id'], { unique: true, name: 'unique_maint_number_tenant' });
    await queryInterface.addIndex('asset_maintenances', ['tenant_id'], { name: 'idx_maintenances_tenant' });
    await queryInterface.addIndex('asset_maintenances', ['asset_id'], { name: 'idx_maintenances_asset' });
    await queryInterface.addIndex('asset_maintenances', ['status'], { name: 'idx_maintenances_status' });
    await queryInterface.addIndex('asset_maintenances', ['next_due_date'], { name: 'idx_maintenances_due' });
  },
  down: async (queryInterface) => { await queryInterface.dropTable('asset_maintenances'); },
};
