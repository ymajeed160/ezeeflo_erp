'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Composite index for inventory aging/valuation report queries
    // (filter by tenant + transaction date, then item/warehouse/type).
    await queryInterface.sequelize.query(
      'CREATE INDEX `idx_inv_tx_tenant_date` ON `inventory_transactions` (`tenant_id`, `transaction_date`)'
    ).catch(() => {});
    await queryInterface.sequelize.query(
      'CREATE INDEX `idx_inv_tx_tenant_item_wh` ON `inventory_transactions` (`tenant_id`, `item_id`, `warehouse_id`)'
    ).catch(() => {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      'ALTER TABLE `inventory_transactions` DROP INDEX `idx_inv_tx_tenant_date`'
    ).catch(() => {});
    await queryInterface.sequelize.query(
      'ALTER TABLE `inventory_transactions` DROP INDEX `idx_inv_tx_tenant_item_wh`'
    ).catch(() => {});
  },
};
