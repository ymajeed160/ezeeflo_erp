const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CouponUsage = sequelize.define('CouponUsage', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  couponId: { type: DataTypes.UUID, allowNull: false },
  customerId: { type: DataTypes.UUID, allowNull: false },
  companyId: { type: DataTypes.UUID, allowNull: false },
  orderReference: { type: DataTypes.STRING(100), allowNull: true },
  discountApplied: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  usedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'coupon_usages',
  timestamps: false,
});

CouponUsage.associate = (models) => {
  CouponUsage.belongsTo(models.Coupon, { foreignKey: 'couponId', as: 'coupon' });
  CouponUsage.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
};

module.exports = CouponUsage;
