const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Announcement = sequelize.define('Announcement', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(300), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.ENUM('general', 'maintenance', 'feature', 'downtime', 'security', 'urgent'), defaultValue: 'general' },
  priority: { type: DataTypes.ENUM('low', 'normal', 'high', 'critical'), defaultValue: 'normal' },
  targetCompanies: { type: DataTypes.JSON, allowNull: true, field: 'target_companies' },
  isPublished: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_published' },
  publishAt: { type: DataTypes.DATE, allowNull: true, field: 'publish_at' },
  expiresAt: { type: DataTypes.DATE, allowNull: true, field: 'expires_at' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, {
  tableName: 'announcements',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['type'] },
    { fields: ['is_published'] },
    { fields: ['publish_at'] },
  ],
});

module.exports = Announcement;
