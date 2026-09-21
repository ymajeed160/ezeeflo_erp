const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SuperAdminCompany = sequelize.define('SuperAdminCompany', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  legalName: { type: DataTypes.STRING(300), allowNull: true, field: 'legal_name' },
  tradeLicenseNumber: { type: DataTypes.STRING(100), allowNull: true, field: 'trade_license_number' },
  taxRegistrationNumber: { type: DataTypes.STRING(100), allowNull: true, field: 'tax_registration_number' },
  country: { type: DataTypes.STRING(100), allowNull: true },
  city: { type: DataTypes.STRING(100), allowNull: true },
  address: { type: DataTypes.TEXT, allowNull: true },
  phone: { type: DataTypes.STRING(30), allowNull: true },
  email: { type: DataTypes.STRING(150), allowNull: true },
  website: { type: DataTypes.STRING(255), allowNull: true },
  logoUrl: { type: DataTypes.STRING(500), allowNull: true, field: 'logo_url' },
  timezone: { type: DataTypes.STRING(50), defaultValue: 'Asia/Dubai' },
  currency: { type: DataTypes.STRING(5), defaultValue: 'AED' },
  language: { type: DataTypes.STRING(10), defaultValue: 'en' },
  workingDays: { type: DataTypes.STRING(50), defaultValue: 'Mon,Tue,Wed,Thu,Fri', field: 'working_days' },
  financialYearStart: { type: DataTypes.STRING(5), defaultValue: '01-01', field: 'financial_year_start' },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended', 'expired', 'pending_activation', 'archived'),
    defaultValue: 'pending_activation',
  },
  subscriptionPlan: { type: DataTypes.STRING(100), allowNull: true, field: 'subscription_plan' },
  subscriptionStartDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'subscription_start_date' },
  subscriptionExpiryDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'subscription_expiry_date' },
  maxEmployees: { type: DataTypes.INTEGER, defaultValue: 50, field: 'max_employees' },
  maxUsers: { type: DataTypes.INTEGER, defaultValue: 10, field: 'max_users' },
  maxBranches: { type: DataTypes.INTEGER, defaultValue: 5, field: 'max_branches' },
  maxDepartments: { type: DataTypes.INTEGER, defaultValue: 10, field: 'max_departments' },
  maxPayrollRuns: { type: DataTypes.INTEGER, defaultValue: 12, field: 'max_payroll_runs' },
  storageLimitMb: { type: DataTypes.INTEGER, defaultValue: 1024, field: 'storage_limit_mb' },
  maxApiRequests: { type: DataTypes.INTEGER, defaultValue: 10000, field: 'max_api_requests' },
  gracePeriodDays: { type: DataTypes.INTEGER, defaultValue: 15, field: 'grace_period_days' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, {
  tableName: 'super_admin_companies',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['name'] },
    { fields: ['email'] },
    { fields: ['status'] },
    { fields: ['subscription_expiry_date'] },
  ],
});

module.exports = SuperAdminCompany;
