const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ModuleUsage = sequelize.define('ModuleUsage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'company_id',
  },
  moduleId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'module_id',
  },
  usageDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'usage_date',
  },
  accessCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'access_count',
  },
  activeUsers: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'active_users',
  },
  transactions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'module_usage',
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['company_id', 'module_id', 'usage_date'],
    },
  ],
});

module.exports = ModuleUsage;
