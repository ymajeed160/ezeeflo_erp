'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('asset_disposals', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'tenants', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      disposal_number: { type: Sequelize.STRING(50), allowNull: false },
      asset_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'assets', key: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
      disposal_date: { type: Sequelize.DATEONLY, allowNull: false },
      disposal_type: { type: Sequelize.ENUM('sale', 'scrap', 'donation', 'write_off', 'lost'), allowNull: false },
      sale_amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      accumulated_depreciation: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      net_book_value: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      gain_on_disposal: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      loss_on_disposal: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      reference: { type: Sequelize.STRING(100), allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      is_posted: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      journal_entry_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'journal_entries', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      updated_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('asset_disposals', ['disposal_number', 'tenant_id'], { unique: true, name: 'unique_disposal_number_tenant' });
    await queryInterface.addIndex('asset_disposals', ['tenant_id'], { name: 'idx_disposals_tenant' });
    await queryInterface.addIndex('asset_disposals', ['asset_id'], { name: 'idx_disposals_asset' });
    await queryInterface.addIndex('asset_disposals', ['disposal_type'], { name: 'idx_disposals_type' });
  },
  down: async (queryInterface) => { await queryInterface.dropTable('asset_disposals'); },
};
