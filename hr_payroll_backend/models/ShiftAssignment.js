const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * ShiftAssignment Model — Assigns shifts to employees for a date range.
 */
const ShiftAssignment = sequelize.define('ShiftAssignment', {
  id: {
    type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID, allowNull: false, field: 'tenant_id',
  },
  employeeId: {
    type: DataTypes.UUID, allowNull: false, field: 'employee_id',
  },
  shiftId: {
    type: DataTypes.UUID, allowNull: false, field: 'shift_id',
  },
  assignedBy: {
    type: DataTypes.UUID, allowNull: true, field: 'assigned_by',
  },
  effectiveFrom: {
    type: DataTypes.DATEONLY, allowNull: false, field: 'effective_from',
  },
  effectiveTo: {
    type: DataTypes.DATEONLY, allowNull: true, field: 'effective_to',
  },
  isActive: {
    type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active',
  },
  notes: {
    type: DataTypes.TEXT, allowNull: true,
  },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, {
  tableName: 'shift_assignments',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['employee_id'] },
    { fields: ['shift_id'] },
    { fields: ['effective_from', 'effective_to'] },
  ],
});

module.exports = ShiftAssignment;
