const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WebhookLog = sequelize.define('WebhookLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  webhookId: { type: DataTypes.UUID, allowNull: false },
  event: { type: DataTypes.STRING(100), allowNull: false },
  payload: { type: DataTypes.JSON, allowNull: true },
  status: { type: DataTypes.ENUM('success', 'failed', 'pending', 'retrying'), defaultValue: 'pending' },
  statusCode: { type: DataTypes.INTEGER, allowNull: true },
  responseBody: { type: DataTypes.TEXT, allowNull: true },
  attemptCount: { type: DataTypes.INTEGER, defaultValue: 1 },
  errorMessage: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'webhook_logs', timestamps: true });

WebhookLog.associate = (models) => {
  WebhookLog.belongsTo(models.Webhook, { foreignKey: 'webhookId', as: 'webhook' });
};

module.exports = WebhookLog;
