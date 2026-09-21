const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  code: { type: DataTypes.STRING(50), allowNull: false },
  firstName: { type: DataTypes.STRING(100), allowNull: false },
  lastName: { type: DataTypes.STRING(100), allowNull: true },
  email: { type: DataTypes.STRING(150), allowNull: true, validate: { isEmail: true } },
  phone: { type: DataTypes.STRING(30), allowNull: false },
  mobile: { type: DataTypes.STRING(30), allowNull: true },
  dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
  gender: { type: DataTypes.ENUM('male', 'female', 'other'), allowNull: true },
  addressLine1: { type: DataTypes.STRING(255), allowNull: true },
  addressLine2: { type: DataTypes.STRING(255), allowNull: true },
  city: { type: DataTypes.STRING(100), allowNull: true },
  state: { type: DataTypes.STRING(100), allowNull: true },
  country: { type: DataTypes.STRING(100), defaultValue: 'UAE' },
  postalCode: { type: DataTypes.STRING(20), allowNull: true },
  nationalId: { type: DataTypes.STRING(50), allowNull: true },
  tags: { type: DataTypes.JSON, allowNull: true },
  segment: { type: DataTypes.STRING(50), allowNull: true },
  source: { type: DataTypes.STRING(50), allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  mergedIntoId: { type: DataTypes.UUID, allowNull: true },
  lifetimeValue: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
  totalVisits: { type: DataTypes.INTEGER, defaultValue: 0 },
  lastVisitDate: { type: DataTypes.DATE, allowNull: true },
  registrationDate: { type: DataTypes.DATEONLY, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true },
  updatedBy: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'customers',
  paranoid: true,
  timestamps: true,
});

Customer.associate = (models) => {
  Customer.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
  Customer.hasOne(models.LoyaltyAccount, { foreignKey: 'customerId', as: 'loyaltyAccount' });
  Customer.hasMany(models.PointTransaction, { foreignKey: 'customerId', as: 'pointTransactions' });
  Customer.hasMany(models.RewardRedemption, { foreignKey: 'customerId', as: 'redemptions' });
  Customer.hasMany(models.Referral, { foreignKey: 'referrerCustomerId', as: 'referralsMade' });
  Customer.hasMany(models.Referral, { foreignKey: 'referredCustomerId', as: 'referralsReceived' });
  Customer.hasMany(models.Notification, { foreignKey: 'customerId', as: 'notifications' });
  Customer.hasMany(models.CustomerMembership, { foreignKey: 'customerId', as: 'customerMemberships' });
  Customer.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
  Customer.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'updater' });
};

module.exports = Customer;
