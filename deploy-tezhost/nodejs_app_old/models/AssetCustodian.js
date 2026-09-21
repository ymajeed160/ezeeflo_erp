const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const AssetCustodian = sequelize.define('AssetCustodian', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  custodianCode: { type: DataTypes.STRING(50), allowNull: false, field: 'custodian_code' },
  custodianName: { type: DataTypes.STRING(200), allowNull: false, field: 'custodian_name' },
  custodianType: { type: DataTypes.ENUM('employee', 'doctor', 'department'), allowNull: false, field: 'custodian_type' },
  email: { type: DataTypes.STRING(200), allowNull: true },
  phone: { type: DataTypes.STRING(50), allowNull: true },
  department: { type: DataTypes.STRING(200), allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false, field: 'is_active' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'asset_custodians', underscored: true, timestamps: true, paranoid: false });
module.exports = AssetCustodian;
