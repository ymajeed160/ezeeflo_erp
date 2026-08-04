const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SuperAdminLoginHistory = sequelize.define('SuperAdminLoginHistory', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  superAdminId: { type: DataTypes.UUID, allowNull: false, field: 'super_admin_id' },
  ipAddress: { type: DataTypes.STRING(45), allowNull: true, field: 'ip_address' },
  userAgent: { type: DataTypes.STRING(500), allowNull: true, field: 'user_agent' },
  loginAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'login_at' },
  logoutAt: { type: DataTypes.DATE, allowNull: true, field: 'logout_at' },
  isSuccess: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_success' },
  failureReason: { type: DataTypes.STRING(255), allowNull: true, field: 'failure_reason' },
  sessionDuration: { type: DataTypes.INTEGER, allowNull: true, field: 'session_duration' },
}, {
  tableName: 'super_admin_login_history',
  timestamps: true,
  indexes: [
    { fields: ['super_admin_id'] },
    { fields: ['login_at'] },
    { fields: ['is_success'] },
  ],
});

module.exports = SuperAdminLoginHistory;
