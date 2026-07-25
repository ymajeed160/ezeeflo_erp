const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmailSetting = sequelize.define('EmailSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    field: 'tenant_id',
  },
  smtpHost: {
    type: DataTypes.STRING(255),
    defaultValue: '',
    field: 'smtp_host',
  },
  smtpPort: {
    type: DataTypes.INTEGER,
    defaultValue: 587,
    field: 'smtp_port',
  },
  senderEmail: {
    type: DataTypes.STRING(255),
    defaultValue: '',
    field: 'sender_email',
  },
  senderName: {
    type: DataTypes.STRING(255),
    defaultValue: '',
    field: 'sender_name',
  },
  username: {
    type: DataTypes.STRING(255),
    defaultValue: '',
  },
  password: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  useSsl: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'use_ssl',
  },
  useTls: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'use_tls',
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_verified',
  },
}, {
  tableName: 'email_settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = EmailSetting;
