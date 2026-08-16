const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  userEmail: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  userRole: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  module: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  entity: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  entityId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  entityReferenceNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  oldValues: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  newValues: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  changedFields: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  changes: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  requestId: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  sessionId: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  source: {
    type: DataTypes.ENUM('USER', 'SYSTEM', 'SCHEDULED_JOB', 'API', 'INTEGRATION'),
    defaultValue: 'USER',
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'audit_logs',
  timestamps: true,
  updatedAt: false,
  indexes: [
    { name: 'idx_audit_logs_tenant_id', fields: ['tenantId'] },
    { name: 'idx_audit_logs_user_id', fields: ['userId'] },
    { name: 'idx_audit_logs_action', fields: ['action'] },
    { name: 'idx_audit_logs_module', fields: ['module'] },
    { name: 'idx_audit_logs_entity', fields: ['entity', 'entityId'] },
    { name: 'idx_audit_logs_created_at', fields: ['createdAt'] },
    { name: 'idx_audit_logs_request_id', fields: ['requestId'] },
    { name: 'idx_audit_logs_tenant_created', fields: ['tenantId', 'createdAt'] },
    { name: 'idx_audit_logs_entity_history', fields: ['tenantId', 'entity', 'entityId', 'createdAt'] },
  ],
});

module.exports = AuditLog;