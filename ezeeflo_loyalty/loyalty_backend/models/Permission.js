const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Permission = sequelize.define('Permission', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  code: { type: DataTypes.STRING(100), allowNull: false },
  groupName: { type: DataTypes.STRING(50), allowNull: true },
  module: { type: DataTypes.STRING(50), allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'permissions',
  paranoid: true,
  timestamps: true,
});

Permission.associate = (models) => {
  Permission.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
  Permission.belongsToMany(models.Role, {
    through: models.RolePermission,
    foreignKey: 'permissionId',
    otherKey: 'roleId',
    as: 'roles',
  });
};

module.exports = Permission;
