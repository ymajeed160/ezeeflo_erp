const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LeaveApproval = sequelize.define('LeaveApproval', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  leaveApplicationId: { type: DataTypes.UUID, allowNull: false, field: 'leave_application_id' },
  approverId: { type: DataTypes.UUID, allowNull: false, field: 'approver_id', comment: 'employee ID of approver' },
  approvalLevel: { type: DataTypes.INTEGER, defaultValue: 1, field: 'approval_level' },
  status: { type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'), defaultValue: 'Pending' },
  comments: { type: DataTypes.TEXT, allowNull: true },
  decidedAt: { type: DataTypes.DATE, allowNull: true, field: 'decided_at' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
}, {
  tableName: 'leave_approvals', timestamps: true, paranoid: true,
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['leave_application_id'] },
    { fields: ['approver_id'] },
    { fields: ['status'] },
  ],
});

module.exports = LeaveApproval;
