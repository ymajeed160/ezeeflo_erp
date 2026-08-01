const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Roster Model — Weekly/Monthly employee roster planning.
 */
const Roster = sequelize.define('Roster', {
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
  rosterDate: {
    type: DataTypes.DATEONLY, allowNull: false, field: 'roster_date',
  },
  isWeeklyOff: {
    type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_weekly_off',
  },
  isHoliday: {
    type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_holiday',
  },
  notes: {
    type: DataTypes.TEXT, allowNull: true,
  },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, {
  tableName: 'rosters',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['employee_id'] },
    { fields: ['shift_id'] },
    { fields: ['roster_date'] },
    { fields: ['tenant_id', 'employee_id', 'roster_date'], unique: true },
  ],
});

module.exports = Roster;
