const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'company_id',
  },
  invoiceId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'invoice_id',
  },
  subscriptionId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'subscription_id',
  },
  paymentNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'payment_number',
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'payment_date',
  },
  amount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'USD',
  },
  paymentMethod: {
    type: DataTypes.ENUM('manual', 'stripe', 'paypal', 'paytabs', 'network_international', 'bank_transfer', 'cash'),
    defaultValue: 'manual',
    field: 'payment_method',
  },
  paymentGateway: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'payment_gateway',
  },
  transactionId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'transaction_id',
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled'),
    defaultValue: 'pending',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  receiptUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'receipt_url',
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'created_by',
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'updated_by',
  },
}, {
  tableName: 'payments',
  timestamps: true,
  paranoid: false,
});

module.exports = Payment;
