const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SellingResource = sequelize.define('SellingResource', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  resourceCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Resource code is required' },
    },
  },
  resourceName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Resource name is required' },
    },
  },
  resourceTypeId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
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
  tableName: 'selling_resources',
  underscored: true,
  timestamps: true,
  paranoid: true,
  indexes: [
    { unique: true, fields: ['resource_code', 'tenant_id'], name: 'unique_sellingresource_code_tenant' },
    { fields: ['resource_type_id'], name: 'idx_sellingresource_type' },
    { fields: ['tenant_id', 'is_active'], name: 'idx_sellingresource_tenant_active' },
  ],
});

module.exports = SellingResource;
