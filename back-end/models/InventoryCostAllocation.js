'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * InventoryCostAllocation
 *
 * Persists the exact FIFO cost allocations used to fulfil a sales invoice
 * line, and the restoration allocations created when that stock is returned
 * or the invoice is cancelled.
 *
 * - allocationType 'sale'    → stock consumed from a cost layer.
 * - allocationType 'return'  → stock restored by a sales return.
 * - allocationType 'cancel'  → stock restored by an invoice cancellation/unpost.
 *
 * `stockTransactionId` links the allocation to the exact inventory_transactions
 * row it generated, making stock history reconcilable per FIFO allocation.
 */
const InventoryCostAllocation = sequelize.define('InventoryCostAllocation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  allocationType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['sale', 'return', 'cancel']],
    },
  },
  salesInvoiceId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  salesInvoiceDetailId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  salesReturnId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  salesReturnDetailId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  itemId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  variantId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  warehouseId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  costLayerId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.DECIMAL(18, 4),
    allowNull: false,
    defaultValue: 0,
  },
  unitCost: {
    type: DataTypes.DECIMAL(18, 6),
    allowNull: false,
    defaultValue: 0,
  },
  totalCost: {
    type: DataTypes.DECIMAL(18, 6),
    allowNull: false,
    defaultValue: 0,
  },
  stockTransactionId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  reversesAllocationId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'inventory_cost_allocations',
  underscored: true,
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      fields: ['sales_invoice_id', 'sales_invoice_detail_id'],
      name: 'idx_alloc_sale_line',
    },
    {
      fields: ['sales_return_id', 'sales_return_detail_id'],
      name: 'idx_alloc_return_line',
    },
    {
      fields: ['cost_layer_id'],
      name: 'idx_alloc_layer',
    },
    {
      fields: ['tenant_id', 'item_id', 'warehouse_id'],
      name: 'idx_alloc_scope',
    },
  ],
});

module.exports = InventoryCostAllocation;
