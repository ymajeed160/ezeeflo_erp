const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PaymentVoucherLine = sequelize.define('PaymentVoucherLine', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  paymentVoucherId: { type: DataTypes.UUID, allowNull: false },
  accountId: { type: DataTypes.UUID, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0.00 },
  taxPercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true, defaultValue: 0.00 },
  taxAccountId: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'payment_voucher_lines', underscored: true, timestamps: true, paranoid: false,
  indexes: [
    { fields: ['payment_voucher_id'], name: 'idx_voucher_lines_voucher' },
    { fields: ['account_id'], name: 'idx_voucher_lines_account' },
  ],
});

module.exports = PaymentVoucherLine;
