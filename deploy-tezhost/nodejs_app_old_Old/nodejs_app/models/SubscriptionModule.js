const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SubscriptionModule = sequelize.define('SubscriptionModule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  moduleName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'module_name',
  },
  moduleCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'module_code',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  icon: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  route: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('enabled', 'disabled', 'hidden', 'beta'),
    defaultValue: 'enabled',
  },
  isCore: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_core',
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'sort_order',
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
  tableName: 'subscription_modules',
  timestamps: true,
  paranoid: false,
});

module.exports = SubscriptionModule;
