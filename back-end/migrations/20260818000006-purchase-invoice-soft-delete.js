'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('purchaseinvoices');
    if (!table.deleted_by) {
      await queryInterface.addColumn('purchaseinvoices', 'deleted_by', { type: Sequelize.UUID, allowNull: true });
    }
    if (!table.delete_reason) {
      await queryInterface.addColumn('purchaseinvoices', 'delete_reason', { type: Sequelize.STRING(255), allowNull: true });
    }
    if (!table.cancel_reason) {
      await queryInterface.addColumn('purchaseinvoices', 'cancel_reason', { type: Sequelize.STRING(255), allowNull: true });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('purchaseinvoices', 'deleted_by');
    await queryInterface.removeColumn('purchaseinvoices', 'delete_reason');
    await queryInterface.removeColumn('purchaseinvoices', 'cancel_reason');
  },
};
