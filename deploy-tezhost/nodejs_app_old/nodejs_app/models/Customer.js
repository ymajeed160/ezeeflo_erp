const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Customer code is required' },
    },
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Customer name is required' },
    },
  },
  legalName: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  group: {
    type: DataTypes.ENUM('retail', 'wholesale', 'corporate', 'government'),
    defaultValue: 'retail',
  },
  type: {
    type: DataTypes.ENUM('individual', 'company'),
    defaultValue: 'individual',
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true,
    validate: { isEmail: { msg: 'Invalid email format' } },
  },
  phone: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  mobile: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  website: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  taxNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  vatNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  registrationNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'AED',
  },
  paymentTerms: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  creditLimit: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0,
  },
  creditDays: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
  },
  arAccountId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Accounts Receivable account for this customer',
  },
  billingAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  shippingAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  postalCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  contactPerson: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  contactEmail: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  contactPhone: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'blocked'),
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'inactive', 'blocked']],
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
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
  tableName: 'customers',
  underscored: true,
  timestamps: true,
  paranoid: true,
  indexes: [
    { unique: true, fields: ['code', 'tenant_id'], name: 'unique_customer_code_tenant' },
    { fields: ['tenant_id', 'name'], name: 'idx_customers_tenant_name' },
    { fields: ['tenant_id', 'email'], name: 'idx_customers_tenant_email' },
    { fields: ['tenant_id', 'status'], name: 'idx_customers_tenant_status' },
    { fields: ['tenant_id', 'is_active'], name: 'idx_customers_tenant_active' },
    { fields: ['ar_account_id'], name: 'idx_customers_ar_account' },
  ],
});

module.exports = Customer;