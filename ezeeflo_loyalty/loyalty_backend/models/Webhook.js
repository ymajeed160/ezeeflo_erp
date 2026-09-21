const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Webhook = sequelize.define('Webhook', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  url: { type: DataTypes.STRING(500), allowNull: false },
  events: { type: DataTypes.JSON, allowNull: false },
  secret: { type: DataTypes.STRING(200), allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  retryCount: { type: DataTypes.INTEGER, defaultValue: 3 },
  successCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  failureCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  lastTriggeredAt: { type: DataTypes.DATE, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'webhooks', paranoid: true, timestamps: true });

Webhook.associate = (models) => {
  Webhook.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
};

module.exports = Webhook;
