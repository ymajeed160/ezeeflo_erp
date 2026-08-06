const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FraudAlert = sequelize.define('FraudAlert', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  fraudRuleId: { type: DataTypes.UUID, allowNull: false },
  customerId: { type: DataTypes.UUID, allowNull: true },
  severity: { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), defaultValue: 'medium' },
  title: { type: DataTypes.STRING(300), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  evidence: { type: DataTypes.JSON, allowNull: true },
  status: { type: DataTypes.ENUM('open', 'investigating', 'resolved', 'dismissed'), defaultValue: 'open' },
  resolvedBy: { type: DataTypes.UUID, allowNull: true },
  resolvedAt: { type: DataTypes.DATE, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'fraud_alerts', timestamps: true });

FraudAlert.associate = (models) => {
  FraudAlert.belongsTo(models.FraudRule, { foreignKey: 'fraudRuleId', as: 'rule' });
  FraudAlert.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
};

module.exports = FraudAlert;
