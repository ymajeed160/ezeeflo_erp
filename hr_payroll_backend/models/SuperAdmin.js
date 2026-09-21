const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SuperAdmin = sequelize.define('SuperAdmin', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  username: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  firstName: { type: DataTypes.STRING(100), allowNull: false, field: 'first_name' },
  lastName: { type: DataTypes.STRING(100), allowNull: false, field: 'last_name' },
  phone: { type: DataTypes.STRING(30), allowNull: true },
  profilePicture: { type: DataTypes.STRING(500), allowNull: true, field: 'profile_picture' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  isLocked: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_locked' },
  lockedAt: { type: DataTypes.DATE, allowNull: true, field: 'locked_at' },
  loginAttempts: { type: DataTypes.INTEGER, defaultValue: 0, field: 'login_attempts' },
  lastLoginAt: { type: DataTypes.DATE, allowNull: true, field: 'last_login_at' },
  lastLoginIp: { type: DataTypes.STRING(45), allowNull: true, field: 'last_login_ip' },
  passwordChangedAt: { type: DataTypes.DATE, allowNull: true, field: 'password_changed_at' },
  mustChangePassword: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'must_change_password' },
  refreshToken: { type: DataTypes.STRING(500), allowNull: true, field: 'refresh_token' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, {
  tableName: 'super_admins',
  timestamps: true,
  paranoid: true,
  defaultScope: { attributes: { exclude: ['password', 'refreshToken'] } },
  scopes: {
    withPassword: { attributes: { include: ['password'] } },
    withRefreshToken: { attributes: { include: ['password', 'refreshToken'] } },
  },
  indexes: [
    { fields: ['username'], unique: true },
    { fields: ['email'], unique: true },
    { fields: ['is_active'] },
  ],
});

module.exports = SuperAdmin;
