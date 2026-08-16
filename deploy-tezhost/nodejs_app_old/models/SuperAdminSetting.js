const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SuperAdminSetting = sequelize.define('SuperAdminSetting', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  settingKey: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    field: 'setting_key',
  },
  settingValue: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'setting_value',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  isEncrypted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_encrypted',
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
  tableName: 'super_admin_settings',
  timestamps: true,
  paranoid: false,
});

module.exports = SuperAdminSetting;
