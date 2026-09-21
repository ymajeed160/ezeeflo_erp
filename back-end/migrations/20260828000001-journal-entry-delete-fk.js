'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const t = await queryInterface.sequelize.transaction();
    try {
      // 1. sales_returns.journal_entry_id currently ON DELETE RESTRICT -> change to SET NULL
      await queryInterface.sequelize.query(
        'ALTER TABLE `sales_returns` DROP FOREIGN KEY `sales_returns_ibfk_5`',
        { transaction: t }
      ).catch(() => {});
      await queryInterface.sequelize.query(
        'ALTER TABLE `sales_returns` ADD CONSTRAINT `sales_returns_ibfk_5` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON UPDATE CASCADE ON DELETE SET NULL',
        { transaction: t }
      );

      // 2. cash_payment_vouchers.journal_entry_id has NO FK — fix collation + add one with SET NULL
      await queryInterface.sequelize.query(
        'ALTER TABLE `cash_payment_vouchers` MODIFY COLUMN `journal_entry_id` CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE `cash_payment_vouchers` ADD CONSTRAINT `cash_payment_vouchers_ibfk_je` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON UPDATE CASCADE ON DELETE SET NULL',
        { transaction: t }
      ).catch(() => {});

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        'ALTER TABLE `cash_payment_vouchers` DROP FOREIGN KEY `cash_payment_vouchers_ibfk_je`',
        { transaction: t }
      ).catch(() => {});
      await queryInterface.sequelize.query(
        'ALTER TABLE `sales_returns` DROP FOREIGN KEY `sales_returns_ibfk_5`',
        { transaction: t }
      ).catch(() => {});
      await queryInterface.sequelize.query(
        'ALTER TABLE `sales_returns` ADD CONSTRAINT `sales_returns_ibfk_5` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT',
        { transaction: t }
      );
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },
};
