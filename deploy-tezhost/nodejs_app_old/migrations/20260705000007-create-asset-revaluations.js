'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('asset_revaluations', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'tenants', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      revaluation_number: { type: Sequelize.STRING(50), allowNull: false },
      asset_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'assets', key: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
      revaluation_date: { type: Sequelize.DATEONLY, allowNull: false },
      revaluation_type: { type: Sequelize.ENUM('increase', 'decrease'), allowNull: false },
      previous_value: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      revaluation_amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      new_value: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      reason: { type: Sequelize.TEXT, allowNull: true },
      is_posted: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      journal_entry_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'journal_entries', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      updated_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('asset_revaluations', ['revaluation_number', 'tenant_id'], { unique: true, name: 'unique_reval_number_tenant' });
    await queryInterface.addIndex('asset_revaluations', ['tenant_id'], { name: 'idx_revaluations_tenant' });
    await queryInterface.addIndex('asset_revaluations', ['asset_id'], { name: 'idx_revaluations_asset' });
  },
  down: async (queryInterface) => { await queryInterface.dropTable('asset_revaluations'); },
};
