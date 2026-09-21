const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Item = sequelize.define('Item', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  itemCode: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Item code is required' },
      len: { args: [1, 100], msg: 'Item code must be between 1 and 100 characters' },
    },
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Item name is required' },
      len: { args: [2, 200], msg: 'Item name must be between 2 and 200 characters' },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  model: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  size: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  ram: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  processor: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  ssd: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  generation: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  colour: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  itemType: {
    type: DataTypes.ENUM('product', 'service'),
    allowNull: false,
    defaultValue: 'product',
    validate: {
      isIn: {
        args: [['product', 'service']],
        msg: 'Item type must be either "product" or "service"',
      },
    },
  },
  unitOfMeasure: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'EA',
  },
  costPrice: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
    defaultValue: 0.00,
    validate: {
      isDecimal: { msg: 'Cost price must be a valid decimal' },
    },
  },
  sellingPrice: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
    defaultValue: 0.00,
    validate: {
      isDecimal: { msg: 'Selling price must be a valid decimal' },
    },
  },
  taxPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0.00,
    validate: {
      isDecimal: { msg: 'Tax percentage must be a valid decimal' },
      min: { args: [0], msg: 'Tax percentage cannot be negative' },
      max: { args: [100], msg: 'Tax percentage cannot exceed 100' },
    },
  },
  isInventoryTracked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  incomeAccountId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  expenseAccountId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  inventoryAccountId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'items',
  underscored: true,
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['item_code', 'tenant_id'],
      name: 'unique_item_code_tenant',
    },
    {
      fields: ['tenant_id'],
      name: 'idx_item_tenant',
    },
    {
      fields: ['category_id'],
      name: 'idx_item_category',
    },
    {
      fields: ['item_type'],
      name: 'idx_item_type',
    },
    {
      fields: ['is_active'],
      name: 'idx_item_status',
    },
    {
      fields: ['income_account_id'],
      name: 'idx_item_income_account',
    },
    {
      fields: ['expense_account_id'],
      name: 'idx_item_expense_account',
    },
    {
      fields: ['inventory_account_id'],
      name: 'idx_item_inventory_account',
    },
  ],
  defaultScope: {
    where: {},
  },
  scopes: {
    active: {
      where: { isActive: true },
    },
    products: {
      where: { itemType: 'product' },
    },
    services: {
      where: { itemType: 'service' },
    },
    tracked: {
      where: { isInventoryTracked: true },
    },
    byTenant: (tenantId) => ({
      where: { tenantId },
    }),
    byType: (type) => ({
      where: { itemType: type },
    }),
  },
});

module.exports = Item;