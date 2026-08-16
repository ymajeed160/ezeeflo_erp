'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // cash_payment_vouchers table
    await queryInterface.createTable('cash_payment_vouchers', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      branch_id: { type: Sequelize.UUID, allowNull: true },
      voucher_number: { type: Sequelize.STRING(50), allowNull: false },
      voucher_date: { type: Sequelize.DATEONLY, allowNull: false },
      cash_account_id: { type: Sequelize.UUID, allowNull: false },
      payee_type: { type: Sequelize.ENUM('supplier', 'employee', 'customer', 'other'), defaultValue: 'other' },
      payee_id: { type: Sequelize.UUID, allowNull: true },
      payee_name: { type: Sequelize.STRING(200), allowNull: true },
      reference_number: { type: Sequelize.STRING(100), allowNull: true },
      payment_method: { type: Sequelize.ENUM('cash', 'bank'), defaultValue: 'cash' },
      currency: { type: Sequelize.STRING(10), defaultValue: 'AED' },
      exchange_rate: { type: Sequelize.DECIMAL(10, 4), defaultValue: 1.0000 },
      description: { type: Sequelize.TEXT, allowNull: true },
      subtotal: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      tax_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      status: { type: Sequelize.ENUM('draft', 'submitted', 'approved', 'posted', 'cancelled', 'reversed'), defaultValue: 'draft' },
      journal_entry_id: { type: Sequelize.UUID, allowNull: true },
      is_deleted: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      posted_by: { type: Sequelize.UUID, allowNull: true },
      posted_at: { type: Sequelize.DATE, allowNull: true },
      reversed_by: { type: Sequelize.UUID, allowNull: true },
      reversed_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('cash_payment_vouchers', ['tenant_id']);
    await queryInterface.addIndex('cash_payment_vouchers', ['voucher_number']);
    await queryInterface.addIndex('cash_payment_vouchers', ['status']);
    await queryInterface.addIndex('cash_payment_vouchers', ['voucher_date']);
    await queryInterface.addIndex('cash_payment_vouchers', ['cash_account_id']);
    await queryInterface.addIndex('cash_payment_vouchers', ['journal_entry_id']);

    // cash_payment_voucher_lines table
    await queryInterface.createTable('cash_payment_voucher_lines', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      voucher_id: { type: Sequelize.UUID, allowNull: false },
      account_id: { type: Sequelize.UUID, allowNull: false },
      description: { type: Sequelize.STRING(255), allowNull: true },
      amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      tax_id: { type: Sequelize.UUID, allowNull: true },
      tax_rate: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      tax_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      cost_center_id: { type: Sequelize.UUID, allowNull: true },
      department_id: { type: Sequelize.UUID, allowNull: true },
      project_id: { type: Sequelize.UUID, allowNull: true },
      line_number: { type: Sequelize.INTEGER, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('cash_payment_voucher_lines', ['voucher_id']);
    await queryInterface.addIndex('cash_payment_voucher_lines', ['account_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('cash_payment_voucher_lines');
    await queryInterface.dropTable('cash_payment_vouchers');
  },
};
