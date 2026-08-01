const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserRole = sequelize.define('UserRole', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
  roleId: { type: DataTypes.UUID, allowNull: false, field: 'role_id' },
  isDefault: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_default' },
}, {
  tableName: 'user_roles',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['role_id'] },
    { fields: ['user_id', 'role_id'], unique: true },
  ],
});

module.exports = UserRole;
