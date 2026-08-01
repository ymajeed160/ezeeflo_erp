const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Cost Center Model
 * 
 * Cost centers for payroll allocation and accounting integration
 */
const CostCenter = sequelize.define('CostCenter', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tenant_id',
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  nameAr: {
    type: DataTypes.STRING(150),
    allowNull: true,
    field: 'name_ar',
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'department_id',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'created_by',
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'updated_by',
  },
}, {
  tableName: 'cost_centers',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['tenant_id', 'code'], unique: true },
    { fields: ['department_id'] },
  ],
});

module.exports = CostCenter;
