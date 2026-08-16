'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ============================================================
    // 1. POS Terminals
    // ============================================================
    await queryInterface.createTable('pos_terminals', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      terminal_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      terminal_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      warehouse_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'warehouses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      default_cash_account_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'accounts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      default_bank_account_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'accounts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      default_currency: {
        type: Sequelize.STRING(10),
        defaultValue: 'AED',
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'maintenance'),
        defaultValue: 'active',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('pos_terminals', ['tenant_id'], { name: 'idx_pos_terminal_tenant' });
    await queryInterface.addIndex('pos_terminals', ['warehouse_id'], { name: 'idx_pos_terminal_warehouse' });
    await queryInterface.addIndex('pos_terminals', ['status'], { name: 'idx_pos_terminal_status' });
    await queryInterface.addIndex('pos_terminals', ['terminal_code', 'tenant_id'], {
      unique: true,
      name: 'uq_pos_terminal_code_tenant',
    });

    // ============================================================
    // 2. POS Terminal Users (assignment)
    // ============================================================
    await queryInterface.createTable('pos_terminal_users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      terminal_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'pos_terminals', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('pos_terminal_users', ['terminal_id'], { name: 'idx_pos_tu_terminal' });
    await queryInterface.addIndex('pos_terminal_users', ['user_id'], { name: 'idx_pos_tu_user' });
    await queryInterface.addIndex('pos_terminal_users', ['terminal_id', 'user_id'], {
      unique: true,
      name: 'uq_pos_tu_terminal_user',
    });

    // ============================================================
    // 3. POS Sessions
    // ============================================================
    await queryInterface.createTable('pos_sessions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      terminal_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'pos_terminals', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      warehouse_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'warehouses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      session_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      opening_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      closing_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      opening_cash: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      closing_cash: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      expected_cash: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      actual_cash: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      cash_difference: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      cash_sales_total: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      card_sales_total: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      bank_sales_total: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      credit_sales_total: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      cash_in_total: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      cash_out_total: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      refund_total: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      total_sales_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('open', 'closed', 'suspended'),
        defaultValue: 'open',
      },
      opening_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      closing_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      manager_approved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      manager_approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('pos_sessions', ['tenant_id'], { name: 'idx_pos_session_tenant' });
    await queryInterface.addIndex('pos_sessions', ['terminal_id'], { name: 'idx_pos_session_terminal' });
    await queryInterface.addIndex('pos_sessions', ['user_id'], { name: 'idx_pos_session_user' });
    await queryInterface.addIndex('pos_sessions', ['status'], { name: 'idx_pos_session_status' });
    await queryInterface.addIndex('pos_sessions', ['session_number'], { name: 'idx_pos_session_number' });
    await queryInterface.addIndex('pos_sessions', ['tenant_id', 'terminal_id', 'status'], { name: 'idx_pos_session_active' });

    // ============================================================
    // 4. POS Sales
    // ============================================================
    await queryInterface.createTable('pos_sales', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      terminal_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'pos_terminals', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'pos_sessions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'customers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      warehouse_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'warehouses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      invoice_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      invoice_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      sub_total: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      discount_total: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      discount_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.00,
      },
      discount_reason: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      tax_total: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      grand_total: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      status: {
        type: Sequelize.ENUM('completed', 'cancelled', 'refunded'),
        defaultValue: 'completed',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      journal_entry_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'journal_entries', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      is_inventory_impact: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      cancelled_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      cancelled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      cancel_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('pos_sales', ['tenant_id'], { name: 'idx_pos_sale_tenant' });
    await queryInterface.addIndex('pos_sales', ['terminal_id'], { name: 'idx_pos_sale_terminal' });
    await queryInterface.addIndex('pos_sales', ['session_id'], { name: 'idx_pos_sale_session' });
    await queryInterface.addIndex('pos_sales', ['customer_id'], { name: 'idx_pos_sale_customer' });
    await queryInterface.addIndex('pos_sales', ['user_id'], { name: 'idx_pos_sale_user' });
    await queryInterface.addIndex('pos_sales', ['status'], { name: 'idx_pos_sale_status' });
    await queryInterface.addIndex('pos_sales', ['invoice_number'], {
      unique: true,
      name: 'uq_pos_sale_invoice_number',
    });
    await queryInterface.addIndex('pos_sales', ['invoice_date'], { name: 'idx_pos_sale_date' });
    await queryInterface.addIndex('pos_sales', ['tenant_id', 'invoice_date'], { name: 'idx_pos_sale_tenant_date' });

    // ============================================================
    // 5. POS Sale Lines
    // ============================================================
    await queryInterface.createTable('pos_sale_lines', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      pos_sale_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'pos_sales', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      item_name: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      sku: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      quantity: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 1.00,
      },
      unit_price: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      cost_price: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      discount_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.00,
      },
      discount_amount: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      tax_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.00,
      },
      tax_amount: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      line_total: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      is_service: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('pos_sale_lines', ['pos_sale_id'], { name: 'idx_pos_sl_sale' });
    await queryInterface.addIndex('pos_sale_lines', ['item_id'], { name: 'idx_pos_sl_item' });

    // ============================================================
    // 6. POS Payments
    // ============================================================
    await queryInterface.createTable('pos_payments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      pos_sale_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'pos_sales', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      payment_method: {
        type: Sequelize.ENUM('cash', 'card', 'bank_transfer', 'credit'),
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      reference: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      account_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'accounts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      change_amount: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('pos_payments', ['pos_sale_id'], { name: 'idx_pos_pay_sale' });
    await queryInterface.addIndex('pos_payments', ['payment_method'], { name: 'idx_pos_pay_method' });

    // ============================================================
    // 7. POS Held Orders
    // ============================================================
    await queryInterface.createTable('pos_held_orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      terminal_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'pos_terminals', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'pos_sessions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'customers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      hold_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      cart_data: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('held', 'retrieved', 'cancelled'),
        defaultValue: 'held',
      },
      held_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      retrieved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      pos_sale_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'pos_sales', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('pos_held_orders', ['tenant_id'], { name: 'idx_pos_ho_tenant' });
    await queryInterface.addIndex('pos_held_orders', ['terminal_id'], { name: 'idx_pos_ho_terminal' });
    await queryInterface.addIndex('pos_held_orders', ['session_id'], { name: 'idx_pos_ho_session' });
    await queryInterface.addIndex('pos_held_orders', ['status'], { name: 'idx_pos_ho_status' });
    await queryInterface.addIndex('pos_held_orders', ['hold_number'], { name: 'idx_pos_ho_number' });

    // ============================================================
    // 8. POS Cash Movements
    // ============================================================
    await queryInterface.createTable('pos_cash_movements', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      terminal_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'pos_terminals', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'pos_sessions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      movement_type: {
        type: Sequelize.ENUM('cash_in', 'cash_out', 'adjustment', 'transfer'),
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      reference_type: {
        type: Sequelize.ENUM('payment', 'refund', 'expense', 'transfer', 'other'),
        allowNull: true,
      },
      reference: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('pos_cash_movements', ['tenant_id'], { name: 'idx_pos_cm_tenant' });
    await queryInterface.addIndex('pos_cash_movements', ['terminal_id'], { name: 'idx_pos_cm_terminal' });
    await queryInterface.addIndex('pos_cash_movements', ['session_id'], { name: 'idx_pos_cm_session' });
    await queryInterface.addIndex('pos_cash_movements', ['movement_type'], { name: 'idx_pos_cm_type' });

    // ============================================================
    // 9. POS Returns
    // ============================================================
    await queryInterface.createTable('pos_returns', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      terminal_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'pos_terminals', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'pos_sessions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'customers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      original_sale_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'pos_sales', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      original_invoice_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      return_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      return_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      sub_total: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      tax_total: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      grand_total: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      refund_amount: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      refund_method: {
        type: Sequelize.ENUM('cash', 'card', 'account_credit'),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('completed', 'cancelled'),
        defaultValue: 'completed',
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      journal_entry_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'journal_entries', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('pos_returns', ['tenant_id'], { name: 'idx_pos_ret_tenant' });
    await queryInterface.addIndex('pos_returns', ['terminal_id'], { name: 'idx_pos_ret_terminal' });
    await queryInterface.addIndex('pos_returns', ['session_id'], { name: 'idx_pos_ret_session' });
    await queryInterface.addIndex('pos_returns', ['original_sale_id'], { name: 'idx_pos_ret_original' });
    await queryInterface.addIndex('pos_returns', ['return_number'], {
      unique: true,
      name: 'uq_pos_return_number',
    });

    // ============================================================
    // 10. POS Return Lines
    // ============================================================
    await queryInterface.createTable('pos_return_lines', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      pos_return_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'pos_returns', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      original_sale_line_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'pos_sale_lines', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      quantity: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      unit_price: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      line_total: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      tax_amount: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0.00,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('pos_return_lines', ['pos_return_id'], { name: 'idx_pos_rl_return' });
    await queryInterface.addIndex('pos_return_lines', ['original_sale_line_id'], { name: 'idx_pos_rl_original_line' });

    // ============================================================
    // 11. POS Subscription Usage Tracking
    // ============================================================
    await queryInterface.createTable('pos_subscription_usage', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      usage_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      total_transactions: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      active_terminals: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      active_users: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      active_sessions: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('pos_subscription_usage', ['tenant_id'], { name: 'idx_pos_su_tenant' });
    await queryInterface.addIndex('pos_subscription_usage', ['tenant_id', 'usage_date'], {
      unique: true,
      name: 'uq_pos_su_tenant_date',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('pos_return_lines');
    await queryInterface.dropTable('pos_returns');
    await queryInterface.dropTable('pos_cash_movements');
    await queryInterface.dropTable('pos_held_orders');
    await queryInterface.dropTable('pos_payments');
    await queryInterface.dropTable('pos_sale_lines');
    await queryInterface.dropTable('pos_sales');
    await queryInterface.dropTable('pos_sessions');
    await queryInterface.dropTable('pos_terminal_users');
    await queryInterface.dropTable('pos_terminals');
    await queryInterface.dropTable('pos_subscription_usage');
  },
};
