const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SurveyResponse = sequelize.define('SurveyResponse', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  surveyId: { type: DataTypes.UUID, allowNull: false },
  customerId: { type: DataTypes.UUID, allowNull: false },
  companyId: { type: DataTypes.UUID, allowNull: false },
  answers: { type: DataTypes.JSON, allowNull: true },
  npsScore: { type: DataTypes.INTEGER, allowNull: true },
  satisfactionScore: { type: DataTypes.INTEGER, allowNull: true },
  feedback: { type: DataTypes.TEXT, allowNull: true },
  pointsAwarded: { type: DataTypes.INTEGER, defaultValue: 0 },
  storeId: { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'survey_responses', timestamps: true });

SurveyResponse.associate = (models) => {
  SurveyResponse.belongsTo(models.Survey, { foreignKey: 'surveyId', as: 'survey' });
  SurveyResponse.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
};

module.exports = SurveyResponse;
