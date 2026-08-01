const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Holiday = sequelize.define('Holiday', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  name: { type: DataTypes.STRING(150), allowNull: false },
  nameAr: { type: DataTypes.STRING(150), allowNull: true, field: 'name_ar' },
  holidayDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'holiday_date' },
  endDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'end_date' },
  isRecurringYearly: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_recurring_yearly' },
  holidayType: { type: DataTypes.ENUM('Public', 'Religious', 'National', 'Company'), defaultValue: 'Public', field: 'holiday_type' },
  description: { type: DataTypes.TEXT, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, {
  tableName: 'holidays', timestamps: true, paranoid: true,
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['holiday_date'] },
    { fields: ['holiday_type'] },
  ],
});

module.exports = Holiday;
