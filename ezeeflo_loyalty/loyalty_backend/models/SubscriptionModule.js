const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SubscriptionModule = sequelize.define('SubscriptionModule', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  category: { type: DataTypes.STRING(50), defaultValue: 'general' },
  status: { type: DataTypes.ENUM('enabled', 'disabled', 'hidden', 'beta'), defaultValue: 'enabled' },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'subscription_modules',
  paranoid: true,
  timestamps: true,
});

SubscriptionModule.associate = (models) => {
  SubscriptionModule.belongsToMany(models.SubscriptionPlan, {
    through: models.SubscriptionPlanModule,
    foreignKey: 'moduleId',
    otherKey: 'planId',
    as: 'plans',
  });
};

module.exports = SubscriptionModule;
