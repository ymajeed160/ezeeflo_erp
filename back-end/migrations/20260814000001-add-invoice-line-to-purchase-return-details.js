'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add invoice-line reference to purchase return details (invoice-based returns)
    const columns = await queryInterface.describeTable('purchasereturndetails');
    if (!columns.purchase_invoice_line_id) {
      await queryInterface.addColumn('purchasereturndetails', 'purchase_invoice_line_id', {
        type: Sequelize.UUID,
        allowNull: true,
      });
    }

    // Add posted/reversed statuses to purchase returns
    await queryInterface.sequelize.query(
      "ALTER TABLE purchasereturns MODIFY COLUMN status ENUM('draft','approved','rejected','posted','reversed') NOT NULL DEFAULT 'draft'"
    );
  },

  down: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('purchasereturndetails');
    if (columns.purchase_invoice_line_id) {
      await queryInterface.removeColumn('purchasereturndetails', 'purchase_invoice_line_id');
    }
    await queryInterface.sequelize.query(
      "ALTER TABLE purchasereturns MODIFY COLUMN status ENUM('draft','approved','rejected') NOT NULL DEFAULT 'draft'"
    );
  },
};
