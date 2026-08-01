const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LeaveApplication = sequelize.define('LeaveApplication', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  applicationNumber: { type: DataTypes.STRING(30), allowNull: false, field: 'application_number' },
  employeeId: { type: DataTypes.UUID, allowNull: false, field: 'employee_id' },
  leaveTypeId: { type: DataTypes.UUID, allowNull: false, field: 'leave_type_id' },
  startDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'start_date' },
  endDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'end_date' },
  totalDays: { type: DataTypes.DECIMAL(5, 1), defaultValue: 0, field: 'total_days' },
  reason: { type: DataTypes.TEXT, allowNull: true },
  status: {
    type: DataTypes.ENUM('Draft', 'Submitted', 'Approved', 'Rejected', 'Cancelled'),
    defaultValue: 'Draft',
  },
  contactDetails: { type: DataTypes.STRING(200), allowNull: true, field: 'contact_details' },
  attachmentPath: { type: DataTypes.STRING(500), allowNull: true, field: 'attachment_path' },
  submittedAt: { type: DataTypes.DATE, allowNull: true, field: 'submitted_at' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, {
  tableName: 'leave_applications', timestamps: true, paranoid: true,
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['employee_id'] },
    { fields: ['leave_type_id'] },
    { fields: ['status'] },
    { fields: ['start_date', 'end_date'] },
  ],
});

module.exports = LeaveApplication;
