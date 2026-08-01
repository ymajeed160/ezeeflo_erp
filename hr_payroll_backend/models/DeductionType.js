const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeductionType = sequelize.define('DeductionType', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  code: { type: DataTypes.STRING(20), allowNull: false },
  name: { type: DataTypes.STRING(150), allowNull: false },
  deductionCategory: { type: DataTypes.ENUM('Loan', 'Absence', 'Late', 'Penalty', 'Insurance', 'Other'), defaultValue: 'Other', field: 'deduction_category' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'deduction_types', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['tenant_id', 'code'], unique: true }] });

module.exports = DeductionType;
