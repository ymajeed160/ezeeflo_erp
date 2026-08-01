const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SalaryComponent = sequelize.define('SalaryComponent', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  structureId: { type: DataTypes.UUID, allowNull: false, field: 'structure_id' },
  code: { type: DataTypes.STRING(20), allowNull: false },
  name: { type: DataTypes.STRING(150), allowNull: false },
  componentType: { type: DataTypes.ENUM('Earning', 'Deduction', 'EmployerContribution', 'EmployeeContribution'), allowNull: false, field: 'component_type' },
  calculationMethod: { type: DataTypes.ENUM('Fixed', 'Percentage', 'Formula'), defaultValue: 'Fixed', field: 'calculation_method' },
  value: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  percentageOf: { type: DataTypes.STRING(50), allowNull: true, field: 'percentage_of', comment: 'Which base to calculate percentage on (e.g., basic_salary, total_salary)' },
  isTaxable: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_taxable' },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0, field: 'sort_order' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'salary_components', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['structure_id'] }, { fields: ['component_type'] }] });

module.exports = SalaryComponent;
