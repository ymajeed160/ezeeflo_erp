const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NumberSeries = sequelize.define('NumberSeries', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tenant_id',
  },
  seriesName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'series_name',
  },
  prefix: {
    type: DataTypes.STRING(50),
    defaultValue: '',
  },
  suffix: {
    type: DataTypes.STRING(50),
    defaultValue: '',
  },
  nextNumber: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'next_number',
  },
  numberLength: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    field: 'number_length',
  },
  padZero: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'pad_zero',
  },
  resetPeriod: {
    type: DataTypes.ENUM('none','yearly','monthly','daily'),
    defaultValue: 'none',
    field: 'reset_period',
  },
  lastResetDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'last_reset_date',
  },
}, {
  tableName: 'number_series',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { unique: true, fields: ['tenant_id', 'series_name'] },
  ],
});

module.exports = NumberSeries;
