const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PaymentReceipt = sequelize.define('PaymentReceipt', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  receiptNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  receiptDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  bankAccountId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  paymentMethod: {
    type: DataTypes.ENUM('Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Online Payment', 'Other'),
    allowNull: false,
    defaultValue: 'Bank Transfer',
  },
  referenceNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  amount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  currencyCode: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'USD',
  },
  exchangeRate: {
    type: DataTypes.DECIMAL(18, 6),
    allowNull: true,
    defaultValue: 1.000000,
  },
  receivedFrom: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  depositReference: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Posted', 'Cancelled', 'Reversed'),
    allowNull: false,
    defaultValue: 'Draft',
  },
  journalEntryId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'payment_receipts',
  underscored: true,
  timestamps: true,
  paranoid: false,
  indexes: [
    { unique: true, fields: ['receipt_number', 'tenant_id'], name: 'unique_receipt_number_tenant' },
    { fields: ['tenant_id'], name: 'idx_receipt_tenant' },
    { fields: ['customer_id'], name: 'idx_receipt_customer' },
    { fields: ['bank_account_id'], name: 'idx_receipt_bank_account' },
    { fields: ['status'], name: 'idx_receipt_status' },
  ],
  defaultScope: {
    where: {},
    order: [['createdAt', 'DESC']],
  },
  scopes: {
    byTenant: (tenantId) => ({ where: { tenantId } }),
    posted: { where: { status: 'Posted' } },
    draft: { where: { status: 'Draft' } },
  },
});

module.exports = PaymentReceipt;
