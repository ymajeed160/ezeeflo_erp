const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RolePermission = sequelize.define('RolePermission', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  roleId: { type: DataTypes.UUID, allowNull: false, field: 'role_id' },
  permissionId: { type: DataTypes.UUID, allowNull: false, field: 'permission_id' },
}, {
  tableName: 'role_permissions',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['role_id'] },
    { fields: ['permission_id'] },
    { fields: ['role_id', 'permission_id'], unique: true },
  ],
});

module.exports = RolePermission;
