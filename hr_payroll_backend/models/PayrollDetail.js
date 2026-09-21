const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PayrollDetail = sequelize.define('PayrollDetail', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  payrollRunId: { type: DataTypes.UUID, allowNull: false, field: 'payroll_run_id' },
  employeeId: { type: DataTypes.UUID, allowNull: false, field: 'employee_id' },
  basicSalary: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'basic_salary' },
  allowances: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  deductions: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  overtimePay: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'overtime_pay' },
  loanDeduction: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'loan_deduction' },
  grossPay: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'gross_pay' },
  netPay: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'net_pay' },
  employerContributions: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'employer_contributions' },
  workingDays: { type: DataTypes.INTEGER, defaultValue: 0, field: 'working_days' },
  paidDays: { type: DataTypes.INTEGER, defaultValue: 0, field: 'paid_days' },
  absentDays: { type: DataTypes.INTEGER, defaultValue: 0, field: 'absent_days' },
  lateMinutes: { type: DataTypes.INTEGER, defaultValue: 0, field: 'late_minutes' },
  overtimeHours: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0, field: 'overtime_hours' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
}, { tableName: 'payroll_details', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['payroll_run_id'] }, { fields: ['employee_id'] }] });

module.exports = PayrollDetail;
