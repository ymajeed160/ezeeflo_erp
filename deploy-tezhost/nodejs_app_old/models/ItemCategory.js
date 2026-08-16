const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ItemCategory = sequelize.define('ItemCategory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Category name is required' },
      len: { args: [2, 200], msg: 'Category name must be between 2 and 200 characters' },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  parentCategoryId: {
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
  tableName: 'item_categories',
  underscored: true,
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['name', 'tenant_id'],
      name: 'unique_category_name_tenant',
    },
    {
      fields: ['tenant_id'],
      name: 'idx_category_tenant',
    },
    {
      fields: ['parent_category_id'],
      name: 'idx_category_parent',
    },
  ],
  defaultScope: {
    where: {},
  },
  scopes: {
    active: {
      where: { isActive: true },
    },
    roots: {
      where: { parentCategoryId: null },
    },
    byTenant: (tenantId) => ({
      where: { tenantId },
    }),
  },
});

module.exports = ItemCategory;