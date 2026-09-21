const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MarketingWorkflow = sequelize.define('MarketingWorkflow', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  code: { type: DataTypes.STRING(50), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  triggerType: {
    type: DataTypes.ENUM('inactive_days', 'birthday', 'anniversary', 'first_purchase', 'nth_purchase', 'tier_upgrade', 'points_expiring', 'high_spend', 'low_activity', 'campaign_join', 'referral_complete', 'custom'),
    allowNull: false,
  },
  triggerConfig: { type: DataTypes.JSON, allowNull: true },
  // Steps: [{ order, actionType, config, delayMinutes }]
  steps: { type: DataTypes.JSON, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  targetSegments: { type: DataTypes.JSON, allowNull: true },
  executionCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  lastExecutedAt: { type: DataTypes.DATE, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'marketing_workflows',
  paranoid: true,
  timestamps: true,
});

MarketingWorkflow.associate = (models) => {
  MarketingWorkflow.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
};

module.exports = MarketingWorkflow;
