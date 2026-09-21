const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EssSubmission = sequelize.define('EssSubmission', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  employeeId: { type: DataTypes.UUID, allowNull: false, field: 'employee_id' },
  requestType: { type: DataTypes.ENUM('Leave', 'Loan', 'Document', 'ProfileUpdate', 'Payslip', 'Attendance', 'Other'), allowNull: false, field: 'request_type' },
  referenceId: { type: DataTypes.UUID, allowNull: true, field: 'reference_id' },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Completed'), defaultValue: 'Pending' },
  reviewedBy: { type: DataTypes.UUID, allowNull: true, field: 'reviewed_by' },
  reviewedAt: { type: DataTypes.DATE, allowNull: true, field: 'reviewed_at' },
  remarks: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'ess_submissions', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }, { fields: ['request_type'] }, { fields: ['status'] }] });

module.exports = EssSubmission;
