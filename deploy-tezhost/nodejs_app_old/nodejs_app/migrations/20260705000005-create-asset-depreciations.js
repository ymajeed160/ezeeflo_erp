'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('asset_depreciations', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'tenants', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      depreciation_number: { type: Sequelize.STRING(50), allowNull: false },
      asset_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'assets', key: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
      depreciation_date: { type: Sequelize.DATEONLY, allowNull: false },
      period_start: { type: Sequelize.DATEONLY, allowNull: true },
      period_end: { type: Sequelize.DATEONLY, allowNull: true },
      frequency: { type: Sequelize.ENUM('monthly', 'quarterly', 'yearly'), allowNull: false, defaultValue: 'monthly' },
      depreciation_method: { type: Sequelize.ENUM('straight_line', 'declining_balance', 'double_declining_balance', 'units_of_production', 'manual'), allowNull: false },
      asset_cost: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      residual_value: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      useful_life: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 5 },
      accumulated_depreciation_before: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      depreciation_amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      accumulated_depreciation_after: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      book_value_after: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      units_produced: { type: Sequelize.DECIMAL(18, 2), allowNull: true },
      total_estimated_units: { type: Sequelize.DECIMAL(18, 2), allowNull: true },
      is_posted: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      journal_entry_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'journal_entries', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      updated_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('asset_depreciations', ['depreciation_number', 'tenant_id'], { unique: true, name: 'unique_depr_number_tenant' });
    await queryInterface.addIndex('asset_depreciations', ['tenant_id'], { name: 'idx_depreciations_tenant' });
    await queryInterface.addIndex('asset_depreciations', ['asset_id'], { name: 'idx_depreciations_asset' });
    await queryInterface.addIndex('asset_depreciations', ['is_posted'], { name: 'idx_depreciations_posted' });
    await queryInterface.addIndex('asset_depreciations', ['depreciation_date'], { name: 'idx_depreciations_date' });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('asset_depreciations');
  },
};
