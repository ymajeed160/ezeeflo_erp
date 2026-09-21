const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Designation Model
 * 
 * Job titles / positions (Manager, Accountant, Developer, etc.)
 */
const Designation = sequelize.define('Designation', {
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
  grade: {
    type: DataTypes.STRING(20),
    allowNull: true,
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
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'sort_order',
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
  tableName: 'designations',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['tenant_id', 'code'], unique: true },
    { fields: ['department_id'] },
  ],
});

module.exports = Designation;
