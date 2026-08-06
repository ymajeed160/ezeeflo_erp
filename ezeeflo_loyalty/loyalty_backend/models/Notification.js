const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  customerId: { type: DataTypes.UUID, allowNull: true },
  userId: { type: DataTypes.UUID, allowNull: true },
  templateId: { type: DataTypes.UUID, allowNull: true },
  channel: { type: DataTypes.ENUM('email', 'sms', 'push', 'whatsapp'), allowNull: false },
  subject: { type: DataTypes.STRING(255), allowNull: true },
  body: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('pending', 'sent', 'failed', 'read'), defaultValue: 'pending' },
  sentAt: { type: DataTypes.DATE, allowNull: true },
  readAt: { type: DataTypes.DATE, allowNull: true },
  errorMessage: { type: DataTypes.TEXT, allowNull: true },
  metadata: { type: DataTypes.JSON, allowNull: true },
}, {
  tableName: 'notifications',
  timestamps: true,
  updatedAt: false,
});

Notification.associate = (models) => {
  Notification.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
  Notification.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
  Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
};

module.exports = Notification;
