const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Role = sequelize.define('Role', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  code: { type: DataTypes.STRING(50), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  isSystem: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'roles',
  paranoid: true,
  timestamps: true,
});

Role.associate = (models) => {
  Role.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
  Role.belongsToMany(models.User, {
    through: models.UserRole,
    foreignKey: 'roleId',
    otherKey: 'userId',
    as: 'users',
  });
  Role.belongsToMany(models.Permission, {
    through: models.RolePermission,
    foreignKey: 'roleId',
    otherKey: 'permissionId',
    as: 'permissions',
  });
};

module.exports = Role;
