const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AllowanceType = sequelize.define('AllowanceType', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  code: { type: DataTypes.STRING(20), allowNull: false },
  name: { type: DataTypes.STRING(150), allowNull: false },
  allowanceCategory: { type: DataTypes.ENUM('Fixed', 'Variable', 'Recurring', 'OneTime'), defaultValue: 'Fixed', field: 'allowance_category' },
  isTaxable: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_taxable' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'allowance_types', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['tenant_id', 'code'], unique: true }] });

module.exports = AllowanceType;
