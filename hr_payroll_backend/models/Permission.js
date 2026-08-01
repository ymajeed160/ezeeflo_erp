const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Permission = sequelize.define('Permission', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  code: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  group: { type: DataTypes.STRING(100), allowNull: true },
  module: { type: DataTypes.STRING(100), allowNull: true },
  action: { type: DataTypes.STRING(50), allowNull: true },
  description: { type: DataTypes.STRING(500), allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
}, {
  tableName: 'permissions',
  timestamps: true,
  paranoid: true,
  indexes: [{ fields: ['code'], unique: true }, { fields: ['group'] }, { fields: ['module'] }],
});

module.exports = Permission;
