const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Supplier = sequelize.define('Supplier', {
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
      notEmpty: { msg: 'Supplier code is required' },
    },
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Supplier name is required' },
    },
  },
  contactPerson: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  mobile: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true,
    validate: { isEmail: { msg: 'Invalid email format' } },
  },
  taxNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  vatNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  address: {
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
  paymentTerms: {
    type: DataTypes.STRING(100),
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
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'AED',
  },
  apAccountId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Accounts Payable account for this supplier',
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
  tableName: 'suppliers',
  underscored: true,
  timestamps: true,
  paranoid: true,
  indexes: [
    { unique: true, fields: ['code', 'tenant_id'], name: 'unique_supplier_code_tenant' },
    { fields: ['tenant_id', 'name'], name: 'idx_suppliers_tenant_name' },
    { fields: ['tenant_id', 'email'], name: 'idx_suppliers_tenant_email' },
    { fields: ['tenant_id', 'status'], name: 'idx_suppliers_tenant_status' },
    { fields: ['tenant_id', 'is_active'], name: 'idx_suppliers_tenant_active' },
    { fields: ['ap_account_id'], name: 'idx_suppliers_ap_account' },
  ],
});

module.exports = Supplier;