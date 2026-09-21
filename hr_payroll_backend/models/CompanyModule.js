const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CompanyModule = sequelize.define('CompanyModule', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false, field: 'company_id' },
  moduleCode: { type: DataTypes.STRING(50), allowNull: false, field: 'module_code' },
  moduleName: { type: DataTypes.STRING(100), allowNull: false, field: 'module_name' },
  isEnabled: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_enabled' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, {
  tableName: 'company_modules',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['company_id'] },
    { fields: ['company_id', 'module_code'], unique: true },
  ],
});

module.exports = CompanyModule;
