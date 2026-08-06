const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CompanySubscriptionModule = sequelize.define('CompanySubscriptionModule', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companySubscriptionId: { type: DataTypes.UUID, allowNull: false },
  moduleId: { type: DataTypes.UUID, allowNull: false },
  isEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'company_subscription_modules',
  timestamps: true,
  updatedAt: false,
});

CompanySubscriptionModule.associate = (models) => {
  CompanySubscriptionModule.belongsTo(models.CompanySubscription, { foreignKey: 'companySubscriptionId', as: 'subscription' });
  CompanySubscriptionModule.belongsTo(models.SubscriptionModule, { foreignKey: 'moduleId', as: 'module' });
};

module.exports = CompanySubscriptionModule;
