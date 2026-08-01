const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BenefitType = sequelize.define('BenefitType', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  code: { type: DataTypes.STRING(20), allowNull: false },
  name: { type: DataTypes.STRING(150), allowNull: false },
  benefitCategory: { type: DataTypes.ENUM('Medical', 'Insurance', 'Travel', 'Education', 'Housing', 'Transportation', 'Other'), allowNull: false, field: 'benefit_category' },
  providerName: { type: DataTypes.STRING(200), allowNull: true, field: 'provider_name' },
  coverageDetails: { type: DataTypes.TEXT, allowNull: true, field: 'coverage_details' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'benefit_types', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['tenant_id', 'code'], unique: true }] });

const EmployeeBenefit = sequelize.define('EmployeeBenefit', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  employeeId: { type: DataTypes.UUID, allowNull: false, field: 'employee_id' },
  benefitTypeId: { type: DataTypes.UUID, allowNull: false, field: 'benefit_type_id' },
  enrolledDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'enrolled_date' },
  expiryDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'expiry_date' },
  coverageAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'coverage_amount' },
  employerContribution: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'employer_contribution' },
  employeeContribution: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'employee_contribution' },
  status: { type: DataTypes.ENUM('Active', 'Inactive', 'Expired', 'Cancelled'), defaultValue: 'Active' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'employee_benefits', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }, { fields: ['benefit_type_id'] }] });

module.exports = { BenefitType, EmployeeBenefit };
