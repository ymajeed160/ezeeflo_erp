'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PosSubscriptionUsage = sequelize.define('PosSubscriptionUsage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tenant_id',
  },
  usageDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'usage_date',
  },
  totalTransactions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_transactions',
  },
  activeTerminals: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'active_terminals',
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
}, {
  tableName: 'pos_subscription_usage',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'usage_date'],
      name: 'uq_pos_su_tenant_date',
    },
  ],
});

module.exports = PosSubscriptionUsage;
