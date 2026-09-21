const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  invoiceId: { type: DataTypes.UUID, allowNull: true },
  paymentMethod: { type: DataTypes.ENUM('credit_card', 'bank_transfer', 'cash', 'check', 'other'), allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  currency: { type: DataTypes.STRING(10), defaultValue: 'AED' },
  transactionReference: { type: DataTypes.STRING(255), allowNull: true },
  status: { type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'), defaultValue: 'pending' },
  paidAt: { type: DataTypes.DATE, allowNull: true },
  metadata: { type: DataTypes.JSON, allowNull: true },
}, {
  tableName: 'payments',
  timestamps: true,
});

Payment.associate = (models) => {
  Payment.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
};

module.exports = Payment;
