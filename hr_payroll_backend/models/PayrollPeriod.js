const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PayrollPeriod = sequelize.define('PayrollPeriod', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  periodCode: { type: DataTypes.STRING(30), allowNull: false, field: 'period_code' },
  periodName: { type: DataTypes.STRING(150), allowNull: false, field: 'period_name' },
  frequency: { type: DataTypes.ENUM('Monthly', 'Weekly', 'BiWeekly', 'Daily'), allowNull: false },
  startDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'start_date' },
  endDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'end_date' },
  paymentDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'payment_date' },
  status: { type: DataTypes.ENUM('Open', 'Processing', 'Closed', 'Locked'), defaultValue: 'Open' },
  isLocked: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_locked' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'payroll_periods', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['tenant_id', 'period_code'], unique: true }, { fields: ['status'] }] });

module.exports = PayrollPeriod;
