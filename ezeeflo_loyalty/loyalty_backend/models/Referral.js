const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Referral = sequelize.define('Referral', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  referrerCustomerId: { type: DataTypes.UUID, allowNull: false },
  referralCode: { type: DataTypes.STRING(50), allowNull: false },
  referredCustomerId: { type: DataTypes.UUID, allowNull: true },
  referredEmail: { type: DataTypes.STRING(150), allowNull: true },
  referredPhone: { type: DataTypes.STRING(30), allowNull: true },
  status: { type: DataTypes.ENUM('pending', 'registered', 'rewarded', 'expired', 'canceled'), defaultValue: 'pending' },
  rewardType: { type: DataTypes.ENUM('points', 'discount', 'cash', 'gift'), defaultValue: 'points' },
  rewardValue: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  referrerRewarded: { type: DataTypes.BOOLEAN, defaultValue: false },
  referredRewarded: { type: DataTypes.BOOLEAN, defaultValue: false },
  registeredDate: { type: DataTypes.DATE, allowNull: true },
  rewardedDate: { type: DataTypes.DATE, allowNull: true },
  expiresAt: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'referrals',
  timestamps: true,
});

Referral.associate = (models) => {
  Referral.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
  Referral.belongsTo(models.Customer, { foreignKey: 'referrerCustomerId', as: 'referrer' });
  Referral.belongsTo(models.Customer, { foreignKey: 'referredCustomerId', as: 'referred' });
};

module.exports = Referral;
