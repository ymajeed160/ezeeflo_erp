const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Badge = sequelize.define('Badge', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  code: { type: DataTypes.STRING(50), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  badgeType: { type: DataTypes.ENUM('achievement', 'streak', 'challenge', 'milestone', 'special', 'referral'), defaultValue: 'achievement' },
  icon: { type: DataTypes.STRING(255), allowNull: true },
  color: { type: DataTypes.STRING(20), allowNull: true },
  criteria: { type: DataTypes.JSON, allowNull: true },
  pointsReward: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  createdBy: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'badges', paranoid: true, timestamps: true,
});

Badge.associate = (models) => {
  Badge.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
};

module.exports = Badge;
