const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  planName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'plan_name',
  },
  planCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'plan_code',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  monthlyPrice: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'monthly_price',
  },
  yearlyPrice: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'yearly_price',
  },
  trialDays: {
    type: DataTypes.INTEGER,
    defaultValue: 14,
    field: 'trial_days',
  },
  maxCompanies: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'max_companies',
  },
  maxUsers: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    field: 'max_users',
  },
  maxStorageMb: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    field: 'max_storage_mb',
  },
  maxApiCalls: {
    type: DataTypes.INTEGER,
    defaultValue: 1000,
    field: 'max_api_calls',
  },
  maxBranches: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'max_branches',
  },
  maxWarehouses: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'max_warehouses',
  },
  maxTransactionsPerMonth: {
    type: DataTypes.INTEGER,
    defaultValue: 500,
    field: 'max_transactions_per_month',
  },
  maxFixedAssets: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
    field: 'max_fixed_assets',
  },
  maxInventoryItems: {
    type: DataTypes.INTEGER,
    defaultValue: 200,
    field: 'max_inventory_items',
  },
  maxCustomers: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    field: 'max_customers',
  },
  maxSuppliers: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
    field: 'max_suppliers',
  },
  maxEmployees: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    field: 'max_employees',
  },
  maxDocuments: {
    type: DataTypes.INTEGER,
    defaultValue: 500,
    field: 'max_documents',
  },
  maxMonthlyInvoices: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    field: 'max_monthly_invoices',
  },
  maxReports: {
    type: DataTypes.INTEGER,
    defaultValue: 20,
    field: 'max_reports',
  },
  maxFileUploadSizeMb: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    field: 'max_file_upload_size_mb',
  },
  maxActiveSessions: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'max_active_sessions',
  },
  supportLevel: {
    type: DataTypes.ENUM('basic', 'standard', 'premium', 'dedicated'),
    defaultValue: 'basic',
    field: 'support_level',
  },
  featuresIncluded: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'features_included',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'sort_order',
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
  tableName: 'subscription_plans',
  timestamps: true,
  paranoid: false,
});

module.exports = SubscriptionPlan;
