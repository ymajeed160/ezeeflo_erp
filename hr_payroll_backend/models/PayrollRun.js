const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PayrollRun = sequelize.define('PayrollRun', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  runNumber: { type: DataTypes.STRING(30), allowNull: false, field: 'run_number' },
  periodId: { type: DataTypes.UUID, allowNull: false, field: 'period_id' },
  runDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'run_date' },
  totalEmployees: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_employees' },
  totalGross: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0, field: 'total_gross' },
  totalDeductions: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0, field: 'total_deductions' },
  totalNetPay: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0, field: 'total_net_pay' },
  totalEmployerContributions: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0, field: 'total_employer_contributions' },
  status: { type: DataTypes.ENUM('Draft', 'Processed', 'Approved', 'Reversed'), defaultValue: 'Draft' },
  processedAt: { type: DataTypes.DATE, allowNull: true, field: 'processed_at' },
  approvedBy: { type: DataTypes.UUID, allowNull: true, field: 'approved_by' },
  approvedAt: { type: DataTypes.DATE, allowNull: true, field: 'approved_at' },
  reversedAt: { type: DataTypes.DATE, allowNull: true, field: 'reversed_at' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'payroll_runs', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['period_id'] }, { fields: ['status'] }] });

module.exports = PayrollRun;
