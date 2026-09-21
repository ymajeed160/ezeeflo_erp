'use strict';

/**
 * Journal Entry Soft Delete
 *
 * Adds soft-delete support (`deleted_at`, `deleted_by`, `delete_reason`) to
 * `journal_entries` and `journal_entry_lines` so that deleted entries no longer
 * appear in search, lists, or the General Ledger.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const t = await queryInterface.sequelize.transaction();
    try {
      const jeCols = await queryInterface.describeTable('journal_entries');
      if (!jeCols.deleted_at) {
        await queryInterface.addColumn('journal_entries', 'deleted_at', { type: Sequelize.DATE, allowNull: true }, { transaction: t });
      }
      if (!jeCols.deleted_by) {
        await queryInterface.addColumn('journal_entries', 'deleted_by', { type: Sequelize.UUID, allowNull: true }, { transaction: t });
      }
      if (!jeCols.delete_reason) {
        await queryInterface.addColumn('journal_entries', 'delete_reason', { type: Sequelize.STRING(255), allowNull: true }, { transaction: t });
      }

      const jlCols = await queryInterface.describeTable('journal_entry_lines');
      if (!jlCols.deleted_at) {
        await queryInterface.addColumn('journal_entry_lines', 'deleted_at', { type: Sequelize.DATE, allowNull: true }, { transaction: t });
      }
      if (!jlCols.deleted_by) {
        await queryInterface.addColumn('journal_entry_lines', 'deleted_by', { type: Sequelize.UUID, allowNull: true }, { transaction: t });
      }

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('journal_entries', 'delete_reason', { transaction: t });
      await queryInterface.removeColumn('journal_entries', 'deleted_by', { transaction: t });
      await queryInterface.removeColumn('journal_entries', 'deleted_at', { transaction: t });
      await queryInterface.removeColumn('journal_entry_lines', 'deleted_by', { transaction: t });
      await queryInterface.removeColumn('journal_entry_lines', 'deleted_at', { transaction: t });
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },
};
