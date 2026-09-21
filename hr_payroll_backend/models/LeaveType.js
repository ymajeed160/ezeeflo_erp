const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LeaveType = sequelize.define('LeaveType', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  code: { type: DataTypes.STRING(20), allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  nameAr: { type: DataTypes.STRING(100), allowNull: true, field: 'name_ar' },
  leaveCategory: {
    type: DataTypes.ENUM('Annual', 'Sick', 'Emergency', 'Maternity', 'Paternity', 'Unpaid', 'Compensatory', 'Bereavement', 'Study', 'Other'),
    allowNull: false, field: 'leave_category',
  },
  isPaid: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_paid' },
  maxDaysPerYear: { type: DataTypes.DECIMAL(5, 1), allowNull: true, field: 'max_days_per_year' },
  maxDaysPerRequest: { type: DataTypes.DECIMAL(5, 1), allowNull: true, field: 'max_days_per_request' },
  minDaysPerRequest: { type: DataTypes.DECIMAL(4, 1), defaultValue: 0.5, field: 'min_days_per_request' },
  requiresApproval: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'requires_approval' },
  requiresDocuments: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'requires_documents' },
  allowNegativeBalance: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'allow_negative_balance' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  description: { type: DataTypes.TEXT, allowNull: true },
  color: { type: DataTypes.STRING(7), allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, {
  tableName: 'leave_types', timestamps: true, paranoid: true,
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['tenant_id', 'code'], unique: true },
    { fields: ['leave_category'] },
  ],
});

module.exports = LeaveType;
