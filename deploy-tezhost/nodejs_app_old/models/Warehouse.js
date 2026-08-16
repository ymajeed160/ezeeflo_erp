const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Warehouse = sequelize.define('Warehouse', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Warehouse code is required' },
      len: { args: [1, 50], msg: 'Warehouse code must be between 1 and 50 characters' },
    },
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Warehouse name is required' },
      len: { args: [2, 200], msg: 'Warehouse name must be between 2 and 200 characters' },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  managerName: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  contactNumber: {
    type: DataTypes.STRING(50),
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
  tableName: 'warehouses',
  underscored: true,
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['code', 'tenant_id'],
      name: 'unique_warehouse_code_tenant',
    },
    {
      unique: true,
      fields: ['name', 'tenant_id'],
      name: 'unique_warehouse_name_tenant',
    },
    {
      fields: ['tenant_id'],
      name: 'idx_warehouse_tenant',
    },
    {
      fields: ['is_active'],
      name: 'idx_warehouse_status',
    },
  ],
  defaultScope: {
    where: {},
  },
  scopes: {
    active: {
      where: { isActive: true },
    },
    byTenant: (tenantId) => ({
      where: { tenantId },
    }),
  },
});

module.exports = Warehouse;