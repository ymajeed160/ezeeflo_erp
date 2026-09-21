const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UsageTracking = sequelize.define('UsageTracking', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  apiCalls: { type: DataTypes.INTEGER, defaultValue: 0 },
  transactions: { type: DataTypes.INTEGER, defaultValue: 0 },
  storageUsedMb: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  activeUsers: { type: DataTypes.INTEGER, defaultValue: 0 },
  activeCustomers: { type: DataTypes.INTEGER, defaultValue: 0 },
  pointsIssued: { type: DataTypes.INTEGER, defaultValue: 0 },
  pointsRedeemed: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'usage_tracking',
  timestamps: true,
  updatedAt: false,
});

UsageTracking.associate = (models) => {
  UsageTracking.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
};

module.exports = UsageTracking;
