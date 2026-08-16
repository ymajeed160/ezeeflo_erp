'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // cash_receipt_vouchers table
    await queryInterface.createTable('cash_receipt_vouchers', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      branch_id: { type: Sequelize.UUID, allowNull: true },
      voucher_number: { type: Sequelize.STRING(50), allowNull: false },
      voucher_date: { type: Sequelize.DATEONLY, allowNull: false },
      cash_account_id: { type: Sequelize.UUID, allowNull: false },
      payer_type: { type: Sequelize.ENUM('customer', 'supplier', 'employee', 'other'), defaultValue: 'other' },
      payer_id: { type: Sequelize.UUID, allowNull: true },
      payer_name: { type: Sequelize.STRING(200), allowNull: true },
      reference_number: { type: Sequelize.STRING(100), allowNull: true },
      payment_method: { type: Sequelize.ENUM('cash', 'bank'), defaultValue: 'cash' },
      currency: { type: Sequelize.STRING(10), defaultValue: 'AED' },
      exchange_rate: { type: Sequelize.DECIMAL(10, 4), defaultValue: 1.0000 },
      description: { type: Sequelize.TEXT, allowNull: true },
      subtotal: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      tax_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      allocated_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      unallocated_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
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

    await queryInterface.addIndex('cash_receipt_vouchers', ['tenant_id']);
    await queryInterface.addIndex('cash_receipt_vouchers', ['voucher_number']);
    await queryInterface.addIndex('cash_receipt_vouchers', ['status']);
    await queryInterface.addIndex('cash_receipt_vouchers', ['voucher_date']);
    await queryInterface.addIndex('cash_receipt_vouchers', ['cash_account_id']);
    await queryInterface.addIndex('cash_receipt_vouchers', ['journal_entry_id']);

    // cash_receipt_voucher_lines table
    await queryInterface.createTable('cash_receipt_voucher_lines', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      voucher_id: { type: Sequelize.UUID, allowNull: false },
      account_id: { type: Sequelize.UUID, allowNull: false },
      party_id: { type: Sequelize.UUID, allowNull: true },
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

    await queryInterface.addIndex('cash_receipt_voucher_lines', ['voucher_id']);
    await queryInterface.addIndex('cash_receipt_voucher_lines', ['account_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('cash_receipt_voucher_lines');
    await queryInterface.dropTable('cash_receipt_vouchers');
  },
};
