'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const Q = await queryInterface.describeTable('quotation_details');
    if (!Q.ordered_quantity) {
      await queryInterface.addColumn('quotation_details', 'ordered_quantity', {
        type: Sequelize.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0,
      });
    }

    const SOD = await queryInterface.describeTable('sales_order_details');
    if (!SOD.quotation_detail_id) {
      await queryInterface.addColumn('sales_order_details', 'quotation_detail_id', {
        type: Sequelize.UUID,
        allowNull: true,
      });
    }
    if (!SOD.invoiced_quantity) {
      await queryInterface.addColumn('sales_order_details', 'invoiced_quantity', {
        type: Sequelize.DECIMAL(15, 3),
        allowNull: false,
        defaultValue: 0,
      });
    }

    const SID = await queryInterface.describeTable('sales_invoice_details');
    if (!SID.delivery_note_detail_id) {
      await queryInterface.addColumn('sales_invoice_details', 'delivery_note_detail_id', {
        type: Sequelize.UUID,
        allowNull: true,
      });
    }
    if (!SID.sales_order_detail_id) {
      await queryInterface.addColumn('sales_invoice_details', 'sales_order_detail_id', {
        type: Sequelize.UUID,
        allowNull: true,
      });
    }

    await queryInterface.sequelize.query(
      "ALTER TABLE quotations MODIFY COLUMN status ENUM('draft','sent','approved','rejected','converted','partially_ordered','fully_ordered','cancelled') NOT NULL DEFAULT 'draft'"
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE sales_orders MODIFY COLUMN status ENUM('draft','approved','confirmed','partially_delivered','delivered','partially_invoiced','fully_invoiced','closed','cancelled') NOT NULL DEFAULT 'draft'"
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('quotation_details', 'ordered_quantity');
    await queryInterface.removeColumn('sales_order_details', 'quotation_detail_id');
    await queryInterface.removeColumn('sales_order_details', 'invoiced_quantity');
    await queryInterface.removeColumn('sales_invoice_details', 'delivery_note_detail_id');
    await queryInterface.removeColumn('sales_invoice_details', 'sales_order_detail_id');
  },
};
