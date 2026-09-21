const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CompanySubscriptionModule = sequelize.define('CompanySubscriptionModule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  subscriptionId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'subscription_id',
  },
  moduleId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'module_id',
  },
  isEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_enabled',
  },
}, {
  tableName: 'company_subscription_modules',
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['subscription_id', 'module_id'],
    },
  ],
});

module.exports = CompanySubscriptionModule;
