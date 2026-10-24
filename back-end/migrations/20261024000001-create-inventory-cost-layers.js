'use strict';

/**
 * Add FIFO inventory cost layers and per-sale cost allocations.
 *
 * inventory_cost_layers      — one row per stock receipt (FIFO layer).
 * inventory_cost_allocations — one row per FIFO consumption/restoration.
 *
 * The `fifo_seq` column on inventory_cost_layers is an auto-increment key that
 * provides a deterministic FIFO tie-breaker for receipts sharing the same date.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('inventory_cost_layers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      item_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      variant_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      warehouse_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      source_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      source_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      source_line_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      stock_in_transaction_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      received_quantity: {
        type: Sequelize.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0,
      },
      remaining_quantity: {
        type: Sequelize.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0,
      },
      unit_cost: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
      },
      original_value: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
      },
      remaining_value: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
      },
      receipt_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      fifo_seq: {
        type: Sequelize.BIGINT,
        allowNull: false,
        autoIncrement: true,
        unique: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('inventory_cost_layers', ['tenant_id', 'item_id', 'warehouse_id', 'variant_id', 'fifo_seq'], {
      name: 'idx_cost_layers_fifo',
    });
    await queryInterface.addIndex('inventory_cost_layers', ['source_type', 'source_id', 'source_line_id'], {
      name: 'idx_cost_layers_source',
    });
    await queryInterface.addIndex('inventory_cost_layers', ['stock_in_transaction_id'], {
      name: 'idx_cost_layers_stock_in',
    });
    await queryInterface.addIndex('inventory_cost_layers', ['receipt_date'], {
      name: 'idx_cost_layers_receipt_date',
    });

    await queryInterface.createTable('inventory_cost_allocations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      allocation_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      sales_invoice_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      sales_invoice_detail_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      sales_return_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      sales_return_detail_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      item_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      variant_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      warehouse_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      cost_layer_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      quantity: {
        type: Sequelize.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0,
      },
      unit_cost: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
      },
      total_cost: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
      },
      stock_transaction_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      reverses_allocation_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('inventory_cost_allocations', ['sales_invoice_id', 'sales_invoice_detail_id'], {
      name: 'idx_alloc_sale_line',
    });
    await queryInterface.addIndex('inventory_cost_allocations', ['sales_return_id', 'sales_return_detail_id'], {
      name: 'idx_alloc_return_line',
    });
    await queryInterface.addIndex('inventory_cost_allocations', ['cost_layer_id'], {
      name: 'idx_alloc_layer',
    });
    await queryInterface.addIndex('inventory_cost_allocations', ['tenant_id', 'item_id', 'warehouse_id'], {
      name: 'idx_alloc_scope',
    });
    // Each allocation maps to exactly one stock movement row.
    await queryInterface.addIndex('inventory_cost_allocations', ['stock_transaction_id'], {
      unique: true,
      name: 'uniq_alloc_stock_tx',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('inventory_cost_allocations');
    await queryInterface.dropTable('inventory_cost_layers');
  },
};
