'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      "ALTER TABLE sales_returns MODIFY COLUMN status ENUM('draft','approved','rejected','posted') NOT NULL DEFAULT 'draft'"
    );
    const cols = await queryInterface.describeTable('sales_return_details');
    if (!cols.cost_price) {
      await queryInterface.addColumn('sales_return_details', 'cost_price', {
        type: Sequelize.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      "ALTER TABLE sales_returns MODIFY COLUMN status ENUM('draft','approved','rejected') NOT NULL DEFAULT 'draft'"
    );
    await queryInterface.removeColumn('sales_return_details', 'cost_price');
  },
};
