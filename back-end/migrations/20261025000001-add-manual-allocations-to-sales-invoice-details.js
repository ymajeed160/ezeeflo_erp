'use strict';

/**
 * Add manual stock-source allocations to sales invoice detail lines.
 *
 * When a user manually selects the stock source(s) (GRN / direct Purchase
 * Invoice) for a sales invoice line, the selection is persisted here as a
 * JSON array so the posting step can re-apply exactly what the user chose:
 *
 *   [{ costLayerId: <uuid>, quantity: <number>, sourceNumber?, unitCost? }]
 *
 * The authoritative per-layer cost record is still written to
 * `inventory_cost_allocations` at posting time; this column only carries the
 * user's pre-posting selection so it survives a save/reopen or a post from the
 * list view. The column is nullable and has no default, so existing rows and
 * the existing FIFO behaviour are unaffected.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('sales_invoice_details', 'manual_allocations', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('sales_invoice_details', 'manual_allocations');
  },
};
