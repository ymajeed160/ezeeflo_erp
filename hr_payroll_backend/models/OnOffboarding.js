const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OnboardingChecklist = sequelize.define('OnboardingChecklist', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  taskName: { type: DataTypes.STRING(200), allowNull: false, field: 'task_name' },
  category: { type: DataTypes.ENUM('IT', 'HR', 'Admin', 'Training', 'Documentation', 'Other'), defaultValue: 'HR' },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0, field: 'sort_order' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
}, { tableName: 'onboarding_checklists', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }] });

const OnboardingProgress = sequelize.define('OnboardingProgress', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  employeeId: { type: DataTypes.UUID, allowNull: false, field: 'employee_id' },
  checklistId: { type: DataTypes.UUID, allowNull: false, field: 'checklist_id' },
  completedDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'completed_date' },
  completedBy: { type: DataTypes.UUID, allowNull: true, field: 'completed_by' },
  status: { type: DataTypes.ENUM('Pending', 'In Progress', 'Completed', 'Skipped'), defaultValue: 'Pending' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
}, { tableName: 'onboarding_progress', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }] });

const OffboardingChecklist = sequelize.define('OffboardingChecklist', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  taskName: { type: DataTypes.STRING(200), allowNull: false, field: 'task_name' },
  category: { type: DataTypes.ENUM('ExitInterview', 'AssetReturn', 'ITAccess', 'FinalSettlement', 'Documentation', 'Clearance', 'Other'), defaultValue: 'Other' },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0, field: 'sort_order' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
}, { tableName: 'offboarding_checklists', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }] });

const OffboardingProgress = sequelize.define('OffboardingProgress', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  employeeId: { type: DataTypes.UUID, allowNull: false, field: 'employee_id' },
  checklistId: { type: DataTypes.UUID, allowNull: false, field: 'checklist_id' },
  completedDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'completed_date' },
  completedBy: { type: DataTypes.UUID, allowNull: true, field: 'completed_by' },
  status: { type: DataTypes.ENUM('Pending', 'In Progress', 'Completed', 'Skipped'), defaultValue: 'Pending' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
}, { tableName: 'offboarding_progress', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }] });

const ExitInterview = sequelize.define('ExitInterview', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  employeeId: { type: DataTypes.UUID, allowNull: false, field: 'employee_id' },
  interviewDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'interview_date' },
  reasonForLeaving: { type: DataTypes.TEXT, allowNull: true, field: 'reason_for_leaving' },
  newEmployer: { type: DataTypes.STRING(200), allowNull: true, field: 'new_employer' },
  newPosition: { type: DataTypes.STRING(200), allowNull: true, field: 'new_position' },
  feedback: { type: DataTypes.TEXT, allowNull: true },
  rehireRecommendation: { type: DataTypes.BOOLEAN, allowNull: true, field: 'rehire_recommendation' },
  interviewerId: { type: DataTypes.UUID, allowNull: true, field: 'interviewer_id' },
  status: { type: DataTypes.ENUM('Scheduled', 'Completed', 'Cancelled'), defaultValue: 'Scheduled' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'exit_interviews', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }] });

module.exports = { OnboardingChecklist, OnboardingProgress, OffboardingChecklist, OffboardingProgress, ExitInterview };
