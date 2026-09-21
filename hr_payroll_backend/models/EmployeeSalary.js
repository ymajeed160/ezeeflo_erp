const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmployeeSalary = sequelize.define('EmployeeSalary', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  employeeId: { type: DataTypes.UUID, allowNull: false, field: 'employee_id' },
  structureId: { type: DataTypes.UUID, allowNull: true, field: 'structure_id' },
  effectiveFrom: { type: DataTypes.DATEONLY, allowNull: false, field: 'effective_from' },
  effectiveTo: { type: DataTypes.DATEONLY, allowNull: true, field: 'effective_to' },
  basicSalary: { type: DataTypes.DECIMAL(12, 2), allowNull: false, field: 'basic_salary' },
  grossSalary: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'gross_salary' },
  netSalary: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'net_salary' },
  currency: { type: DataTypes.STRING(3), defaultValue: 'AED' },
  paymentMode: { type: DataTypes.ENUM('Bank Transfer', 'Cash', 'Cheque', 'WPS'), defaultValue: 'Bank Transfer', field: 'payment_mode' },
  bankName: { type: DataTypes.STRING(150), allowNull: true, field: 'bank_name' },
  bankAccountNumber: { type: DataTypes.STRING(50), allowNull: true, field: 'bank_account_number' },
  iban: { type: DataTypes.STRING(50), allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'employee_salaries', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }, { fields: ['structure_id'] }, { fields: ['effective_from'] }] });

module.exports = EmployeeSalary;
