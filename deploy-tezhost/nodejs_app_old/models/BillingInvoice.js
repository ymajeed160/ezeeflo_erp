const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BillingInvoice = sequelize.define('BillingInvoice', {
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
  subscriptionId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'subscription_id',
  },
  invoiceNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'invoice_number',
  },
  invoiceDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'invoice_date',
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'due_date',
  },
  billingPeriodStart: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'billing_period_start',
  },
  billingPeriodEnd: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'billing_period_end',
  },
  subtotal: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
  },
  discountAmount: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'discount_amount',
  },
  taxAmount: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'tax_amount',
  },
  totalAmount: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'total_amount',
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'USD',
  },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded'),
    defaultValue: 'draft',
  },
  paymentMethod: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'payment_method',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
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
  tableName: 'billing_invoices',
  timestamps: true,
  paranoid: false,
});

module.exports = BillingInvoice;
