'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('debit_notes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' }
      },
      debit_note_number: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      debit_note_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      supplier_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'suppliers', key: 'id' }
      },
      purchase_return_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'purchase_returns', key: 'id' }
      },
      reference_type: {
        type: Sequelize.ENUM('PurchaseReturn', 'Manual'),
        allowNull: false,
        defaultValue: 'Manual'
      },
      reference_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      amount: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('Draft', 'Approved', 'Cancelled'),
        allowNull: false,
        defaultValue: 'Draft'
      },
      journal_entry_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'journal_entries', key: 'id' }
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      approved_by: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    await queryInterface.addIndex('debit_notes', ['tenant_id', 'debit_note_number'], {
      unique: true,
      name: 'idx_debit_notes_tenant_number'
    });
    await queryInterface.addIndex('debit_notes', ['tenant_id', 'supplier_id'], { name: 'idx_debit_notes_supplier' });
    await queryInterface.addIndex('debit_notes', ['tenant_id', 'status'], { name: 'idx_debit_notes_status' });
    await queryInterface.addIndex('debit_notes', ['tenant_id', 'debit_note_date'], { name: 'idx_debit_notes_date' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('debit_notes');
  }
};