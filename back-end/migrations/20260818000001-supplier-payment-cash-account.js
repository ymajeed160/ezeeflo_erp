'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('supplier_payments');
    if (!table.cash_account_id) {
      await queryInterface.addColumn('supplier_payments', 'cash_account_id', {
        type: Sequelize.UUID,
        allowNull: true,
      });
    }
    // Normalize collation to match accounts.id (utf8_bin) so the FK can be created
    await queryInterface.sequelize.query(
      'ALTER TABLE supplier_payments MODIFY COLUMN cash_account_id CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE supplier_payments ADD CONSTRAINT supplier_payments_ibfk_7 FOREIGN KEY (cash_account_id) REFERENCES accounts(id) ON DELETE SET NULL ON UPDATE CASCADE'
    );
    await queryInterface.addIndex('supplier_payments', ['cash_account_id'], {
      name: 'idx_supplier_payments_cash_account',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('supplier_payments', 'idx_supplier_payments_cash_account');
    await queryInterface.sequelize.query(
      'ALTER TABLE supplier_payments DROP FOREIGN KEY supplier_payments_ibfk_7'
    );
    await queryInterface.removeColumn('supplier_payments', 'cash_account_id');
  },
};
