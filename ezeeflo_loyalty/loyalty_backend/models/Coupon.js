const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Coupon = sequelize.define('Coupon', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  code: { type: DataTypes.STRING(50), allowNull: false },
  couponType: { type: DataTypes.ENUM('single_use', 'reusable', 'limited'), defaultValue: 'single_use' },
  discountType: { type: DataTypes.ENUM('percentage', 'fixed_amount', 'points'), allowNull: false },
  discountValue: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  minPurchase: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  maxDiscount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  usageLimit: { type: DataTypes.INTEGER, defaultValue: -1 },
  usageCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  perCustomerLimit: { type: DataTypes.INTEGER, defaultValue: 1 },
  startDate: { type: DataTypes.DATE, allowNull: false },
  endDate: { type: DataTypes.DATE, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  applicableProducts: { type: DataTypes.JSON, allowNull: true },
  applicableCategories: { type: DataTypes.JSON, allowNull: true },
  campaignId: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'coupons',
  paranoid: true,
  timestamps: true,
});

Coupon.associate = (models) => {
  Coupon.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
  Coupon.belongsTo(models.Campaign, { foreignKey: 'campaignId', as: 'campaign' });
};

module.exports = Coupon;
