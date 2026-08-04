const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SuperAdminAuditLog = sequelize.define('SuperAdminAuditLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  superAdminId: { type: DataTypes.UUID, allowNull: false, field: 'super_admin_id' },
  action: { type: DataTypes.STRING(100), allowNull: false },
  entityType: { type: DataTypes.STRING(100), allowNull: true, field: 'entity_type' },
  entityId: { type: DataTypes.UUID, allowNull: true, field: 'entity_id' },
  description: { type: DataTypes.TEXT, allowNull: true },
  oldValues: { type: DataTypes.JSON, allowNull: true, field: 'old_values' },
  newValues: { type: DataTypes.JSON, allowNull: true, field: 'new_values' },
  ipAddress: { type: DataTypes.STRING(45), allowNull: true, field: 'ip_address' },
  userAgent: { type: DataTypes.STRING(500), allowNull: true, field: 'user_agent' },
  metadata: { type: DataTypes.JSON, allowNull: true },
}, {
  tableName: 'super_admin_audit_logs',
  timestamps: true,
  indexes: [
    { fields: ['super_admin_id'] },
    { fields: ['action'] },
    { fields: ['entity_type', 'entity_id'] },
    { fields: ['created_at'] },
  ],
});

module.exports = SuperAdminAuditLog;
