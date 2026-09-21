'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('tenants', 'fiscal_year_start', {
      type: Sequelize.STRING(5),
      allowNull: false,
      defaultValue: '01-01',
    });
    await queryInterface.addColumn('tenants', 'fiscal_year_end', {
      type: Sequelize.STRING(5),
      allowNull: false,
      defaultValue: '12-31',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('tenants', 'fiscal_year_start');
    await queryInterface.removeColumn('tenants', 'fiscal_year_end');
  },
};
