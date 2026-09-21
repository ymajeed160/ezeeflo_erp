const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payslip = sequelize.define('Payslip', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  payslipNumber: { type: DataTypes.STRING(30), allowNull: false, field: 'payslip_number' },
  payrollRunId: { type: DataTypes.UUID, allowNull: false, field: 'payroll_run_id' },
  employeeId: { type: DataTypes.UUID, allowNull: false, field: 'employee_id' },
  periodStart: { type: DataTypes.DATEONLY, allowNull: false, field: 'period_start' },
  periodEnd: { type: DataTypes.DATEONLY, allowNull: false, field: 'period_end' },
  basicSalary: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'basic_salary' },
  allowanceBreakdown: { type: DataTypes.JSON, allowNull: true, field: 'allowance_breakdown' },
  deductionBreakdown: { type: DataTypes.JSON, allowNull: true, field: 'deduction_breakdown' },
  grossPay: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'gross_pay' },
  netPay: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'net_pay' },
  paymentDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'payment_date' },
  status: { type: DataTypes.ENUM('Draft', 'Generated', 'Sent', 'Acknowledged'), defaultValue: 'Generated' },
  generatedAt: { type: DataTypes.DATE, allowNull: true, field: 'generated_at' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
}, { tableName: 'payslips', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['payroll_run_id'] }, { fields: ['employee_id'] }, { fields: ['payslip_number'] }] });

module.exports = Payslip;
