'use strict';

const TABLES = ['quotations', 'sales_orders', 'purchase_requests', 'purchaseorders'];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (const table of TABLES) {
      const cols = await queryInterface.describeTable(table);
      if (!cols.deleted_by) {
        await queryInterface.addColumn(table, 'deleted_by', { type: Sequelize.UUID, allowNull: true });
      }
      if (!cols.delete_reason) {
        await queryInterface.addColumn(table, 'delete_reason', { type: Sequelize.STRING(255), allowNull: true });
      }
      if (!cols.cancel_reason) {
        await queryInterface.addColumn(table, 'cancel_reason', { type: Sequelize.STRING(255), allowNull: true });
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    for (const table of TABLES) {
      await queryInterface.removeColumn(table, 'deleted_by');
      await queryInterface.removeColumn(table, 'delete_reason');
      await queryInterface.removeColumn(table, 'cancel_reason');
    }
  },
};
