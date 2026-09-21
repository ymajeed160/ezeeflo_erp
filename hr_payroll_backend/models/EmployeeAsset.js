const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * EmployeeAsset Model
 * 
 * Tracks assets assigned to employees directly in the HR module.
 * Fields: asset name, type, code, serial number, assigned/return dates, status, remarks.
 */
const EmployeeAsset = sequelize.define('EmployeeAsset', {
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
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'employee_id',
  },
  assetCode: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'asset_code',
  },
  assetName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'asset_name',
  },
  assetType: {
    type: DataTypes.ENUM('laptop', 'mobile_phone', 'sim_card', 'access_card', 'vehicle', 'equipment', 'other'),
    defaultValue: 'other',
    field: 'asset_type',
  },
  serialNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'serial_number',
  },
  brand: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  model: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  assignedDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'assigned_date',
  },
  returnDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'return_date',
  },
  status: {
    type: DataTypes.ENUM('assigned', 'returned', 'lost', 'damaged'),
    defaultValue: 'assigned',
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
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
  tableName: 'employee_assets',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['employee_id'] },
    { fields: ['asset_code'] },
    { fields: ['asset_type'] },
  ],
});

module.exports = EmployeeAsset;
