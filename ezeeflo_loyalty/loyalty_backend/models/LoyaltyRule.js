const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoyaltyRule = sequelize.define('LoyaltyRule', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  code: { type: DataTypes.STRING(50), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  ruleType: {
    type: DataTypes.ENUM('earn', 'redeem', 'bonus', 'tier_upgrade', 'tier_downgrade', 'expiry'),
    allowNull: false,
  },
  priority: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  startDate: { type: DataTypes.DATE, allowNull: true },
  endDate: { type: DataTypes.DATE, allowNull: true },
  // JSON: Array of condition groups. Each group is AND; groups are OR.
  // [{ conditions: [{ field, operator, value }], logic: 'AND' }, { conditions: [...], logic: 'AND' }]
  conditions: { type: DataTypes.JSON, allowNull: true },
  // JSON: Array of actions when rule matches
  // [{ actionType: 'award_points'|'multiply_points'|'upgrade_tier'|'send_notification'|'issue_coupon', config: {...} }]
  actions: { type: DataTypes.JSON, allowNull: true },
  // Store / branch applicability
  applicableStores: { type: DataTypes.JSON, allowNull: true },
  applicableBranches: { type: DataTypes.JSON, allowNull: true },
  // Segment targeting
  targetSegments: { type: DataTypes.JSON, allowNull: true },
  // Limit controls
  maxApplications: { type: DataTypes.INTEGER, allowNull: true },
  maxApplicationsPerCustomer: { type: DataTypes.INTEGER, allowNull: true },
  applicationCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  createdBy: { type: DataTypes.UUID, allowNull: true },
  updatedBy: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'loyalty_rules',
  paranoid: true,
  timestamps: true,
});

LoyaltyRule.associate = (models) => {
  LoyaltyRule.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
};

module.exports = LoyaltyRule;
