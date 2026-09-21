const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BillingInvoice = sequelize.define('BillingInvoice', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  subscriptionId: { type: DataTypes.UUID, allowNull: false },
  invoiceNumber: { type: DataTypes.STRING(50), allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  taxAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  currency: { type: DataTypes.STRING(10), defaultValue: 'AED' },
  status: { type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue', 'canceled'), defaultValue: 'draft' },
  dueDate: { type: DataTypes.DATEONLY, allowNull: false },
  paidDate: { type: DataTypes.DATE, allowNull: true },
  billingPeriodStart: { type: DataTypes.DATEONLY, allowNull: false },
  billingPeriodEnd: { type: DataTypes.DATEONLY, allowNull: false },
}, {
  tableName: 'billing_invoices',
  timestamps: true,
});

BillingInvoice.associate = (models) => {
  BillingInvoice.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
};

module.exports = BillingInvoice;
