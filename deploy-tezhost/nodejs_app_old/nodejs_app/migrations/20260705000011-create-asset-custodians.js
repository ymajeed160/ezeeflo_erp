'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('asset_custodians', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'tenants', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      custodian_code: { type: Sequelize.STRING(50), allowNull: false },
      custodian_name: { type: Sequelize.STRING(200), allowNull: false },
      custodian_type: { type: Sequelize.ENUM('employee', 'doctor', 'department'), allowNull: false },
      email: { type: Sequelize.STRING(200), allowNull: true },
      phone: { type: Sequelize.STRING(50), allowNull: true },
      department: { type: Sequelize.STRING(200), allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true, allowNull: false },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      updated_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('asset_custodians', ['custodian_code', 'tenant_id'], { unique: true, name: 'unique_cust_code_tenant' });
    await queryInterface.addIndex('asset_custodians', ['tenant_id'], { name: 'idx_custodians_tenant' });
  },
  down: async (queryInterface) => { await queryInterface.dropTable('asset_custodians'); },
};
