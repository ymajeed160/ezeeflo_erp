'use strict';

// Tables that already have `deleted_at` (paranoid: true) — add audit columns only.
const PARANOID_TABLES = ['delivery_notes', 'goodsreceipts', 'purchasereturns', 'supplier_payments'];

// Tables without paranoid — need `deleted_at` as well as audit columns.
const NON_PARANOID_TABLES = ['sales_returns', 'customer_payments', 'cash_payment_vouchers'];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const all = [
      ...PARANOID_TABLES.map((t) => ({ table: t, withDeletedAt: false })),
      ...NON_PARANOID_TABLES.map((t) => ({ table: t, withDeletedAt: true })),
    ];

    for (const { table, withDeletedAt } of all) {
      const cols = await queryInterface.describeTable(table);
      if (withDeletedAt && !cols.deleted_at) {
        await queryInterface.addColumn(table, 'deleted_at', { type: Sequelize.DATE, allowNull: true });
      }
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
    const all = [
      ...PARANOID_TABLES.map((t) => ({ table: t, withDeletedAt: false })),
      ...NON_PARANOID_TABLES.map((t) => ({ table: t, withDeletedAt: true })),
    ];
    for (const { table, withDeletedAt } of all) {
      await queryInterface.removeColumn(table, 'deleted_by');
      await queryInterface.removeColumn(table, 'delete_reason');
      await queryInterface.removeColumn(table, 'cancel_reason');
      if (withDeletedAt) {
        await queryInterface.removeColumn(table, 'deleted_at');
      }
    }
  },
};
