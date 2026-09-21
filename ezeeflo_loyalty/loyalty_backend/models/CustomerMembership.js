const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CustomerMembership = sequelize.define('CustomerMembership', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  customerId: { type: DataTypes.UUID, allowNull: false },
  tierId: { type: DataTypes.UUID, allowNull: false },
  startDate: { type: DataTypes.DATEONLY, allowNull: false },
  endDate: { type: DataTypes.DATEONLY, allowNull: true },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'upgraded', 'downgraded', 'renewed'),
    defaultValue: 'active',
  },
  previousTierId: { type: DataTypes.UUID, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'customer_memberships',
  timestamps: true,
});

CustomerMembership.associate = (models) => {
  CustomerMembership.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
  CustomerMembership.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
  CustomerMembership.belongsTo(models.MembershipTier, { foreignKey: 'tierId', as: 'tier' });
  CustomerMembership.belongsTo(models.MembershipTier, { foreignKey: 'previousTierId', as: 'previousTier' });
};

module.exports = CustomerMembership;
