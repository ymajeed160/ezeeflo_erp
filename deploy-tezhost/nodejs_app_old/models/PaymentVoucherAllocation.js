const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PaymentVoucherAllocation = sequelize.define('PaymentVoucherAllocation', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  paymentVoucherId: { type: DataTypes.UUID, allowNull: false },
  purchaseInvoiceId: { type: DataTypes.UUID, allowNull: false },
  allocatedAmount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0.00 },
}, {
  tableName: 'payment_voucher_allocations', underscored: true, timestamps: true, paranoid: false,
  indexes: [
    { fields: ['payment_voucher_id'], name: 'idx_voucher_alloc_voucher' },
    { fields: ['purchase_invoice_id'], name: 'idx_voucher_alloc_invoice' },
  ],
});

module.exports = PaymentVoucherAllocation;
