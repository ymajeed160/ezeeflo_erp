const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FraudRule = sequelize.define('FraudRule', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  code: { type: DataTypes.STRING(50), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  fraudType: { type: DataTypes.ENUM('duplicate_account', 'suspicious_redemption', 'abnormal_accumulation', 'rule_abuse', 'multiple_devices', 'rapid_transactions', 'geo_anomaly', 'amount_anomaly'), allowNull: false },
  severity: { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), defaultValue: 'medium' },
  conditions: { type: DataTypes.JSON, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  autoBlock: { type: DataTypes.BOOLEAN, defaultValue: false },
  notificationChannels: { type: DataTypes.JSON, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'fraud_rules', paranoid: true, timestamps: true });

FraudRule.associate = (models) => {
  FraudRule.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
};

module.exports = FraudRule;
