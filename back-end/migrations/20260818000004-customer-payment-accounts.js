'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('customer_payments');
    if (!table.cash_account_id) {
      await queryInterface.addColumn('customer_payments', 'cash_account_id', {
        type: Sequelize.UUID,
        allowNull: true,
      });
    }
    if (!table.bank_account_ref_id) {
      await queryInterface.addColumn('customer_payments', 'bank_account_ref_id', {
        type: Sequelize.UUID,
        allowNull: true,
      });
    }
    await queryInterface.sequelize.query(
      "ALTER TABLE customer_payments MODIFY COLUMN payment_method ENUM('cash','bank_transfer','cheque','online','credit_card','other') NOT NULL DEFAULT 'bank_transfer'"
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE customer_payments MODIFY COLUMN bank_account_ref_id CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL"
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE customer_payments ADD CONSTRAINT customer_payments_ibfk_7 FOREIGN KEY (bank_account_ref_id) REFERENCES bank_accounts(id) ON DELETE SET NULL ON UPDATE CASCADE"
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('ALTER TABLE customer_payments DROP FOREIGN KEY customer_payments_ibfk_7');
    await queryInterface.removeColumn('customer_payments', 'cash_account_id');
    await queryInterface.removeColumn('customer_payments', 'bank_account_ref_id');
  },
};
