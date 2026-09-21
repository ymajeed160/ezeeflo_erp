'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('sales_invoices');
    if (!table.deleted_by) {
      await queryInterface.addColumn('sales_invoices', 'deleted_by', { type: Sequelize.UUID, allowNull: true });
    }
    if (!table.delete_reason) {
      await queryInterface.addColumn('sales_invoices', 'delete_reason', { type: Sequelize.STRING(255), allowNull: true });
    }
    if (!table.cancel_reason) {
      await queryInterface.addColumn('sales_invoices', 'cancel_reason', { type: Sequelize.STRING(255), allowNull: true });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('sales_invoices', 'deleted_by');
    await queryInterface.removeColumn('sales_invoices', 'delete_reason');
    await queryInterface.removeColumn('sales_invoices', 'cancel_reason');
  },
};
