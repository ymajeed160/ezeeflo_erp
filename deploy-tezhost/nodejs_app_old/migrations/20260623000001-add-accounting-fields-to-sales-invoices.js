'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add accounting-related columns to sales_invoices table
    await queryInterface.addColumn('sales_invoices', 'customer_account_id', {
      type: Sequelize.UUID,
      allowNull: true,
    });

    await queryInterface.addColumn('sales_invoices', 'revenue_account_id', {
      type: Sequelize.UUID,
      allowNull: true,
    });

    await queryInterface.addColumn('sales_invoices', 'tax_account_id', {
      type: Sequelize.UUID,
      allowNull: true,
    });

    // Add indexes for the new columns
    await queryInterface.addIndex('sales_invoices', ['customer_account_id'], {
      name: 'idx_si_customer_account',
    });
    await queryInterface.addIndex('sales_invoices', ['revenue_account_id'], {
      name: 'idx_si_revenue_account',
    });
    await queryInterface.addIndex('sales_invoices', ['tax_account_id'], {
      name: 'idx_si_tax_account',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('sales_invoices', 'idx_si_tax_account');
    await queryInterface.removeIndex('sales_invoices', 'idx_si_revenue_account');
    await queryInterface.removeIndex('sales_invoices', 'idx_si_customer_account');
    await queryInterface.removeColumn('sales_invoices', 'tax_account_id');
    await queryInterface.removeColumn('sales_invoices', 'revenue_account_id');
    await queryInterface.removeColumn('sales_invoices', 'customer_account_id');
  },
};
