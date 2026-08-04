const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
  employeeId: { type: DataTypes.UUID, allowNull: true, field: 'employee_id' },
  type: {
    type: DataTypes.ENUM(
      'attendance_reminder', 'leave_approved', 'leave_rejected', 'leave_submitted',
      'payroll_released', 'document_expiry', 'birthday', 'work_anniversary',
      'announcement', 'training_reminder', 'holiday_reminder', 'request_status'
    ),
    allowNull: false,
  },
  title: { type: DataTypes.STRING(300), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  data: { type: DataTypes.JSON, allowNull: true },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_read' },
  readAt: { type: DataTypes.DATE, allowNull: true, field: 'read_at' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
}, {
  tableName: 'notifications',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['user_id'] },
    { fields: ['employee_id'] },
    { fields: ['is_read'] },
    { fields: ['type'] },
    { fields: ['created_at'] },
  ],
});

module.exports = Notification;
