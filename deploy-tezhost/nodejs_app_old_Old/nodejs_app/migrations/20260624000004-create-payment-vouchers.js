'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // payment_vouchers table
    await queryInterface.createTable('payment_vouchers', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'tenants', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      voucher_number: { type: Sequelize.STRING(50), allowNull: false },
      voucher_date: { type: Sequelize.DATEONLY, allowNull: false },
      supplier_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'suppliers', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      bank_account_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'bank_accounts', key: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
      payment_method: { type: Sequelize.ENUM('Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Online Payment', 'Other'), allowNull: false, defaultValue: 'Bank Transfer' },
      reference_number: { type: Sequelize.STRING(100), allowNull: true },
      amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0.00 },
      currency_code: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'USD' },
      exchange_rate: { type: Sequelize.DECIMAL(18, 6), allowNull: true, defaultValue: 1.000000 },
      paid_to: { type: Sequelize.STRING(200), allowNull: true },
      payment_purpose: { type: Sequelize.ENUM('Supplier Payment', 'Direct Expense', 'Advance Payment', 'Other'), allowNull: false, defaultValue: 'Supplier Payment' },
      status: { type: Sequelize.ENUM('Draft', 'Posted', 'Cancelled', 'Reversed'), allowNull: false, defaultValue: 'Draft' },
      journal_entry_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'journal_entries', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      updated_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('payment_vouchers', ['voucher_number', 'tenant_id'], { unique: true, name: 'unique_voucher_number_tenant' });
    await queryInterface.addIndex('payment_vouchers', ['tenant_id'], { name: 'idx_voucher_tenant' });
    await queryInterface.addIndex('payment_vouchers', ['supplier_id'], { name: 'idx_voucher_supplier' });
    await queryInterface.addIndex('payment_vouchers', ['bank_account_id'], { name: 'idx_voucher_bank_account' });
    await queryInterface.addIndex('payment_vouchers', ['status'], { name: 'idx_voucher_status' });

    // payment_voucher_allocations table
    await queryInterface.createTable('payment_voucher_allocations', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'tenants', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      payment_voucher_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'payment_vouchers', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      purchase_invoice_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'PurchaseInvoices', key: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
      allocated_amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0.00 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('payment_voucher_allocations', ['payment_voucher_id'], { name: 'idx_voucher_alloc_voucher' });
    await queryInterface.addIndex('payment_voucher_allocations', ['purchase_invoice_id'], { name: 'idx_voucher_alloc_invoice' });

    // payment_voucher_lines table (for direct expense distribution)
    await queryInterface.createTable('payment_voucher_lines', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'tenants', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      payment_voucher_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'payment_vouchers', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      account_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'accounts', key: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
      description: { type: Sequelize.TEXT, allowNull: true },
      amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0.00 },
      tax_percentage: { type: Sequelize.DECIMAL(5, 2), allowNull: true, defaultValue: 0.00 },
      tax_account_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'accounts', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('payment_voucher_lines', ['payment_voucher_id'], { name: 'idx_voucher_lines_voucher' });
    await queryInterface.addIndex('payment_voucher_lines', ['account_id'], { name: 'idx_voucher_lines_account' });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('payment_voucher_lines');
    await queryInterface.dropTable('payment_voucher_allocations');
    await queryInterface.dropTable('payment_vouchers');
  },
};
