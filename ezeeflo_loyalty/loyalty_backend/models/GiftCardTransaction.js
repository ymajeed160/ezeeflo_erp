const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GiftCardTransaction = sequelize.define('GiftCardTransaction', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  giftCardId: { type: DataTypes.UUID, allowNull: false },
  companyId: { type: DataTypes.UUID, allowNull: false },
  transactionType: { type: DataTypes.ENUM('purchase', 'redeem', 'recharge', 'transfer', 'expire', 'reverse'), allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  balanceBefore: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  balanceAfter: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  referenceType: { type: DataTypes.STRING(50), allowNull: true },
  referenceId: { type: DataTypes.UUID, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'gift_card_transactions',
  timestamps: true,
  updatedAt: false,
});

GiftCardTransaction.associate = (models) => {
  GiftCardTransaction.belongsTo(models.GiftCard, { foreignKey: 'giftCardId', as: 'giftCard' });
  GiftCardTransaction.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
};

module.exports = GiftCardTransaction;
