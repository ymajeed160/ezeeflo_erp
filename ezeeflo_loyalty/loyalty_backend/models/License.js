const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const License = sequelize.define('License', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  licenseKey: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  startDate: { type: DataTypes.DATEONLY, allowNull: false },
  endDate: { type: DataTypes.DATEONLY, allowNull: false },
  gracePeriodDays: { type: DataTypes.INTEGER, defaultValue: 7 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'licenses',
  timestamps: true,
});

License.associate = (models) => {
  License.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
};

module.exports = License;
