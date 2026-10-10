const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryTransaction = sequelize.define('InventoryTransaction', {
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
  transactionType: {
    type: DataTypes.ENUM('purchase', 'sale', 'adjustment', 'transfer_in', 'transfer_out', 'opening_balance', 'return', 'receipt', 'receipt_cancel'),
    allowNull: false,
    validate: {
      isIn: [['purchase', 'sale', 'adjustment', 'transfer_in', 'transfer_out', 'opening_balance', 'return', 'receipt', 'receipt_cancel']],
    },
  },
  referenceType: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  referenceId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  referenceLineId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  quantityIn: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0,
  },
  quantityOut: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0,
  },
  runningBalance: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0,
  },
  unitCost: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0,
  },
  transactionDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'inventory_transactions',
  underscored: true,
  timestamps: false,
  paranoid: false,
  indexes: [
    {
      fields: ['tenant_id'],
      name: 'idx_inv_tx_tenant',
    },
    {
      fields: ['item_id'],
      name: 'idx_inv_tx_item',
    },
    {
      fields: ['variant_id'],
      name: 'idx_inv_trans_variant',
    },
    {
      fields: ['item_id', 'variant_id'],
      name: 'idx_inv_trans_item_variant',
    },
    {
      fields: ['warehouse_id'],
      name: 'idx_inv_tx_warehouse',
    },
    {
      fields: ['transaction_type'],
      name: 'idx_inv_tx_type',
    },
    {
      fields: ['reference_type', 'reference_id'],
      name: 'idx_inv_tx_reference',
    },
    {
      fields: ['transaction_date'],
      name: 'idx_inv_tx_date',
    },
  ],
});

module.exports = InventoryTransaction;