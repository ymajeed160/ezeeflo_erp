const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SubscriptionPlanModule = sequelize.define('SubscriptionPlanModule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  planId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'plan_id',
  },
  moduleId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'module_id',
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_default',
  },
}, {
  tableName: 'subscription_plan_modules',
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['plan_id', 'module_id'],
    },
  ],
});

module.exports = SubscriptionPlanModule;
