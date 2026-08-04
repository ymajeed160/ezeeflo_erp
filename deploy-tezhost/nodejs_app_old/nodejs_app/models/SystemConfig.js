const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SystemConfig = sequelize.define('SystemConfig', {
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
  configKey: {
    type: DataTypes.STRING(150),
    allowNull: false,
    field: 'config_key',
  },
  configValue: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'config_value',
  },
  category: {
    type: DataTypes.STRING(100),
    defaultValue: 'general',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isEncrypted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_encrypted',
  },
}, {
  tableName: 'system_configs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { unique: true, fields: ['tenant_id', 'config_key'] },
  ],
});

module.exports = SystemConfig;
