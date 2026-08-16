const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const AssetLocation = sequelize.define('AssetLocation', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  locationCode: { type: DataTypes.STRING(50), allowNull: false, field: 'location_code' },
  locationName: { type: DataTypes.STRING(200), allowNull: false, field: 'location_name' },
  locationType: { type: DataTypes.ENUM('building', 'floor', 'room', 'clinic', 'department', 'warehouse'), allowNull: false, field: 'location_type' },
  parentId: { type: DataTypes.UUID, allowNull: true, field: 'parent_id' },
  description: { type: DataTypes.TEXT, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false, field: 'is_active' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'asset_locations', underscored: true, timestamps: true, paranoid: false });
module.exports = AssetLocation;
