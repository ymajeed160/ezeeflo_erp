const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RefreshToken = sequelize.define('RefreshToken', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  token: { type: DataTypes.STRING(500), allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  isRevoked: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'refresh_tokens',
  timestamps: true,
  updatedAt: false,
});

RefreshToken.associate = (models) => {
  RefreshToken.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
};

module.exports = RefreshToken;
