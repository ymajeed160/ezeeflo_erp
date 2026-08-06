const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SubscriptionPlanModule = sequelize.define('SubscriptionPlanModule', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  planId: { type: DataTypes.UUID, allowNull: false },
  moduleId: { type: DataTypes.UUID, allowNull: false },
}, {
  tableName: 'subscription_plan_modules',
  timestamps: true,
  updatedAt: false,
});

module.exports = SubscriptionPlanModule;
