const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Attendance Model — Daily attendance records for employees.
 */
const Attendance = sequelize.define('Attendance', {
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
    type: DataTypes.UUID, allowNull: true, field: 'shift_id',
  },
  attendanceDate: {
    type: DataTypes.DATEONLY, allowNull: false, field: 'attendance_date',
  },
  checkInTime: {
    type: DataTypes.DATE, allowNull: true, field: 'check_in_time',
  },
  checkOutTime: {
    type: DataTypes.DATE, allowNull: true, field: 'check_out_time',
  },
  checkInMethod: {
    type: DataTypes.ENUM('Manual', 'Biometric', 'GPS', 'Mobile', 'Face', 'Web'),
    defaultValue: 'Manual', field: 'check_in_method',
  },
  checkOutMethod: {
    type: DataTypes.ENUM('Manual', 'Biometric', 'GPS', 'Mobile', 'Face', 'Web'),
    defaultValue: 'Manual', field: 'check_out_method',
  },
  checkInLocation: {
    type: DataTypes.STRING(255), allowNull: true, field: 'check_in_location',
  },
  checkOutLocation: {
    type: DataTypes.STRING(255), allowNull: true, field: 'check_out_location',
  },
  status: {
    type: DataTypes.ENUM('Present', 'Absent', 'Late', 'Half Day', 'Weekly Off', 'Holiday', 'On Leave'),
    allowNull: false, defaultValue: 'Present',
  },
  lateMinutes: {
    type: DataTypes.INTEGER, defaultValue: 0, field: 'late_minutes',
  },
  earlyLeavingMinutes: {
    type: DataTypes.INTEGER, defaultValue: 0, field: 'early_leaving_minutes',
  },
  overtimeMinutes: {
    type: DataTypes.INTEGER, defaultValue: 0, field: 'overtime_minutes',
  },
  totalWorkedMinutes: {
    type: DataTypes.INTEGER, defaultValue: 0, field: 'total_worked_minutes',
  },
  isManualEntry: {
    type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_manual_entry',
  },
  remarks: {
    type: DataTypes.TEXT, allowNull: true,
  },
  approvedBy: {
    type: DataTypes.UUID, allowNull: true, field: 'approved_by',
  },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, {
  tableName: 'attendances',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['employee_id'] },
    { fields: ['attendance_date'] },
    { fields: ['tenant_id', 'employee_id', 'attendance_date'], unique: true },
    { fields: ['status'] },
    { fields: ['shift_id'] },
  ],
});

module.exports = Attendance;
