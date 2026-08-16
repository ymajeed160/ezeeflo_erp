const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserTenant = sequelize.define('UserTenant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
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
  tableName: 'user_tenants',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'tenant_id'],
      name: 'unique_user_tenant',
    },
    {
      fields: ['user_id'],
    },
    {
      fields: ['tenant_id'],
    },
  ],
});

module.exports = UserTenant;
