'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * InventoryCostLayer
 *
 * A FIFO cost layer established by every stock-inward movement (purchase
 * invoice, goods receipt, positive stock adjustment, warehouse transfer-in,
 * sales return, purchase return reversal, opening balance).
 *
 * Each layer is traceable to its source receipt and is consumed oldest-first
 * (FIFO) by sales posting. `fifo_seq` is a database-managed monotonic
 * auto-increment key that provides a deterministic tie-breaker for receipts
 * sharing the same receipt_date.
 */
const InventoryCostLayer = sequelize.define('InventoryCostLayer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
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
  sourceType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [[
        'purchase', 'receipt', 'adjustment', 'transfer_in',
        'opening_balance', 'return', 'sales_return', 'purchase_return',
      ]],
    },
  },
  sourceId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  sourceLineId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  stockInTransactionId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  receivedQuantity: {
    type: DataTypes.DECIMAL(18, 4),
    allowNull: false,
    defaultValue: 0,
  },
  remainingQuantity: {
    type: DataTypes.DECIMAL(18, 4),
    allowNull: false,
    defaultValue: 0,
  },
  unitCost: {
    type: DataTypes.DECIMAL(18, 6),
    allowNull: false,
    defaultValue: 0,
  },
  originalValue: {
    type: DataTypes.DECIMAL(18, 6),
    allowNull: false,
    defaultValue: 0,
  },
  remainingValue: {
    type: DataTypes.DECIMAL(18, 6),
    allowNull: false,
    defaultValue: 0,
  },
  receiptDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  fifoSeq: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
  },
}, {
  tableName: 'inventory_cost_layers',
  underscored: true,
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      fields: ['tenant_id', 'item_id', 'warehouse_id', 'variant_id', 'fifo_seq'],
      name: 'idx_cost_layers_fifo',
    },
    {
      fields: ['source_type', 'source_id', 'source_line_id'],
      name: 'idx_cost_layers_source',
    },
    {
      fields: ['stock_in_transaction_id'],
      name: 'idx_cost_layers_stock_in',
    },
    {
      fields: ['receipt_date'],
      name: 'idx_cost_layers_receipt_date',
    },
  ],
});

module.exports = InventoryCostLayer;
