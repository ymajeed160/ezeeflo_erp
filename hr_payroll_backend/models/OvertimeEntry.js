const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * OvertimeEntry Model — Overtime records for employees.
 */
const OvertimeEntry = sequelize.define('OvertimeEntry', {
  id: {
    type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID, allowNull: false, field: 'tenant_id',
  },
  employeeId: {
    type: DataTypes.UUID, allowNull: false, field: 'employee_id',
  },
  attendanceId: {
    type: DataTypes.UUID, allowNull: true, field: 'attendance_id',
  },
  overtimeDate: {
    type: DataTypes.DATEONLY, allowNull: false, field: 'overtime_date',
  },
  startTime: {
    type: DataTypes.TIME, allowNull: false, field: 'start_time',
  },
  endTime: {
    type: DataTypes.TIME, allowNull: false, field: 'end_time',
  },
  totalMinutes: {
    type: DataTypes.INTEGER, defaultValue: 0, field: 'total_minutes',
  },
  overtimeType: {
    type: DataTypes.ENUM('Regular', 'Weekend', 'Holiday'),
    defaultValue: 'Regular', field: 'overtime_type',
  },
  rateMultiplier: {
    type: DataTypes.DECIMAL(3, 2), defaultValue: 1.25, field: 'rate_multiplier',
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending',
  },
  approvedBy: {
    type: DataTypes.UUID, allowNull: true, field: 'approved_by',
  },
  approvedAt: {
    type: DataTypes.DATE, allowNull: true, field: 'approved_at',
  },
  reason: {
    type: DataTypes.TEXT, allowNull: true,
  },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, {
  tableName: 'overtime_entries',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['employee_id'] },
    { fields: ['overtime_date'] },
    { fields: ['status'] },
  ],
});

module.exports = OvertimeEntry;
