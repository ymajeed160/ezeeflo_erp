const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: true },
  userId: { type: DataTypes.UUID, allowNull: true },
  action: { type: DataTypes.STRING(100), allowNull: false },
  entityType: { type: DataTypes.STRING(50), allowNull: false },
  entityId: { type: DataTypes.UUID, allowNull: true },
  oldValues: { type: DataTypes.JSON, allowNull: true },
  newValues: { type: DataTypes.JSON, allowNull: true },
  ipAddress: { type: DataTypes.STRING(45), allowNull: true },
  userAgent: { type: DataTypes.STRING(500), allowNull: true },
  metadata: { type: DataTypes.JSON, allowNull: true },
}, {
  tableName: 'audit_logs',
  timestamps: true,
  updatedAt: false,
});

AuditLog.associate = (models) => {
  AuditLog.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
  AuditLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
};

module.exports = AuditLog;
