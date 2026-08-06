const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reward = sequelize.define('Reward', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  code: { type: DataTypes.STRING(50), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  rewardType: {
    type: DataTypes.ENUM('gift_voucher', 'free_product', 'discount', 'cash_voucher', 'service', 'membership_upgrade', 'other'),
    allowNull: false,
  },
  pointsRequired: { type: DataTypes.INTEGER, allowNull: false },
  value: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  currency: { type: DataTypes.STRING(10), defaultValue: 'AED' },
  image: { type: DataTypes.STRING(255), allowNull: true },
  termsConditions: { type: DataTypes.TEXT, allowNull: true },
  validityDays: { type: DataTypes.INTEGER, allowNull: true },
  stockQuantity: { type: DataTypes.INTEGER, defaultValue: -1 },
  redemptionLimitPerCustomer: { type: DataTypes.INTEGER, defaultValue: -1 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  startDate: { type: DataTypes.DATEONLY, allowNull: true },
  endDate: { type: DataTypes.DATEONLY, allowNull: true },
}, {
  tableName: 'rewards',
  paranoid: true,
  timestamps: true,
});

Reward.associate = (models) => {
  Reward.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
  Reward.hasMany(models.RewardRedemption, { foreignKey: 'rewardId', as: 'redemptions' });
};

module.exports = Reward;
