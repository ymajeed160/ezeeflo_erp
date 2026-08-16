const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SubscriptionAuditLog = sequelize.define('SubscriptionAuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'company_id',
  },
  subscriptionId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'subscription_id',
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  entityType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'entity_type',
  },
  entityId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'entity_id',
  },
  oldValues: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'old_values',
  },
  newValues: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'new_values',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  performedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'performed_by',
  },
  performedByEmail: {
    type: DataTypes.STRING(150),
    allowNull: true,
    field: 'performed_by_email',
  },
  ipAddress: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'ip_address',
  },
}, {
  tableName: 'subscription_audit_logs',
  timestamps: true,
  paranoid: false,
  updatedAt: false,
});

module.exports = SubscriptionAuditLog;
