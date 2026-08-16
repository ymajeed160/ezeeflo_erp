'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('asset_audits', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'tenants', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      audit_number: { type: Sequelize.STRING(50), allowNull: false },
      audit_date: { type: Sequelize.DATEONLY, allowNull: false },
      asset_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'assets', key: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
      verified_location: { type: Sequelize.STRING(300), allowNull: true },
      verified_condition: { type: Sequelize.ENUM('new', 'good', 'fair', 'poor', 'damaged', 'obsolete'), allowNull: true },
      verified_custodian: { type: Sequelize.STRING(200), allowNull: true },
      barcode_scanned: { type: Sequelize.STRING(200), allowNull: true },
      qr_scanned: { type: Sequelize.TEXT, allowNull: true },
      is_verified: { type: Sequelize.BOOLEAN, defaultValue: true },
      is_missing: { type: Sequelize.BOOLEAN, defaultValue: false },
      is_found: { type: Sequelize.BOOLEAN, defaultValue: false },
      remarks: { type: Sequelize.TEXT, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      updated_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('asset_audits', ['audit_number', 'tenant_id'], { unique: true, name: 'unique_audit_number_tenant' });
    await queryInterface.addIndex('asset_audits', ['tenant_id'], { name: 'idx_audits_tenant' });
    await queryInterface.addIndex('asset_audits', ['asset_id'], { name: 'idx_audits_asset' });
    await queryInterface.addIndex('asset_audits', ['audit_date'], { name: 'idx_audits_date' });
  },
  down: async (queryInterface) => { await queryInterface.dropTable('asset_audits'); },
};
