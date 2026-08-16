'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('asset_locations', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'tenants', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      location_code: { type: Sequelize.STRING(50), allowNull: false },
      location_name: { type: Sequelize.STRING(200), allowNull: false },
      location_type: { type: Sequelize.ENUM('building', 'floor', 'room', 'clinic', 'department', 'warehouse'), allowNull: false },
      parent_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'asset_locations', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      description: { type: Sequelize.TEXT, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true, allowNull: false },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      updated_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('asset_locations', ['location_code', 'tenant_id'], { unique: true, name: 'unique_loc_code_tenant' });
    await queryInterface.addIndex('asset_locations', ['tenant_id'], { name: 'idx_locations_tenant' });
    await queryInterface.addIndex('asset_locations', ['parent_id'], { name: 'idx_locations_parent' });
  },
  down: async (queryInterface) => { await queryInterface.dropTable('asset_locations'); },
};
