const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CompanySubscription = sequelize.define('CompanySubscription', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  planId: { type: DataTypes.UUID, allowNull: false },
  startDate: { type: DataTypes.DATEONLY, allowNull: false },
  endDate: { type: DataTypes.DATEONLY, allowNull: false },
  billingCycle: { type: DataTypes.ENUM('monthly', 'quarterly', 'biannual', 'annual'), defaultValue: 'monthly' },
  status: { type: DataTypes.ENUM('active', 'past_due', 'canceled', 'expired', 'trialing'), defaultValue: 'active' },
  autoRenew: { type: DataTypes.BOOLEAN, defaultValue: true },
  trialDays: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'company_subscriptions',
  paranoid: true,
  timestamps: true,
});

CompanySubscription.associate = (models) => {
  CompanySubscription.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
  CompanySubscription.belongsTo(models.SubscriptionPlan, { foreignKey: 'planId', as: 'plan' });
  CompanySubscription.hasMany(models.CompanySubscriptionModule, { foreignKey: 'companySubscriptionId', as: 'subscriptionModules' });
};

module.exports = CompanySubscription;
