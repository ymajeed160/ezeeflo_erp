const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PerformanceGoal = sequelize.define('PerformanceGoal', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  employeeId: { type: DataTypes.UUID, allowNull: false, field: 'employee_id' },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  goalType: { type: DataTypes.ENUM('Individual', 'Team', 'Department', 'Company'), defaultValue: 'Individual', field: 'goal_type' },
  priority: { type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'), defaultValue: 'Medium' },
  startDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'start_date' },
  targetDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'target_date' },
  completionDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'completion_date' },
  progressPercentage: { type: DataTypes.INTEGER, defaultValue: 0, field: 'progress_percentage' },
  weight: { type: DataTypes.DECIMAL(5, 2), defaultValue: 100, comment: 'Weight in appraisal' },
  status: { type: DataTypes.ENUM('Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'), defaultValue: 'Not Started' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'performance_goals', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }, { fields: ['status'] }] });

const PerformanceKpi = sequelize.define('PerformanceKpi', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  code: { type: DataTypes.STRING(20), allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  kpiType: { type: DataTypes.ENUM('Quantitative', 'Qualitative', 'Behavioral'), defaultValue: 'Quantitative', field: 'kpi_type' },
  measurementUnit: { type: DataTypes.STRING(50), allowNull: true, field: 'measurement_unit' },
  targetValue: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'target_value' },
  minimumValue: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'minimum_value' },
  departmentId: { type: DataTypes.UUID, allowNull: true, field: 'department_id' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'performance_kpis', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['tenant_id', 'code'], unique: true }] });

const PerformanceAppraisal = sequelize.define('PerformanceAppraisal', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  employeeId: { type: DataTypes.UUID, allowNull: false, field: 'employee_id' },
  appraiserId: { type: DataTypes.UUID, allowNull: false, field: 'appraiser_id' },
  appraisalDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'appraisal_date' },
  periodFrom: { type: DataTypes.DATEONLY, allowNull: true, field: 'period_from' },
  periodTo: { type: DataTypes.DATEONLY, allowNull: true, field: 'period_to' },
  overallRating: { type: DataTypes.DECIMAL(3, 1), allowNull: true, field: 'overall_rating' },
  strengths: { type: DataTypes.TEXT, allowNull: true },
  improvements: { type: DataTypes.TEXT, allowNull: true },
  employeeComments: { type: DataTypes.TEXT, allowNull: true, field: 'employee_comments' },
  appraiserComments: { type: DataTypes.TEXT, allowNull: true, field: 'appraiser_comments' },
  status: { type: DataTypes.ENUM('Draft', 'Self Review', 'Manager Review', 'Reviewed', 'Acknowledged'), defaultValue: 'Draft' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'performance_appraisals', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }, { fields: ['status'] }] });

module.exports = { PerformanceGoal, PerformanceKpi, PerformanceAppraisal };
