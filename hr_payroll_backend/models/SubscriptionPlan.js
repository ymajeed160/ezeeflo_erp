const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  billingCycle: { type: DataTypes.ENUM('monthly', 'quarterly', 'biannually', 'annually'), defaultValue: 'annually', field: 'billing_cycle' },
  maxEmployees: { type: DataTypes.INTEGER, defaultValue: 50, field: 'max_employees' },
  maxUsers: { type: DataTypes.INTEGER, defaultValue: 10, field: 'max_users' },
  maxBranches: { type: DataTypes.INTEGER, defaultValue: 5, field: 'max_branches' },
  maxDepartments: { type: DataTypes.INTEGER, defaultValue: 10, field: 'max_departments' },
  maxPayrollRuns: { type: DataTypes.INTEGER, defaultValue: 12, field: 'max_payroll_runs' },
  storageLimitMb: { type: DataTypes.INTEGER, defaultValue: 1024, field: 'storage_limit_mb' },
  maxApiRequests: { type: DataTypes.INTEGER, defaultValue: 10000, field: 'max_api_requests' },
  gracePeriodDays: { type: DataTypes.INTEGER, defaultValue: 15, field: 'grace_period_days' },
  enabledModules: { type: DataTypes.JSON, allowNull: true, field: 'enabled_modules' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0, field: 'sort_order' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, {
  tableName: 'subscription_plans',
  timestamps: true,
  paranoid: true,
  indexes: [{ fields: ['code'], unique: true }, { fields: ['is_active'] }],
});

module.exports = SubscriptionPlan;
