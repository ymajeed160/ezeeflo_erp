const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmployeeLoan = sequelize.define('EmployeeLoan', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  loanNumber: { type: DataTypes.STRING(30), allowNull: false, field: 'loan_number' },
  employeeId: { type: DataTypes.UUID, allowNull: false, field: 'employee_id' },
  loanType: { type: DataTypes.ENUM('Personal', 'Housing', 'Vehicle', 'Education', 'Medical', 'Other'), defaultValue: 'Personal', field: 'loan_type' },
  principalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, field: 'principal_amount' },
  interestRate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0, field: 'interest_rate' },
  monthlyInstallment: { type: DataTypes.DECIMAL(12, 2), allowNull: false, field: 'monthly_installment' },
  totalInstallments: { type: DataTypes.INTEGER, allowNull: false, field: 'total_installments' },
  paidInstallments: { type: DataTypes.INTEGER, defaultValue: 0, field: 'paid_installments' },
  remainingAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, field: 'remaining_amount' },
  startDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'start_date' },
  endDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'end_date' },
  status: { type: DataTypes.ENUM('Pending', 'Approved', 'Active', 'Closed', 'Suspended', 'Rejected'), defaultValue: 'Pending' },
  approvedBy: { type: DataTypes.UUID, allowNull: true, field: 'approved_by' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'employee_loans', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }, { fields: ['status'] }] });

module.exports = EmployeeLoan;
