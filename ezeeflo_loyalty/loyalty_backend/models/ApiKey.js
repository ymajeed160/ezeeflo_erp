const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApiKey = sequelize.define('ApiKey', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  keyHash: { type: DataTypes.STRING(255), allowNull: false },
  prefix: { type: DataTypes.STRING(10), allowNull: false },
  permissions: { type: DataTypes.JSON, allowNull: true },
  allowedIps: { type: DataTypes.JSON, allowNull: true },
  rateLimit: { type: DataTypes.INTEGER, defaultValue: 1000 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  lastUsedAt: { type: DataTypes.DATE, allowNull: true },
  expiresAt: { type: DataTypes.DATE, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'api_keys',
  timestamps: true,
});

ApiKey.associate = (models) => {
  ApiKey.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
};

module.exports = ApiKey;
