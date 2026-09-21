const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TrainingCourse = sequelize.define('TrainingCourse', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  code: { type: DataTypes.STRING(20), allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  category: { type: DataTypes.ENUM('Technical', 'Soft Skills', 'Compliance', 'Leadership', 'Safety', 'Other'), defaultValue: 'Other' },
  durationHours: { type: DataTypes.INTEGER, allowNull: true, field: 'duration_hours' },
  cost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  providerName: { type: DataTypes.STRING(200), allowNull: true, field: 'provider_name' },
  isInternal: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_internal' },
  isMandatory: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_mandatory' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'training_courses', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['tenant_id', 'code'], unique: true }] });

const TrainingSession = sequelize.define('TrainingSession', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  courseId: { type: DataTypes.UUID, allowNull: false, field: 'course_id' },
  sessionName: { type: DataTypes.STRING(200), allowNull: false, field: 'session_name' },
  trainerName: { type: DataTypes.STRING(200), allowNull: true, field: 'trainer_name' },
  location: { type: DataTypes.STRING(200), allowNull: true },
  startDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'start_date' },
  endDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'end_date' },
  startTime: { type: DataTypes.TIME, allowNull: true, field: 'start_time' },
  endTime: { type: DataTypes.TIME, allowNull: true, field: 'end_time' },
  maxAttendees: { type: DataTypes.INTEGER, allowNull: true, field: 'max_attendees' },
  enrolledCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'enrolled_count' },
  status: { type: DataTypes.ENUM('Planned', 'In Progress', 'Completed', 'Cancelled'), defaultValue: 'Planned' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'training_sessions', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['course_id'] }, { fields: ['status'] }] });

const TrainingAttendee = sequelize.define('TrainingAttendee', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  sessionId: { type: DataTypes.UUID, allowNull: false, field: 'session_id' },
  employeeId: { type: DataTypes.UUID, allowNull: false, field: 'employee_id' },
  attendanceStatus: { type: DataTypes.ENUM('Enrolled', 'Attended', 'Absent', 'Completed'), defaultValue: 'Enrolled', field: 'attendance_status' },
  score: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  certificateIssued: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'certificate_issued' },
  feedback: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
}, { tableName: 'training_attendees', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['session_id'] }, { fields: ['employee_id'] }] });

module.exports = { TrainingCourse, TrainingSession, TrainingAttendee };
