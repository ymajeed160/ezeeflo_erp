'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('quotations');
    if (!table.confirmed_by) {
      await queryInterface.addColumn('quotations', 'confirmed_by', {
        type: Sequelize.UUID,
        allowNull: true,
      });
    }
    if (!table.confirmed_at) {
      await queryInterface.addColumn('quotations', 'confirmed_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('quotations', 'confirmed_by');
    await queryInterface.removeColumn('quotations', 'confirmed_at');
  },
};
