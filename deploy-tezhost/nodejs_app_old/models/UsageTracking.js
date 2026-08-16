const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UsageTracking = sequelize.define('UsageTracking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'company_id',
  },
  subscriptionId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'subscription_id',
  },
  usageDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'usage_date',
  },
  apiCalls: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'api_calls',
  },
  transactions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  storageUsedMb: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'storage_used_mb',
  },
  activeUsers: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'active_users',
  },
  activeSessions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'active_sessions',
  },
  invoicesGenerated: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'invoices_generated',
  },
  bandwidthUsedMb: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'bandwidth_used_mb',
  },
}, {
  tableName: 'usage_tracking',
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['company_id', 'subscription_id', 'usage_date'],
    },
  ],
});

module.exports = UsageTracking;
