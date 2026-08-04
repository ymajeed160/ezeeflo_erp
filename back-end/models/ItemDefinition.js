const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ItemDefinition = sequelize.define('ItemDefinition', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tenant_id',
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'model, size, ram, processor, ssd, generation, colour',
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'The display value (e.g. "16GB", "Intel i7")',
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'sort_order',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'created_by',
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'updated_by',
  },
}, {
  tableName: 'item_definitions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: false,
  indexes: [
    { fields: ['tenant_id', 'category'] },
    { unique: true, fields: ['tenant_id', 'category', 'name'] },
  ],
});

module.exports = ItemDefinition;
