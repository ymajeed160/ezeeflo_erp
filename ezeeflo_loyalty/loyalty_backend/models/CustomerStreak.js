const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CustomerStreak = sequelize.define('CustomerStreak', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  customerId: { type: DataTypes.UUID, allowNull: false },
  streakType: { type: DataTypes.ENUM('daily_login', 'daily_purchase', 'weekly_purchase', 'referral', 'review'), allowNull: false },
  currentStreak: { type: DataTypes.INTEGER, defaultValue: 0 },
  longestStreak: { type: DataTypes.INTEGER, defaultValue: 0 },
  lastActivityDate: { type: DataTypes.DATEONLY, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'customer_streaks', timestamps: true });

CustomerStreak.associate = (models) => {
  CustomerStreak.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
};

module.exports = CustomerStreak;
