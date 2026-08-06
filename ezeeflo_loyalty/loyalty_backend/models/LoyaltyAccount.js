const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoyaltyAccount = sequelize.define('LoyaltyAccount', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  customerId: { type: DataTypes.UUID, allowNull: false, unique: true },
  membershipId: { type: DataTypes.UUID, allowNull: true },
  accountNumber: { type: DataTypes.STRING(50), allowNull: false },
  availablePoints: { type: DataTypes.INTEGER, defaultValue: 0 },
  pendingPoints: { type: DataTypes.INTEGER, defaultValue: 0 },
  expiredPoints: { type: DataTypes.INTEGER, defaultValue: 0 },
  redeemedPoints: { type: DataTypes.INTEGER, defaultValue: 0 },
  lifetimeEarned: { type: DataTypes.INTEGER, defaultValue: 0 },
  lifetimeRedeemed: { type: DataTypes.INTEGER, defaultValue: 0 },
  currentTierPoints: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  enrolledDate: { type: DataTypes.DATEONLY, allowNull: true },
  lastActivityDate: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'loyalty_accounts',
  paranoid: true,
  timestamps: true,
});

LoyaltyAccount.associate = (models) => {
  LoyaltyAccount.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
  LoyaltyAccount.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
  LoyaltyAccount.belongsTo(models.MembershipTier, { foreignKey: 'membershipId', as: 'membership' });
  LoyaltyAccount.hasMany(models.PointTransaction, { foreignKey: 'loyaltyAccountId', as: 'transactions' });
  LoyaltyAccount.hasMany(models.RewardRedemption, { foreignKey: 'loyaltyAccountId', as: 'redemptions' });
};

module.exports = LoyaltyAccount;
