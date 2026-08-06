const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CustomerBadge = sequelize.define('CustomerBadge', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  customerId: { type: DataTypes.UUID, allowNull: false },
  badgeId: { type: DataTypes.UUID, allowNull: false },
  earnedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  progress: { type: DataTypes.INTEGER, defaultValue: 0 },
  progressTarget: { type: DataTypes.INTEGER, defaultValue: 100 },
  isCompleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  completedAt: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'customer_badges', timestamps: true });

CustomerBadge.associate = (models) => {
  CustomerBadge.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
  CustomerBadge.belongsTo(models.Badge, { foreignKey: 'badgeId', as: 'badge' });
};

module.exports = CustomerBadge;
