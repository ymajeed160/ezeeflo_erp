const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GiftCard = sequelize.define('GiftCard', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  cardNumber: { type: DataTypes.STRING(50), allowNull: false },
  pin: { type: DataTypes.STRING(10), allowNull: true },
  initialBalance: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  currentBalance: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  currency: { type: DataTypes.STRING(10), defaultValue: 'AED' },
  status: { type: DataTypes.ENUM('active', 'redeemed', 'expired', 'canceled', 'suspended'), defaultValue: 'active' },
  purchaserCustomerId: { type: DataTypes.UUID, allowNull: true },
  recipientCustomerId: { type: DataTypes.UUID, allowNull: true },
  recipientEmail: { type: DataTypes.STRING(150), allowNull: true },
  recipientPhone: { type: DataTypes.STRING(30), allowNull: true },
  message: { type: DataTypes.TEXT, allowNull: true },
  startDate: { type: DataTypes.DATEONLY, allowNull: true },
  expiryDate: { type: DataTypes.DATEONLY, allowNull: true },
  redeemedDate: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'gift_cards',
  paranoid: true,
  timestamps: true,
});

GiftCard.associate = (models) => {
  GiftCard.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
  GiftCard.belongsTo(models.Customer, { foreignKey: 'purchaserCustomerId', as: 'purchaser' });
  GiftCard.belongsTo(models.Customer, { foreignKey: 'recipientCustomerId', as: 'recipient' });
  GiftCard.hasMany(models.GiftCardTransaction, { foreignKey: 'giftCardId', as: 'transactions' });
};

module.exports = GiftCard;
