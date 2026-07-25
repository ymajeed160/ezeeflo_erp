const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaxRate = sequelize.define('TaxRate', {
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
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING(30),
    defaultValue: '',
  },
  rate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_default',
  },
}, {
  tableName: 'tax_rates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { unique: true, fields: ['tenant_id', 'name'] },
  ],
});

module.exports = TaxRate;
