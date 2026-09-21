const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Campaign = sequelize.define('Campaign', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  code: { type: DataTypes.STRING(50), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  campaignType: {
    type: DataTypes.ENUM('points_multiplier', 'bonus_points', 'birthday', 'welcome', 'referral', 'festival', 'weekend', 'spend_threshold', 'product', 'category', 'store'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'paused', 'ended', 'canceled'),
    defaultValue: 'draft',
  },
  startDate: { type: DataTypes.DATE, allowNull: false },
  endDate: { type: DataTypes.DATE, allowNull: false },
  rules: { type: DataTypes.JSON, allowNull: true },
  targetSegments: { type: DataTypes.JSON, allowNull: true },
  applicableStores: { type: DataTypes.JSON, allowNull: true },
  applicableProducts: { type: DataTypes.JSON, allowNull: true },
  applicableCategories: { type: DataTypes.JSON, allowNull: true },
  budget: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  budgetSpent: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
  priority: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  createdBy: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'campaigns',
  paranoid: true,
  timestamps: true,
});

Campaign.associate = (models) => {
  Campaign.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
  Campaign.hasMany(models.Coupon, { foreignKey: 'campaignId', as: 'coupons' });
};

module.exports = Campaign;
