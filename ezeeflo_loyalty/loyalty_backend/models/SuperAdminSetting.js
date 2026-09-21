const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SuperAdminSetting = sequelize.define('SuperAdminSetting', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  settingKey: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  settingValue: { type: DataTypes.TEXT, allowNull: true },
  description: { type: DataTypes.STRING(255), allowNull: true },
}, {
  tableName: 'super_admin_settings',
  timestamps: true,
});

module.exports = SuperAdminSetting;
