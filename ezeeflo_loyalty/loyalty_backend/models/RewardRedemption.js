const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RewardRedemption = sequelize.define('RewardRedemption', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  rewardId: { type: DataTypes.UUID, allowNull: false },
  customerId: { type: DataTypes.UUID, allowNull: false },
  loyaltyAccountId: { type: DataTypes.UUID, allowNull: false },
  pointsRedeemed: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'fulfilled', 'canceled', 'expired'), defaultValue: 'pending' },
  redemptionCode: { type: DataTypes.STRING(50), allowNull: true },
  fulfilledDate: { type: DataTypes.DATE, allowNull: true },
  canceledDate: { type: DataTypes.DATE, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'reward_redemptions',
  timestamps: true,
});

RewardRedemption.associate = (models) => {
  RewardRedemption.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
  RewardRedemption.belongsTo(models.Reward, { foreignKey: 'rewardId', as: 'reward' });
  RewardRedemption.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
  RewardRedemption.belongsTo(models.LoyaltyAccount, { foreignKey: 'loyaltyAccountId', as: 'loyaltyAccount' });
};

module.exports = RewardRedemption;
