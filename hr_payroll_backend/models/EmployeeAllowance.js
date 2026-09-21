const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmployeeAllowance = sequelize.define('EmployeeAllowance', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  employeeId: { type: DataTypes.UUID, allowNull: false, field: 'employee_id' },
  allowanceTypeId: { type: DataTypes.UUID, allowNull: false, field: 'allowance_type_id' },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  effectiveFrom: { type: DataTypes.DATEONLY, allowNull: true, field: 'effective_from' },
  effectiveTo: { type: DataTypes.DATEONLY, allowNull: true, field: 'effective_to' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'employee_allowances', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }, { fields: ['allowance_type_id'] }] });

module.exports = EmployeeAllowance;
