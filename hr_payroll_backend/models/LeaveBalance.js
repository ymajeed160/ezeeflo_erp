const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LeaveBalance = sequelize.define('LeaveBalance', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  employeeId: { type: DataTypes.UUID, allowNull: false, field: 'employee_id' },
  leaveTypeId: { type: DataTypes.UUID, allowNull: false, field: 'leave_type_id' },
  year: { type: DataTypes.INTEGER, allowNull: false },
  openingBalance: { type: DataTypes.DECIMAL(5, 1), defaultValue: 0, field: 'opening_balance' },
  accruedDays: { type: DataTypes.DECIMAL(5, 1), defaultValue: 0, field: 'accrued_days' },
  usedDays: { type: DataTypes.DECIMAL(5, 1), defaultValue: 0, field: 'used_days' },
  pendingDays: { type: DataTypes.DECIMAL(5, 1), defaultValue: 0, field: 'pending_days' },
  availableBalance: { type: DataTypes.DECIMAL(5, 1), defaultValue: 0, field: 'available_balance' },
  carryForwardDays: { type: DataTypes.DECIMAL(5, 1), defaultValue: 0, field: 'carry_forward_days' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, {
  tableName: 'leave_balances', timestamps: true, paranoid: true,
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['employee_id'] },
    { fields: ['leave_type_id'] },
    { fields: ['tenant_id', 'employee_id', 'leave_type_id', 'year'], unique: true },
  ],
});

module.exports = LeaveBalance;
