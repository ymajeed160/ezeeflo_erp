const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MembershipTier = sequelize.define('MembershipTier', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  code: { type: DataTypes.STRING(50), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  minPoints: { type: DataTypes.INTEGER, defaultValue: 0 },
  maxPoints: { type: DataTypes.INTEGER, allowNull: true },
  pointMultiplier: { type: DataTypes.DECIMAL(5, 2), defaultValue: 1.00 },
  benefits: { type: DataTypes.JSON, allowNull: true },
  icon: { type: DataTypes.STRING(255), allowNull: true },
  color: { type: DataTypes.STRING(20), allowNull: true },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'membership_tiers',
  paranoid: true,
  timestamps: true,
});

MembershipTier.associate = (models) => {
  MembershipTier.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
  MembershipTier.hasMany(models.LoyaltyAccount, { foreignKey: 'membershipId', as: 'accounts' });
  MembershipTier.hasMany(models.CustomerMembership, { foreignKey: 'tierId', as: 'customerMemberships' });
};

module.exports = MembershipTier;
