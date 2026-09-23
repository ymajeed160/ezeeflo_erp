const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * ResourceIncome — analytical attribution record ONLY.
 *
 * It snapshots the resource-related portion of a posted Sales Invoice for
 * reporting purposes. It MUST NEVER create or modify journal entries,
 * ledger postings, or any other accounting transactions.
 */
const ResourceIncome = sequelize.define('ResourceIncome', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  salesInvoiceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  resourceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  invoiceNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  invoiceDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  netAmount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
  },
  taxAmount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
  },
  grossAmount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
  },
  incomeAmount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('posted', 'cancelled'),
    allowNull: false,
    defaultValue: 'posted',
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
  tableName: 'resource_income',
  underscored: true,
  timestamps: true,
  paranoid: false,
  indexes: [
    { unique: true, fields: ['sales_invoice_id', 'resource_id'], name: 'unique_resource_income_invoice_resource' },
    { fields: ['resource_id'], name: 'idx_resource_income_resource' },
    { fields: ['tenant_id', 'invoice_date'], name: 'idx_resource_income_tenant_date' },
    { fields: ['tenant_id', 'status'], name: 'idx_resource_income_tenant_status' },
  ],
});

module.exports = ResourceIncome;
