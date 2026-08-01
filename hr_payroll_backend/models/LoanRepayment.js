const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoanRepayment = sequelize.define('LoanRepayment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  loanId: { type: DataTypes.UUID, allowNull: false, field: 'loan_id' },
  employeeId: { type: DataTypes.UUID, allowNull: false, field: 'employee_id' },
  installmentNumber: { type: DataTypes.INTEGER, allowNull: false, field: 'installment_number' },
  dueDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'due_date' },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  principalPortion: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'principal_portion' },
  interestPortion: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'interest_portion' },
  paidDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'paid_date' },
  status: { type: DataTypes.ENUM('Pending', 'Paid', 'Skipped'), defaultValue: 'Pending' },
  payrollRunId: { type: DataTypes.UUID, allowNull: true, field: 'payroll_run_id' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'loan_repayments', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['loan_id'] }, { fields: ['employee_id'] }, { fields: ['payroll_run_id'] }] });

module.exports = LoanRepayment;
