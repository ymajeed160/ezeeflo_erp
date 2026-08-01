const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmployeeDeduction = sequelize.define('EmployeeDeduction', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  employeeId: { type: DataTypes.UUID, allowNull: false, field: 'employee_id' },
  deductionTypeId: { type: DataTypes.UUID, allowNull: true, field: 'deduction_type_id' },
  loanId: { type: DataTypes.UUID, allowNull: true, field: 'loan_id' },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  effectiveFrom: { type: DataTypes.DATEONLY, allowNull: true, field: 'effective_from' },
  effectiveTo: { type: DataTypes.DATEONLY, allowNull: true, field: 'effective_to' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'employee_deductions', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }, { fields: ['deduction_type_id'] }] });

module.exports = EmployeeDeduction;
