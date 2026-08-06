const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationTemplate = sequelize.define('NotificationTemplate', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  code: { type: DataTypes.STRING(50), allowNull: false },
  channel: { type: DataTypes.ENUM('email', 'sms', 'push', 'whatsapp'), allowNull: false },
  subject: { type: DataTypes.STRING(255), allowNull: true },
  body: { type: DataTypes.TEXT, allowNull: false },
  variables: { type: DataTypes.JSON, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'notification_templates', timestamps: true });

NotificationTemplate.associate = (models) => {
  NotificationTemplate.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
};

module.exports = NotificationTemplate;
