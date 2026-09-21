const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const AssetInsurance = sequelize.define('AssetInsurance', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  insuranceNumber: { type: DataTypes.STRING(50), allowNull: false, field: 'insurance_number' },
  assetId: { type: DataTypes.UUID, allowNull: false, field: 'asset_id' },
  insuranceCompany: { type: DataTypes.STRING(200), allowNull: false, field: 'insurance_company' },
  policyNumber: { type: DataTypes.STRING(100), allowNull: false, field: 'policy_number' },
  premium: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
  coverageAmount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0, field: 'coverage_amount' },
  startDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'start_date' },
  expiryDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'expiry_date' },
  renewalReminderDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30, field: 'renewal_reminder_days' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('active', 'expired', 'cancelled'), allowNull: false, defaultValue: 'active' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'asset_insurances', underscored: true, timestamps: true, paranoid: false });
module.exports = AssetInsurance;
