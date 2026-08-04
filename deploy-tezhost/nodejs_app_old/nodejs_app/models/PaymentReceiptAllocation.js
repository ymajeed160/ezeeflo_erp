const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PaymentReceiptAllocation = sequelize.define('PaymentReceiptAllocation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  paymentReceiptId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  salesInvoiceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  allocatedAmount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
}, {
  tableName: 'payment_receipt_allocations',
  underscored: true,
  timestamps: true,
  paranoid: false,
  indexes: [
    { fields: ['payment_receipt_id'], name: 'idx_receipt_alloc_receipt' },
    { fields: ['sales_invoice_id'], name: 'idx_receipt_alloc_invoice' },
  ],
});

module.exports = PaymentReceiptAllocation;
