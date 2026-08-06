const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  username: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(150), allowNull: false, validate: { isEmail: true } },
  password: { type: DataTypes.STRING(255), allowNull: false },
  firstName: { type: DataTypes.STRING(100), allowNull: false },
  lastName: { type: DataTypes.STRING(100), allowNull: true },
  phone: { type: DataTypes.STRING(30), allowNull: true },
  avatar: { type: DataTypes.STRING(255), allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  isLocked: { type: DataTypes.BOOLEAN, defaultValue: false },
  isSuperAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
  lastLogin: { type: DataTypes.DATE, allowNull: true },
  lastPasswordChange: { type: DataTypes.DATE, allowNull: true },
  failedLoginAttempts: { type: DataTypes.INTEGER, defaultValue: 0 },
  refreshToken: { type: DataTypes.STRING(500), allowNull: true },
  resetPasswordToken: { type: DataTypes.STRING(255), allowNull: true },
  resetPasswordExpires: { type: DataTypes.DATE, allowNull: true },
  emailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  language: { type: DataTypes.STRING(10), defaultValue: 'en' },
}, {
  tableName: 'users',
  paranoid: true,
  timestamps: true,
  defaultScope: {
    attributes: { exclude: ['password', 'refreshToken', 'resetPasswordToken'] },
  },
  scopes: {
    withPassword: { attributes: { include: ['password'] } },
  },
});

User.associate = (models) => {
  User.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
  User.hasMany(models.RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
  User.belongsToMany(models.Role, {
    through: models.UserRole,
    foreignKey: 'userId',
    otherKey: 'roleId',
    as: 'roles',
  });
  User.hasMany(models.AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
};

module.exports = User;
