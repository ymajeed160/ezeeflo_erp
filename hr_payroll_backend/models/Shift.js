const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Shift Model — Defines work shift types and their timing rules.
 */
const Shift = sequelize.define('Shift', {
  id: {
    type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID, allowNull: false, field: 'tenant_id',
  },
  code: {
    type: DataTypes.STRING(20), allowNull: false,
  },
  name: {
    type: DataTypes.STRING(100), allowNull: false,
  },
  shiftType: {
    type: DataTypes.ENUM('Morning', 'Evening', 'Night', 'Rotational', 'Flexible'),
    allowNull: false, field: 'shift_type',
  },
  startTime: {
    type: DataTypes.TIME, allowNull: false, field: 'start_time',
  },
  endTime: {
    type: DataTypes.TIME, allowNull: false, field: 'end_time',
  },
  gracePeriodMinutes: {
    type: DataTypes.INTEGER, defaultValue: 15, field: 'grace_period_minutes',
  },
  lateThresholdMinutes: {
    type: DataTypes.INTEGER, defaultValue: 30, field: 'late_threshold_minutes',
  },
  halfDayThresholdMinutes: {
    type: DataTypes.INTEGER, defaultValue: 240, field: 'half_day_threshold_minutes',
  },
  earlyLeavingThresholdMinutes: {
    type: DataTypes.INTEGER, defaultValue: 15, field: 'early_leaving_threshold_minutes',
  },
  breakStartTime: {
    type: DataTypes.TIME, allowNull: true, field: 'break_start_time',
  },
  breakEndTime: {
    type: DataTypes.TIME, allowNull: true, field: 'break_end_time',
  },
  totalWorkingHours: {
    type: DataTypes.DECIMAL(4, 2), allowNull: true, field: 'total_working_hours',
  },
  weeklyOffDays: {
    type: DataTypes.STRING(50), allowNull: true, field: 'weekly_off_days',
    comment: 'Comma-separated day numbers: 0=Sun,1=Mon,...,6=Sat',
  },
  isNightShift: {
    type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_night_shift',
  },
  color: {
    type: DataTypes.STRING(7), allowNull: true, comment: 'Hex color for UI display',
  },
  description: {
    type: DataTypes.TEXT, allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active',
  },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, {
  tableName: 'shifts',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['tenant_id', 'code'], unique: true },
    { fields: ['shift_type'] },
    { fields: ['is_active'] },
  ],
});

module.exports = Shift;
