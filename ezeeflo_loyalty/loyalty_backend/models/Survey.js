const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Survey = sequelize.define('Survey', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  code: { type: DataTypes.STRING(50), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  surveyType: { type: DataTypes.ENUM('nps', 'satisfaction', 'product_review', 'store_rating', 'service_rating', 'feedback', 'custom'), defaultValue: 'satisfaction' },
  // JSON array of questions: [{ question, type: 'rating'|'text'|'choice', options: [], required: true }]
  questions: { type: DataTypes.JSON, allowNull: true },
  rewardPoints: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  startDate: { type: DataTypes.DATE, allowNull: true },
  endDate: { type: DataTypes.DATE, allowNull: true },
  triggerEvent: { type: DataTypes.ENUM('after_purchase', 'after_redemption', 'tier_upgrade', 'manual', 'scheduled'), defaultValue: 'manual' },
  targetSegments: { type: DataTypes.JSON, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'surveys', paranoid: true, timestamps: true });

Survey.associate = (models) => {
  Survey.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
};

module.exports = Survey;
