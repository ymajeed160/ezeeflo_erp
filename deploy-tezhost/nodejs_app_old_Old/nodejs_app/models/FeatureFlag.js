const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FeatureFlag = sequelize.define('FeatureFlag', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  featureName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'feature_name',
  },
  featureCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'feature_code',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isGlobalEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_global_enabled',
  },
  appliesToAll: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'applies_to_all',
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'created_by',
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'updated_by',
  },
}, {
  tableName: 'feature_flags',
  timestamps: true,
  paranoid: false,
});

module.exports = FeatureFlag;
