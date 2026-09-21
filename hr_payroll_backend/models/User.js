const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  username: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  firstName: { type: DataTypes.STRING(100), allowNull: false, field: 'first_name' },
  lastName: { type: DataTypes.STRING(100), allowNull: false, field: 'last_name' },
  phone: { type: DataTypes.STRING(30), allowNull: true },
  profilePicture: { type: DataTypes.STRING(500), allowNull: true, field: 'profile_picture' },
  role: { type: DataTypes.ENUM('super_admin', 'company_admin', 'hr_manager', 'payroll_manager', 'hr_officer', 'recruitment_officer', 'attendance_officer', 'department_manager', 'branch_manager', 'finance_manager', 'employee', 'read_only', 'auditor', 'custom'), defaultValue: 'employee' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  isLocked: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_locked' },
  lockedAt: { type: DataTypes.DATE, allowNull: true, field: 'locked_at' },
  loginAttempts: { type: DataTypes.INTEGER, defaultValue: 0, field: 'login_attempts' },
  lastLoginAt: { type: DataTypes.DATE, allowNull: true, field: 'last_login_at' },
  lastLoginIp: { type: DataTypes.STRING(45), allowNull: true, field: 'last_login_ip' },
  passwordChangedAt: { type: DataTypes.DATE, allowNull: true, field: 'password_changed_at' },
  mustChangePassword: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'must_change_password' },
  mfaEnabled: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'mfa_enabled' },
  mfaSecret: { type: DataTypes.STRING(255), allowNull: true, field: 'mfa_secret' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, {
  tableName: 'users',
  timestamps: true,
  paranoid: true,
  defaultScope: { attributes: { exclude: ['password', 'mfaSecret'] } },
  scopes: {
    withPassword: { attributes: { include: ['password'] } },
  },
  indexes: [
    { fields: ['username'], unique: true },
    { fields: ['email'], unique: true },
    { fields: ['role'] },
    { fields: ['is_active'] },
  ],
});

module.exports = User;
