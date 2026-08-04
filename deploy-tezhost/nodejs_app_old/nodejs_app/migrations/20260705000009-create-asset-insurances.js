'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('asset_insurances', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'tenants', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      insurance_number: { type: Sequelize.STRING(50), allowNull: false },
      asset_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'assets', key: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
      insurance_company: { type: Sequelize.STRING(200), allowNull: false },
      policy_number: { type: Sequelize.STRING(100), allowNull: false },
      premium: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      coverage_amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      start_date: { type: Sequelize.DATEONLY, allowNull: true },
      expiry_date: { type: Sequelize.DATEONLY, allowNull: true },
      renewal_reminder_days: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 30 },
      notes: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.ENUM('active', 'expired', 'cancelled'), allowNull: false, defaultValue: 'active' },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      updated_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('asset_insurances', ['insurance_number', 'tenant_id'], { unique: true, name: 'unique_ins_number_tenant' });
    await queryInterface.addIndex('asset_insurances', ['tenant_id'], { name: 'idx_insurances_tenant' });
    await queryInterface.addIndex('asset_insurances', ['asset_id'], { name: 'idx_insurances_asset' });
    await queryInterface.addIndex('asset_insurances', ['expiry_date'], { name: 'idx_insurances_expiry' });
  },
  down: async (queryInterface) => { await queryInterface.dropTable('asset_insurances'); },
};
