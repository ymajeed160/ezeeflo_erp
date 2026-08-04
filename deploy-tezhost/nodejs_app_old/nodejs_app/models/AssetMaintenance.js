const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssetMaintenance = sequelize.define('AssetMaintenance', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  maintenanceNumber: { type: DataTypes.STRING(50), allowNull: false, field: 'maintenance_number' },
  assetId: { type: DataTypes.UUID, allowNull: false, field: 'asset_id' },
  maintenanceType: { type: DataTypes.ENUM('preventive', 'corrective', 'amc'), allowNull: false, field: 'maintenance_type' },
  title: { type: DataTypes.STRING(300), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  serviceProvider: { type: DataTypes.STRING(200), allowNull: true, field: 'service_provider' },
  maintenanceDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'maintenance_date' },
  nextDueDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'next_due_date' },
  cost: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'), allowNull: false, defaultValue: 'scheduled' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'asset_maintenances', underscored: true, timestamps: true, paranoid: false });

module.exports = AssetMaintenance;
