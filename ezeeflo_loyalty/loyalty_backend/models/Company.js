const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Company = sequelize.define('Company', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(150), allowNull: true },
  phone: { type: DataTypes.STRING(30), allowNull: true },
  website: { type: DataTypes.STRING(255), allowNull: true },
  logo: { type: DataTypes.STRING(255), allowNull: true },
  addressLine1: { type: DataTypes.STRING(255), allowNull: true },
  addressLine2: { type: DataTypes.STRING(255), allowNull: true },
  city: { type: DataTypes.STRING(100), allowNull: true },
  state: { type: DataTypes.STRING(100), allowNull: true },
  country: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'UAE' },
  postalCode: { type: DataTypes.STRING(20), allowNull: true },
  currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'AED' },
  currencySymbol: { type: DataTypes.STRING(5), allowNull: false, defaultValue: 'د.إ' },
  timezone: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Asia/Dubai' },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended', 'trial', 'deleted'),
    defaultValue: 'trial',
  },
  trialStartDate: { type: DataTypes.DATEONLY, allowNull: true },
  trialEndDate: { type: DataTypes.DATEONLY, allowNull: true },
  maxUsers: { type: DataTypes.INTEGER, defaultValue: 5 },
  maxCustomers: { type: DataTypes.INTEGER, defaultValue: 100 },
  settings: { type: DataTypes.JSON, allowNull: true },
  branding: { type: DataTypes.JSON, allowNull: true },
  subscriptionStatus: {
    type: DataTypes.ENUM('active', 'past_due', 'canceled', 'expired', 'trialing'),
    defaultValue: 'trialing',
  },
}, {
  tableName: 'companies',
  paranoid: true,
  timestamps: true,
});

Company.associate = (models) => {
  Company.hasMany(models.User, { foreignKey: 'companyId', as: 'users' });
  Company.hasMany(models.Customer, { foreignKey: 'companyId', as: 'customers' });
  Company.hasMany(models.SubscriptionPlan, { foreignKey: 'companyId' }); // not direct - just for queries
  Company.hasMany(models.CompanySubscription, { foreignKey: 'companyId', as: 'subscriptions' });
  Company.hasMany(models.Role, { foreignKey: 'companyId', as: 'roles' });
  Company.hasMany(models.Permission, { foreignKey: 'companyId', as: 'permissions' });
  Company.hasMany(models.AuditLog, { foreignKey: 'companyId', as: 'auditLogs' });
};

module.exports = Company;
