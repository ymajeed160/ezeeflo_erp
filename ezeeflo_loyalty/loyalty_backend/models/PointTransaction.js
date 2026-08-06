const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PointTransaction = sequelize.define('PointTransaction', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  loyaltyAccountId: { type: DataTypes.UUID, allowNull: false },
  customerId: { type: DataTypes.UUID, allowNull: false },
  transactionType: {
    type: DataTypes.ENUM('earn', 'redeem', 'reverse', 'adjust', 'expire', 'transfer_in', 'transfer_out', 'bonus', 'welcome', 'referral'),
    allowNull: false,
  },
  points: { type: DataTypes.INTEGER, allowNull: false },
  balanceBefore: { type: DataTypes.INTEGER, defaultValue: 0 },
  balanceAfter: { type: DataTypes.INTEGER, defaultValue: 0 },
  referenceType: { type: DataTypes.STRING(50), allowNull: true },
  referenceId: { type: DataTypes.UUID, allowNull: true },
  source: { type: DataTypes.STRING(100), allowNull: true },
  storeId: { type: DataTypes.UUID, allowNull: true },
  branchId: { type: DataTypes.UUID, allowNull: true },
  posTransactionId: { type: DataTypes.STRING(100), allowNull: true },
  campaignId: { type: DataTypes.UUID, allowNull: true },
  couponId: { type: DataTypes.UUID, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  expiresAt: { type: DataTypes.DATE, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'point_transactions',
  timestamps: true,
  updatedAt: false,
});

PointTransaction.associate = (models) => {
  PointTransaction.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
  PointTransaction.belongsTo(models.LoyaltyAccount, { foreignKey: 'loyaltyAccountId', as: 'loyaltyAccount' });
  PointTransaction.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
  PointTransaction.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
};

module.exports = PointTransaction;
