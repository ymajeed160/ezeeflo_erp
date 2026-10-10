const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryBalance = sequelize.define('InventoryBalance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  warehouseId: {
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
  quantityOnHand: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Quantity cannot be negative' },
    },
  },
  averageCost: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0,
  },
}, {
  tableName: 'inventory_balances',
  underscored: true,
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['warehouse_id', 'item_id', 'variant_id'],
      name: 'unique_warehouse_item_variant',
    },
    {
      fields: ['tenant_id'],
      name: 'idx_inventory_balances_tenant',
    },
    {
      fields: ['warehouse_id'],
      name: 'idx_inventory_balances_warehouse',
    },
    {
      fields: ['item_id'],
      name: 'idx_inventory_balances_item',
    },
  ],
});

module.exports = InventoryBalance;