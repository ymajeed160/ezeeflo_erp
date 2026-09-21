const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WpsConfiguration = sequelize.define('WpsConfiguration', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  configName: { type: DataTypes.STRING(100), allowNull: false, field: 'config_name' },
  bankCode: { type: DataTypes.STRING(50), allowNull: true, field: 'bank_code' },
  agentCode: { type: DataTypes.STRING(50), allowNull: true, field: 'agent_code' },
  fileFormat: { type: DataTypes.ENUM('SIF', 'CSV', 'EXCEL'), defaultValue: 'SIF', field: 'file_format' },
  employerReference: { type: DataTypes.STRING(100), allowNull: true, field: 'employer_reference' },
  isDefault: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_default' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'wps_configurations', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }] });

const WpsExport = sequelize.define('WpsExport', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  exportNumber: { type: DataTypes.STRING(30), allowNull: false, field: 'export_number' },
  configId: { type: DataTypes.UUID, allowNull: true, field: 'config_id' },
  payrollRunId: { type: DataTypes.UUID, allowNull: true, field: 'payroll_run_id' },
  exportDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'export_date' },
  totalEmployees: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_employees' },
  totalAmount: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0, field: 'total_amount' },
  fileName: { type: DataTypes.STRING(255), allowNull: true, field: 'file_name' },
  filePath: { type: DataTypes.STRING(500), allowNull: true, field: 'file_path' },
  status: { type: DataTypes.ENUM('Draft', 'Generated', 'Submitted'), defaultValue: 'Draft' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
}, { tableName: 'wps_exports', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['payroll_run_id'] }] });

module.exports = { WpsConfiguration, WpsExport };
