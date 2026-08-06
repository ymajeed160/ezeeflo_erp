const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  billingCycle: { type: DataTypes.ENUM('monthly', 'quarterly', 'biannual', 'annual'), defaultValue: 'monthly' },
  maxCompanies: { type: DataTypes.INTEGER, defaultValue: 1 },
  maxUsers: { type: DataTypes.INTEGER, defaultValue: 5 },
  maxCustomers: { type: DataTypes.INTEGER, defaultValue: 100 },
  maxApiCalls: { type: DataTypes.INTEGER, defaultValue: 1000 },
  storageLimitMb: { type: DataTypes.INTEGER, defaultValue: 100 },
  features: { type: DataTypes.JSON, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'subscription_plans',
  paranoid: true,
  timestamps: true,
});

SubscriptionPlan.associate = (models) => {
  SubscriptionPlan.hasMany(models.CompanySubscription, { foreignKey: 'planId', as: 'subscriptions' });
  SubscriptionPlan.belongsToMany(models.SubscriptionModule, {
    through: models.SubscriptionPlanModule,
    foreignKey: 'planId',
    otherKey: 'moduleId',
    as: 'modules',
  });
};

module.exports = SubscriptionPlan;
